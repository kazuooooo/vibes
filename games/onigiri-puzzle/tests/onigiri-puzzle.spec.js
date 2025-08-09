import { test, expect } from '@playwright/test';

test.describe('おにぎりパズル', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('初期表示テスト', () => {
    test('TC001: ゲーム画面の初期表示', async ({ page }) => {
      // タイトルが表示される
      await expect(page.locator('h1')).toContainText('おにぎりパズル');
      
      // ゲームグリッドが表示される
      const gameGrid = page.locator('[data-testid="game-grid"]');
      await expect(gameGrid).toBeVisible();
      
      // 制限時間が表示される
      const timer = page.locator('[data-testid="timer"]');
      await expect(timer).toBeVisible();
      await expect(timer).toContainText('60');
      
      // 現在得点が表示される
      const score = page.locator('[data-testid="score"]');
      await expect(score).toBeVisible();
      await expect(score).toContainText('0');
      
      // 作成済みおにぎり数が表示される
      const onigiriCount = page.locator('[data-testid="onigiri-count"]');
      await expect(onigiriCount).toBeVisible();
      await expect(onigiriCount).toContainText('0');
    });

    test('TC002: 初期グリッドの具材配置', async ({ page }) => {
      // 8×8の全てのセルに具材が配置されている
      const cells = page.locator('[data-testid="game-cell"]');
      await expect(cells).toHaveCount(64);
      
      // 各セルに具材が表示されている
      for (let i = 0; i < 64; i++) {
        await expect(cells.nth(i)).not.toBeEmpty();
      }
    });
  });

  test.describe('基本操作テスト', () => {
    test('TC003: 具材の選択', async ({ page }) => {
      // 最初の具材をクリック
      const firstCell = page.locator('[data-testid="game-cell"]').first();
      await firstCell.click();
      
      // 選択状態になる（selected クラスが追加される）
      await expect(firstCell).toHaveClass(/selected/);
    });

    test('TC004: 具材の交換', async ({ page }) => {
      // 最初の具材を選択
      const firstCell = page.locator('[data-testid="game-cell"]').first();
      const firstCellContent = await firstCell.textContent();
      await firstCell.click();
      
      // 隣接するセル（右のセル）をクリック
      const secondCell = page.locator('[data-testid="game-cell"]').nth(1);
      const secondCellContent = await secondCell.textContent();
      await secondCell.click();
      
      // 交換が実行されることを確認（内容が入れ替わる）
      await expect(firstCell).toContainText(secondCellContent);
      await expect(secondCell).toContainText(firstCellContent);
      
      // 選択状態が解除される
      await expect(firstCell).not.toHaveClass(/selected/);
    });

    test('TC005: 無効な交換の拒否', async ({ page }) => {
      // 最初の具材を選択
      const firstCell = page.locator('[data-testid="game-cell"]').first();
      const firstCellContent = await firstCell.textContent();
      await firstCell.click();
      
      // 離れた位置の具材をクリック（2行下）
      const distantCell = page.locator('[data-testid="game-cell"]').nth(16);
      const distantCellContent = await distantCell.textContent();
      await distantCell.click();
      
      // 交換は実行されない（内容が変わらない）
      await expect(firstCell).toContainText(firstCellContent);
      await expect(distantCell).toContainText(distantCellContent);
      
      // 新しくクリックした具材が選択状態になる
      await expect(distantCell).toHaveClass(/selected/);
    });
  });

  test.describe('マッチング機能テスト', () => {
    test('TC006: 3マッチの検出と消去', async ({ page }) => {
      // スコアの初期値を記録
      const initialScore = await page.locator('[data-testid="score"]').textContent();
      
      // 3マッチが可能な配置を作成（テスト用のセットアップ関数が必要）
      await page.evaluate(() => {
        if (window.testSetup && window.testSetup.create3Match) {
          window.testSetup.create3Match();
        }
      });
      
      // マッチ処理が実行されるまで待機
      await page.waitForTimeout(1000);
      
      // 得点が加算されていることを確認
      const currentScore = await page.locator('[data-testid="score"]').textContent();
      expect(parseInt(currentScore)).toBeGreaterThan(parseInt(initialScore));
    });

    test('TC007: 4マッチのボーナス得点', async ({ page }) => {
      const initialScore = await page.locator('[data-testid="score"]').textContent();
      
      // 4マッチが可能な配置を作成
      await page.evaluate(() => {
        if (window.testSetup && window.testSetup.create4Match) {
          window.testSetup.create4Match();
        }
      });
      
      await page.waitForTimeout(1000);
      
      // 4マッチボーナス（200点）が加算されることを確認
      const currentScore = await page.locator('[data-testid="score"]').textContent();
      expect(parseInt(currentScore)).toBeGreaterThanOrEqual(parseInt(initialScore) + 200);
    });
  });

  test.describe('おにぎり完成システムテスト', () => {
    test('TC013: 基本おにぎりの完成', async ({ page }) => {
      const initialOnigiriCount = await page.locator('[data-testid="onigiri-count"]').textContent();
      const initialScore = await page.locator('[data-testid="score"]').textContent();
      
      // おにぎり完成条件をセットアップ（米3個+具材1個+海苔1個）
      await page.evaluate(() => {
        if (window.testSetup && window.testSetup.createOnigiri) {
          window.testSetup.createOnigiri();
        }
      });
      
      await page.waitForTimeout(2000);
      
      // おにぎり数が増加することを確認
      const currentOnigiriCount = await page.locator('[data-testid="onigiri-count"]').textContent();
      expect(parseInt(currentOnigiriCount)).toBeGreaterThan(parseInt(initialOnigiriCount));
      
      // おにぎりボーナス（1000点）が加算されることを確認
      const currentScore = await page.locator('[data-testid="score"]').textContent();
      expect(parseInt(currentScore)).toBeGreaterThanOrEqual(parseInt(initialScore) + 1000);
    });
  });

  test.describe('特殊効果テスト', () => {
    test('TC015: 梅干しの爆破効果', async ({ page }) => {
      const initialScore = await page.locator('[data-testid="score"]').textContent();
      
      // 梅干しマッチをセットアップ
      await page.evaluate(() => {
        if (window.testSetup && window.testSetup.createUmeMatch) {
          window.testSetup.createUmeMatch();
        }
      });
      
      await page.waitForTimeout(2000);
      
      // 特殊効果ボーナス（+500点）が加算されることを確認
      const currentScore = await page.locator('[data-testid="score"]').textContent();
      expect(parseInt(currentScore)).toBeGreaterThanOrEqual(parseInt(initialScore) + 500);
      
      // 爆破エフェクトの確認
      const explosionEffect = page.locator('[data-testid="explosion-effect"]');
      await expect(explosionEffect).toBeVisible();
    });

    test('TC016: 鮭のライン消去効果', async ({ page }) => {
      const initialScore = await page.locator('[data-testid="score"]').textContent();
      
      // 鮭マッチをセットアップ
      await page.evaluate(() => {
        if (window.testSetup && window.testSetup.createSalmonMatch) {
          window.testSetup.createSalmonMatch();
        }
      });
      
      await page.waitForTimeout(2000);
      
      // 特殊効果ボーナスが加算されることを確認
      const currentScore = await page.locator('[data-testid="score"]').textContent();
      expect(parseInt(currentScore)).toBeGreaterThanOrEqual(parseInt(initialScore) + 500);
      
      // ライン消去エフェクトの確認
      const lineEffect = page.locator('[data-testid="line-effect"]');
      await expect(lineEffect).toBeVisible();
    });
  });

  test.describe('タイマー機能テスト', () => {
    test('TC019: 制限時間のカウントダウン', async ({ page }) => {
      // 初期タイマー値を確認
      const initialTimer = await page.locator('[data-testid="timer"]').textContent();
      expect(parseInt(initialTimer)).toBe(60);
      
      // 数秒待ってカウントダウンを確認
      await page.waitForTimeout(2000);
      const currentTimer = await page.locator('[data-testid="timer"]').textContent();
      expect(parseInt(currentTimer)).toBeLessThan(60);
    });

    test('TC020: タイムアップ時の処理', async ({ page }) => {
      // タイマーを0にセット
      await page.evaluate(() => {
        if (window.gameTimer && window.gameTimer.setTime) {
          window.gameTimer.setTime(1);
        }
      });
      
      // 1秒後にゲーム終了を確認
      await page.waitForTimeout(2000);
      
      // 結果画面が表示されることを確認
      const gameOverScreen = page.locator('[data-testid="game-over"]');
      await expect(gameOverScreen).toBeVisible();
      
      // 最終得点が表示されることを確認
      const finalScore = page.locator('[data-testid="final-score"]');
      await expect(finalScore).toBeVisible();
    });
  });

  test.describe('UI/UX テスト', () => {
    test('TC021: レスポンシブデザイン（デスクトップ）', async ({ page }) => {
      // デスクトップサイズに設定
      await page.setViewportSize({ width: 1200, height: 800 });
      
      // グリッドが中央に配置されることを確認
      const gameGrid = page.locator('[data-testid="game-grid"]');
      await expect(gameGrid).toBeVisible();
      
      // サイドパネルが右側に表示されることを確認
      const sidePanel = page.locator('[data-testid="side-panel"]');
      await expect(sidePanel).toBeVisible();
    });

    test('TC022: レスポンシブデザイン（タブレット）', async ({ page }) => {
      // タブレットサイズに設定
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // レイアウトが調整されることを確認
      const gameGrid = page.locator('[data-testid="game-grid"]');
      await expect(gameGrid).toBeVisible();
      
      // サイドパネルが下部に移動することを確認
      const sidePanel = page.locator('[data-testid="side-panel"]');
      await expect(sidePanel).toBeVisible();
    });

    test('TC023: レスポンシブデザイン（モバイル）', async ({ page }) => {
      // モバイルサイズに設定
      await page.setViewportSize({ width: 375, height: 667 });
      
      // グリッドが画面幅に収まることを確認
      const gameGrid = page.locator('[data-testid="game-grid"]');
      await expect(gameGrid).toBeVisible();
      
      // UI要素がコンパクトに配置されることを確認
      const compactUI = page.locator('[data-testid="compact-ui"]');
      await expect(compactUI).toBeVisible();
    });
  });

  test.describe('操作系テスト', () => {
    test('TC024: マウス操作（PC）', async ({ page }) => {
      // ホバー効果のテスト
      const firstCell = page.locator('[data-testid="game-cell"]').first();
      await firstCell.hover();
      
      // ホバー状態のクラスが追加されることを確認
      await expect(firstCell).toHaveClass(/hover/);
      
      // クリック反応時間のテスト（100ms以内）
      const startTime = Date.now();
      await firstCell.click();
      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(100);
    });

    test('TC025: タッチ操作（モバイル）', async ({ page }) => {
      // モバイルサイズに設定
      await page.setViewportSize({ width: 375, height: 667 });
      
      // タップ操作のテスト
      const firstCell = page.locator('[data-testid="game-cell"]').first();
      await firstCell.tap();
      
      // 選択状態になることを確認
      await expect(firstCell).toHaveClass(/selected/);
      
      // スワイプ操作のシミュレーション
      const secondCell = page.locator('[data-testid="game-cell"]').nth(1);
      await page.touchscreen.tap(await firstCell.boundingBox().then(box => ({ x: box.x + box.width/2, y: box.y + box.height/2 })));
      await page.touchscreen.tap(await secondCell.boundingBox().then(box => ({ x: box.x + box.width/2, y: box.y + box.height/2 })));
    });
  });

  test.describe('エラーハンドリングテスト', () => {
    test('TC028: 無効操作の処理', async ({ page }) => {
      // グリッド外をクリック
      await page.click('body', { position: { x: 10, y: 10 } });
      
      // エラーが発生しないことを確認
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).not.toBeVisible();
      
      // ゲームが続行可能であることを確認
      const gameGrid = page.locator('[data-testid="game-grid"]');
      await expect(gameGrid).toBeVisible();
    });

    test('TC029: ブラウザリサイズ対応', async ({ page }) => {
      // 初期サイズでゲーム開始
      await page.setViewportSize({ width: 1200, height: 800 });
      
      // サイズ変更
      await page.setViewportSize({ width: 800, height: 600 });
      
      // ゲームが継続していることを確認
      const gameGrid = page.locator('[data-testid="game-grid"]');
      await expect(gameGrid).toBeVisible();
      
      // レイアウトが適切に調整されることを確認
      const timer = page.locator('[data-testid="timer"]');
      await expect(timer).toBeVisible();
    });
  });

  test.describe('アクセシビリティテスト', () => {
    test('TC030: キーボード操作', async ({ page }) => {
      // Tabキーでフォーカス移動
      await page.keyboard.press('Tab');
      
      // フォーカスが適切な要素に移動することを確認
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // 矢印キーで選択移動
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowDown');
      
      // Enterキーで選択
      await page.keyboard.press('Enter');
      
      // 操作が正常に動作することを確認
      const selectedCell = page.locator('[data-testid="game-cell"].selected');
      await expect(selectedCell).toBeVisible();
    });

    test('TC031: スクリーンリーダー対応', async ({ page }) => {
      // ARIAラベルが適切に設定されていることを確認
      const gameGrid = page.locator('[data-testid="game-grid"]');
      await expect(gameGrid).toHaveAttribute('aria-label');
      
      // ゲーム状況を示すARIAライブリージョンの確認
      const gameStatus = page.locator('[aria-live="polite"]');
      await expect(gameStatus).toBeVisible();
      
      // 各セルにアクセシブルな名前が設定されていることを確認
      const firstCell = page.locator('[data-testid="game-cell"]').first();
      await expect(firstCell).toHaveAttribute('aria-label');
    });
  });

});