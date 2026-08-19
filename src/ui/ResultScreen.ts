import type { Verdict } from '../types/match';

const OUTCOME_TEXT: Record<Verdict['outcome'], { text: string; cls: string }> = {
  playerWin: { text: 'きみの勝ち！', cls: 'result-title--win' },
  cpuWin: { text: 'まけた…', cls: 'result-title--lose' },
  draw: { text: 'ひきわけ', cls: 'result-title--draw' },
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

/** リザルト画面。勝敗・決着理由と再戦導線 */
export class ResultScreen {
  private root: HTMLDivElement;
  private title: HTMLDivElement;
  private reason: HTMLDivElement;

  constructor(parent: HTMLElement, onRematch: () => void, onBackToSelect: () => void) {
    this.root = document.createElement('div');
    this.root.className = 'screen screen--dim';

    this.title = document.createElement('div');
    this.title.className = 'result-title';
    this.root.appendChild(this.title);

    this.reason = document.createElement('div');
    this.reason.className = 'result-reason';
    this.root.appendChild(this.reason);

    const rematch = document.createElement('button');
    rematch.className = 'btn';
    rematch.textContent = '同じコマで再戦';
    rematch.addEventListener('click', onRematch);
    this.root.appendChild(rematch);

    const back = document.createElement('button');
    back.className = 'btn btn--sub';
    back.textContent = 'コマ選択へ';
    back.addEventListener('click', onBackToSelect);
    this.root.appendChild(back);

    parent.appendChild(this.root);
  }

  showVerdict(verdict: Verdict): void {
    const outcome = OUTCOME_TEXT[verdict.outcome];
    this.title.textContent = outcome.text;
    this.title.className = `result-title ${outcome.cls}`;
    this.reason.textContent = verdict.outcome === 'draw' ? '同時に決着！' : reasonText(verdict);
    this.root.style.display = 'flex';
  }

  hide(): void {
    this.root.style.display = 'none';
  }
}
