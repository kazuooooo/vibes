# ギリギリチャレンジ – Playwright E2E テストケース

## 概要

本ドキュメントは、Webカジュアルゲーム「ギリギリチャレンジ」のE2Eテストケース一覧です。Playwrightを用いて、UIの描画、ユーザーインタラクション、スコアロジックなどの一貫性と正確性を検証します。

---

## 📘 前提条件

- アプリは `/` ルートで起動
- ページ読み込み時にゲームが初期状態で表示される
- ゲージは自動で動き始める
- 以下のセレクターが利用可能であること（data-testid）

| テストID | 対象UI |
|----------|--------|
| `stop-button` | 「止める」ボタン |
| `score` | スコア表示エリア |
| `gauge-value` | ゲージの現在値（数値％） |
| `retry-button` | リトライボタン |
| `title` | ゲームタイトル表示 |

---

## 🧪 テストケース一覧

### TC01: 初期表示の確認

**目的**: ページ初期ロード時にUI要素が表示されるか確認

**手順**
1. `/` にアクセス
2. `title`, `stop-button`, `gauge-value` が存在することを確認
3. `stop-button` が有効であることを確認

---

### TC02: ゲージが動いているか確認

**目的**: ゲージが自動で動いているか確認

**手順**
1. `/` にアクセス
2. `gauge-value` を取得して一時保存
3. 500ms 待機
4. 再度 `gauge-value` を取得し、値が変化していることを検証

---

### TC03: ボタンでゲージを停止

**目的**: 「止める」ボタンでゲージが停止することを確認

**手順**
1. `/` にアクセス
2. 数秒後 `stop-button` をクリック
3. 500ms 待機し `gauge-value` が変化していないことを確認
4. `score` が表示されることを確認

---

### TC04: スコアの検証（90%〜94%）

**目的**: ゲージが90%台前半で止まったとき、スコアが80点になることを検証

**手順**
1. `/` にアクセス
2. `gauge-value` をポーリングし、90〜94 の範囲になった瞬間に `stop-button` を押す
3. `score` の内容が「80点」であることを確認

---

### TC05: バースト（100%以上）の判定

**目的**: ゲージが100%以上で停止した場合に「失敗」になるか確認

**手順**
1. `/` にアクセス
2. `gauge-value` を監視し、100以上になった時に `stop-button` をクリック
3. `score` が「0点」であることを確認
4. 「バースト」などの失敗メッセージが表示されること（任意）

---

### TC06: リトライボタンでゲームが再開できる

**目的**: リトライによって状態が初期化されることを確認

**手順**
1. ゲームを一度停止して `score` を表示させる
2. `retry-button` をクリック
3. `score` が消え、`gauge-value` が0付近に戻る
4. ゲージが再び動き始めることを確認

---

### TC07: モバイル対応確認（ビューポート）

**目的**: モバイル画面サイズでレイアウトが破綻していないことを確認

**手順**
1. ビューポートを iPhone SE サイズ (375x667) に設定
2. `/` にアクセス
3. 主要UI (`stop-button`, `gauge`, `score`) が表示され、画面内に収まっていることを確認

---

### TC08: 多重クリック防止

**目的**: 「止める」ボタンの連打で状態が不正にならないことを確認

**手順**
1. `/` にアクセス
2. `stop-button` を2回以上連続でクリック
3. スコア表示が1度しか更新されないことを確認
4. ゲージが停止し、その後再び変化しないことを確認

---

## 🔧 テストのための補足実装（推奨）

- `gauge-value` の数値表示（data属性またはinnerText）をDOMで確認可能にすること
- テスト中のみゲージ速度や開始位置を制御するオプション（例: ?test=true）を用意すると、精度の高い検証が可能

---

## 📄 備考

- テストはPlaywrightの `expect.poll` や `page.waitForFunction` を活用して、ゲージの数値を監視しながら操作を行うことを推奨。
- 実装が非同期・アニメーションを含むため、タイミングと遅延に注意。