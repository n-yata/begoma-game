import type { KomaState } from '../../../src/types/koma';
import { KOMA_SPECS } from '../../../src/game/komaSpecs';
import { computeThrow } from '../../../src/game/throwCalc';
import {
  applyImpactDecay,
  computeKnockback,
  decaySpin,
  resolveAttacker,
} from '../../../src/game/spin';
import { judge, updateKomaStatus } from '../../../src/game/judge';
import { decideCpuThrow } from '../../../src/game/cpu';
import { createRng } from '../../../src/game/random';
import { FIXED_DT, PhysicsWorld, type KomaSide } from '../../../src/engine/PhysicsWorld';
import type { Verdict } from '../../../src/types/match';

export const PLAYER_SPAWN = { x: 0, y: 0.35, z: 0.95 };
export const CPU_SPAWN = { x: 0, y: 0.35, z: -0.95 };
/** 打ち切り上限: 実時間 120 秒相当。回転減衰だけでも必ずこれ以内に決着する */
export const MAX_STEPS = 120 * 60;

export interface BattleResult {
  verdict: Verdict;
  steps: number;
  ringOutEverReverted: boolean;
  finalStates: Record<KomaSide, KomaState>;
}

/**
 * main.ts の battleStep と同じパイプラインをヘッドレスで回す。
 * 決定性を保つため、対戦ごとに新しいワールドを作る（使い回すと内部状態が残り再現しない）
 */
export async function runBattle(
  seed: number,
  playerDrag: { x: number; y: number },
): Promise<BattleResult> {
  const world = await PhysicsWorld.create();
  const rng = createRng(seed);
  const playerSpec = KOMA_SPECS.balance;
  const playerThrow = computeThrow(playerDrag, playerSpec);
  if (!playerThrow) throw new Error('player throw must be valid');

  const cpuDecision = decideCpuThrow(rng);
  const cpuSpec = KOMA_SPECS[cpuDecision.komaId];
  const cpuThrow = computeThrow(cpuDecision.drag, cpuSpec);
  if (!cpuThrow) throw new Error('cpu throw must be valid');

  world.reset();
  world.spawnKoma('player', playerSpec, PLAYER_SPAWN);
  world.spawnKoma('cpu', cpuSpec, CPU_SPAWN);
  world.applyThrow('player', { x: playerThrow.velocity.x, y: playerThrow.velocity.y });
  world.applyThrow('cpu', { x: -cpuThrow.velocity.x, y: -cpuThrow.velocity.y });

  let states: Record<KomaSide, KomaState> = {
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

  let ringOutEverReverted = false;
  for (let step = 1; step <= MAX_STEPS; step++) {
    const result = world.step();
    let playerSpin = decaySpin(states.player.spin, playerSpec, FIXED_DT);
    let cpuSpin = decaySpin(states.cpu.spin, cpuSpec, FIXED_DT);
    if (result.komaImpact !== null) {
      const attacker = resolveAttacker(
        result.komaImpact.relativeVelocity,
        { x: states.player.position.x, z: states.player.position.z },
        { x: states.cpu.position.x, z: states.cpu.position.z },
      );
      const factorOnPlayer = attacker === 'cpu' ? cpuSpec.attack : 1.0;
      const factorOnCpu = attacker === 'player' ? playerSpec.attack : 1.0;
      playerSpin = applyImpactDecay(playerSpin, result.komaImpact.magnitude, factorOnPlayer);
      cpuSpin = applyImpactDecay(cpuSpin, result.komaImpact.magnitude, factorOnCpu);
    }
    const prevRingOut = { player: states.player.ringOut, cpu: states.cpu.ringOut };
    states = {
      player: updateKomaStatus(states.player, playerSpin, result.koma.player),
      cpu: updateKomaStatus(states.cpu, cpuSpin, result.koma.cpu),
    };
    // main.ts の battleStep と同じ勢い負けノックバック
    const distance = Math.hypot(
      states.player.position.x - states.cpu.position.x,
      states.player.position.z - states.cpu.position.z,
    );
    const knock = computeKnockback(
      distance,
      states.player.spin / playerThrow.initialSpin,
      states.cpu.spin / cpuThrow.initialSpin,
    );
    if (knock) {
      const other = knock.target === 'player' ? 'cpu' : 'player';
      world.addHorizontalVelocity(
        knock.target,
        {
          x: states[knock.target].position.x - states[other].position.x,
          z: states[knock.target].position.z - states[other].position.z,
        },
        knock.deltaV,
      );
    }
    if (
      (prevRingOut.player && !states.player.ringOut) ||
      (prevRingOut.cpu && !states.cpu.ringOut)
    ) {
      ringOutEverReverted = true;
    }

    const verdict = judge(states.player, states.cpu);
    if (verdict) return { verdict, steps: step, ringOutEverReverted, finalStates: states };
  }
  throw new Error('battle did not settle within the step limit');
}

/** 決着時の不変条件: 敗者側には必ず敗北条件フラグが立っている */
export function isDefeated(state: KomaState): boolean {
  return state.ringOut || state.stopped;
}
