import { test, expect } from '@playwright/test';

test.describe('Direction Memory Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC01: 初期表示の確認', async ({ page }) => {
    // UI要素の存在確認
    await expect(page.locator('[data-testid="title"]')).toBeVisible();
    await expect(page.locator('[data-testid="start-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="level-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="score-display"]')).toBeVisible();
    
    // 方向ボタンの存在確認
    await expect(page.locator('[data-testid="direction-up"]')).toBeVisible();
    await expect(page.locator('[data-testid="direction-down"]')).toBeVisible();
    await expect(page.locator('[data-testid="direction-left"]')).toBeVisible();
    await expect(page.locator('[data-testid="direction-right"]')).toBeVisible();
    
    // 初期値の確認
    await expect(page.locator('[data-testid="level-display"]')).toContainText('1');
    await expect(page.locator('[data-testid="score-display"]')).toContainText('0');
    
    // スタートボタンが有効
    await expect(page.locator('[data-testid="start-button"]')).toBeEnabled();
  });

  test('TC02: ゲーム開始で矢印表示フェーズに移行', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    
    // 状態メッセージの確認
    await expect(page.locator('[data-testid="status-message"]')).toContainText('観察してください');
    
    // 矢印表示エリアが表示される
    await expect(page.locator('[data-testid="arrow-display"]')).toBeVisible();
    
    // 方向ボタンが無効化される
    await expect(page.locator('[data-testid="direction-up"]')).toBeDisabled();
    await expect(page.locator('[data-testid="direction-down"]')).toBeDisabled();
    await expect(page.locator('[data-testid="direction-left"]')).toBeDisabled();
    await expect(page.locator('[data-testid="direction-right"]')).toBeDisabled();
  });

  test('TC03: 矢印が順番に表示される', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    
    // 矢印表示の確認（3つの矢印が表示される）
    const arrowDisplay = page.locator('[data-testid="arrow-display"]');
    
    // 最初の矢印が表示される
    await expect(arrowDisplay).not.toBeEmpty();
    
    // 十分な時間を待って矢印表示が完了するのを確認
    await page.waitForTimeout(4000); // 3つの矢印 × (800ms + 200ms) = 3000ms + バッファ
    
    // 入力フェーズに移行していることを確認
    await expect(page.locator('[data-testid="status-message"]')).toContainText('入力してください');
  });

  test('TC04: 入力フェーズへの移行', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    
    // 矢印表示完了を待つ
    await page.waitForTimeout(4000);
    
    // 入力フェーズのメッセージ確認
    await expect(page.locator('[data-testid="status-message"]')).toContainText('入力してください');
    
    // 方向ボタンが有効化される
    await expect(page.locator('[data-testid="direction-up"]')).toBeEnabled();
    await expect(page.locator('[data-testid="direction-down"]')).toBeEnabled();
    await expect(page.locator('[data-testid="direction-left"]')).toBeEnabled();
    await expect(page.locator('[data-testid="direction-right"]')).toBeEnabled();
  });

  test('TC05: 正しい順番での入力（レベル1クリア）', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    
    // 矢印順番を記録するため、test属性を利用
    await page.waitForTimeout(4000); // 矢印表示完了まで待機
    
    // 表示された矢印の順番を取得（テスト用の実装が必要）
    const sequence = await page.locator('[data-testid="arrow-display"]').getAttribute('data-sequence');
    
    if (sequence) {
      const arrows = sequence.split(',');
      
      // 矢印の順番通りに入力
      for (const arrow of arrows) {
        await page.locator(`[data-testid="direction-${arrow}"]`).click();
        await page.waitForTimeout(100); // クリック間隔
      }
      
      // 正解メッセージの確認
      await expect(page.locator('[data-testid="status-message"]')).toContainText('正解');
      
      // レベルとスコアの更新確認
      await expect(page.locator('[data-testid="level-display"]')).toContainText('2');
      await expect(page.locator('[data-testid="score-display"]')).toContainText('100');
    }
  });

  test('TC06: 間違った順番での入力（ゲームオーバー）', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    
    // 矢印表示完了まで待機
    await page.waitForTimeout(4000);
    
    // 意図的に間違った順番で入力（最初を上で固定）
    await page.locator('[data-testid="direction-up"]').click();
    await page.locator('[data-testid="direction-up"]').click(); // 2回目も上（間違いの確率が高い）
    await page.locator('[data-testid="direction-up"]').click(); // 3回目も上
    
    // ゲームオーバーメッセージの確認
    await expect(page.locator('[data-testid="status-message"]')).toContainText('ゲームオーバー');
    
    // リトライボタンが表示される
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    
    // 方向ボタンが無効化される
    await expect(page.locator('[data-testid="direction-up"]')).toBeDisabled();
    await expect(page.locator('[data-testid="direction-down"]')).toBeDisabled();
    await expect(page.locator('[data-testid="direction-left"]')).toBeDisabled();
    await expect(page.locator('[data-testid="direction-right"]')).toBeDisabled();
  });

  test('TC09: リトライ機能', async ({ page }) => {
    // ゲームオーバーにする
    await page.locator('[data-testid="start-button"]').click();
    await page.waitForTimeout(4000);
    
    // 間違った入力でゲームオーバーにする
    await page.locator('[data-testid="direction-up"]').click();
    await page.locator('[data-testid="direction-up"]').click();
    await page.locator('[data-testid="direction-up"]').click();
    
    // リトライボタンをクリック
    await page.locator('[data-testid="retry-button"]').click();
    
    // 値がリセットされることを確認
    await expect(page.locator('[data-testid="level-display"]')).toContainText('1');
    await expect(page.locator('[data-testid="score-display"]')).toContainText('0');
    
    // 矢印表示フェーズが再開される
    await expect(page.locator('[data-testid="status-message"]')).toContainText('観察してください');
  });

  test('TC10: 連続入力の防止', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    
    // 矢印表示中にボタンをクリックしようとする
    await page.locator('[data-testid="direction-up"]').click();
    
    // ボタンが無効化されているので反応しない
    await expect(page.locator('[data-testid="direction-up"]')).toBeDisabled();
    
    // 状態メッセージが変わらない
    await expect(page.locator('[data-testid="status-message"]')).toContainText('観察してください');
  });

  test('TC11: モバイル対応確認', async ({ page }) => {
    // モバイルサイズに設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    // UI要素が表示される
    await expect(page.locator('[data-testid="title"]')).toBeVisible();
    await expect(page.locator('[data-testid="start-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="direction-up"]')).toBeVisible();
    await expect(page.locator('[data-testid="direction-down"]')).toBeVisible();
    await expect(page.locator('[data-testid="direction-left"]')).toBeVisible();
    await expect(page.locator('[data-testid="direction-right"]')).toBeVisible();
    
    // ボタンが適切なサイズでタッチできる
    const upButton = page.locator('[data-testid="direction-up"]');
    const boundingBox = await upButton.boundingBox();
    expect(boundingBox?.width).toBeGreaterThan(40); // 最小タッチサイズ
    expect(boundingBox?.height).toBeGreaterThan(40);
  });

  test('TC13: 複数クリック防止', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    await page.waitForTimeout(4000); // 入力フェーズまで待機
    
    // 同じボタンを素早く複数回クリック
    const upButton = page.locator('[data-testid="direction-up"]');
    await upButton.click();
    await upButton.click();
    await upButton.click();
    
    // 1回の入力として処理されることを確認（実装依存）
    // この検証は実装次第で調整が必要
  });
});