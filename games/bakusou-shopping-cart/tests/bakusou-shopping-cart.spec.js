const { test, expect } = require('@playwright/test');

test.describe('爆走ショッピングカート', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/games/bakusou-shopping-cart/index.html');
  });

  test('初期状態の確認', async ({ page }) => {
    // ページが正常に読み込まれる
    await expect(page).toHaveTitle(/爆走ショッピングカート/);
    
    // ゲームタイトルが表示される
    await expect(page.locator('h1')).toContainText('爆走ショッピングカート');
    
    // スタートボタンが表示される
    await expect(page.locator('#startButton')).toBeVisible();
    
    // 初期スコアが0で表示される
    await expect(page.locator('#score')).toContainText('0');
    
    // 初期スピードが5で表示される
    await expect(page.locator('#speed')).toContainText('5');
  });

  test('ゲーム開始機能', async ({ page }) => {
    // スタートボタンをクリック
    await page.locator('#startButton').click();
    
    // ゲームエリアが表示される
    await expect(page.locator('#gameArea')).toBeVisible();
    
    // プレイヤー（ショッピングカート）が表示される
    await expect(page.locator('#player')).toBeVisible();
    
    // スタートボタンが非表示になる
    await expect(page.locator('#startButton')).toBeHidden();
  });

  test('キーボード操作（左右矢印キー）', async ({ page }) => {
    await page.locator('#startButton').click();
    
    // 初期位置を取得
    const initialPosition = await page.locator('#player').boundingBox();
    
    // 右矢印キーを押す
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
    
    const rightPosition = await page.locator('#player').boundingBox();
    expect(rightPosition.x).toBeGreaterThan(initialPosition.x);
    
    // 左矢印キーを押す
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(100);
    
    const leftPosition = await page.locator('#player').boundingBox();
    expect(leftPosition.x).toBeLessThan(rightPosition.x);
  });

  test('キーボード操作（A/Dキー）', async ({ page }) => {
    await page.locator('#startButton').click();
    
    // 初期位置を取得
    const initialPosition = await page.locator('#player').boundingBox();
    
    // Dキーを押す（右移動）
    await page.keyboard.press('KeyD');
    await page.waitForTimeout(100);
    
    const rightPosition = await page.locator('#player').boundingBox();
    expect(rightPosition.x).toBeGreaterThan(initialPosition.x);
    
    // Aキーを押す（左移動）
    await page.keyboard.press('KeyA');
    await page.waitForTimeout(100);
    
    const leftPosition = await page.locator('#player').boundingBox();
    expect(leftPosition.x).toBeLessThan(rightPosition.x);
  });

  test('アイテム生成と取得', async ({ page }) => {
    await page.locator('#startButton').click();
    
    // アイテムが生成されるまで待機
    await page.waitForSelector('.item', { timeout: 5000 });
    
    // アイテムが表示される
    const items = page.locator('.item');
    await expect(items.first()).toBeVisible();
    
    // 初期スコアを取得
    const initialScore = await page.locator('#score').textContent();
    
    // アイテムとプレイヤーを重ねる（簡略化）
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    
    // スコアが増加することを確認（時間による加算もあるので、初期値より大きいことを確認）
    const currentScore = await page.locator('#score').textContent();
    expect(parseInt(currentScore)).toBeGreaterThan(parseInt(initialScore));
  });

  test('スコア計算の基本動作', async ({ page }) => {
    await page.locator('#startButton').click();
    
    // 初期スコア
    await expect(page.locator('#score')).toContainText('0');
    
    // 時間経過でスコアが増加することを確認
    await page.waitForTimeout(1500);
    const score = await page.locator('#score').textContent();
    expect(parseInt(score)).toBeGreaterThan(0);
  });

  test('スピード表示', async ({ page }) => {
    await page.locator('#startButton').click();
    
    // 初期スピードが5
    await expect(page.locator('#speed')).toContainText('5');
    
    // スピードが表示され続けることを確認
    await page.waitForTimeout(1000);
    const speed = await page.locator('#speed').textContent();
    expect(parseInt(speed)).toBeGreaterThanOrEqual(1);
  });

  test('ゲーム状態の管理', async ({ page }) => {
    // 初期状態
    await expect(page.locator('#gameStatus')).toContainText('待機中');
    
    // ゲーム開始
    await page.locator('#startButton').click();
    await expect(page.locator('#gameStatus')).toContainText('プレイ中');
  });

  test('リスタート機能', async ({ page }) => {
    // ゲームを開始
    await page.locator('#startButton').click();
    
    // しばらく待ってからリスタート
    await page.waitForTimeout(1000);
    
    // ページをリロードしてリスタートをテスト
    await page.reload();
    
    // 初期状態に戻ることを確認
    await expect(page.locator('#startButton')).toBeVisible();
    await expect(page.locator('#score')).toContainText('0');
  });

  test('レスポンシブデザイン - モバイル', async ({ page }) => {
    // モバイルサイズに変更
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 要素が適切に表示される
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#startButton')).toBeVisible();
    await expect(page.locator('#score')).toBeVisible();
    await expect(page.locator('#speed')).toBeVisible();
  });

  test('ゲームオブジェクトの動作', async ({ page }) => {
    await page.locator('#startButton').click();
    
    // ゲームが開始されてオブジェクトが生成されることを確認
    await page.waitForTimeout(2000);
    
    // アイテムまたは障害物が存在することを確認
    const gameObjects = await page.locator('#gameArea > *').count();
    expect(gameObjects).toBeGreaterThan(1); // プレイヤー + その他のオブジェクト
  });
});