import { test, expect, type Page } from '@playwright/test';

/**
 * UC-01: タイトル → コマ選択 → 投擲 → 対戦 → リザルト（マッチ決着まで）の1本通し。
 * 乱数シードは実時間由来のため勝敗・ラウンド数は非決定。E2E は「操作が通り決着に到達する」
 * ことだけを検証する（物理の決着性はヘッドレス統合テストが担保済み）
 */

/** 画面中央から下方向へドラッグして投擲する（画面座標の +y = 前方への投擲） */
async function throwKoma(page: Page): Promise<void> {
  const size = page.viewportSize();
  const cx = (size?.width ?? 1280) / 2;
  const cy = (size?.height ?? 720) / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 10, cy + 180, { steps: 8 });
  await page.mouse.up();
}

/** リザルト画面の表示を待ち、マッチ決着済みかどうかを返す */
async function waitForRoundResult(page: Page): Promise<boolean> {
  const nextRound = page.getByRole('button', { name: '次のラウンドへ' });
  const rematch = page.getByRole('button', { name: '同じコマで再戦' });
  await expect(nextRound.or(rematch)).toBeVisible({ timeout: 120_000 });
  return rematch.isVisible();
}

test('UC-01: 1マッチ（3本勝負）を通しでプレイし最終リザルトに到達する', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'スタート' }).click();
  await expect(page.getByText('コマを選ぼう')).toBeVisible();
  await page.getByRole('button', { name: 'これで戦う！' }).click();

  // 引き分けやり直しを含む上限。超えたら失敗として検出する
  const MAX_ROUNDS = 10;
  let decided = false;
  for (let round = 1; round <= MAX_ROUNDS && !decided; round++) {
    await throwKoma(page);
    decided = await waitForRoundResult(page);
    if (!decided) {
      // ラウンドスコアが表示されている
      await expect(page.getByText(/あなた \d+ - \d+ CPU/)).toBeVisible();
      await page.getByRole('button', { name: '次のラウンドへ' }).click();
    }
  }

  expect(decided).toBe(true);
  await expect(page.getByText(/マッチ(勝利！|敗北…)/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'コマ選択へ' })).toBeVisible();
});

test('マッチ未決着のリザルトから中断してコマ選択へ戻れる', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'スタート' }).click();
  await page.getByRole('button', { name: 'これで戦う！' }).click();

  // ラウンド1直後は必ずマッチ未決着（2勝先取のため）
  await throwKoma(page);
  const decided = await waitForRoundResult(page);
  expect(decided).toBe(false);

  await page.getByRole('button', { name: 'マッチを中断してコマ選択へ' }).click();
  await expect(page.getByText('コマを選ぼう')).toBeVisible();
});
