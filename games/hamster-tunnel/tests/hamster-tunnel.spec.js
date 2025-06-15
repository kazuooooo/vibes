import { test, expect } from '@playwright/test';

test.describe('Hamster Tunnel Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC01: 初期表示の確認', async ({ page }) => {
    // UI要素の存在確認
    await expect(page.locator('[data-testid="title"]')).toBeVisible();
    await expect(page.locator('[data-testid="start-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="level-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="score-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="timer-display"]')).toBeVisible();
    
    // ゲームフィールドの存在確認
    await expect(page.locator('[data-testid="game-field"]')).toBeVisible();
    await expect(page.locator('[data-testid="hamster"]')).toBeVisible();
    await expect(page.locator('[data-testid="start-point"]')).toBeVisible();
    await expect(page.locator('[data-testid="goal-point"]')).toBeVisible();
    
    // 初期値の確認
    await expect(page.locator('[data-testid="level-display"]')).toContainText('1');
    await expect(page.locator('[data-testid="score-display"]')).toContainText('0');
    await expect(page.locator('[data-testid="timer-display"]')).toContainText('30');
    
    // スタートボタンが有効
    await expect(page.locator('[data-testid="start-button"]')).toBeEnabled();
    
    // 5×5グリッドの確認
    const gridCells = page.locator('[data-testid="grid-cell"]');
    await expect(gridCells).toHaveCount(25);
  });

  test('TC02: ゲーム開始でトンネル掘りフェーズに移行', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    
    // 状態メッセージの確認
    await expect(page.locator('[data-testid="status-message"]')).toContainText('トンネルを掘ってください');
    
    // ゲームフィールドが表示される
    await expect(page.locator('[data-testid="game-field"]')).toBeVisible();
    
    // タイマーがカウントダウンを開始（数値が変化する）
    const initialTimer = await page.locator('[data-testid="timer-display"]').textContent();
    await page.waitForTimeout(1500);
    const currentTimer = await page.locator('[data-testid="timer-display"]').textContent();
    expect(parseInt(currentTimer)).toBeLessThan(parseInt(initialTimer));
  });

  test('TC03: トンネル掘り機能', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    
    // 土ブロックをクリックしてトンネルを掘る
    const gridCell = page.locator('[data-testid="grid-cell"]').first();
    await gridCell.click();
    
    // マスの状態が変化することを確認（実装依存）
    await expect(gridCell).toHaveAttribute('data-state', 'tunnel');
    
    // 複数のマスをクリック
    const secondCell = page.locator('[data-testid="grid-cell"]').nth(1);
    await secondCell.click();
    await expect(secondCell).toHaveAttribute('data-state', 'tunnel');
  });

  test('TC04: ハムスター移動フェーズへの移行', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    
    // スタートからゴールまでの経路を作成
    // 最低限の経路: 右→下→右→下...
    const cells = page.locator('[data-testid="grid-cell"]');
    
    // 経路を作成（簡単な経路）
    await cells.nth(1).click(); // (0,1)
    await cells.nth(2).click(); // (0,2)
    await cells.nth(7).click(); // (1,2)
    await cells.nth(12).click(); // (2,2)
    await cells.nth(17).click(); // (3,2)
    await cells.nth(22).click(); // (4,2)
    await cells.nth(23).click(); // (4,3)
    
    // 移動開始（実装によってボタンが変わる可能性）
    if (await page.locator('[data-testid="move-button"]').isVisible()) {
      await page.locator('[data-testid="move-button"]').click();
    }
    
    // ハムスター移動中の状態確認
    await expect(page.locator('[data-testid="status-message"]')).toContainText('ハムスター移動中');
  });

  test('TC05: ハムスターの正常移動（レベル1クリア）', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    
    // 確実にゴールまで繋がる経路を作成
    const cells = page.locator('[data-testid="grid-cell"]');
    
    // 最短経路を作成: (0,0) -> (0,1) -> (0,2) -> (0,3) -> (0,4) -> (1,4) -> (2,4) -> (3,4) -> (4,4)
    await cells.nth(1).click();  // (0,1)
    await cells.nth(2).click();  // (0,2)
    await cells.nth(3).click();  // (0,3)
    await cells.nth(9).click();  // (1,4)
    await cells.nth(14).click(); // (2,4)
    await cells.nth(19).click(); // (3,4)
    
    // 移動開始
    if (await page.locator('[data-testid="move-button"]').isVisible()) {
      await page.locator('[data-testid="move-button"]').click();
    }
    
    // ハムスターの移動を待つ
    await page.waitForTimeout(5000);
    
    // クリア状態の確認
    await expect(page.locator('[data-testid="status-message"]')).toContainText('クリア');
    
    // レベルとスコアの更新確認
    await expect(page.locator('[data-testid="level-display"]')).toContainText('2');
    
    // スコアが100点以上（時間ボーナス込み）
    const scoreText = await page.locator('[data-testid="score-display"]').textContent();
    const score = parseInt(scoreText);
    expect(score).toBeGreaterThanOrEqual(100);
  });

  test('TC06: 経路なしでゲームオーバー', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    
    // ゴールまで到達できない経路を作成（途中で止める）
    const cells = page.locator('[data-testid="grid-cell"]');
    await cells.nth(1).click(); // (0,1) のみ
    
    // 移動開始
    if (await page.locator('[data-testid="move-button"]').isVisible()) {
      await page.locator('[data-testid="move-button"]').click();
    }
    
    // ゲームオーバーになることを確認
    await page.waitForTimeout(3000);
    await expect(page.locator('[data-testid="status-message"]')).toContainText('ゲームオーバー');
    
    // リトライボタンが表示される
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('TC07: 制限時間切れでゲームオーバー', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    
    // トンネルを掘らずに時間を経過させる
    // タイマーが0になるまで待つ（実際のテストでは短縮する）
    await page.waitForTimeout(32000); // 30秒 + バッファ
    
    // ゲームオーバーメッセージの確認
    await expect(page.locator('[data-testid="status-message"]')).toContainText('ゲームオーバー');
    
    // リトライボタンが表示される
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('TC08: レベル2での難易度上昇', async ({ page }) => {
    // レベル1をクリアしてレベル2に進む
    await page.locator('[data-testid="start-button"]').click();
    
    // レベル1をクリア（簡単な実装）
    const cells = page.locator('[data-testid="grid-cell"]');
    
    // 経路作成
    await cells.nth(1).click();
    await cells.nth(2).click();
    await cells.nth(3).click();
    await cells.nth(9).click();
    await cells.nth(14).click();
    await cells.nth(19).click();
    
    // 移動開始
    if (await page.locator('[data-testid="move-button"]').isVisible()) {
      await page.locator('[data-testid="move-button"]').click();
    }
    
    // クリアまで待機
    await page.waitForTimeout(6000);
    
    // レベル2の確認
    await expect(page.locator('[data-testid="level-display"]')).toContainText('2');
    
    // 6×6グリッドの確認
    const newGridCells = page.locator('[data-testid="grid-cell"]');
    await expect(newGridCells).toHaveCount(36);
    
    // タイマーが35秒で開始
    await expect(page.locator('[data-testid="timer-display"]')).toContainText('35');
  });

  test('TC09: スコア計算の確認', async ({ page }) => {
    // レベル1をクリア
    await page.locator('[data-testid="start-button"]').click();
    
    const cells = page.locator('[data-testid="grid-cell"]');
    
    // 経路作成
    await cells.nth(1).click();
    await cells.nth(2).click();
    await cells.nth(3).click();
    await cells.nth(9).click();
    await cells.nth(14).click();
    await cells.nth(19).click();
    
    if (await page.locator('[data-testid="move-button"]').isVisible()) {
      await page.locator('[data-testid="move-button"]').click();
    }
    
    await page.waitForTimeout(6000);
    
    // レベル1クリア後のスコア確認
    const level1Score = await page.locator('[data-testid="score-display"]').textContent();
    expect(parseInt(level1Score)).toBeGreaterThanOrEqual(100);
    
    // レベル2をクリア
    const newCells = page.locator('[data-testid="grid-cell"]');
    
    // レベル2の経路作成（6×6グリッド）
    await newCells.nth(1).click();
    await newCells.nth(2).click();
    await newCells.nth(3).click();
    await newCells.nth(4).click();
    await newCells.nth(11).click();
    await newCells.nth(18).click();
    await newCells.nth(25).click();
    await newCells.nth(32).click();
    
    if (await page.locator('[data-testid="move-button"]').isVisible()) {
      await page.locator('[data-testid="move-button"]').click();
    }
    
    await page.waitForTimeout(7000);
    
    // レベル2クリア後のスコア確認（累計）
    const level2Score = await page.locator('[data-testid="score-display"]').textContent();
    expect(parseInt(level2Score)).toBeGreaterThan(parseInt(level1Score));
  });

  test('TC10: リトライ機能', async ({ page }) => {
    // ゲームオーバーにする
    await page.locator('[data-testid="start-button"]').click();
    
    // 経路を作らずに時間切れまたは不完全な経路
    const cells = page.locator('[data-testid="grid-cell"]');
    await cells.nth(1).click(); // 不完全な経路
    
    if (await page.locator('[data-testid="move-button"]').isVisible()) {
      await page.locator('[data-testid="move-button"]').click();
    }
    
    await page.waitForTimeout(3000);
    
    // リトライボタンをクリック
    await page.locator('[data-testid="retry-button"]').click();
    
    // 値がリセットされることを確認
    await expect(page.locator('[data-testid="level-display"]')).toContainText('1');
    await expect(page.locator('[data-testid="score-display"]')).toContainText('0');
    await expect(page.locator('[data-testid="timer-display"]')).toContainText('30');
    
    // トンネル掘りフェーズが再開される
    await expect(page.locator('[data-testid="status-message"]')).toContainText('トンネルを掘ってください');
  });

  test('TC11: 最短経路ボーナス', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    
    // 理論的最短経路のみを作成
    const cells = page.locator('[data-testid="grid-cell"]');
    
    // 最短経路: 8マス（右4マス、下4マス）
    await cells.nth(1).click();  // (0,1)
    await cells.nth(2).click();  // (0,2)
    await cells.nth(3).click();  // (0,3)
    await cells.nth(9).click();  // (1,4)
    await cells.nth(14).click(); // (2,4)
    await cells.nth(19).click(); // (3,4)
    
    if (await page.locator('[data-testid="move-button"]').isVisible()) {
      await page.locator('[data-testid="move-button"]').click();
    }
    
    await page.waitForTimeout(6000);
    
    // 最短経路ボーナス込みのスコア確認
    const scoreText = await page.locator('[data-testid="score-display"]').textContent();
    const score = parseInt(scoreText);
    expect(score).toBeGreaterThanOrEqual(600); // 100 + 500 (bonus) + time bonus
  });

  test('TC12: モバイル対応確認', async ({ page }) => {
    // モバイルサイズに設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    // UI要素が表示される
    await expect(page.locator('[data-testid="title"]')).toBeVisible();
    await expect(page.locator('[data-testid="start-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="game-field"]')).toBeVisible();
    
    // グリッドセルが適切なサイズでタップできる
    const gridCell = page.locator('[data-testid="grid-cell"]').first();
    const boundingBox = await gridCell.boundingBox();
    expect(boundingBox?.width).toBeGreaterThan(40); // 最小タッチサイズ
    expect(boundingBox?.height).toBeGreaterThan(40);
  });

  test('TC13: 複数クリック防止', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    
    // 経路を作成してハムスターを移動開始
    const cells = page.locator('[data-testid="grid-cell"]');
    await cells.nth(1).click();
    await cells.nth(2).click();
    await cells.nth(3).click();
    await cells.nth(9).click();
    await cells.nth(14).click();
    await cells.nth(19).click();
    
    if (await page.locator('[data-testid="move-button"]').isVisible()) {
      await page.locator('[data-testid="move-button"]').click();
    }
    
    // ハムスター移動中にクリックを試行
    await page.waitForTimeout(1000);
    const testCell = page.locator('[data-testid="grid-cell"]').nth(10);
    
    // クリックが無効化されていることを確認（実装依存）
    await testCell.click();
    
    // ゲーム状態に影響しないことを確認
    await expect(page.locator('[data-testid="status-message"]')).toContainText('ハムスター移動中');
  });

  test('TC14: ハムスターアニメーション確認', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    
    // 複数マスの経路を作成
    const cells = page.locator('[data-testid="grid-cell"]');
    await cells.nth(1).click();
    await cells.nth(2).click();
    await cells.nth(3).click();
    await cells.nth(9).click();
    await cells.nth(14).click();
    await cells.nth(19).click();
    
    if (await page.locator('[data-testid="move-button"]').isVisible()) {
      await page.locator('[data-testid="move-button"]').click();
    }
    
    // ハムスターの移動を追跡
    const hamster = page.locator('[data-testid="hamster"]');
    
    // 初期位置を確認
    const initialPosition = await hamster.boundingBox();
    
    // 1秒後の位置を確認（移動していることを確認）
    await page.waitForTimeout(1000);
    const movedPosition = await hamster.boundingBox();
    
    // 位置が変化していることを確認
    expect(
      initialPosition?.x !== movedPosition?.x || 
      initialPosition?.y !== movedPosition?.y
    ).toBeTruthy();
  });

  test('TC15: エッジケースの処理', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    
    // エッジケース1: トンネルを一切掘らない
    if (await page.locator('[data-testid="move-button"]').isVisible()) {
      await page.locator('[data-testid="move-button"]').click();
    }
    
    await page.waitForTimeout(3000);
    
    // ゲームオーバーになることを確認
    await expect(page.locator('[data-testid="status-message"]')).toContainText('ゲームオーバー');
    
    // リトライして次のエッジケース
    await page.locator('[data-testid="retry-button"]').click();
    
    // エッジケース2: フィールド全体をトンネルにする
    const allCells = page.locator('[data-testid="grid-cell"]');
    const count = await allCells.count();
    
    for (let i = 0; i < count; i++) {
      const cell = allCells.nth(i);
      // スタートとゴール以外をクリック
      if (await cell.getAttribute('data-testid') !== 'start-point' && 
          await cell.getAttribute('data-testid') !== 'goal-point') {
        await cell.click();
      }
    }
    
    if (await page.locator('[data-testid="move-button"]').isVisible()) {
      await page.locator('[data-testid="move-button"]').click();
    }
    
    await page.waitForTimeout(6000);
    
    // クリアできることを確認
    await expect(page.locator('[data-testid="status-message"]')).toContainText('クリア');
  });
});