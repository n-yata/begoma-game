import { test, expect } from '@playwright/test';

/** UC-04: WebGL 非対応環境ではフォールバック文言を表示する */
test('WebGL2 が使えない環境でフォールバック表示になる', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type === 'webgl2' || type === 'webgl') return null;
      return (original as (...a: unknown[]) => unknown).call(this, type, ...args);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });

  await page.goto('/');
  await expect(page.getByText('お使いのブラウザでは3D表示ができません')).toBeVisible();
  // ゲーム画面（スタートボタン）が出ないこと
  await expect(page.getByRole('button', { name: 'スタート' })).toHaveCount(0);
});
