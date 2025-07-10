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
const ws_1 = require("ws");
const fileSyncManager_js_1 = require("./fileSyncManager.js");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
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
    // 拡張機能起動時に自動的にWebSocketサーバーを開始
    setTimeout(() => {
        startWebSocketServer();
    }, 1000); // 1秒後に開始
}
exports.activate = activate;
function deactivate() {
    stopWebSocketServer();
}
exports.deactivate = deactivate;
function startWebSocketServer() {
    if (webSocketServer) {
        vscode.window.showWarningMessage('WebSocketサーバーは既に起動しています。');
        return;
    }
    const config = vscode.workspace.getConfiguration('browserToVscodeSync');
    const port = config.get('port', 3001);
    // ワークスペースルートを自動的に取得
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    console.log(`ワークスペースルートです->${workspaceRoot}`);
    if (!workspaceRoot) {
        vscode.window.showErrorMessage('ワークスペースが開かれていません。');
        return;
    }
    try {
        webSocketServer = new ws_1.WebSocketServer({ port });
        fileSyncManager = new fileSyncManager_js_1.FileSyncManager(workspaceRoot);
        console.log(`WebSocketサーバーをポート${port}で起動中...`);
        console.log(`ワークスペースルート: ${workspaceRoot}`);
        webSocketServer.on('connection', (ws) => {
            vscode.window.showInformationMessage('ブラウザ拡張機能が接続しました。');
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    // ブラウザから送られてきたJSONメッセージを受信・解析
                    // handleBrowserMessage() に渡して処理を振り分け
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
        console.log('ブラウザからのメッセージを受信:', message);
        switch (message.type) {
            case 'dom_change':
                // 新しいメッセージ形式に対応
                handleDOMChange(message.data, message.url);
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
    }
    catch (error) {
        console.error('メッセージ処理エラー:', error);
        vscode.window.showErrorMessage('ブラウザからの変更の処理に失敗しました。');
    }
}
function handleDOMChange(data, url) {
    console.log('DOM変更を受信:', data);
    vscode.window.showInformationMessage(`DOM変更を受信: ${data.type || '不明'}`);
    switch (data.type) {
        case 'element_added':
            handleElementAdded({ ...data, url });
            break;
        case 'element_removed':
            handleElementRemoved({ ...data, url });
            break;
        case 'attribute_changed':
            handleAttributeChanged({ ...data, url });
            break;
        case 'text_changed':
            handleTextChanged({ ...data, url });
            break;
        default:
            console.warn('未知のDOM変更タイプ:', data.type);
    }
}
function handleElementAdded(message) {
    console.log('DEBUG: メッセージ全体:', message);
    console.log('DEBUG: message.url:', message.url);
    vscode.window.showInformationMessage(`要素追加: ${message.element?.tagName || '不明'}`);
    // 必要に応じてファイルに要素を追加する処理を実装
    if (message.element && message.url) {
        // ファイルパスを解決して要素を追加
        // ブラウザのURLからローカルのHTMLファイルパスを特定
        const filePath = resolveFilePath(message.url);
        console.log('実際のfilePath:', filePath);
        if (filePath) {
            addElementToFile(filePath, message.element, message.parent);
        }
    }
}
function handleElementRemoved(message) {
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
function handleAttributeChanged(message) {
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
function handleTextChanged(message) {
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
function resolveFilePath(url) {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            console.error('ワークスペースが開かれていません');
            return null;
        }
        const relativePath = pathname.startsWith('/') ? pathname.substring(1) : pathname;
        console.log('workspaceRoot:', workspaceRoot);
        console.log('relativePath:', relativePath);
        // 通常のファイルパスをチェック
        const fullPath = path.join(workspaceRoot, relativePath);
        if (fs.existsSync(fullPath)) {
            console.log('Found file at:', fullPath);
            return fullPath;
        }
        // index.htmlの自動解決
        if (pathname.endsWith('/') || pathname === '') {
            const indexPath = path.join(workspaceRoot, relativePath, 'index.html');
            console.log('indexPath:', indexPath);
            if (fs.existsSync(indexPath)) {
                console.log('Found index.html at:', indexPath);
                return indexPath;
            }
        }
        // 【追加】.html 拡張子の自動解決 (今回の肝)
        const fallbackPath = path.join(workspaceRoot, `${relativePath}.html`);
        console.log('fallbackPath:', fallbackPath);
        if (fs.existsSync(fallbackPath)) {
            console.log('Found fallback .html file at:', fallbackPath);
            return fallbackPath;
        }
        console.error('ファイルが見つかりません:', fullPath);
        return null;
    }
    catch (error) {
        console.error('URL解決エラー:', error);
        return null;
    }
}
async function addElementToFile(filePath, element, parentSelector) {
    // VS CodeのTextDocumentオブジェクトを取得
    const document = await vscode.workspace.openTextDocument(filePath);
    const text = document.getText();
    const newHtml = element.outerHTML || `<div>New Element</div>`;
    const updated = text.replace('</body>', `${newHtml}\n</body>`); // 仮で末尾に追加
    const edit = new vscode.WorkspaceEdit();
    const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(text.length));
    edit.replace(document.uri, fullRange, updated);
    await vscode.workspace.applyEdit(edit);
    await document.save();
    vscode.window.showInformationMessage('要素を追加しました');
}
async function removeElementFromFile(filePath, element) {
    const document = await vscode.workspace.openTextDocument(filePath);
    const text = document.getText();
    const elementId = element.attributes?.id;
    if (!elementId) {
        console.warn('ID属性がないため、特定できません');
        return;
    }
    const regex = new RegExp(`<[^>]*id=["']${elementId}["'][^>]*>.*?</[^>]+>`, 'gs');
    const match = regex.exec(text);
    if (!match) {
        console.warn('対象要素が見つかりません');
        return;
    }
    const startPos = document.positionAt(match.index);
    const endPos = document.positionAt(match.index + match[0].length);
    const range = new vscode.Range(startPos, endPos);
    const edit = new vscode.WorkspaceEdit();
    edit.delete(document.uri, range);
    await vscode.workspace.applyEdit(edit);
    await document.save();
    vscode.window.showInformationMessage(`要素を削除しました`);
}
async function updateAttributeInFile(filePath, element, attributeName, newValue) {
    const document = await vscode.workspace.openTextDocument(filePath);
    const text = document.getText();
    // 簡易的に、element.outerHTML が含まれる行を検索する
    const elementId = element.attributes?.id;
    if (!elementId) {
        console.warn('ID属性がないため、特定できません');
        return;
    }
    const regex = new RegExp(`<[^>]*id=["']${elementId}["'][^>]*>`, 'g');
    const match = regex.exec(text);
    if (!match) {
        console.warn('対象要素が見つかりません');
        return;
    }
    const startPos = document.positionAt(match.index);
    const endPos = document.positionAt(match.index + match[0].length);
    const range = new vscode.Range(startPos, endPos);
    let tagText = match[0];
    // 既存の属性を置き換え or 追加
    if (tagText.includes(`${attributeName}=`)) {
        tagText = tagText.replace(new RegExp(`${attributeName}=["'][^"']*["']`), `${attributeName}="${newValue}"`);
    }
    else {
        tagText = tagText.replace(/<[^>]+/, (m) => `${m} ${attributeName}="${newValue}"`);
    }
    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, range, tagText);
    await vscode.workspace.applyEdit(edit);
    await document.save();
    vscode.window.showInformationMessage(`属性「${attributeName}」を更新しました`);
}
async function updateTextInFile(filePath, parentElement, newValue) {
    const document = await vscode.workspace.openTextDocument(filePath);
    const text = document.getText();
    const parentId = parentElement.id;
    if (!parentId) {
        console.warn('ID属性がないため、特定できません');
        return;
    }
    const tagName = parentElement.tagName.toLowerCase(); // タグ名も使う
    const regex = new RegExp(`<${tagName}[^>]*id=["']${parentId}["'][^>]*>[\\s\\S]*?</${tagName}>`, 'g');
    const match = regex.exec(text);
    if (!match) {
        console.warn('対象要素が見つかりません');
        return;
    }
    const startPos = document.positionAt(match.index);
    const endPos = document.positionAt(match.index + match[0].length);
    const range = new vscode.Range(startPos, endPos);
    // 新しいタグを作成
    const newTag = match[0].replace(/>(.*?)</s, `>${newValue}<`);
    // 実際にファイルが書き換わり、保存
    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, range, newTag);
    await vscode.workspace.applyEdit(edit);
    await document.save();
    vscode.window.showInformationMessage(`テキストを更新しました`);
}
//# sourceMappingURL=extension.js.map