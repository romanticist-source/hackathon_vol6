# Browser-to-VSCode Sync Extension

ブラウザの開発者ツールで行ったHTML/CSSの変更を、リアルタイムでVS Code上のローカルファイルに自動同期するVS Code拡張機能です。

## 概要

ウェブ開発者がブラウザで試行錯誤したUI変更を、手動でコードに反映する手間をなくし、開発ワークフローを劇的に高速化・効率化することを目的としています。

## 主な機能

### ブラウザ拡張機能（Chrome）
- 開発者ツールでHTML要素の属性（id, class, style）やインラインCSSを変更した際の差分をリアルタイムで検知
- WebSocketを介してVS Code拡張機能へ変更データを送信

### VS Code拡張機能
- WebSocketサーバーとして動作
- 受信した変更データに基づき、VS Codeワークスペース内の該当するローカルHTML/CSSファイルを自動で更新・保存

## MVPの対象範囲

### 対応機能
- ✅ HTML要素の属性変更（id, class, style属性）
- ✅ インラインCSS（style属性内）の変更
- ⚠️ 外部CSSファイルの値変更（限定的）

### 対象外機能
- ❌ 要素の追加・削除
- ❌ JavaScriptファイルの変更
- ❌ テキストコンテンツの変更
- ❌ CSSプロパティの追加・削除（外部CSS）

## 技術構成

- **VS Code拡張機能**: WebSocketサーバー（Node.js）
- **ブラウザ拡張機能**: WebSocketクライアント
- **通信**: WebSocket（ws://localhost）
- **対象ブラウザ**: Chrome（MVP）

## プロジェクト構造

```
hackathon_vol6/
├── vscode-extension/          # VS Code拡張機能
├── browser-extension/         # Chrome拡張機能
├── docs/                      # ドキュメント
└── README.md                  # プロジェクト概要
```

## セットアップ手順

### VS Code拡張機能
```bash
cd vscode-extension
npm install
npm run compile
```

### Chrome拡張機能
1. Chromeで `chrome://extensions/` を開く
2. 「デベロッパーモード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」で `browser-extension` フォルダを選択

## 使用方法

1. VS Codeで拡張機能を有効化
2. Chromeでブラウザ拡張機能を有効化
3. 開発者ツールでHTML/CSSを編集
4. 変更が自動的にVS Codeのファイルに同期される

## 開発者

ハッカソン vol.6 チーム 