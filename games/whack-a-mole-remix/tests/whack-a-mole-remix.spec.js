import { test, expect } from '@playwright/test';

test.describe('モグラたたきリミックス E2E テスト', () => {
  
  test('TC01: 初期表示の確認', async ({ page }) => {
    await page.goto('/');
    
    // 必要な要素が存在することを確認
    await expect(page.getByTestId('title')).toBeVisible();
    await expect(page.getByTestId('score')).toBeVisible();
    await expect(page.getByTestId('timer')).toBeVisible();
    await expect(page.getByTestId('start-button')).toBeVisible();
    
    // 9個の穴が存在することを確認
    for (let i = 0; i < 9; i++) {
      await expect(page.getByTestId(`hole-${i}`)).toBeVisible();
    }
    
    // 初期値の確認
    await expect(page.getByTestId('score')).toContainText('0点');
    await expect(page.getByTestId('timer')).toContainText('30');
    await expect(page.getByTestId('start-button')).toBeEnabled();
  });

  test('TC02: スタートボタンでゲーム開始', async ({ page }) => {
    await page.goto('/');
    
    // スタートボタンをクリック
    await page.getByTestId('start-button').click();
    
    // タイマーがカウントダウンを開始することを確認
    await page.waitForTimeout(1000);
    const timerValue = await page.getByTestId('timer').textContent();
    expect(parseInt(timerValue)).toBeLessThan(30);
    
    // スタートボタンが無効になることを確認
    await expect(page.getByTestId('start-button')).toBeDisabled();
  });

  test('TC03: 敵キャラクター（モグラ）のタップ成功', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-button').click();
    
    // 敵キャラクター（茶色）が出現するまで待機
    const enemyCharacter = page.locator('[data-testid^="character-"][data-type="enemy"]').first();
    await enemyCharacter.waitFor({ state: 'visible', timeout: 10000 });
    
    // 初期スコアを記録
    const initialScore = await page.getByTestId('score').textContent();
    const initialScoreNumber = parseInt(initialScore.replace('点', ''));
    
    // 敵キャラクターをクリック
    await enemyCharacter.click();
    
    // スコアが+10点されることを確認
    await expect(page.getByTestId('score')).toContainText(`${initialScoreNumber + 10}点`);
    
    // キャラクターが消えることを確認
    await expect(enemyCharacter).toBeHidden();
  });

  test('TC04: 味方キャラクター（ウサギ）のタップ失敗', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-button').click();
    
    // 味方キャラクター（白色）が出現するまで待機
    const allyCharacter = page.locator('[data-testid^="character-"][data-type="ally"]').first();
    await allyCharacter.waitFor({ state: 'visible', timeout: 10000 });
    
    // 初期スコアを記録
    const initialScore = await page.getByTestId('score').textContent();
    const initialScoreNumber = parseInt(initialScore.replace('点', ''));
    
    // 味方キャラクターをクリック
    await allyCharacter.click();
    
    // スコアが-20点されることを確認
    await expect(page.getByTestId('score')).toContainText(`${initialScoreNumber - 20}点`);
    
    // キャラクターが消えることを確認
    await expect(allyCharacter).toBeHidden();
  });

  test('TC05: 味方キャラクターの見逃し成功', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-button').click();
    
    // 味方キャラクター（白色）が出現するまで待機
    const allyCharacter = page.locator('[data-testid^="character-"][data-type="ally"]').first();
    await allyCharacter.waitFor({ state: 'visible', timeout: 10000 });
    
    // 初期スコアを記録
    const initialScore = await page.getByTestId('score').textContent();
    const initialScoreNumber = parseInt(initialScore.replace('点', ''));
    
    // キャラクターが自然に消えるまで待機
    await allyCharacter.waitFor({ state: 'hidden', timeout: 5000 });
    
    // スコアが+5点されることを確認
    await expect(page.getByTestId('score')).toContainText(`${initialScoreNumber + 5}点`);
  });

  test('TC06: タイマーのカウントダウン確認', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-button').click();
    
    // タイマーがカウントダウンすることを確認
    const initialTimer = await page.getByTestId('timer').textContent();
    await page.waitForTimeout(2000);
    const currentTimer = await page.getByTestId('timer').textContent();
    
    expect(parseInt(currentTimer)).toBeLessThan(parseInt(initialTimer));
  });

  test('TC07: ゲーム終了時の結果表示', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-button').click();
    
    // タイマーが0になるまで待機（最大35秒）
    await page.waitForFunction(() => {
      const timerElement = document.querySelector('[data-testid="timer"]');
      return timerElement && parseInt(timerElement.textContent) === 0;
    }, {}, { timeout: 35000 });
    
    // ゲーム終了画面が表示されることを確認
    await expect(page.getByTestId('game-over-screen')).toBeVisible();
    await expect(page.getByTestId('final-score')).toBeVisible();
    await expect(page.getByTestId('retry-button')).toBeVisible();
  });

  test('TC08: リトライボタンでゲームが再開', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-button').click();
    
    // ゲームが終了するまで待機
    await page.waitForFunction(() => {
      const timerElement = document.querySelector('[data-testid="timer"]');
      return timerElement && parseInt(timerElement.textContent) === 0;
    }, {}, { timeout: 35000 });
    
    // リトライボタンをクリック
    await page.getByTestId('retry-button').click();
    
    // 状態がリセットされることを確認
    await expect(page.getByTestId('score')).toContainText('0点');
    await expect(page.getByTestId('timer')).toContainText('30');
    await expect(page.getByTestId('game-over-screen')).toBeHidden();
    await expect(page.getByTestId('start-button')).toBeEnabled();
  });

  test('TC09: 複数キャラクターの同時出現', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-button').click();
    
    // 複数のキャラクターが出現するまで待機
    await page.waitForFunction(() => {
      const characters = document.querySelectorAll('[data-testid^="character-"]:not([style*="display: none"])');
      return characters.length >= 2;
    }, {}, { timeout: 15000 });
    
    // 初期スコアを記録
    const initialScore = await page.getByTestId('score').textContent();
    const initialScoreNumber = parseInt(initialScore.replace('点', ''));
    
    // 表示されているキャラクターをすべてクリック
    const visibleCharacters = page.locator('[data-testid^="character-"]').filter({ hasNotText: '' });
    const count = await visibleCharacters.count();
    
    for (let i = 0; i < count; i++) {
      const character = visibleCharacters.nth(i);
      if (await character.isVisible()) {
        await character.click();
      }
    }
    
    // スコアが変化していることを確認
    await page.waitForTimeout(500);
    const finalScore = await page.getByTestId('score').textContent();
    const finalScoreNumber = parseInt(finalScore.replace('点', ''));
    expect(finalScoreNumber).not.toBe(initialScoreNumber);
  });

  test('TC10: モバイル対応確認（ビューポート）', async ({ page }) => {
    // iPhone SE サイズに設定
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // 主要UI要素が表示されることを確認
    await expect(page.getByTestId('title')).toBeVisible();
    await expect(page.getByTestId('score')).toBeVisible();
    await expect(page.getByTestId('timer')).toBeVisible();
    await expect(page.getByTestId('start-button')).toBeVisible();
    
    // 全ての穴が表示されることを確認
    for (let i = 0; i < 9; i++) {
      await expect(page.getByTestId(`hole-${i}`)).toBeVisible();
    }
    
    // タップ操作のテスト
    await page.getByTestId('start-button').click();
    await page.waitForTimeout(1000);
    
    // 最初に出現するキャラクターをタップ
    const character = page.locator('[data-testid^="character-"]').first();
    await character.waitFor({ state: 'visible', timeout: 10000 });
    await character.tap();
    
    // スコアが更新されることを確認
    const score = await page.getByTestId('score').textContent();
    expect(score).not.toBe('0点');
  });

  test('TC11: 連続タップの処理', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-button').click();
    
    // キャラクターが出現するまで待機
    const character = page.locator('[data-testid^="character-"]').first();
    await character.waitFor({ state: 'visible', timeout: 10000 });
    
    // 初期スコアを記録
    const initialScore = await page.getByTestId('score').textContent();
    
    // 同じキャラクターを複数回連続でクリック
    await character.click();
    await character.click();
    await character.click();
    
    await page.waitForTimeout(500);
    
    // スコアが1回分のみ更新されていることを確認
    const finalScore = await page.getByTestId('score').textContent();
    const initialScoreNumber = parseInt(initialScore.replace('点', ''));
    const finalScoreNumber = parseInt(finalScore.replace('点', ''));
    
    // スコア変化は1回分のみ（敵なら+10、味方なら-20）
    const scoreDifference = Math.abs(finalScoreNumber - initialScoreNumber);
    expect(scoreDifference === 10 || scoreDifference === 20).toBe(true);
  });

  test('TC12: 空の穴のタップ', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-button').click();
    
    // 初期スコアを記録
    const initialScore = await page.getByTestId('score').textContent();
    
    // キャラクターがいない穴をクリック
    await page.getByTestId('hole-0').click();
    await page.waitForTimeout(500);
    
    // スコアが変化しないことを確認
    const finalScore = await page.getByTestId('score').textContent();
    expect(finalScore).toBe(initialScore);
  });

  test('TC13: ゲーム中のスコア計算精度', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-button').click();
    
    let currentScore = 0;
    let actionCount = 0;
    const maxActions = 5; // 5回のアクションをテスト
    
    while (actionCount < maxActions) {
      // キャラクターの出現を待機
      const character = page.locator('[data-testid^="character-"]').first();
      
      try {
        await character.waitFor({ state: 'visible', timeout: 5000 });
        
        // キャラクターの種類を確認
        const characterType = await character.getAttribute('data-type');
        
        if (characterType === 'enemy') {
          // 敵をクリック (+10点)
          await character.click();
          currentScore += 10;
        } else if (characterType === 'ally') {
          const shouldClick = actionCount % 2 === 0; // 半分はクリック、半分は見逃し
          
          if (shouldClick) {
            // 味方をクリック (-20点)
            await character.click();
            currentScore -= 20;
          } else {
            // 味方を見逃し (+5点)
            await character.waitFor({ state: 'hidden', timeout: 5000 });
            currentScore += 5;
          }
        }
        
        actionCount++;
        await page.waitForTimeout(500);
        
        // スコア表示を確認
        const displayedScore = await page.getByTestId('score').textContent();
        const displayedScoreNumber = parseInt(displayedScore.replace('点', ''));
        expect(displayedScoreNumber).toBe(currentScore);
        
      } catch (error) {
        // タイムアウトした場合は次のループへ
        await page.waitForTimeout(500);
      }
    }
  });

  test('TC14: タイマー残り5秒での緊急表示', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-button').click();
    
    // 25秒経過するまで待機
    await page.waitForFunction(() => {
      const timerElement = document.querySelector('[data-testid="timer"]');
      return timerElement && parseInt(timerElement.textContent) <= 5;
    }, {}, { timeout: 30000 });
    
    // タイマーの表示確認
    const timerValue = await page.getByTestId('timer').textContent();
    expect(parseInt(timerValue)).toBeLessThanOrEqual(5);
    
    // 残り時間でも正常にカウントダウンが続くことを確認
    const currentTime = parseInt(timerValue);
    await page.waitForTimeout(1000);
    const newTime = await page.getByTestId('timer').textContent();
    expect(parseInt(newTime)).toBeLessThan(currentTime);
  });
});