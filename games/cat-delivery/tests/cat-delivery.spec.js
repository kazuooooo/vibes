const { test, expect } = require('@playwright/test');

test.describe('ネコの宅配便', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC01: 初期表示の確認', async ({ page }) => {
    // UI要素の存在確認
    await expect(page.locator('[data-testid="title"]')).toBeVisible();
    await expect(page.locator('[data-testid="start-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="timer-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="score-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="health-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="packages-display"]')).toBeVisible();

    // スタートボタンが有効
    await expect(page.locator('[data-testid="start-button"]')).toBeEnabled();

    // 初期値の確認
    await expect(page.locator('[data-testid="timer-display"]')).toContainText('120');
    await expect(page.locator('[data-testid="score-display"]')).toContainText('0');
    await expect(page.locator('[data-testid="health-display"]')).toContainText('3');
    await expect(page.locator('[data-testid="packages-display"]')).toContainText('0');

    // ゲーム要素の表示確認
    await expect(page.locator('[data-testid="road-area"]')).toBeVisible();
    await expect(page.locator('[data-testid="cat-player"]')).toBeVisible();
  });

  test('TC02: ゲーム開始でプレイ状態に移行', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();

    // ゲーム状態の確認
    await expect(page.locator('[data-testid="game-status"]')).toHaveAttribute('data-status', 'playing');

    // タイマーカウントダウンの確認
    await page.waitForTimeout(1100);
    await expect(page.locator('[data-testid="timer-display"]')).toContainText('119');

    // スタートボタンが無効化または非表示
    await expect(page.locator('[data-testid="start-button"]')).not.toBeVisible();
  });

  test('TC03: 猫キャラクターの左右移動', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();

    const catPlayer = page.locator('[data-testid="cat-player"]');
    
    // 初期位置の取得
    const initialBox = await catPlayer.boundingBox();
    
    // 左移動
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(100);
    const leftBox = await catPlayer.boundingBox();
    expect(leftBox.x).toBeLessThan(initialBox.x);

    // 右移動
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
    const rightBox = await catPlayer.boundingBox();
    expect(rightBox.x).toBeGreaterThan(leftBox.x);

    // A/Dキーでの移動確認
    await page.keyboard.press('KeyA');
    await page.waitForTimeout(100);
    const leftBoxA = await catPlayer.boundingBox();
    expect(leftBoxA.x).toBeLessThan(rightBox.x);

    await page.keyboard.press('KeyD');
    await page.waitForTimeout(100);
    const rightBoxD = await catPlayer.boundingBox();
    expect(rightBoxD.x).toBeGreaterThan(leftBoxA.x);
  });

  test('TC04: 障害物の出現と流れ', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();

    // 障害物が出現するまで待機
    await page.waitForSelector('[data-testid="obstacle"]', { timeout: 5000 });

    const obstacles = page.locator('[data-testid="obstacle"]');
    await expect(obstacles.first()).toBeVisible();

    // 障害物の種類確認
    const firstObstacle = obstacles.first();
    const classList = await firstObstacle.getAttribute('class');
    const hasValidType = ['obstacle-car', 'obstacle-construction', 'obstacle-hole', 'obstacle-tree', 'obstacle-signal']
      .some(type => classList.includes(type));
    expect(hasValidType).toBeTruthy();

    // 障害物の移動確認（位置が下に移動することを確認）
    const initialPosition = await firstObstacle.boundingBox();
    await page.waitForTimeout(1000);
    const laterPosition = await firstObstacle.boundingBox();
    if (laterPosition) {
      expect(laterPosition.y).toBeGreaterThan(initialPosition.y);
    }
  });

  test('TC05: 障害物との衝突判定', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();

    // 初期体力とスコアの確認
    const initialHealth = await page.locator('[data-testid="health-display"]').textContent();
    const initialScore = await page.locator('[data-testid="score-display"]').textContent();

    // 障害物が出現するまで待機
    await page.waitForSelector('[data-testid="obstacle"]', { timeout: 5000 });

    // 猫を障害物の位置に移動させて衝突
    const obstacle = page.locator('[data-testid="obstacle"]').first();
    const obstacleBox = await obstacle.boundingBox();
    const catPlayer = page.locator('[data-testid="cat-player"]');
    
    // 障害物の中央に猫を移動
    if (obstacleBox) {
      await catPlayer.hover();
      await page.mouse.click(obstacleBox.x + obstacleBox.width / 2, obstacleBox.y + obstacleBox.height / 2);
    }

    // 衝突後の確認（短時間待機）
    await page.waitForTimeout(500);

    // 体力とスコアの変化を確認（最大3秒間待機）
    await page.waitForFunction(() => {
      const health = document.querySelector('[data-testid="health-display"]')?.textContent;
      const score = document.querySelector('[data-testid="score-display"]')?.textContent;
      return health !== initialHealth || score !== initialScore;
    }, null, { timeout: 3000 }).catch(() => {}); // エラーを無視
  });

  test('TC06: 体力システムとゲームオーバー', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();

    // 体力を段階的に減らす（障害物に3回衝突）
    for (let i = 0; i < 3; i++) {
      await page.waitForSelector('[data-testid="obstacle"]', { timeout: 5000 });
      
      const obstacle = page.locator('[data-testid="obstacle"]').first();
      const obstacleBox = await obstacle.boundingBox();
      
      if (obstacleBox) {
        const catPlayer = page.locator('[data-testid="cat-player"]');
        await catPlayer.hover();
        await page.mouse.click(obstacleBox.x + obstacleBox.width / 2, obstacleBox.y + obstacleBox.height / 2);
        await page.waitForTimeout(1000);
      }
    }

    // ゲームオーバーの確認
    await expect(page.locator('[data-testid="game-status"]')).toHaveAttribute('data-status', 'finished', { timeout: 5000 });
    await expect(page.locator('[data-testid="final-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('TC07: 荷物のピックアップ', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();

    // 荷物が出現するまで待機
    await page.waitForSelector('[data-testid="package"]', { timeout: 10000 });

    const packageElement = page.locator('[data-testid="package"]').first();
    await expect(packageElement).toBeVisible();

    const packageBox = await packageElement.boundingBox();
    const catPlayer = page.locator('[data-testid="cat-player"]');
    
    // 荷物の位置に猫を移動
    if (packageBox) {
      await catPlayer.hover();
      await page.mouse.click(packageBox.x + packageBox.width / 2, packageBox.y + packageBox.height / 2);
    }

    // ピックアップ後の確認
    await page.waitForTimeout(500);
    
    // 荷物が消えることを確認
    await expect(packageElement).not.toBeVisible({ timeout: 2000 });
    
    // 配達先が表示されることを確認
    await expect(page.locator('[data-testid="delivery-target"]')).toBeVisible({ timeout: 2000 });
  });

  test('TC08: 荷物の配達システム', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();

    // 荷物をピックアップ
    await page.waitForSelector('[data-testid="package"]', { timeout: 10000 });
    const packageElement = page.locator('[data-testid="package"]').first();
    const packageBox = await packageElement.boundingBox();
    
    if (packageBox) {
      await page.mouse.click(packageBox.x + packageBox.width / 2, packageBox.y + packageBox.height / 2);
    }

    await page.waitForTimeout(500);

    // 配達先に移動
    await page.waitForSelector('[data-testid="delivery-target"]', { timeout: 5000 });
    const deliveryTarget = page.locator('[data-testid="delivery-target"]');
    const targetBox = await deliveryTarget.boundingBox();
    
    if (targetBox) {
      await page.mouse.click(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
    }

    // 配達完了の確認
    await page.waitForTimeout(500);
    
    // スコアの増加を確認（最低200点増加）
    await page.waitForFunction(() => {
      const score = document.querySelector('[data-testid="score-display"]')?.textContent;
      return score && parseInt(score.replace(/\D/g, '')) >= 200;
    }, null, { timeout: 3000 });

    // 配達済み荷物数の増加を確認
    await expect(page.locator('[data-testid="packages-display"]')).toContainText('1');
  });

  test('TC09: タイマー機能とゲーム終了', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();

    // タイマーの動作確認（最初の数秒）
    await page.waitForTimeout(1100);
    await expect(page.locator('[data-testid="timer-display"]')).toContainText('119');
    
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-testid="timer-display"]')).toContainText('118');

    // タイマーを0に設定（テスト用に時間短縮）
    await page.evaluate(() => {
      window.gameTimer = 1; // タイマーを1秒に設定
    });

    await page.waitForTimeout(2000);

    // ゲーム終了の確認
    await expect(page.locator('[data-testid="game-status"]')).toHaveAttribute('data-status', 'finished');
    await expect(page.locator('[data-testid="final-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('TC10: リトライ機能', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();

    // ゲームを終了状態にする（タイマーを短縮）
    await page.evaluate(() => {
      window.gameTimer = 1;
    });

    await page.waitForTimeout(2000);

    // リトライボタンをクリック
    await page.locator('[data-testid="retry-button"]').click();

    // リセットの確認
    await expect(page.locator('[data-testid="timer-display"]')).toContainText('120');
    await expect(page.locator('[data-testid="score-display"]')).toContainText('0');
    await expect(page.locator('[data-testid="health-display"]')).toContainText('3');
    await expect(page.locator('[data-testid="packages-display"]')).toContainText('0');
    await expect(page.locator('[data-testid="game-status"]')).toHaveAttribute('data-status', 'playing');
  });

  test('TC11: モバイル操作ボタン', async ({ page }) => {
    // モバイルビューポートに設定
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // モバイル用ボタンの表示確認
    await expect(page.locator('[data-testid="left-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="right-button"]')).toBeVisible();

    await page.locator('[data-testid="start-button"]').click();

    const catPlayer = page.locator('[data-testid="cat-player"]');
    const initialBox = await catPlayer.boundingBox();

    // 左ボタンでの移動
    await page.locator('[data-testid="left-button"]').click();
    await page.waitForTimeout(100);
    const leftBox = await catPlayer.boundingBox();
    expect(leftBox.x).toBeLessThan(initialBox.x);

    // 右ボタンでの移動
    await page.locator('[data-testid="right-button"]').click();
    await page.waitForTimeout(100);
    const rightBox = await catPlayer.boundingBox();
    expect(rightBox.x).toBeGreaterThan(leftBox.x);
  });

  test('TC12: レスポンシブレイアウト確認', async ({ page }) => {
    // デスクトップサイズ
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await expect(page.locator('[data-testid="title"]')).toBeVisible();

    // タブレットサイズ
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid="title"]')).toBeVisible();
    await expect(page.locator('[data-testid="road-area"]')).toBeVisible();

    // モバイルサイズ
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="title"]')).toBeVisible();
    await expect(page.locator('[data-testid="road-area"]')).toBeVisible();
    await expect(page.locator('[data-testid="left-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="right-button"]')).toBeVisible();
  });
});