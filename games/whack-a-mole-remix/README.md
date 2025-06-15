# モグラたたきリミックス

「モグラたたきリミックス – タップで敵を叩くが味方も混ざる」は、敵と味方を見分けてタップする判断力ゲームです。

## ゲーム概要

- **ジャンル**: カジュアル・アクションゲーム
- **プレイ時間**: 30秒/1ラウンド
- **操作**: タップ/クリック
- **対応端末**: PC・モバイル

## ルール

1. 3×3のグリッドの穴から敵（😈）と味方（🐰）がランダムに出現
2. 敵をタップすると+10点、味方をタップすると-20点
3. 味方を見逃すと+5点のボーナス
4. 30秒の制限時間内で最高スコアを目指す

## ファイル構成

- `index.html` - メインのHTMLファイル
- `style.css` - スタイルシート
- `game.js` - ゲームロジック
- `specification.md` - ゲーム仕様書
- `test.md` - テストケース一覧
- `package.json` - パッケージ設定
- `playwright.config.js` - Playwright設定
- `tests/whack-a-mole-remix.spec.js` - E2Eテスト

## 開発・テスト

### ローカル実行
```bash
# パッケージインストール
npm install

# ローカルサーバー起動
npm run serve
```

### E2Eテスト実行
```bash
# Playwrightインストール
npm run install:playwright

# テスト実行
npm test

# テストUIモード
npm run test:ui

# デバッグモード
npm run test:debug
```

## 技術仕様

- **フロントエンド**: HTML5, CSS3, ES6 JavaScript
- **テスト**: Playwright
- **レスポンシブ対応**: モバイル・タブレット・PC
- **ブラウザ対応**: Chrome, Safari, Firefox

## ゲーム特徴

- 直感的な操作性
- レスポンシブデザイン
- アニメーション演出
- スコア統計表示
- モバイル最適化

---

**開発**: Claude Code で自動生成