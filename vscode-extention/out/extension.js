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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const webSocketManager_js_1 = require("./server/webSocketManager.js");
const domChangeHandler_js_1 = require("./sync/domChangeHandler.js");
const fileSyncManager_js_1 = require("./fileSyncManager.js");
const ChangePreviewManager_js_1 = require("./preview/ChangePreviewManager.js");
let webSocketManager;
let domChangeHandler;
let fileSyncManager;
let changePreviewManager;
function activate(context) {
    console.log('Browser to VSCode Sync extension is now active!');
    let startServerCommand = vscode.commands.registerCommand('browser-to-vscode-sync.startServer', () => {
        startWebSocketServer();
    });
    let stopServerCommand = vscode.commands.registerCommand('browser-to-vscode-sync.stopServer', () => {
        stopWebSocketServer();
    });
    context.subscriptions.push(startServerCommand, stopServerCommand);
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('browserToVscodeSync')) {
            vscode.window.showInformationMessage('Browser to VSCode Sync設定が変更されました。サーバーを再起動してください。');
        }
    }));
    setTimeout(() => {
        startWebSocketServer();
    }, 1000);
}
exports.activate = activate;
function deactivate() {
    stopWebSocketServer();
}
exports.deactivate = deactivate;
function startWebSocketServer() {
    if (webSocketManager?.isRunning()) {
        vscode.window.showWarningMessage('WebSocketサーバーは既に起動しています。');
        return;
    }
    const config = vscode.workspace.getConfiguration('browserToVscodeSync');
    const port = config.get('port', 3001);
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    console.log(`ワークスペースルートです->${workspaceRoot}`);
    if (!workspaceRoot) {
        vscode.window.showErrorMessage('ワークスペースが開かれていません。');
        return;
    }
    try {
        webSocketManager = new webSocketManager_js_1.WebSocketManager();
        fileSyncManager = new fileSyncManager_js_1.FileSyncManager(workspaceRoot);
        changePreviewManager = new ChangePreviewManager_js_1.ChangePreviewManager(fileSyncManager);
        domChangeHandler = new domChangeHandler_js_1.DOMChangeHandler(fileSyncManager, changePreviewManager);
        webSocketManager.setMessageHandler((message) => {
            if (domChangeHandler) {
                domChangeHandler.handleMessage(message);
            }
        });
        console.log(`WebSocketサーバーをポート${port}で起動中...`);
        console.log(`ワークスペースルート: ${workspaceRoot}`);
        webSocketManager.start(port).catch((error) => {
            console.error('WebSocket server start failed:', error);
        });
    }
    catch (error) {
        console.error('サーバー起動エラー:', error);
        vscode.window.showErrorMessage('WebSocketサーバーの起動に失敗しました。');
    }
}
function stopWebSocketServer() {
    if (webSocketManager) {
        webSocketManager.stop();
        webSocketManager = undefined;
        fileSyncManager = undefined;
        domChangeHandler = undefined;
    }
    if (changePreviewManager) {
        changePreviewManager.dispose();
        changePreviewManager = undefined;
    }
}
//# sourceMappingURL=extension.js.map