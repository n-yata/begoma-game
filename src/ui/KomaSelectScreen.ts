import type { KomaTypeId } from '../types/koma';
import { KOMA_SPECS, KOMA_TYPE_IDS } from '../game/komaSpecs';

/** ステータスを 3 段階目盛りで表す（例: ●●○） */
function statDots(value: number, min: number, max: number): string {
  const level = Math.round(1 + ((value - min) / (max - min)) * 2);
  return '●'.repeat(level) + '○'.repeat(3 - level);
}

/** コマ選択画面。3種のカードから1つ選んで決定する */
export class KomaSelectScreen {
  private root: HTMLDivElement;
  private cards = new Map<KomaTypeId, HTMLDivElement>();
  private selected: KomaTypeId = 'balance';

  constructor(parent: HTMLElement, onDecide: (komaId: KomaTypeId) => void) {
    this.root = document.createElement('div');
    this.root.className = 'screen screen--dim';

    const heading = document.createElement('h2');
    heading.textContent = 'コマを選ぼう';
    this.root.appendChild(heading);

    const cardsBox = document.createElement('div');
    cardsBox.className = 'koma-cards';

    const masses = KOMA_TYPE_IDS.map((id) => KOMA_SPECS[id].mass);
    const spins = KOMA_TYPE_IDS.map((id) => KOMA_SPECS[id].initialSpin);
    const attacks = KOMA_TYPE_IDS.map((id) => KOMA_SPECS[id].attack);

    for (const id of KOMA_TYPE_IDS) {
      const spec = KOMA_SPECS[id];
      const card = document.createElement('div');
      card.className = 'koma-card';

      const name = document.createElement('h3');
      name.textContent = spec.name;
      card.appendChild(name);

      const stats: Array<[string, string]> = [
        ['重さ', statDots(spec.mass, Math.min(...masses), Math.max(...masses))],
        ['回転', statDots(spec.initialSpin, Math.min(...spins), Math.max(...spins))],
        ['攻め', statDots(spec.attack, Math.min(...attacks), Math.max(...attacks))],
      ];
      for (const [label, dots] of stats) {
        const row = document.createElement('div');
        row.className = 'stat';
        const l = document.createElement('span');
        l.textContent = label;
        const v = document.createElement('span');
        v.textContent = dots;
        row.append(l, v);
        card.appendChild(row);
      }

      const desc = document.createElement('div');
      desc.className = 'stat';
      desc.textContent = spec.description;
      card.appendChild(desc);

      card.addEventListener('click', () => this.select(id));
      cardsBox.appendChild(card);
      this.cards.set(id, card);
    }
    this.root.appendChild(cardsBox);

    const decide = document.createElement('button');
    decide.className = 'btn';
    decide.textContent = 'これで戦う！';
    decide.addEventListener('click', () => onDecide(this.selected));
    this.root.appendChild(decide);

    parent.appendChild(this.root);
    this.select('balance');
  }

  private select(id: KomaTypeId): void {
    this.selected = id;
    for (const [cardId, card] of this.cards) {
      card.classList.toggle('koma-card--selected', cardId === id);
    }
  }

  show(): void {
    this.root.style.display = 'flex';
  }

  hide(): void {
    this.root.style.display = 'none';
  }
}
