const { test, expect } = require('@playwright/test');

test.describe('回転寿司キャッチャー', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // TC01: 初期表示の確認
  test('初期表示 - 全てのUI要素が表示される', async ({ page }) => {
    // 基本要素の存在確認
    await expect(page.getByTestId('title')).toBeVisible();
    await expect(page.getByTestId('start-button')).toBeVisible();
    await expect(page.getByTestId('timer-display')).toBeVisible();
    await expect(page.getByTestId('score-display')).toBeVisible();
    await expect(page.getByTestId('combo-display')).toBeVisible();
    await expect(page.getByTestId('order-display')).toBeVisible();
    await expect(page.getByTestId('lane-area')).toBeVisible();

    // スタートボタンが有効
    await expect(page.getByTestId('start-button')).toBeEnabled();

    // 初期値の確認
    await expect(page.getByTestId('timer-display')).toContainText('60');
    await expect(page.getByTestId('score-display')).toContainText('0');
    await expect(page.getByTestId('combo-display')).toContainText('0');
  });

  // TC02: ゲーム開始でプレイ状態に移行
  test('ゲーム開始 - プレイ状態への移行', async ({ page }) => {
    await page.getByTestId('start-button').click();

    // ゲーム状態の確認
    const gameStatus = await page.getByTestId('game-status').getAttribute('data-status');
    expect(gameStatus).toBe('playing');

    // 注文が表示される
    await expect(page.getByTestId('order-display')).not.toBeEmpty();

    // スタートボタンが無効化または非表示
    await expect(page.getByTestId('start-button')).toBeDisabled();
  });

  // TC03: 寿司皿が流れる
  test('寿司の流れ - 寿司皿がレーンに出現し移動する', async ({ page }) => {
    await page.getByTestId('start-button').click();

    // 寿司皿の出現を待つ
    await expect(page.locator('.sushi-plate').first()).toBeVisible({ timeout: 3000 });

    // 複数の寿司皿が出現することを確認
    await page.waitForTimeout(2000);
    const sushiCount = await page.locator('.sushi-plate').count();
    expect(sushiCount).toBeGreaterThan(0);

    // 寿司皿に種類のclass属性があることを確認
    const firstSushi = page.locator('.sushi-plate').first();
    const sushiClasses = await firstSushi.getAttribute('class');
    expect(sushiClasses).toMatch(/sushi-(maguro|salmon|ebi|tamago|ikura|uni)/);
  });

  // TC04: 正しい寿司のキャッチ
  test('正解キャッチ - 注文通りの寿司をキャッチで得点獲得', async ({ page }) => {
    await page.getByTestId('start-button').click();

    // 現在の注文を取得
    const orderText = await page.getByTestId('order-display').textContent();
    const orderedSushi = orderText.match(/(まぐろ|サーモン|えび|たまご|いくら|うに)/)[1];

    // 対応する寿司種類のマッピング
    const sushiTypeMap = {
      'まぐろ': 'maguro',
      'サーモン': 'salmon', 
      'えび': 'ebi',
      'たまご': 'tamago',
      'いくら': 'ikura',
      'うに': 'uni'
    };

    const targetSushiClass = `sushi-${sushiTypeMap[orderedSushi]}`;

    // 対応する寿司皿が流れてくるまで待機（最大10秒）
    await expect(page.locator(`.${targetSushiClass}`).first()).toBeVisible({ timeout: 10000 });

    // 初期スコアを記録
    const initialScoreText = await page.getByTestId('score-display').textContent();
    const initialScore = parseInt(initialScoreText.match(/\d+/)[0]);

    // 寿司皿をクリック
    await page.locator(`.${targetSushiClass}`).first().click();

    // スコアが100点増加することを確認
    await expect(page.getByTestId('score-display')).toContainText((initialScore + 100).toString());

    // コンボが1になることを確認
    await expect(page.getByTestId('combo-display')).toContainText('1');

    // 新しい注文が表示されることを確認（少し待つ）
    await page.waitForTimeout(500);
    const newOrderText = await page.getByTestId('order-display').textContent();
    expect(newOrderText).toBeTruthy();
  });

  // TC05: 間違った寿司のキャッチ（ペナルティ）
  test('間違いキャッチ - ペナルティとコンボリセット', async ({ page }) => {
    await page.getByTestId('start-button').click();

    // 現在の注文を取得
    const orderText = await page.getByTestId('order-display').textContent();
    const orderedSushi = orderText.match(/(まぐろ|サーモン|えび|たまご|いくら|うに)/)[1];

    // 注文以外の寿司種類を特定
    const allSushiTypes = ['maguro', 'salmon', 'ebi', 'tamago', 'ikura', 'uni'];
    const sushiTypeMap = {
      'まぐろ': 'maguro',
      'サーモン': 'salmon',
      'えび': 'ebi', 
      'たまご': 'tamago',
      'いくら': 'ikura',
      'うに': 'uni'
    };

    const orderedSushiType = sushiTypeMap[orderedSushi];
    const wrongSushiTypes = allSushiTypes.filter(type => type !== orderedSushiType);

    // 間違った寿司皿が流れてくるまで待機
    let wrongSushiClicked = false;
    for (const wrongType of wrongSushiTypes) {
      const wrongSushi = page.locator(`.sushi-${wrongType}`).first();
      try {
        await wrongSushi.waitFor({ timeout: 2000 });
        
        // 初期スコアを記録
        const initialScoreText = await page.getByTestId('score-display').textContent();
        const initialScore = parseInt(initialScoreText.match(/\d+/)[0]);

        // 間違った寿司皿をクリック
        await wrongSushi.click();

        // スコアが50点減少することを確認
        await expect(page.getByTestId('score-display')).toContainText(Math.max(0, initialScore - 50).toString());

        // コンボが0にリセットされることを確認
        await expect(page.getByTestId('combo-display')).toContainText('0');

        wrongSushiClicked = true;
        break;
      } catch (e) {
        // この種類の寿司が見つからない場合は次を試す
        continue;
      }
    }

    expect(wrongSushiClicked).toBe(true);
  });

  // TC07: コンボシステムの確認
  test('コンボシステム - 連続成功でボーナス増加', async ({ page }) => {
    await page.getByTestId('start-button').click();

    let expectedScore = 0;
    let combo = 0;

    // 3回連続で正解をキャッチ
    for (let i = 0; i < 3; i++) {
      // 現在の注文を取得
      const orderText = await page.getByTestId('order-display').textContent();
      const orderedSushi = orderText.match(/(まぐろ|サーモン|えび|たまご|いくら|うに)/)[1];

      const sushiTypeMap = {
        'まぐろ': 'maguro',
        'サーモン': 'salmon',
        'えび': 'ebi',
        'たまご': 'tamago', 
        'いくら': 'ikura',
        'うに': 'uni'
      };

      const targetSushiClass = `sushi-${sushiTypeMap[orderedSushi]}`;

      // 対応する寿司皿を待機してクリック
      await expect(page.locator(`.${targetSushiClass}`).first()).toBeVisible({ timeout: 10000 });
      await page.locator(`.${targetSushiClass}`).first().click();

      // スコア計算
      combo++;
      const baseScore = 100;
      const comboBonus = combo > 1 ? (combo - 1) * 20 : 0;
      expectedScore += baseScore + comboBonus;

      // スコアとコンボの確認
      await expect(page.getByTestId('score-display')).toContainText(expectedScore.toString());
      await expect(page.getByTestId('combo-display')).toContainText(combo.toString());

      // 次の注文のために少し待機
      await page.waitForTimeout(500);
    }
  });

  // TC08: タイマー機能（短縮版）
  test('タイマー機能 - カウントダウンの動作', async ({ page }) => {
    await page.getByTestId('start-button').click();

    // タイマーが動作していることを確認（60秒から減少）
    await page.waitForTimeout(1100); // 1秒以上待機
    const timerText = await page.getByTestId('timer-display').textContent();
    const currentTime = parseInt(timerText.match(/\d+/)[0]);
    expect(currentTime).toBeLessThan(60);
  });

  // TC09: リトライ機能
  test('リトライ機能 - ゲーム終了後の再開', async ({ page }) => {
    // テスト用にタイマーを短縮するかモック化が必要
    // ここでは手動でゲーム終了状態をトリガー
    await page.getByTestId('start-button').click();

    // ゲーム終了をシミュレート（実際の実装ではタイマー終了を待つ）
    await page.evaluate(() => {
      window.endGame && window.endGame();
    });

    // リトライボタンが表示されることを確認
    await expect(page.getByTestId('retry-button')).toBeVisible();

    // リトライボタンをクリック
    await page.getByTestId('retry-button').click();

    // 初期状態にリセットされることを確認
    await expect(page.getByTestId('timer-display')).toContainText('60');
    await expect(page.getByTestId('score-display')).toContainText('0');
    await expect(page.getByTestId('combo-display')).toContainText('0');
  });

  // TC12: 寿司の種類判定
  test('寿司種類 - 全6種類の寿司が認識される', async ({ page }) => {
    await page.getByTestId('start-button').click();

    const sushiTypes = ['maguro', 'salmon', 'ebi', 'tamago', 'ikura', 'uni'];
    const foundTypes = new Set();

    // 10秒間観察して、できるだけ多くの種類を確認
    const endTime = Date.now() + 10000;
    while (Date.now() < endTime && foundTypes.size < 6) {
      const sushiElements = await page.locator('.sushi-plate').all();
      
      for (const sushi of sushiElements) {
        const classes = await sushi.getAttribute('class');
        for (const type of sushiTypes) {
          if (classes.includes(`sushi-${type}`)) {
            foundTypes.add(type);
          }
        }
      }
      
      await page.waitForTimeout(500);
    }

    // 少なくとも3種類以上の寿司が確認できることを期待
    expect(foundTypes.size).toBeGreaterThanOrEqual(3);
  });

  // TC13: モバイル対応確認
  test('モバイル対応 - 小画面でのレイアウト', async ({ page }) => {
    // iPhone SE サイズに設定
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // 全要素が画面内に収まることを確認
    await expect(page.getByTestId('title')).toBeVisible();
    await expect(page.getByTestId('start-button')).toBeVisible();
    await expect(page.getByTestId('lane-area')).toBeVisible();

    // ゲームが正常に開始できることを確認
    await page.getByTestId('start-button').click();
    await expect(page.getByTestId('game-status')).toHaveAttribute('data-status', 'playing');
  });

});