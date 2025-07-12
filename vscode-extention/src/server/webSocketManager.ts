import * as vscode from 'vscode';
import { WebSocketServer, WebSocket } from 'ws';

export class WebSocketManager {
    private server: WebSocketServer | undefined;
    private onMessageCallback: ((message: any) => void) | undefined;

    constructor() {}

    public setMessageHandler(callback: (message: any) => void): void {
        this.onMessageCallback = callback;
    }

    public start(port: number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.server) {
                vscode.window.showWarningMessage('WebSocketサーバーは既に起動しています。');
                resolve();
                return;
            }

            try {
                this.server = new WebSocketServer({ port });

                console.log(`WebSocketサーバーをポート${port}で起動中...`);

                this.server.on('connection', (ws: WebSocket) => {
                    vscode.window.showInformationMessage('ブラウザ拡張機能が接続しました。');

                    ws.on('message', (data) => {
                        try {
                            const message = JSON.parse(data.toString());
                            if (this.onMessageCallback) {
                                this.onMessageCallback(message);
                            }
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

                this.server.on('listening', () => {
                    vscode.window.showInformationMessage(`WebSocketサーバーがポート${port}で起動しました。`);
                    resolve();
                });

                this.server.on('error', (error) => {
                    console.error('WebSocketサーバーエラー:', error);
                    vscode.window.showErrorMessage(`WebSocketサーバーの起動に失敗しました: ${error.message}`);
                    reject(error);
                });

            } catch (error) {
                console.error('サーバー起動エラー:', error);
                vscode.window.showErrorMessage('WebSocketサーバーの起動に失敗しました。');
                reject(error);
            }
        });
    }

    public stop(): void {
        if (this.server) {
            this.server.close();
            this.server = undefined;
            vscode.window.showInformationMessage('WebSocketサーバーを停止しました。');
        }
    }

    public isRunning(): boolean {
        return this.server !== undefined;
    }
}