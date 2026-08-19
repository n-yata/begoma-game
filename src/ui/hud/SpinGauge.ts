/** 回転ゲージ（初期回転力に対する残量バー）。プレイヤー=下・CPU=上 */
export class SpinGauge {
  private root: HTMLDivElement;
  private bar: HTMLDivElement;

  constructor(parent: HTMLElement, side: 'player' | 'cpu') {
    this.root = document.createElement('div');
    this.root.className = `hud-gauge hud-gauge--${side}`;
    this.bar = document.createElement('div');
    this.bar.className = 'bar';
    this.root.appendChild(this.bar);
    parent.appendChild(this.root);
    this.hide();
  }

  /** ratio: 0〜1（現在spin / 初期spin） */
  update(ratio: number): void {
    this.bar.style.width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
  }

  show(): void {
    this.root.style.display = 'block';
  }

  hide(): void {
    this.root.style.display = 'none';
  }
}
