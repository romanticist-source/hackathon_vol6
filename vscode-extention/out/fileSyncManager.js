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
exports.FileSyncManager = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class FileSyncManager {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
    }
    async handleAttributeChange(data) {
        try {
            const filePath = this.resolveFilePath(data.url);
            if (!filePath) {
                console.warn('ファイルパスを解決できませんでした:', data.url);
                return;
            }
            const document = await this.openDocument(filePath);
            if (!document) {
                console.warn('ドキュメントを開けませんでした:', filePath);
                return;
            }
            const element = this.findElementInDocument(document, data.selector);
            if (!element) {
                console.warn('要素が見つかりませんでした:', data.selector);
                return;
            }
            await this.updateAttribute(document, element, data.attribute, data.value);
            vscode.window.showInformationMessage(`属性を更新しました: ${data.attribute}="${data.value}"`);
        }
        catch (error) {
            console.error('属性変更の処理エラー:', error);
            vscode.window.showErrorMessage('属性の更新に失敗しました。');
        }
    }
    async handleStyleChange(data) {
        try {
            const filePath = this.resolveFilePath(data.url);
            if (!filePath) {
                console.warn('ファイルパスを解決できませんでした:', data.url);
                return;
            }
            const document = await this.openDocument(filePath);
            if (!document) {
                console.warn('ドキュメントを開けませんでした:', filePath);
                return;
            }
            const element = this.findElementInDocument(document, data.selector);
            if (!element) {
                console.warn('要素が見つかりませんでした:', data.selector);
                return;
            }
            await this.updateStyle(document, element, data.property, data.value);
            vscode.window.showInformationMessage(`スタイルを更新しました: ${data.property}: ${data.value}`);
        }
        catch (error) {
            console.error('スタイル変更の処理エラー:', error);
            vscode.window.showErrorMessage('スタイルの更新に失敗しました。');
        }
    }
    resolveFilePath(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            // localhostの場合の処理
            if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
                const relativePath = pathname.startsWith('/') ? pathname.substring(1) : pathname;
                const fullPath = path.join(this.workspaceRoot, relativePath);
                // ファイルが存在するかチェック
                if (fs.existsSync(fullPath)) {
                    return fullPath;
                }
                // index.htmlの自動解決
                if (pathname.endsWith('/') || pathname === '') {
                    const indexPath = path.join(this.workspaceRoot, relativePath, 'index.html');
                    if (fs.existsSync(indexPath)) {
                        return indexPath;
                    }
                }
            }
            return null;
        }
        catch (error) {
            console.error('URL解決エラー:', error);
            return null;
        }
    }
    async openDocument(filePath) {
        try {
            const uri = vscode.Uri.file(filePath);
            return await vscode.workspace.openTextDocument(uri);
        }
        catch (error) {
            console.error('ドキュメントを開くエラー:', error);
            return null;
        }
    }
    findElementInDocument(document, selector) {
        const text = document.getText();
        // 簡易的なセレクタ解析（MVP用）
        // より高度な解析は将来的に実装
        if (selector.startsWith('#')) {
            // IDセレクタ
            const id = selector.substring(1);
            const regex = new RegExp(`id\\s*=\\s*["']${id}["']`, 'g');
            const match = regex.exec(text);
            if (match) {
                const start = document.positionAt(match.index);
                const end = document.positionAt(match.index + match[0].length);
                return new vscode.Range(start, end);
            }
        }
        else if (selector.startsWith('.')) {
            // クラスセレクタ
            const className = selector.substring(1);
            const regex = new RegExp(`class\\s*=\\s*["'][^"']*\\b${className}\\b[^"']*["']`, 'g');
            const match = regex.exec(text);
            if (match) {
                const start = document.positionAt(match.index);
                const end = document.positionAt(match.index + match[0].length);
                return new vscode.Range(start, end);
            }
        }
        return null;
    }
    async updateAttribute(document, elementRange, attribute, value) {
        const edit = new vscode.WorkspaceEdit();
        const newAttribute = `${attribute}="${value}"`;
        edit.replace(document.uri, elementRange, newAttribute);
        await vscode.workspace.applyEdit(edit);
        await document.save();
    }
    async updateStyle(document, elementRange, property, value) {
        const text = document.getText(elementRange);
        // style属性の更新
        if (text.includes('style=')) {
            // 既存のstyle属性を更新
            const styleRegex = /style\s*=\s*["']([^"']*)["']/;
            const match = text.match(styleRegex);
            if (match) {
                const existingStyles = match[1];
                const updatedStyles = this.updateStyleString(existingStyles, property, value);
                const newStyle = `style="${updatedStyles}"`;
                const edit = new vscode.WorkspaceEdit();
                edit.replace(document.uri, elementRange, newStyle);
                await vscode.workspace.applyEdit(edit);
            }
        }
        else {
            // 新しいstyle属性を追加
            const newStyle = `style="${property}: ${value};"`;
            const edit = new vscode.WorkspaceEdit();
            edit.replace(document.uri, elementRange, newStyle);
            await vscode.workspace.applyEdit(edit);
        }
        await document.save();
    }
    updateStyleString(existingStyles, property, value) {
        const stylePairs = existingStyles.split(';').filter(pair => pair.trim());
        const styleMap = new Map();
        // 既存のスタイルを解析
        for (const pair of stylePairs) {
            const [key, val] = pair.split(':').map(s => s.trim());
            if (key && val) {
                styleMap.set(key, val);
            }
        }
        // 新しいスタイルを追加/更新
        styleMap.set(property, value);
        // スタイル文字列を再構築
        return Array.from(styleMap.entries())
            .map(([key, val]) => `${key}: ${val}`)
            .join('; ');
    }
}
exports.FileSyncManager = FileSyncManager;
//# sourceMappingURL=fileSyncManager.js.map