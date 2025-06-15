import { test, expect } from '@playwright/test';

test.describe('変顔メーカー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC01: 初期表示の確認', async ({ page }) => {
    // UI要素の存在確認
    await expect(page.locator('[data-testid="title"]')).toBeVisible();
    await expect(page.locator('[data-testid="face-base"]')).toBeVisible();
    await expect(page.locator('[data-testid="left-eye"]')).toBeVisible();
    await expect(page.locator('[data-testid="right-eye"]')).toBeVisible();
    await expect(page.locator('[data-testid="nose"]')).toBeVisible();
    await expect(page.locator('[data-testid="mouth"]')).toBeVisible();
    
    // ボタンの有効性確認
    await expect(page.locator('[data-testid="complete-button"]')).toBeEnabled();
    await expect(page.locator('[data-testid="reset-button"]')).toBeEnabled();
    
    // 各パーツが初期位置に配置されていることを確認
    const leftEye = page.locator('[data-testid="left-eye"]');
    const leftEyeStyle = await leftEye.getAttribute('style');
    expect(leftEyeStyle).toContain('left: 80px');
    expect(leftEyeStyle).toContain('top: 90px');
  });

  test('TC02: 左目のドラッグ操作', async ({ page }) => {
    const leftEye = page.locator('[data-testid="left-eye"]');
    
    // 初期位置を取得
    const initialBox = await leftEye.boundingBox();
    
    // ドラッグ操作: 50px右、30px下に移動
    await leftEye.dragTo(leftEye, {
      targetPosition: { x: initialBox.x + 50, y: initialBox.y + 30 }
    });
    
    // 位置が変更されていることを確認
    const newBox = await leftEye.boundingBox();
    expect(Math.abs(newBox.x - (initialBox.x + 50))).toBeLessThan(10);
    expect(Math.abs(newBox.y - (initialBox.y + 30))).toBeLessThan(10);
    
    // 他のパーツの位置が変更されていないことを確認
    const rightEye = page.locator('[data-testid="right-eye"]');
    const rightEyeStyle = await rightEye.getAttribute('style');
    expect(rightEyeStyle).toContain('left: 170px');
    expect(rightEyeStyle).toContain('top: 90px');
  });

  test('TC03: 右目のドラッグ操作', async ({ page }) => {
    const rightEye = page.locator('[data-testid="right-eye"]');
    
    // 初期位置を取得
    const initialBox = await rightEye.boundingBox();
    
    // ドラッグ操作: 30px左、20px上に移動
    await rightEye.dragTo(rightEye, {
      targetPosition: { x: initialBox.x - 30, y: initialBox.y - 20 }
    });
    
    // 位置が変更されていることを確認
    const newBox = await rightEye.boundingBox();
    expect(Math.abs(newBox.x - (initialBox.x - 30))).toBeLessThan(10);
    expect(Math.abs(newBox.y - (initialBox.y - 20))).toBeLessThan(10);
  });

  test('TC04: 鼻のドラッグ操作', async ({ page }) => {
    const nose = page.locator('[data-testid="nose"]');
    
    // 初期位置を取得
    const initialBox = await nose.boundingBox();
    
    // ドラッグ操作: 20px左、40px下に移動
    await nose.dragTo(nose, {
      targetPosition: { x: initialBox.x - 20, y: initialBox.y + 40 }
    });
    
    // 位置が変更されていることを確認
    const newBox = await nose.boundingBox();
    expect(Math.abs(newBox.x - (initialBox.x - 20))).toBeLessThan(10);
    expect(Math.abs(newBox.y - (initialBox.y + 40))).toBeLessThan(10);
  });

  test('TC05: 口のドラッグ操作', async ({ page }) => {
    const mouth = page.locator('[data-testid="mouth"]');
    
    // 初期位置を取得
    const initialBox = await mouth.boundingBox();
    
    // ドラッグ操作: 60px右、10px上に移動
    await mouth.dragTo(mouth, {
      targetPosition: { x: initialBox.x + 60, y: initialBox.y - 10 }
    });
    
    // 位置が変更されていることを確認
    const newBox = await mouth.boundingBox();
    expect(Math.abs(newBox.x - (initialBox.x + 60))).toBeLessThan(10);
    expect(Math.abs(newBox.y - (initialBox.y - 10))).toBeLessThan(10);
  });

  test('TC06: 複数パーツの同時移動', async ({ page }) => {
    const leftEye = page.locator('[data-testid="left-eye"]');
    const rightEye = page.locator('[data-testid="right-eye"]');
    const mouth = page.locator('[data-testid="mouth"]');
    
    // 各パーツの初期位置を取得
    const leftEyeInitial = await leftEye.boundingBox();
    const rightEyeInitial = await rightEye.boundingBox();
    const mouthInitial = await mouth.boundingBox();
    
    // 連続してドラッグ
    await leftEye.dragTo(leftEye, {
      targetPosition: { x: leftEyeInitial.x + 30, y: leftEyeInitial.y + 20 }
    });
    
    await rightEye.dragTo(rightEye, {
      targetPosition: { x: rightEyeInitial.x - 20, y: rightEyeInitial.y + 30 }
    });
    
    await mouth.dragTo(mouth, {
      targetPosition: { x: mouthInitial.x + 40, y: mouthInitial.y - 15 }
    });
    
    // 各パーツが意図した位置に配置されていることを確認
    const leftEyeFinal = await leftEye.boundingBox();
    const rightEyeFinal = await rightEye.boundingBox();
    const mouthFinal = await mouth.boundingBox();
    
    expect(Math.abs(leftEyeFinal.x - (leftEyeInitial.x + 30))).toBeLessThan(10);
    expect(Math.abs(rightEyeFinal.x - (rightEyeInitial.x - 20))).toBeLessThan(10);
    expect(Math.abs(mouthFinal.x - (mouthInitial.x + 40))).toBeLessThan(10);
  });

  test('TC07: 完成ボタンの動作', async ({ page }) => {
    // いくつかのパーツをドラッグして移動
    const leftEye = page.locator('[data-testid="left-eye"]');
    await leftEye.dragTo(leftEye, {
      targetPosition: { x: 150, y: 120 }
    });
    
    // 完成ボタンをクリック
    await page.locator('[data-testid="complete-button"]').click();
    
    // 完成画面が表示されることを確認
    await expect(page.locator('.result-area')).toBeVisible();
    await expect(page.locator('[data-testid="new-face-button"]')).toBeVisible();
    
    // ゲームエリアが非表示になることを確認
    await expect(page.locator('.game-area')).toBeHidden();
  });

  test('TC08: リセットボタンの動作', async ({ page }) => {
    // 全てのパーツをドラッグして初期位置から移動
    const parts = [
      '[data-testid="left-eye"]',
      '[data-testid="right-eye"]',
      '[data-testid="nose"]',
      '[data-testid="mouth"]'
    ];
    
    for (const partSelector of parts) {
      const part = page.locator(partSelector);
      await part.dragTo(part, {
        targetPosition: { x: 200, y: 200 }
      });
    }
    
    // リセットボタンをクリック
    await page.locator('[data-testid="reset-button"]').click();
    
    // 少し待機（アニメーション）
    await page.waitForTimeout(500);
    
    // 全てのパーツが初期位置に戻ることを確認
    const leftEye = page.locator('[data-testid="left-eye"]');
    const leftEyeStyle = await leftEye.getAttribute('style');
    expect(leftEyeStyle).toContain('left: 80px');
    expect(leftEyeStyle).toContain('top: 90px');
    
    const rightEye = page.locator('[data-testid="right-eye"]');
    const rightEyeStyle = await rightEye.getAttribute('style');
    expect(rightEyeStyle).toContain('left: 170px');
    expect(rightEyeStyle).toContain('top: 90px');
  });

  test('TC09: 新しく作るボタンの動作', async ({ page }) => {
    // ゲームを完成まで進める
    await page.locator('[data-testid="complete-button"]').click();
    await expect(page.locator('.result-area')).toBeVisible();
    
    // 新しく作るボタンをクリック
    await page.locator('[data-testid="new-face-button"]').click();
    
    // ゲーム画面に戻ることを確認
    await expect(page.locator('.game-area')).toBeVisible();
    await expect(page.locator('.result-area')).toBeHidden();
    
    // 全てのパーツが初期位置に配置されていることを確認
    const leftEye = page.locator('[data-testid="left-eye"]');
    const leftEyeStyle = await leftEye.getAttribute('style');
    expect(leftEyeStyle).toContain('left: 80px');
    expect(leftEyeStyle).toContain('top: 90px');
  });

  test('TC10: 境界値テスト（顔の範囲外への移動）', async ({ page }) => {
    const leftEye = page.locator('[data-testid="left-eye"]');
    const faceBase = page.locator('[data-testid="face-base"]');
    
    // 顔の範囲を取得
    const faceBox = await faceBase.boundingBox();
    
    // 顔の範囲を大きく超える位置にドラッグを試行
    await leftEye.dragTo(leftEye, {
      targetPosition: { x: faceBox.x + faceBox.width + 100, y: faceBox.y - 100 }
    });
    
    // パーツが顔の範囲内に留まることを確認
    const eyeBox = await leftEye.boundingBox();
    expect(eyeBox.x).toBeGreaterThanOrEqual(faceBox.x);
    expect(eyeBox.x + eyeBox.width).toBeLessThanOrEqual(faceBox.x + faceBox.width);
    expect(eyeBox.y).toBeGreaterThanOrEqual(faceBox.y);
    expect(eyeBox.y + eyeBox.height).toBeLessThanOrEqual(faceBox.y + faceBox.height);
  });

  test('TC11: モバイル対応確認（タッチ操作）', async ({ page }) => {
    // モバイルビューポートに設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    // ページを再読み込み
    await page.reload();
    
    // 主要UIがモバイル画面に適切に表示されることを確認
    await expect(page.locator('[data-testid="title"]')).toBeVisible();
    await expect(page.locator('[data-testid="face-base"]')).toBeVisible();
    await expect(page.locator('[data-testid="complete-button"]')).toBeVisible();
    
    // タッチ操作でドラッグ
    const leftEye = page.locator('[data-testid="left-eye"]');
    const initialBox = await leftEye.boundingBox();
    
    await leftEye.dragTo(leftEye, {
      targetPosition: { x: initialBox.x + 30, y: initialBox.y + 20 }
    });
    
    // パーツが正しく移動することを確認
    const newBox = await leftEye.boundingBox();
    expect(Math.abs(newBox.x - (initialBox.x + 30))).toBeLessThan(15);
    expect(Math.abs(newBox.y - (initialBox.y + 20))).toBeLessThan(15);
  });

  test('TC12: 連続操作の安定性', async ({ page }) => {
    const leftEye = page.locator('[data-testid="left-eye"]');
    const initialBox = await leftEye.boundingBox();
    
    // 同じパーツを複数回連続でドラッグ
    for (let i = 0; i < 5; i++) {
      await leftEye.dragTo(leftEye, {
        targetPosition: { 
          x: initialBox.x + (i * 10), 
          y: initialBox.y + (i * 5) 
        }
      });
      
      // 少し待機
      await page.waitForTimeout(100);
    }
    
    // パーツが正しく追従することを確認
    const finalBox = await leftEye.boundingBox();
    expect(Math.abs(finalBox.x - (initialBox.x + 40))).toBeLessThan(15);
    expect(Math.abs(finalBox.y - (initialBox.y + 20))).toBeLessThan(15);
    
    // ゲームの状態が安定していることを確認（エラーが発生していない）
    await expect(page.locator('[data-testid="complete-button"]')).toBeEnabled();
    await expect(page.locator('[data-testid="reset-button"]')).toBeEnabled();
  });
});