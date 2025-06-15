import { test, expect } from '@playwright/test';

test.describe('Neko Nade Houdai Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC01: 初期表示の確認', async ({ page }) => {
    // UI要素の存在確認
    await expect(page.locator('[data-testid="title"]')).toBeVisible();
    await expect(page.locator('[data-testid="start-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="score-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="time-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="combo-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="game-area"]')).toBeVisible();
    
    // 初期値の確認
    await expect(page.locator('[data-testid="score-display"]')).toContainText('0');
    await expect(page.locator('[data-testid="time-display"]')).toContainText('60');
    await expect(page.locator('[data-testid="combo-display"]')).toContainText('0');
    
    // スタートボタンが有効
    await expect(page.locator('[data-testid="start-button"]')).toBeEnabled();
  });

  test('TC02: ゲーム開始でタイマーが作動', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    
    // 状態メッセージの確認
    await expect(page.locator('[data-testid="status-message"]')).toContainText('プレイ中');
    
    // 1秒後に時間が減ることを確認
    await page.waitForTimeout(1100);
    await expect(page.locator('[data-testid="time-display"]')).toContainText('59');
    
    // スタートボタンが無効化される
    await expect(page.locator('[data-testid="start-button"]')).toBeDisabled();
  });

  test('TC03: ネコが出現する', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    
    // 2秒以内にネコが出現することを確認
    await expect(page.locator('[data-testid="cat"]').first()).toBeVisible({ timeout: 2000 });
    
    // ネコがゲームエリア内に表示されることを確認
    const cat = page.locator('[data-testid="cat"]').first();
    const gameArea = page.locator('[data-testid="game-area"]');
    
    const catBox = await cat.boundingBox();
    const gameAreaBox = await gameArea.boundingBox();
    
    expect(catBox.x).toBeGreaterThanOrEqual(gameAreaBox.x);
    expect(catBox.y).toBeGreaterThanOrEqual(gameAreaBox.y);
    expect(catBox.x + catBox.width).toBeLessThanOrEqual(gameAreaBox.x + gameAreaBox.width);
    expect(catBox.y + catBox.height).toBeLessThanOrEqual(gameAreaBox.y + gameAreaBox.height);
  });

  test('TC04: ネコをクリックしてスコア獲得', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    
    // ネコが出現するまで待機
    const cat = page.locator('[data-testid="cat"]').first();
    await expect(cat).toBeVisible({ timeout: 2000 });
    
    // ネコをクリック
    await cat.click();
    
    // スコアが10になることを確認
    await expect(page.locator('[data-testid="score-display"]')).toContainText('10');
    
    // クリックしたネコが消えることを確認
    await expect(cat).not.toBeVisible({ timeout: 1000 });
  });

  test('TC05: 連続ボーナスシステム', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    
    // 5匹のネコを連続でクリック
    for (let i = 0; i < 5; i++) {
      const cat = page.locator('[data-testid="cat"]').first();
      await expect(cat).toBeVisible({ timeout: 3000 });
      await cat.click();
      await page.waitForTimeout(200); // クリック間の短い待機
    }
    
    // 5匹連続後のスコアを確認 (10×5 + 5×5 = 75)
    await expect(page.locator('[data-testid="score-display"]')).toContainText('75');
    
    // コンボ表示が5になることを確認
    await expect(page.locator('[data-testid="combo-display"]')).toContainText('5');
  });

  test('TC06: 空クリックでコンボリセット', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    
    // 3匹のネコを連続でクリック
    for (let i = 0; i < 3; i++) {
      const cat = page.locator('[data-testid="cat"]').first();
      await expect(cat).toBeVisible({ timeout: 3000 });
      await cat.click();
      await page.waitForTimeout(200);
    }
    
    // コンボが3になることを確認
    await expect(page.locator('[data-testid="combo-display"]')).toContainText('3');
    
    // 空いている場所をクリック
    await page.locator('[data-testid="game-area"]').click({ position: { x: 50, y: 50 } });
    
    // コンボがリセットされることを確認
    await expect(page.locator('[data-testid="combo-display"]')).toContainText('0');
  });

  test('TC08: 制限時間終了時の処理', async ({ page }) => {
    // テスト用に短時間バージョンで実行（クエリパラメータ使用）
    await page.goto('/?test=true&time=3');
    await page.locator('[data-testid="start-button"]').click();
    
    // 制限時間終了まで待機
    await page.waitForTimeout(4000);
    
    // 時間が0になることを確認
    await expect(page.locator('[data-testid="time-display"]')).toContainText('0');
    
    // 終了状態になることを確認
    await expect(page.locator('[data-testid="status-message"]')).toContainText('終了');
    
    // 最終スコア表示とリトライボタンの確認
    await expect(page.locator('[data-testid="final-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('TC09: リトライ機能', async ({ page }) => {
    // テスト用短時間でゲーム終了まで進める
    await page.goto('/?test=true&time=2');
    await page.locator('[data-testid="start-button"]').click();
    await page.waitForTimeout(3000);
    
    // リトライボタンをクリック
    await page.locator('[data-testid="retry-button"]').click();
    
    // 値がリセットされることを確認
    await expect(page.locator('[data-testid="score-display"]')).toContainText('0');
    await expect(page.locator('[data-testid="time-display"]')).toContainText('60');
    await expect(page.locator('[data-testid="combo-display"]')).toContainText('0');
    
    // 準備状態に戻ることを確認
    await expect(page.locator('[data-testid="status-message"]')).toContainText('準備中');
    await expect(page.locator('[data-testid="start-button"]')).toBeEnabled();
  });

  test('TC10: 複数ネコ同時出現の処理', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    
    // 複数のネコが出現するまで待機
    await page.waitForTimeout(3000);
    
    // 複数のネコが存在することを確認（最大3匹）
    const catCount = await page.locator('[data-testid="cat"]').count();
    expect(catCount).toBeGreaterThan(0);
    expect(catCount).toBeLessThanOrEqual(3);
    
    // 異なるネコを順番にクリック
    const cats = await page.locator('[data-testid="cat"]').all();
    for (const cat of cats) {
      if (await cat.isVisible()) {
        await cat.click();
        await page.waitForTimeout(100);
      }
    }
    
    // スコアが適切に加算されることを確認
    const score = await page.locator('[data-testid="score-display"]').textContent();
    expect(parseInt(score)).toBeGreaterThan(0);
  });

  test('TC12: モバイル対応確認', async ({ page }) => {
    // モバイルサイズに設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    // UI要素が表示される
    await expect(page.locator('[data-testid="title"]')).toBeVisible();
    await expect(page.locator('[data-testid="start-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="score-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="time-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="game-area"]')).toBeVisible();
    
    // ゲームが正常に開始できる
    await page.locator('[data-testid="start-button"]').click();
    await expect(page.locator('[data-testid="status-message"]')).toContainText('プレイ中');
    
    // ネコが適切なサイズで表示される
    const cat = page.locator('[data-testid="cat"]').first();
    await expect(cat).toBeVisible({ timeout: 2000 });
    
    const boundingBox = await cat.boundingBox();
    expect(boundingBox?.width).toBeGreaterThanOrEqual(80); // 最小タッチサイズ
    expect(boundingBox?.height).toBeGreaterThanOrEqual(80);
  });

  test('TC14: ネコの消失タイミング', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    
    // ネコが出現するまで待機
    const cat = page.locator('[data-testid="cat"]').first();
    await expect(cat).toBeVisible({ timeout: 2000 });
    
    // クリックせずに3秒待機
    await page.waitForTimeout(3500);
    
    // ネコが自動的に消えることを確認
    await expect(cat).not.toBeVisible();
  });

  test('TC15: 連続クリック防止', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    
    // ネコが出現するまで待機
    const cat = page.locator('[data-testid="cat"]').first();
    await expect(cat).toBeVisible({ timeout: 2000 });
    
    // 同じネコを素早く複数回クリック
    await cat.click();
    await cat.click();
    await cat.click();
    
    // 1匹分のスコアのみが加算されることを確認
    await expect(page.locator('[data-testid="score-display"]')).toContainText('10');
  });
});