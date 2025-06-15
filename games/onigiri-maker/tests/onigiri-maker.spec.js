import { test, expect } from '@playwright/test';

test.describe('おにぎりメーカー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC01: 初期画面の表示確認', async ({ page }) => {
    // タイトル確認
    await expect(page.getByTestId('title')).toHaveText('おにぎりメーカー');
    
    // 具材選択ボタン（5つ）の確認
    await expect(page.getByTestId('ingredient-ume')).toBeVisible();
    await expect(page.getByTestId('ingredient-salmon')).toBeVisible();
    await expect(page.getByTestId('ingredient-konbu')).toBeVisible();
    await expect(page.getByTestId('ingredient-tuna-mayo')).toBeVisible();
    await expect(page.getByTestId('ingredient-mentaiko')).toBeVisible();
    
    // 形選択ボタン（4つ）の確認
    await expect(page.getByTestId('shape-triangle')).toBeVisible();
    await expect(page.getByTestId('shape-barrel')).toBeVisible();
    await expect(page.getByTestId('shape-round')).toBeVisible();
    await expect(page.getByTestId('shape-square')).toBeVisible();
    
    // のり選択ボタン（4つ）の確認
    await expect(page.getByTestId('nori-full')).toBeVisible();
    await expect(page.getByTestId('nori-half')).toBeVisible();
    await expect(page.getByTestId('nori-hand-roll')).toBeVisible();
    await expect(page.getByTestId('nori-none')).toBeVisible();
    
    // 作るボタンが無効状態であることを確認
    await expect(page.getByTestId('make-button')).toBeDisabled();
    
    // リセットボタンが表示されることを確認
    await expect(page.getByTestId('reset-button')).toBeVisible();
    
    // 作成回数カウンターが0であることを確認
    await expect(page.getByTestId('creation-count')).toHaveText('0');
  });

  test('TC02: 具材選択機能', async ({ page }) => {
    // 梅干しを選択
    await page.getByTestId('ingredient-ume').click();
    await expect(page.getByTestId('ingredient-ume')).toHaveClass(/selected/);
    
    // 鮭を選択し、梅干しの選択が解除されることを確認
    await page.getByTestId('ingredient-salmon').click();
    await expect(page.getByTestId('ingredient-salmon')).toHaveClass(/selected/);
    await expect(page.getByTestId('ingredient-ume')).not.toHaveClass(/selected/);
  });

  test('TC03: 形選択機能', async ({ page }) => {
    // 三角を選択
    await page.getByTestId('shape-triangle').click();
    await expect(page.getByTestId('shape-triangle')).toHaveClass(/selected/);
    
    // 丸型を選択し、三角の選択が解除されることを確認
    await page.getByTestId('shape-round').click();
    await expect(page.getByTestId('shape-round')).toHaveClass(/selected/);
    await expect(page.getByTestId('shape-triangle')).not.toHaveClass(/selected/);
  });

  test('TC04: のり選択機能', async ({ page }) => {
    // 全巻きを選択
    await page.getByTestId('nori-full').click();
    await expect(page.getByTestId('nori-full')).toHaveClass(/selected/);
    
    // のりなしを選択し、全巻きの選択が解除されることを確認
    await page.getByTestId('nori-none').click();
    await expect(page.getByTestId('nori-none')).toHaveClass(/selected/);
    await expect(page.getByTestId('nori-full')).not.toHaveClass(/selected/);
  });

  test('TC05: 作るボタンの有効化条件', async ({ page }) => {
    // 初期状態では無効
    await expect(page.getByTestId('make-button')).toBeDisabled();
    
    // 具材のみ選択 - まだ無効
    await page.getByTestId('ingredient-ume').click();
    await expect(page.getByTestId('make-button')).toBeDisabled();
    
    // 形も選択 - まだ無効
    await page.getByTestId('shape-triangle').click();
    await expect(page.getByTestId('make-button')).toBeDisabled();
    
    // のりも選択 - 有効になる
    await page.getByTestId('nori-full').click();
    await expect(page.getByTestId('make-button')).toBeEnabled();
  });

  test('TC06: おにぎり作成と結果表示', async ({ page }) => {
    // 選択を行う
    await page.getByTestId('ingredient-ume').click();
    await page.getByTestId('shape-triangle').click();
    await page.getByTestId('nori-full').click();
    
    // 作るボタンをクリック
    await page.getByTestId('make-button').click();
    
    // 結果表示エリアが表示される
    await expect(page.getByTestId('result-area')).toBeVisible();
    
    // 点数、ランク、コメントが表示される
    await expect(page.getByTestId('score-display')).toBeVisible();
    await expect(page.getByTestId('rank-display')).toBeVisible();
    await expect(page.getByTestId('comment-display')).toBeVisible();
    
    // もう一度作るボタンが表示される
    await expect(page.getByTestId('retry-button')).toBeVisible();
    
    // 作成回数が1に増加
    await expect(page.getByTestId('creation-count')).toHaveText('1');
  });

  test('TC07: 王道コンボの特別評価', async ({ page }) => {
    // 王道コンボ（梅干し+三角+全巻き）を選択
    await page.getByTestId('ingredient-ume').click();
    await page.getByTestId('shape-triangle').click();
    await page.getByTestId('nori-full').click();
    
    // 作成
    await page.getByTestId('make-button').click();
    
    // 高得点（90点以上）であることを確認
    const scoreText = await page.getByTestId('score-display').textContent();
    const score = parseInt(scoreText);
    expect(score).toBeGreaterThanOrEqual(90);
    
    // ランクがSまたはAであることを確認
    const rank = await page.getByTestId('rank-display').textContent();
    expect(['S', 'A']).toContain(rank);
  });

  test('TC08: リセット機能', async ({ page }) => {
    // 選択を行う
    await page.getByTestId('ingredient-salmon').click();
    await page.getByTestId('shape-round').click();
    await page.getByTestId('nori-half').click();
    
    // 選択されていることを確認
    await expect(page.getByTestId('ingredient-salmon')).toHaveClass(/selected/);
    await expect(page.getByTestId('shape-round')).toHaveClass(/selected/);
    await expect(page.getByTestId('nori-half')).toHaveClass(/selected/);
    
    // リセットボタンをクリック
    await page.getByTestId('reset-button').click();
    
    // すべての選択がクリアされることを確認
    await expect(page.getByTestId('ingredient-salmon')).not.toHaveClass(/selected/);
    await expect(page.getByTestId('shape-round')).not.toHaveClass(/selected/);
    await expect(page.getByTestId('nori-half')).not.toHaveClass(/selected/);
    
    // 作るボタンが無効になることを確認
    await expect(page.getByTestId('make-button')).toBeDisabled();
  });

  test('TC09: もう一度作る機能', async ({ page }) => {
    // おにぎりを作成
    await page.getByTestId('ingredient-konbu').click();
    await page.getByTestId('shape-barrel').click();
    await page.getByTestId('nori-hand-roll').click();
    await page.getByTestId('make-button').click();
    
    // 結果が表示されていることを確認
    await expect(page.getByTestId('result-area')).toBeVisible();
    
    // もう一度作るボタンをクリック
    await page.getByTestId('retry-button').click();
    
    // 結果表示エリアが非表示になる
    await expect(page.getByTestId('result-area')).not.toBeVisible();
    
    // すべての選択がクリアされる
    await expect(page.getByTestId('ingredient-konbu')).not.toHaveClass(/selected/);
    await expect(page.getByTestId('shape-barrel')).not.toHaveClass(/selected/);
    await expect(page.getByTestId('nori-hand-roll')).not.toHaveClass(/selected/);
    
    // 作るボタンが無効になる
    await expect(page.getByTestId('make-button')).toBeDisabled();
  });

  test('TC10: 複数回作成時のカウンター', async ({ page }) => {
    // 初期状態で0
    await expect(page.getByTestId('creation-count')).toHaveText('0');
    
    // 1回目の作成
    await page.getByTestId('ingredient-ume').click();
    await page.getByTestId('shape-triangle').click();
    await page.getByTestId('nori-full').click();
    await page.getByTestId('make-button').click();
    await expect(page.getByTestId('creation-count')).toHaveText('1');
    
    // 2回目の作成
    await page.getByTestId('retry-button').click();
    await page.getByTestId('ingredient-salmon').click();
    await page.getByTestId('shape-round').click();
    await page.getByTestId('nori-half').click();
    await page.getByTestId('make-button').click();
    await expect(page.getByTestId('creation-count')).toHaveText('2');
  });

  test('TC11: 評価システムの動作確認', async ({ page }) => {
    // 1回目: 王道組み合わせ
    await page.getByTestId('ingredient-ume').click();
    await page.getByTestId('shape-triangle').click();
    await page.getByTestId('nori-full').click();
    await page.getByTestId('make-button').click();
    
    const firstScore = await page.getByTestId('score-display').textContent();
    const firstRank = await page.getByTestId('rank-display').textContent();
    
    // 2回目: 異なる組み合わせ
    await page.getByTestId('retry-button').click();
    await page.getByTestId('ingredient-mentaiko').click();
    await page.getByTestId('shape-square').click();
    await page.getByTestId('nori-none').click();
    await page.getByTestId('make-button').click();
    
    const secondScore = await page.getByTestId('score-display').textContent();
    const secondRank = await page.getByTestId('rank-display').textContent();
    
    // 異なる評価が出ることを確認（通常は王道コンボの方が高い）
    expect(firstScore).not.toBe(secondScore);
  });

  test('TC13: モバイル対応確認', async ({ page }) => {
    // モバイルサイズに設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    // すべての要素が表示されることを確認
    await expect(page.getByTestId('title')).toBeVisible();
    await expect(page.getByTestId('ingredient-ume')).toBeVisible();
    await expect(page.getByTestId('shape-triangle')).toBeVisible();
    await expect(page.getByTestId('nori-full')).toBeVisible();
    await expect(page.getByTestId('make-button')).toBeVisible();
    await expect(page.getByTestId('preview-area')).toBeVisible();
    
    // ゲームが正常にプレイできることを確認
    await page.getByTestId('ingredient-salmon').click();
    await page.getByTestId('shape-round').click();
    await page.getByTestId('nori-half').click();
    await page.getByTestId('make-button').click();
    
    await expect(page.getByTestId('result-area')).toBeVisible();
  });

  test('TC14: 大画面対応確認', async ({ page }) => {
    // 大画面サイズに設定
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // すべての要素が適切に表示されることを確認
    await expect(page.getByTestId('title')).toBeVisible();
    await expect(page.getByTestId('preview-area')).toBeVisible();
    
    // 各カテゴリーのボタンが表示されることを確認
    await expect(page.getByTestId('ingredient-ume')).toBeVisible();
    await expect(page.getByTestId('shape-triangle')).toBeVisible();
    await expect(page.getByTestId('nori-full')).toBeVisible();
  });
});