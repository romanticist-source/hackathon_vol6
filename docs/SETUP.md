# セットアップ手順

## 前提条件

- Node.js (v16以上)
- VS Code
- Google Chrome
- ローカル開発サーバー（例：Live Server、http-server等）

## VS Code拡張機能のセットアップ

### 1. 依存関係のインストール

```bash
cd vscode-extension
npm install
```

### 2. 拡張機能のコンパイル

```bash
npm run compile
```

### 3. VS Codeでの拡張機能の読み込み

1. VS Codeを開く
2. `Ctrl+Shift+P`（macOS: `Cmd+Shift+P`）でコマンドパレットを開く
3. "Extensions: Install from VSIX..."を選択
4. `vscode-extension`フォルダを選択

または、開発者モードで直接読み込む場合：

1. VS Codeで`vscode-extension`フォルダを開く
2. `F5`キーを押して拡張機能をデバッグ実行

### 4. 設定の構成

1. VS Codeの設定を開く（`Ctrl+,`）
2. "Browser to VSCode Sync"セクションを探す
3. 以下の設定を行う：
   - **Workspace Root**: プロジェクトのルートパス（例：`/Users/username/projects/my-website`）
   - **Port**: WebSocketサーバーのポート番号（デフォルト：3001）

## Chrome拡張機能のセットアップ

### 1. 拡張機能の読み込み

1. Chromeで `chrome://extensions/` を開く
2. 右上の「デベロッパーモード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. `browser-extension`フォルダを選択

### 2. 拡張機能の確認

1. 拡張機能が正常に読み込まれていることを確認
2. ツールバーに拡張機能のアイコンが表示されることを確認

## 使用方法

### 1. VS Code拡張機能の起動

1. VS Codeでコマンドパレットを開く（`Ctrl+Shift+P`）
2. "Start Browser Sync Server"を実行
3. 成功メッセージが表示されることを確認

### 2. ブラウザでの動作確認

1. ローカル開発サーバーを起動（例：`http://localhost:3000`）
2. Chromeで該当ページを開く
3. 開発者ツールを開く（`F12`）
4. 拡張機能のアイコンをクリックして接続状態を確認

### 3. 同期のテスト

1. 開発者ツールでHTML要素を選択
2. 要素の属性（id、class、style）を変更
3. VS Codeの対応するファイルが自動更新されることを確認

## トラブルシューティング

### VS Code拡張機能が起動しない

- Node.jsのバージョンを確認（v16以上が必要）
- 依存関係が正しくインストールされているか確認
- ポート3001が他のアプリケーションで使用されていないか確認

### Chrome拡張機能が動作しない

- 拡張機能が正しく読み込まれているか確認
- localhostページでアクセスしているか確認
- 開発者ツールが開いているか確認

### 同期が動作しない

- VS Code拡張機能が起動しているか確認
- ワークスペースルートパスが正しく設定されているか確認
- ブラウザのコンソールでエラーメッセージを確認

## 開発者向け情報

### ログの確認

- VS Code: 出力パネルで"Browser to VSCode Sync"を選択
- Chrome: 開発者ツールのコンソールでログを確認

### デバッグ

- VS Code拡張機能: `F5`キーでデバッグ実行
- Chrome拡張機能: `chrome://extensions/`で「詳細」→「デバッグ」をクリック

## 注意事項

- MVP版では、localhostページでのみ動作します
- 要素の追加・削除は同期されません
- JavaScriptファイルの変更は同期されません
- 外部CSSファイルの変更は限定的にサポートされます 