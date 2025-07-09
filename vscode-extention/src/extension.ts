import * as vscode from 'vscode';
import { WebSocketServer } from 'ws';
import { FileSyncManager } from './fileSyncManager.js';
import * as fs from 'fs';
import * as path from 'path';

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

	// 拡張機能起動時に自動的にWebSocketサーバーを開始
	setTimeout(() => {
		startWebSocketServer();
	}, 1000); // 1秒後に開始
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

	// ワークスペースルートを自動的に取得
	const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';

	if (!workspaceRoot) {
		vscode.window.showErrorMessage('ワークスペースが開かれていません。');
		return;
	}

	try {
		webSocketServer = new WebSocketServer({ port });
		fileSyncManager = new FileSyncManager(workspaceRoot);

		console.log(`WebSocketサーバーをポート${port}で起動中...`);
		console.log(`ワークスペースルート: ${workspaceRoot}`);

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
		console.log('ブラウザからのメッセージを受信:', message);

		switch (message.type) {
			case 'dom_change':
				// 新しいメッセージ形式に対応
				handleDOMChange(message.data);
				break;
			case 'element_added':
				handleElementAdded(message);
				break;
			case 'element_removed':
				handleElementRemoved(message);
				break;
			case 'attribute_changed':
				handleAttributeChanged(message);
				break;
			case 'text_changed':
				handleTextChanged(message);
				break;
			case 'attribute_change':
				// 旧形式のメッセージにも対応
				fileSyncManager.handleAttributeChange(message.data);
				break;
			case 'style_change':
				// 旧形式のメッセージにも対応
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

function handleDOMChange(data: any) {
	// dom_changeメッセージの処理（必要に応じて実装）
	console.log('DOM変更を受信:', data);
	vscode.window.showInformationMessage(`DOM変更を受信: ${data.type || '不明'}`);
}

function handleElementAdded(message: any) {
	console.log('要素追加を受信:', message);
	vscode.window.showInformationMessage(`要素追加: ${message.element?.tagName || '不明'}`);

	// 必要に応じてファイルに要素を追加する処理を実装
	if (message.element && message.url) {
		// ファイルパスを解決して要素を追加
		const filePath = resolveFilePath(message.url);
		if (filePath) {
			addElementToFile(filePath, message.element, message.parent);
		}
	}
}

function handleElementRemoved(message: any) {
	console.log('要素削除を受信:', message);
	vscode.window.showInformationMessage(`要素削除: ${message.element?.tagName || '不明'}`);

	// 必要に応じてファイルから要素を削除する処理を実装
	if (message.element && message.url) {
		const filePath = resolveFilePath(message.url);
		if (filePath) {
			removeElementFromFile(filePath, message.element);
		}
	}
}

function handleAttributeChanged(message: any) {
	console.log('属性変更を受信:', message);
	vscode.window.showInformationMessage(`属性変更: ${message.attributeName}="${message.newValue}"`);

	// 属性変更をファイルに反映
	if (message.element && message.url) {
		const filePath = resolveFilePath(message.url);
		if (filePath) {
			updateAttributeInFile(filePath, message.element, message.attributeName, message.newValue);
		}
	}
}

function handleTextChanged(message: any) {
	console.log('テキスト変更を受信:', message);
	vscode.window.showInformationMessage(`テキスト変更: "${message.newValue}"`);

	// テキスト変更をファイルに反映
	if (message.parentElement && message.url) {
		const filePath = resolveFilePath(message.url);
		if (filePath) {
			updateTextInFile(filePath, message.parentElement, message.newValue);
		}
	}
}

// ファイルパス解決のヘルパー関数
function resolveFilePath(url: string): string | null {
	try {
		const urlObj = new URL(url);
		const pathname = urlObj.pathname;

		// localhostの場合の処理
		if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
			const relativePath = pathname.startsWith('/') ? pathname.substring(1) : pathname;
			const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

			if (workspaceRoot) {
				const fullPath = path.join(workspaceRoot, relativePath);

				// ファイルが存在するかチェック
				if (fs.existsSync(fullPath)) {
					return fullPath;
				}

				// index.htmlの自動解決
				if (pathname.endsWith('/') || pathname === '') {
					const indexPath = path.join(workspaceRoot, relativePath, 'index.html');
					if (fs.existsSync(indexPath)) {
						return indexPath;
					}
				}
			}
		}

		return null;
	} catch (error) {
		console.error('URL解決エラー:', error);
		return null;
	}
}

// ファイル操作のヘルパー関数（簡易実装）
async function addElementToFile(filePath: string, element: any, parent: any) {
	// 実装は後で追加
	console.log('要素追加処理:', filePath, element);
}

async function removeElementFromFile(filePath: string, element: any) {
	// 実装は後で追加
	console.log('要素削除処理:', filePath, element);
}

async function updateAttributeInFile(filePath: string, element: any, attributeName: string, newValue: string) {
	// 実装は後で追加
	console.log('属性更新処理:', filePath, element, attributeName, newValue);
}

async function updateTextInFile(filePath: string, parentElement: any, newValue: string) {
	// 実装は後で追加
	console.log('テキスト更新処理:', filePath, parentElement, newValue);
} 