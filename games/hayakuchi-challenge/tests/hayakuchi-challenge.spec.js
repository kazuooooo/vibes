import { test, expect } from '@playwright/test';

test.describe('早口言葉チャレンジ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Web Speech APIをモック
    await page.addInitScript(() => {
      // SpeechRecognitionのモック
      window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || class MockSpeechRecognition {
        constructor() {
          this.continuous = false;
          this.interimResults = false;
          this.lang = 'ja-JP';
          this.onstart = null;
          this.onend = null;
          this.onresult = null;
          this.onerror = null;
        }
        
        start() {
          if (this.onstart) {
            setTimeout(() => this.onstart(), 100);
          }
          
          // テスト用の結果を返す
          setTimeout(() => {
            if (this.onresult) {
              const mockResult = {
                results: [{
                  0: { transcript: window.__mockSpeechResult || '生麦生米生卵' },
                  isFinal: true
                }]
              };
              this.onresult(mockResult);
            }
            if (this.onend) {
              this.onend();
            }
          }, 1000);
        }
        
        stop() {
          if (this.onend) {
            setTimeout(() => this.onend(), 100);
          }
        }
      };
      
      // メディア权限のモック
      if (!navigator.mediaDevices) {
        navigator.mediaDevices = {};
      }
      navigator.mediaDevices.getUserMedia = () => Promise.resolve({
        getTracks: () => [],
        getAudioTracks: () => [],
        getVideoTracks: () => []
      });
    });
  });

  test('TC01: 初期表示の確認', async ({ page }) => {
    // UI要素の存在確認
    await expect(page.locator('[data-testid="title"]')).toBeVisible();
    await expect(page.locator('[data-testid="start-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="level-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="score-display"]')).toBeVisible();
    
    // マイクボタンの存在確認
    await expect(page.locator('[data-testid="mic-button"]')).toBeVisible();
    
    // 初期値の確認
    await expect(page.locator('[data-testid="level-display"]')).toContainText('1');
    await expect(page.locator('[data-testid="score-display"]')).toContainText('0');
    await expect(page.locator('[data-testid="status-message"]')).toContainText('準備完了');
    
    // スタートボタンが有効
    await expect(page.locator('[data-testid="start-button"]')).toBeEnabled();
  });

  test('TC02: ゲーム開始で早口言葉表示フェーズに移行', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    
    // 状態メッセージの確認
    await expect(page.locator('[data-testid="status-message"]')).toContainText('挑戦してください');
    
    // 早口言葉が表示される
    await expect(page.locator('[data-testid="tongue-twister-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="tongue-twister-display"]')).toContainText('生麦生米生卵');
    
    // 制限時間が表示される
    await expect(page.locator('[data-testid="time-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="time-display"]')).toContainText('5');
    
    // マイクボタンが有効化される
    await expect(page.locator('[data-testid="mic-button"]')).toBeEnabled();
  });

  test('TC03: 制限時間のカウントダウン', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    
    // 初期時間の確認
    await expect(page.locator('[data-testid="time-display"]')).toContainText('5');
    
    // 1秒待ってカウントダウンを確認
    await page.waitForTimeout(1100);
    await expect(page.locator('[data-testid="time-display"]')).toContainText('4');
    
    // 時間切れまで待つ（テストを高速化するため短時間で設定）
    await page.waitForTimeout(4500);
    
    // ゲームオーバーになることを確認
    await expect(page.locator('[data-testid="status-message"]')).toContainText('ゲームオーバー');
  });

  test('TC04: マイクボタンでの音声認識開始', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    await page.locator('[data-testid="mic-button"]').click();
    
    // 認識中メッセージの確認
    await expect(page.locator('[data-testid="status-message"]')).toContainText('認識中');
    
    // マイクボタンのアニメーション確認（class属性で判定）
    await expect(page.locator('[data-testid="mic-button"]')).toHaveClass(/recording/);
  });

  test('TC05: 正しい発音での判定（レベル1クリア）', async ({ page }) => {
    // 正しい音声認識結果を設定
    await page.evaluate(() => {
      window.__mockSpeechResult = '生麦生米生卵';
    });
    
    await page.locator('[data-testid="start-button"]').click();
    await page.locator('[data-testid="mic-button"]').click();
    
    // 認識完了まで待機
    await page.waitForTimeout(1500);
    
    // 正解メッセージの確認
    await expect(page.locator('[data-testid="status-message"]')).toContainText('正解');
    
    // レベルとスコアの更新確認
    await expect(page.locator('[data-testid="level-display"]')).toContainText('2');
    
    // スコアが100点以上（時間ボーナス含む）
    const scoreText = await page.locator('[data-testid="score-display"]').textContent();
    const score = parseInt(scoreText);
    expect(score).toBeGreaterThanOrEqual(100);
  });

  test('TC06: 間違った発音での判定（ゲームオーバー）', async ({ page }) => {
    // 間違った音声認識結果を設定
    await page.evaluate(() => {
      window.__mockSpeechResult = 'なまむぎなまこめ';
    });
    
    await page.locator('[data-testid="start-button"]').click();
    await page.locator('[data-testid="mic-button"]').click();
    
    // 認識完了まで待機
    await page.waitForTimeout(1500);
    
    // ゲームオーバーメッセージの確認
    await expect(page.locator('[data-testid="status-message"]')).toContainText('ゲームオーバー');
    
    // リトライボタンが表示される
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    
    // マイクボタンが無効化される
    await expect(page.locator('[data-testid="mic-button"]')).toBeDisabled();
  });

  test('TC07: 時間切れでのゲームオーバー', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    
    // 制限時間が経過するまで待機（マイクボタンを押さない）
    await page.waitForTimeout(6000);
    
    // ゲームオーバーメッセージの確認
    await expect(page.locator('[data-testid="status-message"]')).toContainText('ゲームオーバー');
    
    // リトライボタンが表示される
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('TC08: レベル2での早口言葉変更', async ({ page }) => {
    // レベル1をクリア
    await page.evaluate(() => {
      window.__mockSpeechResult = '生麦生米生卵';
    });
    
    await page.locator('[data-testid="start-button"]').click();
    await page.locator('[data-testid="mic-button"]').click();
    await page.waitForTimeout(1500);
    
    // レベル2に進んだことを確認
    await expect(page.locator('[data-testid="level-display"]')).toContainText('2');
    
    // レベル2の早口言葉が表示される
    await expect(page.locator('[data-testid="tongue-twister-display"]')).toContainText('隣の客はよく柿食う客だ');
    
    // 制限時間が6秒に変更される
    await expect(page.locator('[data-testid="time-display"]')).toContainText('6');
  });

  test('TC09: スコア計算の確認', async ({ page }) => {
    // レベル1をクリア
    await page.evaluate(() => {
      window.__mockSpeechResult = '生麦生米生卵';
    });
    
    await page.locator('[data-testid="start-button"]').click();
    await page.locator('[data-testid="mic-button"]').click();
    await page.waitForTimeout(1500);
    
    // レベル1のスコアを確認
    const level1Score = await page.locator('[data-testid="score-display"]').textContent();
    const score1 = parseInt(level1Score);
    expect(score1).toBeGreaterThanOrEqual(100);
    
    // レベル2をクリア
    await page.evaluate(() => {
      window.__mockSpeechResult = '隣の客はよく柿食う客だ';
    });
    
    await page.locator('[data-testid="mic-button"]').click();
    await page.waitForTimeout(1500);
    
    // 合計スコアが正しく計算されることを確認
    const totalScore = await page.locator('[data-testid="score-display"]').textContent();
    const scoreTotal = parseInt(totalScore);
    expect(scoreTotal).toBeGreaterThanOrEqual(score1 + 200);
  });

  test('TC10: リトライ機能', async ({ page }) => {
    // ゲームオーバーにする
    await page.evaluate(() => {
      window.__mockSpeechResult = 'まちがった発音';
    });
    
    await page.locator('[data-testid="start-button"]').click();
    await page.locator('[data-testid="mic-button"]').click();
    await page.waitForTimeout(1500);
    
    // リトライボタンをクリック
    await page.locator('[data-testid="retry-button"]').click();
    
    // 値がリセットされることを確認
    await expect(page.locator('[data-testid="level-display"]')).toContainText('1');
    await expect(page.locator('[data-testid="score-display"]')).toContainText('0');
    
    // 最初の早口言葉が再表示される
    await expect(page.locator('[data-testid="tongue-twister-display"]')).toContainText('生麦生米生卵');
    await expect(page.locator('[data-testid="status-message"]')).toContainText('挑戦してください');
  });

  test('TC11: 音声認識が使用できない場合の代替手段', async ({ page }) => {
    // Web Speech APIを無効化
    await page.addInitScript(() => {
      delete window.SpeechRecognition;
      delete window.webkitSpeechRecognition;
    });
    
    await page.goto('/');
    await page.locator('[data-testid="start-button"]').click();
    
    // 代替手段（テキスト入力）が表示される
    await expect(page.locator('[data-testid="fallback-input"]')).toBeVisible();
    
    // テキスト入力で正解を入力
    await page.fill('[data-testid="fallback-input"]', '生麦生米生卵');
    await page.press('[data-testid="fallback-input"]', 'Enter');
    
    // 正解判定が機能することを確認
    await expect(page.locator('[data-testid="status-message"]')).toContainText('正解');
  });

  test('TC14: 連続音声認識の防止', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    await page.locator('[data-testid="mic-button"]').click();
    
    // 認識中に再度マイクボタンをクリック
    await page.locator('[data-testid="mic-button"]').click();
    
    // 2回目のクリックが無視されることを確認（ボタンが無効化されている）
    await expect(page.locator('[data-testid="mic-button"]')).toBeDisabled();
    
    // 認識処理が継続されることを確認
    await expect(page.locator('[data-testid="status-message"]')).toContainText('認識中');
  });

  test('TC15: モバイル対応確認', async ({ page }) => {
    // モバイルサイズに設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    // UI要素が表示される
    await expect(page.locator('[data-testid="title"]')).toBeVisible();
    await expect(page.locator('[data-testid="start-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="mic-button"]')).toBeVisible();
    
    // マイクボタンが適切なサイズでタッチできる
    const micButton = page.locator('[data-testid="mic-button"]');
    const boundingBox = await micButton.boundingBox();
    expect(boundingBox?.width).toBeGreaterThan(44); // iOS推奨の最小タッチサイズ
    expect(boundingBox?.height).toBeGreaterThan(44);
    
    // ゲームが正常にプレイできる
    await page.locator('[data-testid="start-button"]').click();
    await expect(page.locator('[data-testid="tongue-twister-display"]')).toBeVisible();
    
    // マイクボタンがタッチできる
    await page.locator('[data-testid="mic-button"]').click();
    await expect(page.locator('[data-testid="status-message"]')).toContainText('認識中');
  });

  test('TC16: 認識結果表示の確認', async ({ page }) => {
    await page.evaluate(() => {
      window.__mockSpeechResult = 'なまむぎなまこめなまたまご';
    });
    
    await page.locator('[data-testid="start-button"]').click();
    await page.locator('[data-testid="mic-button"]').click();
    
    // 認識完了まで待機
    await page.waitForTimeout(1500);
    
    // 認識結果が表示される
    await expect(page.locator('[data-testid="recognition-result"]')).toBeVisible();
    await expect(page.locator('[data-testid="recognition-result"]')).toContainText('なまむぎなまこめなまたまご');
    
    // 正解との比較が表示される（実装に依存）
    await expect(page.locator('[data-testid="recognition-result"]')).toBeVisible();
  });

  test('TC17: 音声波形エフェクトの表示', async ({ page }) => {
    await page.locator('[data-testid="start-button"]').click();
    await page.locator('[data-testid="mic-button"]').click();
    
    // 音声認識中の波形エフェクト確認
    await expect(page.locator('[data-testid="wave-effect"]')).toBeVisible();
    
    // 認識完了まで待機
    await page.waitForTimeout(1500);
    
    // エフェクトが停止することを確認
    await expect(page.locator('[data-testid="wave-effect"]')).not.toBeVisible();
  });
});