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
exports.PreviewContentProvider = void 0;
const vscode = __importStar(require("vscode"));
class PreviewContentProvider {
    constructor(changeDataManager) {
        this._onDidChange = new vscode.EventEmitter();
        this.changeDataManager = changeDataManager;
    }
    get onDidChange() {
        return this._onDidChange.event;
    }
    /**
     * プレビューURIを生成
     */
    static createPreviewUri(changeId, filePath) {
        return vscode.Uri.parse(`${PreviewContentProvider.scheme}://${changeId}/${encodeURIComponent(filePath)}`);
    }
    /**
     * プレビューコンテンツを提供
     */
    provideTextDocumentContent(uri) {
        try {
            const changeId = uri.authority;
            const filePath = decodeURIComponent(uri.path.substring(1)); // 先頭のスラッシュを除去
            const change = this.changeDataManager.getChange(changeId);
            if (!change) {
                return `// 変更データが見つかりません: ${changeId}`;
            }
            // 元のファイルコンテンツを取得
            const originalContent = this.getOriginalFileContent(filePath);
            if (!originalContent) {
                return `// ファイルが見つかりません: ${filePath}`;
            }
            // プレビューコンテンツを生成
            const previewContent = this.changeDataManager.generatePreviewContent(originalContent, change);
            return previewContent;
        }
        catch (error) {
            console.error('プレビューコンテンツ生成エラー:', error);
            return `// プレビューコンテンツの生成に失敗しました: ${error}`;
        }
    }
    /**
     * プレビューコンテンツを更新
     */
    updatePreview(changeId, filePath) {
        const uri = PreviewContentProvider.createPreviewUri(changeId, filePath);
        this._onDidChange.fire(uri);
    }
    /**
     * 元のファイルコンテンツを取得
     */
    getOriginalFileContent(filePath) {
        try {
            const fs = require('fs');
            if (fs.existsSync(filePath)) {
                return fs.readFileSync(filePath, 'utf8');
            }
        }
        catch (error) {
            console.error('ファイル読み込みエラー:', error);
        }
        return null;
    }
    /**
     * リソースを破棄
     */
    dispose() {
        this._onDidChange.dispose();
    }
}
exports.PreviewContentProvider = PreviewContentProvider;
PreviewContentProvider.scheme = 'diff-preview';
//# sourceMappingURL=PreviewContentProvider.js.map