import { test, expect } from '@playwright/test';

test.describe('回転ジャンプ E2Eテスト', () => {

  test('TC01: ゲーム画面の初期表示', async ({ page }) => {
    await page.goto('/');
    
    // Canvas要素の存在確認
    const canvas = page.locator('#gameCanvas');
    await expect(canvas).toBeVisible();
    
    // Canvas要素のサイズ確認
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox?.width).toBe(800);
    expect(canvasBox?.height).toBe(600);
    
    // 操作説明の表示確認
    await expect(page.locator('text=スペースキーまたはクリックでジャンプ')).toBeVisible();
    
    // 時間表示の確認
    await expect(page.locator('text=0.0秒')).toBeVisible();
  });

  test('TC03: ジャンプ操作（スペースキー）', async ({ page }) => {
    await page.goto('/');
    
    // ゲーム開始まで少し待機
    await page.waitForTimeout(500);
    
    // スペースキーでジャンプ
    await page.keyboard.press('Space');
    
    // ジャンプ後少し待機（アニメーション確認のため）
    await page.waitForTimeout(1000);
    
    // ゲームが継続していることを確認（ゲームオーバーでない）
    await expect(page.locator('text=Game Over!')).not.toBeVisible();
  });

  test('TC04: ジャンプ操作（クリック）', async ({ page }) => {
    await page.goto('/');
    
    // ゲーム開始まで少し待機
    await page.waitForTimeout(500);
    
    // Canvas上をクリック
    const canvas = page.locator('#gameCanvas');
    await canvas.click();
    
    // ジャンプ後少し待機
    await page.waitForTimeout(1000);
    
    // ゲームが継続していることを確認
    await expect(page.locator('text=Game Over!')).not.toBeVisible();
  });

  test('TC06: ゲームクリア（30秒生存）', async ({ page }) => {
    await page.goto('/');
    
    // ゲーム開始まで少し待機
    await page.waitForTimeout(500);
    
    // 30秒間定期的にジャンプしてゲームクリアを目指す
    const jumpInterval = setInterval(async () => {
      try {
        await page.keyboard.press('Space');
      } catch (e) {
        // テスト終了時にエラーが出ることがあるので無視
      }
    }, 1000);
    
    // 31秒間待機（30秒クリア + 余裕）
    await page.waitForTimeout(31000);
    
    clearInterval(jumpInterval);
    
    // ゲームクリアメッセージの確認
    await expect(page.locator('text=Game Clear!')).toBeVisible();
    
    // リスタートボタンの表示確認
    await expect(page.locator('button:has-text("もう一度")')).toBeVisible();
  });

  test('TC07: ゲームオーバー（床から落下）', async ({ page }) => {
    await page.goto('/');
    
    // ゲーム開始まで少し待機
    await page.waitForTimeout(500);
    
    // 意図的にジャンプしないで落下を待つ
    await page.waitForTimeout(5000);
    
    // ゲームオーバーメッセージの確認
    await expect(page.locator('text=Game Over!')).toBeVisible();
    
    // リスタートボタンの表示確認
    await expect(page.locator('button:has-text("もう一度")')).toBeVisible();
  });

  test('TC08: 時間表示の更新', async ({ page }) => {
    await page.goto('/');
    
    // ゲーム開始まで少し待機
    await page.waitForTimeout(500);
    
    // 定期的にジャンプして5秒間維持
    const jumpInterval = setInterval(async () => {
      try {
        await page.keyboard.press('Space');
      } catch (e) {
        // エラーは無視
      }
    }, 800);
    
    // 5秒待機
    await page.waitForTimeout(5000);
    
    clearInterval(jumpInterval);
    
    // 時間表示が更新されているか確認（4.0秒以上の表示があること）
    const timePattern = /[4-9]\.\d秒|[1-9][0-9]\.\d秒/;
    await expect(page.locator('text=' + timePattern)).toBeVisible();
  });

  test('TC09: リスタート機能', async ({ page }) => {
    await page.goto('/');
    
    // ゲーム開始まで少し待機
    await page.waitForTimeout(500);
    
    // 意図的に落下させてゲームオーバーにする
    await page.waitForTimeout(5000);
    
    // ゲームオーバー確認
    await expect(page.locator('text=Game Over!')).toBeVisible();
    
    // リスタートボタンをクリック
    await page.locator('button:has-text("もう一度")').click();
    
    // ゲームがリセットされたことを確認
    await expect(page.locator('text=Game Over!')).not.toBeVisible();
    await expect(page.locator('text=0.0秒')).toBeVisible();
    
    // Canvas要素が再び表示されていることを確認
    await expect(page.locator('#gameCanvas')).toBeVisible();
  });

});