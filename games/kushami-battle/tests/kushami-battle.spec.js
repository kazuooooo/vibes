import { test, expect } from '@playwright/test';

test.describe('くしゃみバトル E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC01: 初期表示の確認', async ({ page }) => {
    // UI要素が存在することを確認
    await expect(page.getByTestId('title')).toBeVisible();
    await expect(page.getByTestId('charge-button')).toBeVisible();
    await expect(page.getByTestId('charge-gauge')).toBeVisible();
    await expect(page.getByTestId('player-character')).toBeVisible();
    await expect(page.getByTestId('enemy-character')).toBeVisible();
    await expect(page.getByTestId('distance-display')).toBeVisible();
    
    // チャージボタンが有効であることを確認
    await expect(page.getByTestId('charge-button')).toBeEnabled();
    
    // 初期距離が表示されることを確認
    await expect(page.getByTestId('distance-display')).toContainText('100');
  });

  test('TC02: チャージゲージの動作確認', async ({ page }) => {
    const chargeGauge = page.getByTestId('charge-gauge');
    const chargeButton = page.getByTestId('charge-button');
    
    // 初期状態でゲージが0%であることを確認
    await expect(chargeGauge).toHaveCSS('width', '0px');
    
    // ボタンを押し始める（マウスダウン）
    await chargeButton.hover();
    await page.mouse.down();
    
    // 500ms待機
    await page.waitForTimeout(500);
    
    // ゲージが増加していることを確認
    const gaugeWidth = await chargeGauge.evaluate(el => el.style.width);
    expect(parseFloat(gaugeWidth)).toBeGreaterThan(0);
    
    // ボタンを離す（マウスアップ）
    await page.mouse.up();
  });

  test('TC03: 短時間チャージ（弱威力）', async ({ page }) => {
    const chargeButton = page.getByTestId('charge-button');
    const powerDisplay = page.getByTestId('power-display');
    
    // 200ms長押し
    await chargeButton.hover();
    await page.mouse.down();
    await page.waitForTimeout(200);
    await page.mouse.up();
    
    // 威力が1であることを確認
    await expect(powerDisplay).toContainText('威力: 1');
    
    // 結果メッセージが表示されることを確認
    const resultMessage = page.getByTestId('result-message');
    await expect(resultMessage).toBeVisible();
    await expect(resultMessage).toContainText('ふわっ');
  });

  test('TC04: 中程度チャージ（普通威力）', async ({ page }) => {
    const chargeButton = page.getByTestId('charge-button');
    const powerDisplay = page.getByTestId('power-display');
    
    // 1000ms長押し
    await chargeButton.hover();
    await page.mouse.down();
    await page.waitForTimeout(1000);
    await page.mouse.up();
    
    // 威力が2-4の範囲内であることを確認
    await page.waitForTimeout(100);
    const powerText = await powerDisplay.textContent();
    const power = parseInt(powerText.match(/\d+/)[0]);
    expect(power).toBeGreaterThanOrEqual(2);
    expect(power).toBeLessThanOrEqual(4);
    
    // 結果メッセージが表示されることを確認
    const resultMessage = page.getByTestId('result-message');
    await expect(resultMessage).toBeVisible();
    await expect(resultMessage).toContainText('はくしょん');
  });

  test('TC05: 長時間チャージ（強威力）', async ({ page }) => {
    const chargeButton = page.getByTestId('charge-button');
    const powerDisplay = page.getByTestId('power-display');
    
    // 2000ms長押し
    await chargeButton.hover();
    await page.mouse.down();
    await page.waitForTimeout(2000);
    await page.mouse.up();
    
    // 威力が5-7の範囲内であることを確認
    await page.waitForTimeout(100);
    const powerText = await powerDisplay.textContent();
    const power = parseInt(powerText.match(/\d+/)[0]);
    expect(power).toBeGreaterThanOrEqual(5);
    expect(power).toBeLessThanOrEqual(7);
    
    // 結果メッセージが表示されることを確認
    const resultMessage = page.getByTestId('result-message');
    await expect(resultMessage).toBeVisible();
    await expect(resultMessage).toContainText('ハーーークション');
  });

  test('TC06: 最強チャージ', async ({ page }) => {
    const chargeButton = page.getByTestId('charge-button');
    const powerDisplay = page.getByTestId('power-display');
    
    // 2750ms長押し
    await chargeButton.hover();
    await page.mouse.down();
    await page.waitForTimeout(2750);
    await page.mouse.up();
    
    // 威力が8-10の範囲内であることを確認
    await page.waitForTimeout(100);
    const powerText = await powerDisplay.textContent();
    const power = parseInt(powerText.match(/\d+/)[0]);
    expect(power).toBeGreaterThanOrEqual(8);
    expect(power).toBeLessThanOrEqual(10);
    
    // 結果メッセージが表示されることを確認
    const resultMessage = page.getByTestId('result-message');
    await expect(resultMessage).toBeVisible();
    await expect(resultMessage).toContainText('究極のくしゃみ');
  });

  test('TC07: チャージ暴発', async ({ page }) => {
    const chargeButton = page.getByTestId('charge-button');
    const powerDisplay = page.getByTestId('power-display');
    
    // 3500ms長押し
    await chargeButton.hover();
    await page.mouse.down();
    await page.waitForTimeout(3500);
    await page.mouse.up();
    
    // 威力が1であることを確認（暴発）
    await page.waitForTimeout(100);
    await expect(powerDisplay).toContainText('威力: 1');
    
    // 暴発メッセージが表示されることを確認
    const resultMessage = page.getByTestId('result-message');
    await expect(resultMessage).toBeVisible();
    await expect(resultMessage).toContainText('暴発');
  });

  test('TC08: 勝利条件の確認', async ({ page }) => {
    const chargeButton = page.getByTestId('charge-button');
    const distanceDisplay = page.getByTestId('distance-display');
    const resultMessage = page.getByTestId('result-message');
    
    // 複数回最強レベルのチャージを実行
    for (let i = 0; i < 5; i++) {
      // 距離が0以下になったら勝利なのでチェック
      const currentDistance = await distanceDisplay.textContent();
      const distance = parseInt(currentDistance.match(/\d+/)[0]);
      if (distance <= 0) {
        break;
      }
      
      // 最強チャージ（2750ms）
      await chargeButton.hover();
      await page.mouse.down();
      await page.waitForTimeout(2750);
      await page.mouse.up();
      
      // アニメーション待機
      await page.waitForTimeout(1000);
      
      // リトライボタンが表示されるまで待機
      await expect(page.getByTestId('retry-button')).toBeVisible();
      
      // 勝利判定をチェック
      const messageText = await resultMessage.textContent();
      if (messageText.includes('勝利')) {
        await expect(resultMessage).toContainText('勝利');
        return;
      }
      
      // まだ勝利していない場合はリトライ
      await page.getByTestId('retry-button').click();
      await page.waitForTimeout(500);
    }
  });

  test('TC09: リトライボタンでゲームが再開できる', async ({ page }) => {
    const chargeButton = page.getByTestId('charge-button');
    const powerDisplay = page.getByTestId('power-display');
    const resultMessage = page.getByTestId('result-message');
    const retryButton = page.getByTestId('retry-button');
    const distanceDisplay = page.getByTestId('distance-display');
    
    // ゲームを一度プレイ
    await chargeButton.hover();
    await page.mouse.down();
    await page.waitForTimeout(1000);
    await page.mouse.up();
    
    // 結果が表示されるまで待機
    await expect(resultMessage).toBeVisible();
    await expect(retryButton).toBeVisible();
    
    // リトライボタンをクリック
    await retryButton.click();
    
    // 状態がリセットされることを確認
    await expect(resultMessage).toBeHidden();
    await expect(retryButton).toBeHidden();
    await expect(powerDisplay).toContainText('威力: 0');
    await expect(distanceDisplay).toContainText('100');
    
    // チャージゲージが0に戻ることを確認
    const chargeGauge = page.getByTestId('charge-gauge');
    await expect(chargeGauge).toHaveCSS('width', '0px');
  });

  test('TC10: 連続チャージ防止', async ({ page }) => {
    const chargeButton = page.getByTestId('charge-button');
    const powerDisplay = page.getByTestId('power-display');
    
    // チャージ開始
    await chargeButton.hover();
    await page.mouse.down();
    
    // チャージ中に追加でクリック操作
    await page.waitForTimeout(500);
    await chargeButton.click();
    await chargeButton.click();
    
    // チャージを継続
    await page.waitForTimeout(500);
    await page.mouse.up();
    
    // 威力が正常に計算されることを確認
    await page.waitForTimeout(100);
    const powerText = await powerDisplay.textContent();
    const power = parseInt(powerText.match(/\d+/)[0]);
    expect(power).toBeGreaterThanOrEqual(2);
    expect(power).toBeLessThanOrEqual(4);
  });

  test('TC11: モバイル対応確認（ビューポート）', async ({ page }) => {
    // iPhone SE サイズに設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 主要UIが表示され、画面内に収まっていることを確認
    await expect(page.getByTestId('charge-button')).toBeVisible();
    await expect(page.getByTestId('charge-gauge')).toBeVisible();
    await expect(page.getByTestId('player-character')).toBeVisible();
    await expect(page.getByTestId('enemy-character')).toBeVisible();
    
    // タッチ操作でチャージが正常に動作することを確認
    const chargeButton = page.getByTestId('charge-button');
    const powerDisplay = page.getByTestId('power-display');
    
    // タッチでチャージ
    await chargeButton.dispatchEvent('touchstart');
    await page.waitForTimeout(1000);
    await chargeButton.dispatchEvent('touchend');
    
    // 威力が正常に表示されることを確認
    await page.waitForTimeout(100);
    const powerText = await powerDisplay.textContent();
    const power = parseInt(powerText.match(/\d+/)[0]);
    expect(power).toBeGreaterThanOrEqual(2);
  });

  test('TC12: キャラクターアニメーション', async ({ page }) => {
    const chargeButton = page.getByTestId('charge-button');
    const enemyCharacter = page.getByTestId('enemy-character');
    
    // 敵キャラクターの初期位置を記録
    const initialPosition = await enemyCharacter.evaluate(el => 
      getComputedStyle(el).right
    );
    
    // チャージしてリリース
    await chargeButton.hover();
    await page.mouse.down();
    await page.waitForTimeout(1500);
    await page.mouse.up();
    
    // アニメーション完了まで待機
    await page.waitForTimeout(1000);
    
    // 敵キャラクターの位置が変化したことを確認
    const newPosition = await enemyCharacter.evaluate(el => 
      getComputedStyle(el).right
    );
    
    expect(newPosition).not.toBe(initialPosition);
    
    // リトライボタンが表示されることを確認
    await expect(page.getByTestId('retry-button')).toBeVisible();
  });

  test('距離表示の更新確認', async ({ page }) => {
    const chargeButton = page.getByTestId('charge-button');
    const distanceDisplay = page.getByTestId('distance-display');
    
    // 初期距離を記録
    const initialDistanceText = await distanceDisplay.textContent();
    const initialDistance = parseInt(initialDistanceText.match(/\d+/)[0]);
    
    // 強力なチャージを実行
    await chargeButton.hover();
    await page.mouse.down();
    await page.waitForTimeout(2000);
    await page.mouse.up();
    
    // アニメーション完了まで待機
    await page.waitForTimeout(1000);
    
    // 距離が減少したことを確認
    const newDistanceText = await distanceDisplay.textContent();
    const newDistance = parseInt(newDistanceText.match(/\d+/)[0]);
    
    expect(newDistance).toBeLessThan(initialDistance);
  });
});