import * as vscode from 'vscode';
import { ChangeDataManager, ChangeData } from './ChangeDataManager.js';

export class PreviewContentProvider implements vscode.TextDocumentContentProvider {
    public static readonly scheme = 'diff-preview';
    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
    private changeDataManager: ChangeDataManager;

    constructor(changeDataManager: ChangeDataManager) {
        this.changeDataManager = changeDataManager;
    }

    public get onDidChange(): vscode.Event<vscode.Uri> {
        return this._onDidChange.event;
    }

    /**
     * プレビューURIを生成
     */
    public static createPreviewUri(changeId: string, filePath: string): vscode.Uri {
        return vscode.Uri.parse(`${PreviewContentProvider.scheme}://${changeId}/${encodeURIComponent(filePath)}`);
    }

    /**
     * プレビューコンテンツを提供
     */
    public provideTextDocumentContent(uri: vscode.Uri): string | Thenable<string> {
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

        } catch (error) {
            console.error('プレビューコンテンツ生成エラー:', error);
            return `// プレビューコンテンツの生成に失敗しました: ${error}`;
        }
    }

    /**
     * プレビューコンテンツを更新
     */
    public updatePreview(changeId: string, filePath: string): void {
        const uri = PreviewContentProvider.createPreviewUri(changeId, filePath);
        this._onDidChange.fire(uri);
    }

    /**
     * 元のファイルコンテンツを取得
     */
    private getOriginalFileContent(filePath: string): string | null {
        try {
            const fs = require('fs');
            if (fs.existsSync(filePath)) {
                return fs.readFileSync(filePath, 'utf8');
            }
        } catch (error) {
            console.error('ファイル読み込みエラー:', error);
        }
        return null;
    }

    /**
     * リソースを破棄
     */
    public dispose(): void {
        this._onDidChange.dispose();
    }
} 