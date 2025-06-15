import { test, expect } from '@playwright/test';

test.describe('ズボン上げマスター', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // TC01: 初期表示の確認
  test('初期表示の確認', async ({ page }) => {
    // UI要素の存在確認
    await expect(page.getByTestId('title')).toBeVisible();
    await expect(page.getByTestId('start-button')).toBeVisible();
    await expect(page.getByTestId('score-display')).toBeVisible();
    await expect(page.getByTestId('life-display')).toBeVisible();
    await expect(page.getByTestId('character-area')).toBeVisible();
    await expect(page.getByTestId('zubon')).toBeVisible();
    
    // 初期値の確認
    await expect(page.getByTestId('score-display')).toContainText('0');
    await expect(page.getByTestId('life-display')).toContainText('3');
    await expect(page.getByTestId('status-message')).toContainText('準備中');
    
    // スタートボタンが有効
    await expect(page.getByTestId('start-button')).toBeEnabled();
  });

  // TC02: ゲーム開始でゲーム中状態に移行
  test('ゲーム開始でゲーム中状態に移行', async ({ page }) => {
    await page.getByTestId('start-button').click();
    
    await expect(page.getByTestId('status-message')).toContainText('ゲーム中');
    await expect(page.getByTestId('start-button')).not.toBeVisible();
  });

  // TC03: ズボン落下イベントの発生
  test('ズボン落下イベントの発生', async ({ page }) => {
    await page.getByTestId('start-button').click();
    
    // ズボンの初期位置を記録
    const zubon = page.getByTestId('zubon');
    const initialPosition = await zubon.boundingBox();
    
    // 5秒以内にズボンの位置が変化することを確認
    await page.waitForTimeout(5000);
    const newPosition = await zubon.boundingBox();
    
    expect(newPosition.y).toBeGreaterThan(initialPosition.y);
  });

  // TC04: ズボンを上げる成功パターン
  test('ズボンを上げる成功パターン', async ({ page }) => {
    await page.getByTestId('start-button').click();
    
    // 初期スコアを記録
    const initialScore = await page.getByTestId('score-display').textContent();
    
    // ズボンが落ち始めるまで待機
    await page.waitForTimeout(3000);
    
    // キャラクターエリアをクリック
    await page.getByTestId('character-area').click();
    
    // スコアが増加していることを確認
    await expect(page.getByTestId('score-display')).not.toContainText(initialScore);
    
    // ライフが減っていないことを確認
    await expect(page.getByTestId('life-display')).toContainText('3');
  });

  // TC05: ズボン落下によるライフ減少
  test('ズボン落下によるライフ減少', async ({ page }) => {
    await page.getByTestId('start-button').click();
    
    // ズボンが完全に落ちるまで待機（約5秒）
    await page.waitForTimeout(8000);
    
    // ライフが減っていることを確認
    await expect(page.getByTestId('life-display')).toContainText('2');
  });

  // TC06: パーフェクトタイミング判定
  test('パーフェクトタイミング判定', async ({ page }) => {
    await page.getByTestId('start-button').click();
    
    const initialScore = await page.getByTestId('score-display').textContent();
    
    // 危険フェーズまで待機（約4秒）
    await page.waitForTimeout(4000);
    
    // パーフェクトタイミングでクリック
    await page.getByTestId('character-area').click();
    
    // 20点増加することを確認（パーフェクトスコア）
    const finalScore = await page.getByTestId('score-display').textContent();
    const scoreIncrease = parseInt(finalScore) - parseInt(initialScore);
    expect(scoreIncrease).toBe(20);
  });

  // TC07: 早すぎるクリック判定
  test('早すぎるクリック判定', async ({ page }) => {
    await page.getByTestId('start-button').click();
    
    const initialScore = await page.getByTestId('score-display').textContent();
    
    // 警告フェーズでクリック（約1秒後）
    await page.waitForTimeout(1000);
    await page.getByTestId('character-area').click();
    
    // 5点増加することを確認
    const finalScore = await page.getByTestId('score-display').textContent();
    const scoreIncrease = parseInt(finalScore) - parseInt(initialScore);
    expect(scoreIncrease).toBe(5);
  });

  // TC08: コンボシステムの確認
  test('コンボシステムの確認', async ({ page }) => {
    await page.getByTestId('start-button').click();
    
    // 3回連続でズボンを上げる
    for (let i = 0; i < 3; i++) {
      await page.waitForTimeout(3000);
      await page.getByTestId('character-area').click();
      await page.waitForTimeout(2000); // 次のイベントまで待機
    }
    
    // コンボ表示が3になることを確認
    await expect(page.getByTestId('combo-display')).toContainText('3');
  });

  // TC09: ゲームオーバー条件
  test('ゲームオーバー条件', async ({ page }) => {
    await page.getByTestId('start-button').click();
    
    // 3回ズボンを落とす
    for (let i = 0; i < 3; i++) {
      await page.waitForTimeout(8000); // ズボンが完全に落ちるまで待機
    }
    
    await expect(page.getByTestId('status-message')).toContainText('ゲームオーバー');
    await expect(page.getByTestId('retry-button')).toBeVisible();
    await expect(page.getByTestId('life-display')).toContainText('0');
  });

  // TC10: リトライ機能
  test('リトライ機能', async ({ page }) => {
    // ゲームオーバーまで進める
    await page.getByTestId('start-button').click();
    
    for (let i = 0; i < 3; i++) {
      await page.waitForTimeout(8000);
    }
    
    // リトライボタンをクリック
    await page.getByTestId('retry-button').click();
    
    // 初期状態にリセットされることを確認
    await expect(page.getByTestId('score-display')).toContainText('0');
    await expect(page.getByTestId('life-display')).toContainText('3');
    await expect(page.getByTestId('combo-display')).toContainText('0');
    await expect(page.getByTestId('status-message')).toContainText('ゲーム中');
  });

  // TC11: 連続クリック防止
  test('連続クリック防止', async ({ page }) => {
    await page.getByTestId('start-button').click();
    
    const initialScore = await page.getByTestId('score-display').textContent();
    
    // ズボンが落ちていない状態で連続クリック
    await page.getByTestId('character-area').click();
    await page.getByTestId('character-area').click();
    await page.getByTestId('character-area').click();
    
    // スコアが変化しないことを確認
    await expect(page.getByTestId('score-display')).toContainText(initialScore);
  });

  // TC12: モバイル対応確認
  test('モバイル対応確認', async ({ page }) => {
    // iPhone SEサイズに変更
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 全てのUI要素が画面内に収まることを確認
    await expect(page.getByTestId('title')).toBeInViewport();
    await expect(page.getByTestId('score-display')).toBeInViewport();
    await expect(page.getByTestId('life-display')).toBeInViewport();
    await expect(page.getByTestId('character-area')).toBeInViewport();
    await expect(page.getByTestId('start-button')).toBeInViewport();
    
    // ゲームが正常にプレイできることを確認
    await page.getByTestId('start-button').click();
    await expect(page.getByTestId('status-message')).toContainText('ゲーム中');
  });

  // TC13: スコア計算の正確性
  test('スコア計算の正確性', async ({ page }) => {
    await page.getByTestId('start-button').click();
    
    let currentScore = 0;
    
    // パーフェクトスコア (20点)
    await page.waitForTimeout(4000);
    await page.getByTestId('character-area').click();
    currentScore += 20;
    await expect(page.getByTestId('score-display')).toContainText(currentScore.toString());
    
    await page.waitForTimeout(3000);
    
    // グッドスコア (10点)
    await page.waitForTimeout(2500);
    await page.getByTestId('character-area').click();
    currentScore += 10;
    await expect(page.getByTestId('score-display')).toContainText(currentScore.toString());
  });

  // TC14: 長時間プレイでの安定性
  test('長時間プレイでの安定性', async ({ page }) => {
    await page.getByTestId('start-button').click();
    
    // 2分間（120秒）継続プレイ
    const endTime = Date.now() + 120000;
    
    while (Date.now() < endTime) {
      await page.waitForTimeout(3000);
      
      // ライフが0になったらリトライ
      const lifeText = await page.getByTestId('life-display').textContent();
      if (lifeText === '0') {
        await page.getByTestId('retry-button').click();
      } else {
        await page.getByTestId('character-area').click();
      }
      
      await page.waitForTimeout(1000);
    }
    
    // ゲームが継続して動作していることを確認
    await expect(page.getByTestId('status-message')).toContainText(/ゲーム中|ゲームオーバー/);
  });

});