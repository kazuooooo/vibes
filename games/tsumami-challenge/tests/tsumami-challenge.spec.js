import { test, expect } from '@playwright/test';

test.describe('つまみ食いチャレンジ', () => {
  
  test('TC01: 初期表示の確認', async ({ page }) => {
    await page.goto('/');
    
    // UI要素の存在確認
    await expect(page.getByTestId('title')).toBeVisible();
    await expect(page.getByTestId('start-button')).toBeVisible();
    await expect(page.getByTestId('level-display')).toBeVisible();
    await expect(page.getByTestId('score-display')).toBeVisible();
    await expect(page.getByTestId('timer-display')).toBeVisible();
    
    // スタートボタンが有効
    await expect(page.getByTestId('start-button')).toBeEnabled();
    
    // 親キャラクターと菓子エリアの存在
    await expect(page.getByTestId('parent-character')).toBeVisible();
    await expect(page.getByTestId('snack-area')).toBeVisible();
    
    // 初期値の確認
    await expect(page.getByTestId('level-display')).toHaveText('1');
    await expect(page.getByTestId('score-display')).toHaveText('0');
    await expect(page.getByTestId('timer-display')).toHaveText('30');
  });

  test('TC02: ゲーム開始で親と菓子が初期化される', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-button').click();
    
    // 親キャラクターが後ろ向き状態
    await expect(page.getByTestId('parent-character')).toHaveAttribute('data-state', 'safe');
    
    // お菓子が表示される
    await expect(page.getByTestId('current-snack')).toBeVisible();
    
    // タイマーが開始される（30秒から減少）
    await page.waitForTimeout(1000);
    const timerText = await page.getByTestId('timer-display').textContent();
    expect(parseInt(timerText)).toBeLessThan(30);
    
    // 状態メッセージが「チャンス！」になる
    await expect(page.getByTestId('status-message')).toHaveText('チャンス！');
  });

  test('TC03: 安全な時間にお菓子を食べる（成功パターン）', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-button').click();
    
    // 親が後ろ向きであることを確認
    await expect(page.getByTestId('parent-character')).toHaveAttribute('data-state', 'safe');
    await expect(page.getByTestId('status-message')).toHaveText('チャンス！');
    
    // お菓子をクリック
    await page.getByTestId('current-snack').click();
    
    // スコアが10点増加
    await expect(page.getByTestId('score-display')).toHaveText('10');
    
    // 新しいお菓子が表示される
    await expect(page.getByTestId('current-snack')).toBeVisible();
  });

  test('TC04: 親が振り向いている時にクリック（失敗パターン）', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-button').click();
    
    // 親が振り向くまで待機（最大5秒）
    await page.waitForFunction(() => {
      const parent = document.querySelector('[data-testid="parent-character"]');
      return parent && parent.getAttribute('data-state') === 'danger';
    }, { timeout: 5000 });
    
    // 親が振り向いている状態でお菓子をクリック
    await page.getByTestId('current-snack').click();
    
    // ゲームオーバー状態になる
    await expect(page.getByTestId('status-message')).toHaveText('バレた！');
    await expect(page.getByTestId('retry-button')).toBeVisible();
  });

  test('TC05: 親の振り向きパターンの確認', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-button').click();
    
    // 初期状態は安全
    await expect(page.getByTestId('parent-character')).toHaveAttribute('data-state', 'safe');
    await expect(page.getByTestId('status-message')).toHaveText('チャンス！');
    
    // 約2秒後に警告が表示される
    await page.waitForFunction(() => {
      const status = document.querySelector('[data-testid="status-message"]');
      return status && status.textContent === '危険！';
    }, { timeout: 4000 });
    
    // その後親が振り向く
    await page.waitForFunction(() => {
      const parent = document.querySelector('[data-testid="parent-character"]');
      return parent && parent.getAttribute('data-state') === 'danger';
    }, { timeout: 2000 });
    
    // 振り向き中はお菓子がクリック不可
    const snackClickable = await page.getByTestId('current-snack').isEnabled();
    expect(snackClickable).toBeFalsy();
  });

  test('TC06: タイマーによる時間制限', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-button').click();
    
    // タイマーが30秒から開始されることを確認
    const initialTimer = await page.getByTestId('timer-display').textContent();
    expect(parseInt(initialTimer)).toBeLessThanOrEqual(30);
    
    // 1秒待ってタイマーが減少していることを確認
    await page.waitForTimeout(1000);
    const updatedTimer = await page.getByTestId('timer-display').textContent();
    expect(parseInt(updatedTimer)).toBeLessThan(parseInt(initialTimer));
  });

  test('TC07: 連続成功ボーナス', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-button').click();
    
    // 1個目のお菓子を食べる（10点）
    await page.waitForFunction(() => {
      const parent = document.querySelector('[data-testid="parent-character"]');
      return parent && parent.getAttribute('data-state') === 'safe';
    });
    await page.getByTestId('current-snack').click();
    await expect(page.getByTestId('score-display')).toHaveText('10');
    
    // 2個目のお菓子を食べる（10 + 5ボーナス = 15点追加）
    await page.waitForFunction(() => {
      const parent = document.querySelector('[data-testid="parent-character"]');
      return parent && parent.getAttribute('data-state') === 'safe';
    });
    await page.getByTestId('current-snack').click();
    await expect(page.getByTestId('score-display')).toHaveText('25');
  });

  test('TC08: ゲームオーバー時のリトライ機能', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-button').click();
    
    // 意図的にゲームオーバーにする
    await page.waitForFunction(() => {
      const parent = document.querySelector('[data-testid="parent-character"]');
      return parent && parent.getAttribute('data-state') === 'danger';
    }, { timeout: 5000 });
    
    await page.getByTestId('current-snack').click();
    
    // リトライボタンをクリック
    await page.getByTestId('retry-button').click();
    
    // 値がリセットされることを確認
    await expect(page.getByTestId('level-display')).toHaveText('1');
    await expect(page.getByTestId('score-display')).toHaveText('0');
    await expect(page.getByTestId('timer-display')).toHaveText('30');
  });

  test('TC09: スコア計算の正確性', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-button').click();
    
    // 1個食べて10点
    await page.waitForFunction(() => {
      const parent = document.querySelector('[data-testid="parent-character"]');
      return parent && parent.getAttribute('data-state') === 'safe';
    });
    await page.getByTestId('current-snack').click();
    await expect(page.getByTestId('score-display')).toHaveText('10');
    
    // 2個目で15点追加（10 + 5ボーナス）
    await page.waitForFunction(() => {
      const parent = document.querySelector('[data-testid="parent-character"]');
      return parent && parent.getAttribute('data-state') === 'safe';
    });
    await page.getByTestId('current-snack').click();
    await expect(page.getByTestId('score-display')).toHaveText('25');
  });

  test('TC10: 危険警告の表示タイミング', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-button').click();
    
    // 初期状態は「チャンス！」
    await expect(page.getByTestId('status-message')).toHaveText('チャンス！');
    
    // 約2秒後に「危険！」に変わる
    await page.waitForFunction(() => {
      const status = document.querySelector('[data-testid="status-message"]');
      return status && status.textContent === '危険！';
    }, { timeout: 4000 });
    
    // その1秒後に親が振り向く
    await page.waitForFunction(() => {
      const parent = document.querySelector('[data-testid="parent-character"]');
      return parent && parent.getAttribute('data-state') === 'danger';
    }, { timeout: 2000 });
  });

  test('TC11: モバイル対応確認', async ({ page }) => {
    // iPhone SEサイズに設定
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // すべてのUI要素が表示されることを確認
    await expect(page.getByTestId('title')).toBeVisible();
    await expect(page.getByTestId('start-button')).toBeVisible();
    await expect(page.getByTestId('parent-character')).toBeVisible();
    await expect(page.getByTestId('snack-area')).toBeVisible();
    
    // ゲームが正常に開始できることを確認
    await page.getByTestId('start-button').click();
    await expect(page.getByTestId('current-snack')).toBeVisible();
    await expect(page.getByTestId('status-message')).toHaveText('チャンス！');
  });

  test('TC12: お菓子の種類とランダム表示', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-button').click();
    
    // 最初のお菓子の種類を記録
    const firstSnackType = await page.getByTestId('current-snack').getAttribute('data-snack-type');
    
    // お菓子を食べる
    await page.waitForFunction(() => {
      const parent = document.querySelector('[data-testid="parent-character"]');
      return parent && parent.getAttribute('data-state') === 'safe';
    });
    await page.getByTestId('current-snack').click();
    
    // 新しいお菓子が表示される
    await expect(page.getByTestId('current-snack')).toBeVisible();
    
    // お菓子の種類が設定されていることを確認（同じでも異なってもOK）
    const secondSnackType = await page.getByTestId('current-snack').getAttribute('data-snack-type');
    expect(secondSnackType).toBeTruthy();
  });

  test('TC13: 同時クリック防止', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('start-button').click();
    
    // 安全な時間を待つ
    await page.waitForFunction(() => {
      const parent = document.querySelector('[data-testid="parent-character"]');
      return parent && parent.getAttribute('data-state') === 'safe';
    });
    
    // 同じお菓子を素早く複数回クリック
    const snack = page.getByTestId('current-snack');
    await snack.click();
    await snack.click();
    await snack.click();
    
    // スコアが10点のみ加算されることを確認（重複しない）
    await expect(page.getByTestId('score-display')).toHaveText('10');
  });
});