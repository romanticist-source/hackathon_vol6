import * as vscode from 'vscode';
import { WebSocketManager } from './server/webSocketManager.js';
import { DOMChangeHandler } from './sync/domChangeHandler.js';
import { FileSyncManager } from './fileSyncManager.js';
import { ChangePreviewManager } from './preview/ChangePreviewManager.js';

let webSocketManager: WebSocketManager | undefined;
let domChangeHandler: DOMChangeHandler | undefined;
let fileSyncManager: FileSyncManager | undefined;
let changePreviewManager: ChangePreviewManager | undefined;

export function activate(context: vscode.ExtensionContext) {
	console.log('Browser to VSCode Sync extension is now active!');

	let startServerCommand = vscode.commands.registerCommand('browser-to-vscode-sync.startServer', () => {
		startWebSocketServer();
	});

	let stopServerCommand = vscode.commands.registerCommand('browser-to-vscode-sync.stopServer', () => {
		stopWebSocketServer();
	});

	context.subscriptions.push(startServerCommand, stopServerCommand);

	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration((event) => {
			if (event.affectsConfiguration('browserToVscodeSync')) {
				vscode.window.showInformationMessage('Browser to VSCode Sync設定が変更されました。サーバーを再起動してください。');
			}
		})
	);

	setTimeout(() => {
		startWebSocketServer();
	}, 1000);
}

export function deactivate() {
	stopWebSocketServer();
}

function startWebSocketServer() {
	if (webSocketManager?.isRunning()) {
		vscode.window.showWarningMessage('WebSocketサーバーは既に起動しています。');
		return;
	}

	const config = vscode.workspace.getConfiguration('browserToVscodeSync');
	const port = config.get<number>('port', 3001);

	const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
	console.log(`ワークスペースルートです->${workspaceRoot}`)
	if (!workspaceRoot) {
		vscode.window.showErrorMessage('ワークスペースが開かれていません。');
		return;
	}

	try {
		webSocketManager = new WebSocketManager();
		fileSyncManager = new FileSyncManager(workspaceRoot);
		changePreviewManager = new ChangePreviewManager(fileSyncManager);
		domChangeHandler = new DOMChangeHandler(fileSyncManager, changePreviewManager);

		webSocketManager.setMessageHandler((message: any) => {
			if (domChangeHandler) {
				domChangeHandler.handleMessage(message);
			}
		});

		console.log(`WebSocketサーバーをポート${port}で起動中...`);
		console.log(`ワークスペースルート: ${workspaceRoot}`);

		webSocketManager.start(port).catch((error) => {
			console.error('WebSocket server start failed:', error);
		});

	} catch (error) {
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