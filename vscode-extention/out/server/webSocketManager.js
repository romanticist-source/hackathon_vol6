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
exports.WebSocketManager = void 0;
const vscode = __importStar(require("vscode"));
const ws_1 = require("ws");
class WebSocketManager {
    constructor() { }
    setMessageHandler(callback) {
        this.onMessageCallback = callback;
    }
    start(port) {
        return new Promise((resolve, reject) => {
            if (this.server) {
                vscode.window.showWarningMessage('WebSocketサーバーは既に起動しています。');
                resolve();
                return;
            }
            try {
                this.server = new ws_1.WebSocketServer({ port });
                console.log(`WebSocketサーバーをポート${port}で起動中...`);
                this.server.on('connection', (ws) => {
                    vscode.window.showInformationMessage('ブラウザ拡張機能が接続しました。');
                    ws.on('message', (data) => {
                        try {
                            const message = JSON.parse(data.toString());
                            if (this.onMessageCallback) {
                                this.onMessageCallback(message);
                            }
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
                this.server.on('listening', () => {
                    vscode.window.showInformationMessage(`WebSocketサーバーがポート${port}で起動しました。`);
                    resolve();
                });
                this.server.on('error', (error) => {
                    console.error('WebSocketサーバーエラー:', error);
                    vscode.window.showErrorMessage(`WebSocketサーバーの起動に失敗しました: ${error.message}`);
                    reject(error);
                });
            }
            catch (error) {
                console.error('サーバー起動エラー:', error);
                vscode.window.showErrorMessage('WebSocketサーバーの起動に失敗しました。');
                reject(error);
            }
        });
    }
    stop() {
        if (this.server) {
            this.server.close();
            this.server = undefined;
            vscode.window.showInformationMessage('WebSocketサーバーを停止しました。');
        }
    }
    isRunning() {
        return this.server !== undefined;
    }
}
exports.WebSocketManager = WebSocketManager;
//# sourceMappingURL=webSocketManager.js.map