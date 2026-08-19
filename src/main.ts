import './style.css';
import type { Vec2 } from './types/geometry';
import type { KomaState } from './types/koma';
import { KOMA_SPECS } from './game/komaSpecs';
import { computeThrow } from './game/throwCalc';
import { applyImpactDecay, computeKnockback, decaySpin, resolveAttacker } from './game/spin';
import { judge, updateKomaStatus } from './game/judge';
import { decideCpuThrow } from './game/cpu';
import { createRng } from './game/random';
import { InvalidTransitionError, MatchStateMachine } from './game/MatchStateMachine';
import { PhysicsWorld, type KomaSide } from './engine/PhysicsWorld';
import { Renderer } from './engine/Renderer';
import { GameLoop } from './engine/GameLoop';
import { WebGLUnsupportedError } from './engine/errors';
import { TitleScreen } from './ui/TitleScreen';
import { KomaSelectScreen } from './ui/KomaSelectScreen';
import { BattleScreen } from './ui/BattleScreen';
import { ResultScreen } from './ui/ResultScreen';
import { InputHandler } from './ui/InputHandler';

const PLAYER_SPAWN = { x: 0, y: 0.35, z: 0.95 };
const CPU_SPAWN = { x: 0, y: 0.35, z: -0.95 };

/** 復帰不能なエラーの全画面表示（WebGL 非対応・アセットロード失敗のみに使う） */
function showFatal(overlay: HTMLElement, message: string, showReload: boolean): void {
  overlay.replaceChildren();
  const box = document.createElement('div');
  box.className = 'screen screen--dim';
  const text = document.createElement('p');
  text.className = 'fallback';
  text.textContent = message;
  box.appendChild(text);
  if (showReload) {
    const reload = document.createElement('button');
    reload.className = 'btn';
    reload.textContent = '再読み込み';
    reload.addEventListener('click', () => window.location.reload());
    box.appendChild(reload);
  }
  overlay.appendChild(box);
}

/** 画面を壊さない一時通知 */
function showToast(overlay: HTMLElement, message: string): void {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  overlay.appendChild(toast);
  window.setTimeout(() => toast.remove(), 4000);
}

function main(): void {
  const overlay = document.querySelector<HTMLDivElement>('#overlay');
  const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!overlay || !canvas || !app) return;

  let renderer: Renderer;
  try {
    renderer = new Renderer(canvas);
  } catch (e) {
    if (e instanceof WebGLUnsupportedError) {
      showFatal(
        overlay,
        'お使いのブラウザでは3D表示ができません。別のブラウザでお試しください。',
        false,
      );
      return;
    }
    throw e;
  }

  // Rapier(WASM) は裏で先行ロードし、タイトル表示をブロックしない。
  // ロード失敗の表示はこの catch の1経路に集約する（startBattle 側は静かに中断する）
  let physicsLoadFailed = false;
  const physicsPromise = PhysicsWorld.create().catch((e: unknown) => {
    physicsLoadFailed = true;
    showFatal(overlay, '読み込みに失敗しました。再読み込みしてください。', true);
    throw e;
  });

  const sm = new MatchStateMachine();
  const rng = createRng(Date.now() >>> 0);

  // 対戦中の状態（battle フェーズでのみ非 null）
  let states: Record<KomaSide, KomaState> | null = null;
  let initialSpins: Record<KomaSide, number> = { player: 1, cpu: 1 };
  let physics: PhysicsWorld | null = null;
  let throwing = false;

  /** UI からの遷移イベント。タイミングずれによる不正遷移は無視する */
  const safe =
    <A extends unknown[]>(fn: (...args: A) => void) =>
    (...args: A): void => {
      try {
        fn(...args);
      } catch (e) {
        if (!(e instanceof InvalidTransitionError)) throw e;
      }
    };

  const titleScreen = new TitleScreen(
    overlay,
    safe(() => sm.start()),
  );
  const komaSelectScreen = new KomaSelectScreen(
    overlay,
    safe((komaId) => sm.selectKoma(komaId)),
  );
  const battleScreen = new BattleScreen(overlay);
  const resultScreen = new ResultScreen(
    overlay,
    safe(() => sm.nextRound()),
    safe(() => sm.rematch()),
    safe(() => sm.backToSelect()),
  );

  const input = new InputHandler(app, {
    onDragMove: (drag) => battleScreen.throwGuide.updateDrag(drag),
    onDragEnd: (drag) => void startBattle(drag),
  });

  async function startBattle(drag: Vec2): Promise<void> {
    if (throwing || sm.phase !== 'aiming' || sm.selectedKoma === null) return;
    const playerSpec = KOMA_SPECS[sm.selectedKoma];
    const playerThrow = computeThrow(drag, playerSpec);
    if (!playerThrow) return;

    // await 前に同期で閉じ、二重投擲を防ぐ
    throwing = true;
    input.enabled = false;
    try {
      const world = await physicsPromise;
      if (sm.phase !== 'aiming') return;
      physics = world;

      const cpuDecision = decideCpuThrow(rng);
      const cpuSpec = KOMA_SPECS[cpuDecision.komaId];
      const cpuThrow = computeThrow(cpuDecision.drag, cpuSpec);
      if (!cpuThrow) return;

      world.reset();
      renderer.resetKoma();
      world.spawnKoma('player', playerSpec, PLAYER_SPAWN);
      world.spawnKoma('cpu', cpuSpec, CPU_SPAWN);
      renderer.spawnKoma('player', PLAYER_SPAWN);
      renderer.spawnKoma('cpu', CPU_SPAWN);

      // 画面座標(y下向き) → ワールド水平面(x, z)。CPU は対面なので反転
      world.applyThrow('player', { x: playerThrow.velocity.x, y: playerThrow.velocity.y });
      world.applyThrow('cpu', { x: -cpuThrow.velocity.x, y: -cpuThrow.velocity.y });

      initialSpins = { player: playerThrow.initialSpin, cpu: cpuThrow.initialSpin };
      states = {
        player: {
          specId: playerSpec.id,
          spin: playerThrow.initialSpin,
          stopped: false,
          ringOut: false,
          touchedToko: false,
          position: PLAYER_SPAWN,
        },
        cpu: {
          specId: cpuSpec.id,
          spin: cpuThrow.initialSpin,
          stopped: false,
          ringOut: false,
          touchedToko: false,
          position: CPU_SPAWN,
        },
      };

      sm.throwKoma();
    } catch {
      // ロード失敗は physicsPromise の catch が表示済み。ここでは静かに中断する
      if (!physicsLoadFailed) throw new Error('battle start failed');
    } finally {
      throwing = false;
      if (sm.phase === 'aiming') input.enabled = true;
    }
  }

  function battleStep(dt: number): void {
    if (sm.phase !== 'battle' || !physics || !states) return;

    const result = physics.step();
    const playerSpec = KOMA_SPECS[states.player.specId];
    const cpuSpec = KOMA_SPECS[states.cpu.specId];

    let playerSpin = decaySpin(states.player.spin, playerSpec, dt);
    let cpuSpin = decaySpin(states.cpu.spin, cpuSpec, dt);
    if (result.komaImpact !== null) {
      // 攻撃側（相手へ向かって進んでいた側）は自分の攻撃補正分だけ相手の減衰を増やす
      const attacker = resolveAttacker(
        result.komaImpact.relativeVelocity,
        { x: states.player.position.x, z: states.player.position.z },
        { x: states.cpu.position.x, z: states.cpu.position.z },
      );
      const decayFactorOnPlayer = attacker === 'cpu' ? cpuSpec.attack : 1.0;
      const decayFactorOnCpu = attacker === 'player' ? playerSpec.attack : 1.0;
      playerSpin = applyImpactDecay(playerSpin, result.komaImpact.magnitude, decayFactorOnPlayer);
      cpuSpin = applyImpactDecay(cpuSpin, result.komaImpact.magnitude, decayFactorOnCpu);
    }

    states = {
      player: updateKomaStatus(states.player, playerSpin, result.koma.player),
      cpu: updateKomaStatus(states.cpu, cpuSpin, result.koma.cpu),
    };

    // 勢い負けノックバック: 弱った側は接触していると相手から離れる方向へ弾き飛ばされる
    const distance = Math.hypot(
      states.player.position.x - states.cpu.position.x,
      states.player.position.z - states.cpu.position.z,
    );
    const knock = computeKnockback(
      distance,
      states.player.spin / initialSpins.player,
      states.cpu.spin / initialSpins.cpu,
    );
    if (knock) {
      const other = knock.target === 'player' ? 'cpu' : 'player';
      physics.addHorizontalVelocity(
        knock.target,
        {
          x: states[knock.target].position.x - states[other].position.x,
          z: states[knock.target].position.z - states[other].position.z,
        },
        knock.deltaV,
      );
    }

    battleScreen.playerGauge.update(states.player.spin / initialSpins.player);
    battleScreen.cpuGauge.update(states.cpu.spin / initialSpins.cpu);

    const verdict = judge(states.player, states.cpu);
    if (verdict) sm.settle(verdict);
  }

  const loop = new GameLoop({
    onStep: (dt) => battleStep(dt),
    onFrame: (dt) => {
      if (states) {
        renderer.syncKoma('player', states.player.position, states.player.spin, dt);
        renderer.syncKoma('cpu', states.cpu.position, states.cpu.spin, dt);
      }
      renderer.render();
    },
  });

  sm.onPhaseChange((phase) => {
    titleScreen.hide();
    komaSelectScreen.hide();
    resultScreen.hide();
    input.enabled = false;

    switch (phase) {
      case 'komaSelect':
        battleScreen.hide();
        states = null;
        physics?.reset();
        renderer.resetKoma();
        komaSelectScreen.show();
        break;
      case 'aiming':
        states = null;
        physics?.reset();
        renderer.resetKoma();
        battleScreen.showAiming();
        input.enabled = true;
        break;
      case 'battle':
        battleScreen.showBattle();
        break;
      case 'result':
        battleScreen.hide();
        if (sm.verdict) resultScreen.showVerdict(sm.verdict, sm.score, sm.matchOutcome);
        break;
      case 'title':
        battleScreen.hide();
        titleScreen.show();
        break;
    }
  });

  // 予期しない例外はタイトルへ復帰して継続する（cross-cutting.md）。
  // 短時間に連発する場合は復帰不能とみなし、リロード誘導へ切り替える
  const errorTimes: number[] = [];
  const handleGlobalError = (): void => {
    if (physicsLoadFailed) return;
    const now = performance.now();
    errorTimes.push(now);
    while (errorTimes.length > 0 && now - (errorTimes[0] ?? 0) > 10000) errorTimes.shift();
    if (errorTimes.length > 3) {
      loop.stop();
      showFatal(overlay, 'エラーが続いています。再読み込みしてください。', true);
      return;
    }
    states = null;
    physics?.reset();
    renderer.resetKoma();
    if (sm.phase !== 'title') sm.reset();
    showToast(overlay, 'エラーが発生したためタイトルに戻りました');
  };
  window.addEventListener('error', handleGlobalError);
  window.addEventListener('unhandledrejection', handleGlobalError);

  titleScreen.show();
  komaSelectScreen.hide();
  battleScreen.hide();
  resultScreen.hide();
  loop.start();
}

main();
