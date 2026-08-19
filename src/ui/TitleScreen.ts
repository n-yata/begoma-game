/** タイトル画面 */
export class TitleScreen {
  private root: HTMLDivElement;

  constructor(parent: HTMLElement, onStart: () => void) {
    this.root = document.createElement('div');
    this.root.className = 'screen screen--dim';

    const logo = document.createElement('h1');
    logo.className = 'title-logo';
    logo.textContent = 'べーゴマバトル';
    this.root.appendChild(logo);

    const button = document.createElement('button');
    button.className = 'btn';
    button.textContent = 'スタート';
    button.addEventListener('click', onStart);
    this.root.appendChild(button);

    parent.appendChild(this.root);
  }

  show(): void {
    this.root.style.display = 'flex';
  }

  hide(): void {
    this.root.style.display = 'none';
  }
}
