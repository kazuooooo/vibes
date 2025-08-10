import { test, expect } from '@playwright/test';

test.describe('Rhythm Ninja Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // TC1.1: ページロード
  test('TC01: ゲーム初期化 - ページロード', async ({ page }) => {
    // タイトル「リズム忍者」が表示される
    await expect(page.locator('[data-testid="title"]')).toBeVisible();
    await expect(page.locator('[data-testid="title"]')).toContainText('リズム忍者');
    
    // スタートボタンが表示される
    await expect(page.locator('[data-testid="start-button"]')).toBeVisible();
    
    // 忍者キャラクターが表示される
    await expect(page.locator('[data-testid="ninja-character"]')).toBeVisible();
  });

  // TC1.2: 初期状態確認
  test('TC02: 初期状態確認', async ({ page }) => {
    // スコア: 0
    await expect(page.locator('[data-testid="score-display"]')).toContainText('0');
    
    // HP: 3（❤️❤️❤️）
    await expect(page.locator('[data-testid="hp-display"]')).toBeVisible();
    const hearts = page.locator('[data-testid="heart"]');
    await expect(hearts).toHaveCount(3);
    
    // BPM: 80
    await expect(page.locator('[data-testid="bpm-display"]')).toContainText('80');
    
    // アクションボタンの存在確認
    await expect(page.locator('[data-testid="slash-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="jump-button"]')).toBeVisible();
  });

  // TC2.1: ゲーム開始
  test('TC03: ゲーム開始', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    
    // カウントダウンが表示される
    await expect(page.locator('[data-testid="countdown"]')).toBeVisible();
    
    // カウントダウン後にゲームが開始される（4秒後）
    await page.waitForTimeout(4000);
    
    // ビートインジケーターが動作する
    await expect(page.locator('[data-testid="beat-indicator"]')).toBeVisible();
    
    // 敵が出現する
    await expect(page.locator('[data-testid="enemy"]')).toBeVisible();
  });

  // TC3.1: 斬撃アクション（キーボード）
  test('TC04: 斬撃アクション - キーボード', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    await page.waitForTimeout(4000); // カウントダウン完了まで待機
    
    // 地上敵が出現するまで待機
    await expect(page.locator('[data-testid="ground-enemy"]')).toBeVisible();
    
    // スペースキーで斬撃
    await page.keyboard.press('Space');
    
    // 忍者が斬撃モーションを行う
    await expect(page.locator('[data-testid="ninja-character"]')).toHaveAttribute('data-action', 'slash');
    
    // スコアが増加する
    await expect(page.locator('[data-testid="score-display"]')).not.toContainText('0');
  });

  // TC3.2: ジャンプアクション（キーボード）
  test('TC05: ジャンプアクション - キーボード', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    await page.waitForTimeout(4000);
    
    // 空中敵が出現するまで待機（または強制的に出現）
    await expect(page.locator('[data-testid="air-enemy"]')).toBeVisible();
    
    // 上矢印キーでジャンプ
    await page.keyboard.press('ArrowUp');
    
    // 忍者がジャンプモーションを行う
    await expect(page.locator('[data-testid="ninja-character"]')).toHaveAttribute('data-action', 'jump');
  });

  // TC3.3: ボタン操作（モバイル/タッチ）
  test('TC06: ボタン操作 - タッチ', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    await page.waitForTimeout(4000);
    
    // 斬撃ボタンをクリック
    await page.locator('[data-testid="slash-button"]').click();
    await expect(page.locator('[data-testid="ninja-character"]')).toHaveAttribute('data-action', 'slash');
    
    // ジャンプボタンをクリック
    await page.locator('[data-testid="jump-button"]').click();
    await expect(page.locator('[data-testid="ninja-character"]')).toHaveAttribute('data-action', 'jump');
  });

  // TC4.1: Perfect判定
  test('TC07: タイミング判定 - Perfect', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    await page.waitForTimeout(4000);
    
    // ビートタイミングを取得して正確なタイミングで入力
    // （実装に応じて調整が必要）
    await page.locator('[data-testid="slash-button"]').click();
    
    // Perfect判定が表示される
    await expect(page.locator('[data-testid="timing-result"]')).toContainText('Perfect');
    
    // コンボカウンターが増加する
    await expect(page.locator('[data-testid="combo-display"]')).toContainText('1');
  });

  // TC4.2: Good判定
  test('TC08: タイミング判定 - Good', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    await page.waitForTimeout(4000);
    
    // 少しずれたタイミングで入力
    await page.waitForTimeout(100); // 少し遅らせる
    await page.locator('[data-testid="slash-button"]').click();
    
    // Good判定が表示される
    await expect(page.locator('[data-testid="timing-result"]')).toContainText('Good');
  });

  // TC4.3: Miss判定
  test('TC09: タイミング判定 - Miss', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    await page.waitForTimeout(4000);
    
    // 明らかにタイミングがずれた時に入力
    await page.waitForTimeout(500); // 大幅に遅らせる
    await page.locator('[data-testid="slash-button"]').click();
    
    // Miss判定が表示される
    await expect(page.locator('[data-testid="timing-result"]')).toContainText('Miss');
    
    // HPが1減少する
    const hearts = page.locator('[data-testid="heart"]');
    await expect(hearts).toHaveCount(2);
    
    // コンボがリセットされる
    await expect(page.locator('[data-testid="combo-display"]')).toContainText('0');
  });

  // TC5.1: HP減少とゲームオーバー
  test('TC10: HP減少とゲームオーバー', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    await page.waitForTimeout(4000);
    
    // 意図的に3回Missする
    for (let i = 0; i < 3; i++) {
      await page.waitForTimeout(1000); // 大幅に遅らせてMiss
      await page.locator('[data-testid="slash-button"]').click();
      await page.waitForTimeout(500); // 判定完了まで待機
    }
    
    // ゲームオーバー画面が表示される
    await expect(page.locator('[data-testid="game-over"]')).toBeVisible();
    
    // 最終スコアが表示される
    await expect(page.locator('[data-testid="final-score"]')).toBeVisible();
    
    // リトライボタンが表示される
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  // TC5.2: スコア計算
  test('TC11: スコア計算', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    await page.waitForTimeout(4000);
    
    // Perfect判定を取る
    await page.locator('[data-testid="slash-button"]').click();
    await expect(page.locator('[data-testid="timing-result"]')).toContainText('Perfect');
    
    // スコアが100点増加することを確認
    await expect(page.locator('[data-testid="score-display"]')).toContainText('100');
  });

  // TC5.3: コンボシステム
  test('TC12: コンボシステム', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    await page.waitForTimeout(4000);
    
    // 連続でGoodまたはPerfectを取る（3回）
    for (let i = 0; i < 3; i++) {
      await page.waitForTimeout(750); // ビートタイミングに合わせる
      await page.locator('[data-testid="slash-button"]').click();
      await page.waitForTimeout(250);
    }
    
    // コンボ数が増加していることを確認
    await expect(page.locator('[data-testid="combo-display"]')).toContainText('3');
    
    // Miss時にコンボがリセットされることを確認
    await page.waitForTimeout(1000); // 大幅に遅らせてMiss
    await page.locator('[data-testid="slash-button"]').click();
    await expect(page.locator('[data-testid="combo-display"]')).toContainText('0');
  });

  // TC6.1: BPM上昇
  test('TC13: BPM上昇', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    await page.waitForTimeout(4000);
    
    // 開始時BPM: 80
    await expect(page.locator('[data-testid="bpm-display"]')).toContainText('80');
    
    // 30秒経過を待つ（テスト時間短縮のため実際は5秒に調整）
    await page.waitForTimeout(5000);
    
    // BPMが上昇していることを確認
    const bpmText = await page.locator('[data-testid="bpm-display"]').textContent();
    const currentBPM = parseInt(bpmText || '80');
    expect(currentBPM).toBeGreaterThan(80);
  });

  // TC7.1: レスポンシブデザイン
  test('TC14: レスポンシブデザイン - モバイル', async ({ page }) => {
    // モバイルサイズに設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 全ての要素が適切に配置される
    await expect(page.locator('[data-testid="title"]')).toBeVisible();
    await expect(page.locator('[data-testid="ninja-character"]')).toBeVisible();
    await expect(page.locator('[data-testid="slash-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="jump-button"]')).toBeVisible();
    
    // ボタンが適切なサイズでタッチできる
    const slashButton = page.locator('[data-testid="slash-button"]');
    const boundingBox = await slashButton.boundingBox();
    expect(boundingBox?.width).toBeGreaterThan(40); // 最小タッチサイズ
    expect(boundingBox?.height).toBeGreaterThan(40);
  });

  // TC7.2: ビジュアルフィードバック
  test('TC15: ビジュアルフィードバック', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    await page.waitForTimeout(4000);
    
    // アクション実行
    await page.locator('[data-testid="slash-button"]').click();
    
    // 判定結果がはっきり見える
    await expect(page.locator('[data-testid="timing-result"]')).toBeVisible();
    
    // ビートインジケーターが分かりやすい
    await expect(page.locator('[data-testid="beat-indicator"]')).toBeVisible();
    
    // アクションエフェクトが表示される
    await expect(page.locator('[data-testid="action-effect"]')).toBeVisible();
  });

  // TC8.1: 音声再生（視覚的確認のみ）
  test('TC16: 音響システム確認', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    await page.waitForTimeout(4000);
    
    // 音声関連の要素が存在することを確認
    await expect(page.locator('[data-testid="audio-metronome"]')).toBeVisible();
    
    // 音声コントロールが存在することを確認
    const audioElements = await page.locator('audio').count();
    expect(audioElements).toBeGreaterThan(0);
  });

  // TC9.1: エラーハンドリング
  test('TC17: パフォーマンステスト', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    await page.waitForTimeout(4000);
    
    // 長時間プレイの模擬（5秒間連続操作）
    const startTime = Date.now();
    while (Date.now() - startTime < 5000) {
      await page.locator('[data-testid="slash-button"]').click();
      await page.waitForTimeout(200);
    }
    
    // ゲームが正常に動作していることを確認
    await expect(page.locator('[data-testid="ninja-character"]')).toBeVisible();
    await expect(page.locator('[data-testid="score-display"]')).toBeVisible();
  });

  // リトライ機能テスト
  test('TC18: リトライ機能', async ({ page }) => {
    // ゲームオーバーまで進める
    await page.locator('[data-testid="start-button"]').click();
    await page.waitForTimeout(4000);
    
    // 3回Missしてゲームオーバー
    for (let i = 0; i < 3; i++) {
      await page.waitForTimeout(1000);
      await page.locator('[data-testid="slash-button"]').click();
      await page.waitForTimeout(500);
    }
    
    // リトライボタンをクリック
    await page.locator('[data-testid="retry-button"]').click();
    
    // 値がリセットされることを確認
    await expect(page.locator('[data-testid="score-display"]')).toContainText('0');
    await expect(page.locator('[data-testid="bpm-display"]')).toContainText('80');
    
    // HPが満タンに戻る
    const hearts = page.locator('[data-testid="heart"]');
    await expect(hearts).toHaveCount(3);
    
    // ゲームが再開される
    await expect(page.locator('[data-testid="countdown"]')).toBeVisible();
  });
});