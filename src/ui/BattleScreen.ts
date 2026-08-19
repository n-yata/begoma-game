import { SpinGauge } from './hud/SpinGauge';
import { ThrowGuide } from './hud/ThrowGuide';

/** 投擲（aiming）・対戦（battle）中の HUD をまとめた画面 */
export class BattleScreen {
  readonly playerGauge: SpinGauge;
  readonly cpuGauge: SpinGauge;
  readonly throwGuide: ThrowGuide;

  constructor(parent: HTMLElement) {
    this.playerGauge = new SpinGauge(parent, 'player');
    this.cpuGauge = new SpinGauge(parent, 'cpu');
    this.throwGuide = new ThrowGuide(parent);
  }

  showAiming(): void {
    this.throwGuide.show();
    this.playerGauge.hide();
    this.cpuGauge.hide();
  }

  showBattle(): void {
    this.throwGuide.hide();
    this.playerGauge.show();
    this.cpuGauge.show();
    this.playerGauge.update(1);
    this.cpuGauge.update(1);
  }

  hide(): void {
    this.throwGuide.hide();
    this.playerGauge.hide();
    this.cpuGauge.hide();
  }
}
