// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as WebSocket from 'ws';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	// console.log('Congratulations, your extension "my-vscode-extention" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('browser-sync-server.start', () => {
		const port = 3001;
		const outputChannel = vscode.window. createOutputChannel('Browser Sync Server');
		let wss: WebSocket.Server


		try {
			wss = new WebSocket.Server({ port }, () => {
				vscode.window.showInformationMessage(`WebSocketサーバーポート${port}で起動しやした`);
				outputChannel.appendLine(`WebSocketサーバー起動: ポート${port}`)
			});
			
			// wssはサーバー
			wss.on('connection', (ws) => {
				outputChannel.appendLine('クライアント接続');
				ws.on('message', (message) => {
					outputChannel.appendLine(`受信データ: ${message}`);
					try {
						const data = JSON.parse(message.toString());
					} catch (err) {
						outputChannel.appendLine(`JSONパース失敗: ${err}`)
					}
				});

				// wsはクライアントが切断されたとき
				// 切断されたら、実行
				ws.on('close', ()=> {
					outputChannel.appendLine('クライアント切断')
				});
			});

			wss.on('error', (err) => {
				vscode.window.showErrorMessage(`WebSocketサーバーエラー:${err.message}`)
				outputChannel.appendLine(`エラー:${err.message}`)
			});

		} catch (err) {
			vscode.window.showErrorMessage(`サーバー起動失敗: ${err}`);
		}

		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		// vscode.window.showInformationMessage('Hello World from my-vscode-extention!');

		context.subscriptions.push(disposable);
	});
}

// This method is called when your extension is deactivated
export function deactivate() {}
