# 方向記憶 (Direction Memory)

矢印の順番を覚えて入力するメモリーゲーム

## ゲームの概要

プレイヤーが画面に表示される矢印の順番を記憶し、同じ順番で入力するカジュアルゲームです。レベルが上がるごとに矢印の数が増え、より多くの矢印を覚える必要があります。

## 遊び方

1. **スタート**: 「スタート」ボタンを押してゲームを開始
2. **観察**: 画面に順番に表示される矢印を覚える
3. **入力**: 表示された順番と同じ順番で方向ボタンを押す
4. **レベルアップ**: 正解すると次のレベルに進み、矢印の数が増える
5. **ゲームオーバー**: 間違った順番で入力するとゲームオーバー

## スコア

- レベル1: 100点
- レベル2: 200点
- レベル3: 300点
- レベル4以上: レベル × 100点

## 開発・テスト

### 必要な環境

- Node.js
- npm

### セットアップ

```bash
# 依存関係のインストール
npm install

# Playwrightのインストール
npm run install:playwright
```

### テスト実行

```bash
# E2Eテストを実行
npm test

# UIモードでテスト実行
npm run test:ui

# デバッグモードでテスト実行
npm run test:debug
```

### ローカル実行

```bash
# ローカルサーバーでゲームを起動
npm run serve
```

その後、ブラウザで `http://localhost:3000` にアクセスしてゲームをプレイできます。

## ファイル構成

- `index.html` - メインのHTMLファイル
- `style.css` - スタイルシート
- `game.js` - ゲームロジック
- `specification.md` - ゲーム仕様書
- `test.md` - テストケース仕様
- `tests/direction-memory.spec.js` - Playwright E2Eテスト
- `playwright.config.js` - Playwright設定ファイル
- `package.json` - パッケージ設定

## 技術仕様

- **フロントエンド**: HTML5, CSS3, Vanilla JavaScript
- **テスト**: Playwright
- **対応ブラウザ**: Chrome, Safari, モバイルブラウザ
- **レスポンシブ**: PC・モバイル対応