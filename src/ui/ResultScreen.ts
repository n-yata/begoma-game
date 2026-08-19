import type { MatchOutcome, Verdict } from '../types/match';
import type { RoundScore } from '../game/MatchStateMachine';

const OUTCOME_TEXT: Record<Verdict['outcome'], { text: string; cls: string }> = {
  playerWin: { text: 'きみの勝ち！', cls: 'result-title--win' },
  cpuWin: { text: 'まけた…', cls: 'result-title--lose' },
  draw: { text: 'ひきわけ', cls: 'result-title--draw' },
};

const MATCH_OUTCOME_TEXT: Record<Exclude<MatchOutcome, 'draw'>, { text: string; cls: string }> = {
  playerWin: { text: 'マッチ勝利！', cls: 'result-title--win' },
  cpuWin: { text: 'マッチ敗北…', cls: 'result-title--lose' },
};

function reasonText(verdict: Verdict): string {
  const loserIsCpu = verdict.outcome === 'playerWin';
  switch (verdict.reason) {
    case 'ringOut':
      return loserIsCpu ? '場外勝ち！相手を弾き出した！' : '場外に弾き出された…';
    case 'spinStop':
      return loserIsCpu ? '相手が先に止まった！' : '先に回転が止まってしまった…';
    case 'foul':
      return loserIsCpu ? '相手が投げ込みに失敗！' : '投げ込み失敗…トコに乗らなかった';
    default:
      return '';
  }
}

/**
 * リザルト画面。ラウンド決着とマッチ決着で表示を出し分ける。
 * - マッチ未決着: ラウンド結果・スコア・「次のラウンドへ」
 * - マッチ決着: 最終勝敗・スコア・「同じコマで再戦」「コマ選択へ」
 */
export class ResultScreen {
  private root: HTMLDivElement;
  private title: HTMLDivElement;
  private reason: HTMLDivElement;
  private score: HTMLDivElement;
  private nextRoundBtn: HTMLButtonElement;
  private rematchBtn: HTMLButtonElement;
  private backBtn: HTMLButtonElement;

  constructor(
    parent: HTMLElement,
    onNextRound: () => void,
    onRematch: () => void,
    onBackToSelect: () => void,
  ) {
    this.root = document.createElement('div');
    this.root.className = 'screen screen--dim';

    this.title = document.createElement('div');
    this.title.className = 'result-title';
    this.root.appendChild(this.title);

    this.reason = document.createElement('div');
    this.reason.className = 'result-reason';
    this.root.appendChild(this.reason);

    this.score = document.createElement('div');
    this.score.className = 'result-score';
    this.root.appendChild(this.score);

    this.nextRoundBtn = document.createElement('button');
    this.nextRoundBtn.className = 'btn';
    this.nextRoundBtn.textContent = '次のラウンドへ';
    this.nextRoundBtn.addEventListener('click', onNextRound);
    this.root.appendChild(this.nextRoundBtn);

    this.rematchBtn = document.createElement('button');
    this.rematchBtn.className = 'btn';
    this.rematchBtn.textContent = '同じコマで再戦';
    this.rematchBtn.addEventListener('click', onRematch);
    this.root.appendChild(this.rematchBtn);

    this.backBtn = document.createElement('button');
    this.backBtn.className = 'btn btn--sub';
    this.backBtn.textContent = 'コマ選択へ';
    this.backBtn.addEventListener('click', onBackToSelect);
    this.root.appendChild(this.backBtn);

    parent.appendChild(this.root);
  }

  showVerdict(verdict: Verdict, score: RoundScore, matchOutcome: MatchOutcome | null): void {
    const decided = matchOutcome !== null && matchOutcome !== 'draw';
    const heading = decided ? MATCH_OUTCOME_TEXT[matchOutcome] : OUTCOME_TEXT[verdict.outcome];
    this.title.textContent = heading.text;
    this.title.className = `result-title ${heading.cls}`;
    this.reason.textContent = verdict.outcome === 'draw' ? '同時に決着！' : reasonText(verdict);
    this.score.textContent = `あなた ${String(score.player)} - ${String(score.cpu)} CPU`;
    this.nextRoundBtn.style.display = decided ? 'none' : '';
    this.rematchBtn.style.display = decided ? '' : 'none';
    this.backBtn.style.display = decided ? '' : 'none';
    this.root.style.display = 'flex';
  }

  hide(): void {
    this.root.style.display = 'none';
  }
}
