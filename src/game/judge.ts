import type { Vec3 } from '../types/geometry';
import type { KomaState } from '../types/koma';
import type { Verdict, WinReason } from '../types/match';
import { FALL_MARGIN, FLOOR_Y, RING_OUT_MARGIN, TOKO_RADIUS } from './komaSpecs';
import { isStopped } from './spin';

/** 物理レイヤーから毎ステップ渡される観測値 */
export interface KomaObservation {
  position: Vec3;
  /** このステップでトコに接触したか */
  touchedTokoNow: boolean;
}

/** 位置が場外条件を満たすか（判定式そのもの。不可逆性は updateKomaStatus が担う） */
export function isOutOfToko(position: Vec3): boolean {
  const horizontal = Math.hypot(position.x, position.z);
  return horizontal > TOKO_RADIUS + RING_OUT_MARGIN || position.y < FLOOR_Y - FALL_MARGIN;
}

/**
 * 毎ステップのコマ状態更新。場外・停止・接地の不可逆フラグを維持する。
 * spin は減衰適用後の値を渡すこと。
 */
export function updateKomaStatus(koma: KomaState, spin: number, obs: KomaObservation): KomaState {
  const stopped = koma.stopped || isStopped(spin);
  return {
    ...koma,
    position: obs.position,
    spin: stopped ? 0 : spin,
    stopped,
    ringOut: koma.ringOut || isOutOfToko(obs.position),
    touchedToko: koma.touchedToko || obs.touchedTokoNow,
  };
}

function isDefeated(koma: KomaState): boolean {
  return koma.ringOut || koma.stopped;
}

/** 敗者側の状態から決着理由を求める。優先順位: 場外(foul含む) > 停止 */
function reasonFor(loser: KomaState): WinReason {
  if (loser.ringOut) {
    return loser.touchedToko ? 'ringOut' : 'foul';
  }
  return 'spinStop';
}

/**
 * 勝敗判定。決着していなければ null。
 * 双方が同一ステップで敗北条件を満たした場合は draw。
 */
export function judge(player: KomaState, cpu: KomaState): Verdict | null {
  const playerLost = isDefeated(player);
  const cpuLost = isDefeated(cpu);

  if (!playerLost && !cpuLost) return null;
  if (playerLost && cpuLost) {
    const playerReason = reasonFor(player);
    const cpuReason = reasonFor(cpu);
    return { outcome: 'draw', reason: playerReason === cpuReason ? playerReason : null };
  }
  if (cpuLost) {
    return { outcome: 'playerWin', reason: reasonFor(cpu) };
  }
  return { outcome: 'cpuWin', reason: reasonFor(player) };
}
