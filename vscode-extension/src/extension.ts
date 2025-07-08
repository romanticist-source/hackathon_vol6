import * as vscode from 'vscode';
import { WebSocketServer } from 'ws';
import { FileSyncManager } from './fileSyncManager.js';

let webSocketServer: WebSocketServer | undefined;
let fileSyncManager: FileSyncManager | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Browser to VSCode Sync extension is now active!');

    // コマンドの登録
    let startServerCommand = vscode.commands.registerCommand('browser-to-vscode-sync.startServer', () => {
        startWebSocketServer();
    });

    let stopServerCommand = vscode.commands.registerCommand('browser-to-vscode-sync.stopServer', () => {
        stopWebSocketServer();
    });

    context.subscriptions.push(startServerCommand, stopServerCommand);

    // 設定の変更を監視
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration('browserToVscodeSync')) {
                vscode.window.showInformationMessage('Browser to VSCode Sync設定が変更されました。サーバーを再起動してください。');
            }
        })
    );
}

export function deactivate() {
    stopWebSocketServer();
}

function startWebSocketServer() {
    if (webSocketServer) {
        vscode.window.showWarningMessage('WebSocketサーバーは既に起動しています。');
        return;
    }

    const config = vscode.workspace.getConfiguration('browserToVscodeSync');
    const port = config.get<number>('port', 3001);
    const workspaceRoot = config.get<string>('workspaceRoot', '');

    if (!workspaceRoot) {
        vscode.window.showErrorMessage('ワークスペースルートパスが設定されていません。設定で指定してください。');
        return;
    }

    try {
        webSocketServer = new WebSocketServer({ port });
        fileSyncManager = new FileSyncManager(workspaceRoot);

        webSocketServer.on('connection', (ws) => {
            vscode.window.showInformationMessage('ブラウザ拡張機能が接続しました。');

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    handleBrowserMessage(message);
                } catch (error) {
                    console.error('メッセージの解析エラー:', error);
                }
            });

            ws.on('close', () => {
                vscode.window.showInformationMessage('ブラウザ拡張機能が切断しました。');
            });

            ws.on('error', (error) => {
                console.error('WebSocketエラー:', error);
                vscode.window.showErrorMessage('WebSocket接続でエラーが発生しました。');
            });
        });

        webSocketServer.on('listening', () => {
            vscode.window.showInformationMessage(`WebSocketサーバーがポート${port}で起動しました。`);
        });

        webSocketServer.on('error', (error) => {
            console.error('WebSocketサーバーエラー:', error);
            vscode.window.showErrorMessage(`WebSocketサーバーの起動に失敗しました: ${error.message}`);
        });

    } catch (error) {
        console.error('サーバー起動エラー:', error);
        vscode.window.showErrorMessage('WebSocketサーバーの起動に失敗しました。');
    }
}

function stopWebSocketServer() {
    if (webSocketServer) {
        webSocketServer.close();
        webSocketServer = undefined;
        fileSyncManager = undefined;
        vscode.window.showInformationMessage('WebSocketサーバーを停止しました。');
    }
}

function handleBrowserMessage(message: any) {
    if (!fileSyncManager) {
        return;
    }

    try {
        switch (message.type) {
            case 'attribute_change':
                fileSyncManager.handleAttributeChange(message.data);
                break;
            case 'style_change':
                fileSyncManager.handleStyleChange(message.data);
                break;
            default:
                console.warn('未知のメッセージタイプ:', message.type);
        }
    } catch (error) {
        console.error('メッセージ処理エラー:', error);
        vscode.window.showErrorMessage('ブラウザからの変更の処理に失敗しました。');
    }
} 