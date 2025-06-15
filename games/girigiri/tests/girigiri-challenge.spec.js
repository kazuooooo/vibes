import { test, expect } from '@playwright/test';

test.describe('ギリギリチャレンジ E2E テスト', () => {
  
  test('TC01: 初期表示の確認', async ({ page }) => {
    await page.goto('/');
    
    // 必要な要素が存在することを確認
    await expect(page.getByTestId('title')).toBeVisible();
    await expect(page.getByTestId('stop-button')).toBeVisible();
    await expect(page.getByTestId('gauge-value')).toBeVisible();
    
    // 止めるボタンが有効であることを確認
    await expect(page.getByTestId('stop-button')).toBeEnabled();
  });

  test('TC02: ゲージが動いているか確認', async ({ page }) => {
    await page.goto('/');
    
    // 初期値を取得
    const initialValue = await page.getByTestId('gauge-value').textContent();
    
    // 500ms 待機
    await page.waitForTimeout(500);
    
    // 値が変化していることを確認
    const newValue = await page.getByTestId('gauge-value').textContent();
    expect(newValue).not.toBe(initialValue);
  });

  test('TC03: ボタンでゲージを停止', async ({ page }) => {
    await page.goto('/');
    
    // 数秒待ってからボタンをクリック
    await page.waitForTimeout(1000);
    await page.getByTestId('stop-button').click();
    
    // ゲージ値を取得
    const stoppedValue = await page.getByTestId('gauge-value').textContent();
    
    // 500ms 待機してゲージが停止していることを確認
    await page.waitForTimeout(500);
    const finalValue = await page.getByTestId('gauge-value').textContent();
    expect(finalValue).toBe(stoppedValue);
    
    // スコアが表示されることを確認
    await expect(page.getByTestId('score')).toBeVisible();
  });

  test('TC04: スコアの検証（90%〜94%）', async ({ page }) => {
    await page.goto('/');
    
    // ゲージが90-94の範囲になるまで待機してクリック
    await page.waitForFunction(() => {
      const gaugeElement = document.querySelector('[data-testid="gauge-value"]');
      const value = parseInt(gaugeElement?.textContent || '0');
      return value >= 90 && value <= 94;
    }, {}, { timeout: 10000 });
    
    await page.getByTestId('stop-button').click();
    
    // スコアが80点であることを確認
    await expect(page.getByTestId('score')).toContainText('80点');
  });

  test('TC05: バースト（100%以上）の判定', async ({ page }) => {
    await page.goto('/');
    
    // ゲージが100以上になるまで待機
    await page.waitForFunction(() => {
      const gaugeElement = document.querySelector('[data-testid="gauge-value"]');
      const value = parseInt(gaugeElement?.textContent || '0');
      return value >= 100;
    }, {}, { timeout: 10000 });
    
    await page.getByTestId('stop-button').click();
    
    // スコアが0点であることを確認
    await expect(page.getByTestId('score')).toContainText('0点');
    // バーストメッセージが表示されることを確認
    await expect(page.getByTestId('score')).toContainText('バースト');
  });

  test('TC06: リトライボタンでゲームが再開できる', async ({ page }) => {
    await page.goto('/');
    
    // ゲームを停止
    await page.waitForTimeout(1000);
    await page.getByTestId('stop-button').click();
    
    // スコアが表示されることを確認
    await expect(page.getByTestId('score')).toBeVisible();
    
    // リトライボタンをクリック
    await page.getByTestId('retry-button').click();
    
    // スコアが非表示になることを確認
    await expect(page.getByTestId('score')).toBeHidden();
    
    // ゲージが再び動き始めることを確認
    const initialValue = await page.getByTestId('gauge-value').textContent();
    await page.waitForTimeout(500);
    const newValue = await page.getByTestId('gauge-value').textContent();
    expect(newValue).not.toBe(initialValue);
  });

  test('TC07: モバイル対応確認（ビューポート）', async ({ page }) => {
    // iPhone SE サイズに設定
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // 主要UI要素が表示されることを確認
    await expect(page.getByTestId('stop-button')).toBeVisible();
    await expect(page.getByTestId('gauge-value')).toBeVisible();
    
    // ボタンをクリックしてスコア表示も確認
    await page.waitForTimeout(1000);
    await page.getByTestId('stop-button').click();
    await expect(page.getByTestId('score')).toBeVisible();
    
    // すべての要素が画面内に収まっていることを確認（スクロールが発生していない）
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    expect(bodyHeight).toBeLessThanOrEqual(viewportHeight + 50); // 多少のマージンを許可
  });

  test('TC08: 多重クリック防止', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForTimeout(1000);
    
    // 最初のクリック
    await page.getByTestId('stop-button').click();
    
    // ボタンが無効になっていることを確認
    await expect(page.getByTestId('stop-button')).toBeDisabled();
    
    // ゲージ値を記録
    const stoppedValue = await page.getByTestId('gauge-value').textContent();
    
    // 500ms 待機後、ゲージが変化していないことを確認
    await page.waitForTimeout(500);
    const finalValue = await page.getByTestId('gauge-value').textContent();
    expect(finalValue).toBe(stoppedValue);
    
    // スコアが表示されていることを確認
    await expect(page.getByTestId('score')).toBeVisible();
  });

  test('TC09: 95%〜99%でギリギリ成功の確認', async ({ page }) => {
    await page.goto('/');
    
    // ゲージが95-99の範囲になるまで待機してクリック
    await page.waitForFunction(() => {
      const gaugeElement = document.querySelector('[data-testid="gauge-value"]');
      const value = parseInt(gaugeElement?.textContent || '0');
      return value >= 95 && value <= 99;
    }, {}, { timeout: 10000 });
    
    await page.getByTestId('stop-button').click();
    
    // スコアが100点でギリギリ成功であることを確認
    await expect(page.getByTestId('score')).toContainText('100点');
    await expect(page.getByTestId('score')).toContainText('ギリギリ成功');
  });

  test('TC10: ゲージの上限確認', async ({ page }) => {
    await page.goto('/');
    
    // ゲージが最大値を超えないことを確認（長時間待機）
    await page.waitForTimeout(5000);
    
    const maxObservedValue = await page.evaluate(() => {
      return new Promise((resolve) => {
        let maxValue = 0;
        const interval = setInterval(() => {
          const gaugeElement = document.querySelector('[data-testid="gauge-value"]');
          const value = parseInt(gaugeElement?.textContent || '0');
          maxValue = Math.max(maxValue, value);
        }, 50);
        
        setTimeout(() => {
          clearInterval(interval);
          resolve(maxValue);
        }, 3000);
      });
    });
    
    // ゲージが110%を超えないことを確認（内部的には110まで行くが表示は100まで）
    expect(maxObservedValue).toBeLessThanOrEqual(110);
  });
});