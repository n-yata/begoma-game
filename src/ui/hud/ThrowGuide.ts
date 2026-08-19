import type { Vec2 } from '../../types/geometry';
import { computePower } from '../../game/throwCalc';

/** 投擲ガイド（操作説明とパワーバー）。aiming 中のみ表示 */
export class ThrowGuide {
  private root: HTMLDivElement;
  private label: HTMLDivElement;
  private bar: HTMLDivElement;

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'throw-guide';

    this.label = document.createElement('div');
    this.label.textContent = '下に引っ張って離すと投げるよ！';
    this.root.appendChild(this.label);

    const power = document.createElement('div');
    power.className = 'power';
    this.bar = document.createElement('div');
    this.bar.className = 'bar';
    power.appendChild(this.bar);
    this.root.appendChild(power);

    parent.appendChild(this.root);
    this.hide();
  }

  updateDrag(drag: Vec2): void {
    this.bar.style.width = `${computePower(drag) * 100}%`;
  }

  show(): void {
    this.root.style.display = 'block';
    this.bar.style.width = '0%';
  }

  hide(): void {
    this.root.style.display = 'none';
  }
}
