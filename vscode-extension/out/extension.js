"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const ws_1 = require("ws");
const fileSyncManager_js_1 = require("./fileSyncManager.js");
let webSocketServer;
let fileSyncManager;
function activate(context) {
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
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('browserToVscodeSync')) {
            vscode.window.showInformationMessage('Browser to VSCode Sync設定が変更されました。サーバーを再起動してください。');
        }
    }));
}
function deactivate() {
    stopWebSocketServer();
}
function startWebSocketServer() {
    if (webSocketServer) {
        vscode.window.showWarningMessage('WebSocketサーバーは既に起動しています。');
        return;
    }
    const config = vscode.workspace.getConfiguration('browserToVscodeSync');
    const port = config.get('port', 3001);
    const workspaceRoot = config.get('workspaceRoot', '');
    if (!workspaceRoot) {
        vscode.window.showErrorMessage('ワークスペースルートパスが設定されていません。設定で指定してください。');
        return;
    }
    try {
        webSocketServer = new ws_1.WebSocketServer({ port });
        fileSyncManager = new fileSyncManager_js_1.FileSyncManager(workspaceRoot);
        webSocketServer.on('connection', (ws) => {
            vscode.window.showInformationMessage('ブラウザ拡張機能が接続しました。');
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    handleBrowserMessage(message);
                }
                catch (error) {
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
    }
    catch (error) {
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
function handleBrowserMessage(message) {
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
    }
    catch (error) {
        console.error('メッセージ処理エラー:', error);
        vscode.window.showErrorMessage('ブラウザからの変更の処理に失敗しました。');
    }
}
//# sourceMappingURL=extension.js.map