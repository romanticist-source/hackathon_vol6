import * as vscode from 'vscode';
import { ChangeDataManager } from './ChangeDataManager.js';
import { PreviewContentProvider } from './PreviewContentProvider.js';

export class DiffEditorManager {
    private changeDataManager: ChangeDataManager;
    private previewContentProvider: PreviewContentProvider;
    private statusBarItem: vscode.StatusBarItem;
    private activeDiffEditor: vscode.TextEditor | undefined;

    constructor(changeDataManager: ChangeDataManager, previewContentProvider: PreviewContentProvider) {
        this.changeDataManager = changeDataManager;
        this.previewContentProvider = previewContentProvider;
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.setupStatusBar();
    }

    /**
     * ステータスバーの設定
     */
    private setupStatusBar(): void {
        this.statusBarItem.text = '$(sync) 変更プレビュー';
        this.statusBarItem.tooltip = 'ブラウザからの変更をプレビュー';
        this.statusBarItem.command = 'browser-to-vscode-sync.showPreview';
        this.statusBarItem.hide();
    }

    /**
     * 変更通知を表示
     */
    public showChangeNotification(changeId: string, filePath: string): void {
        console.log('DiffEditorManager.showChangeNotification', changeId, filePath);
        const change = this.changeDataManager.getChange(changeId);
        if (!change) return;

        const fileName = this.getFileName(filePath);
        const changeType = this.getChangeTypeText(change.type);

        // ステータスバーを表示
        this.statusBarItem.text = `$(sync) ${changeType}: ${fileName}`;
        this.statusBarItem.show();

        // 通知メッセージを表示
        const message = `ブラウザからの変更を検出: ${changeType} (${fileName})`;
        vscode.window.showInformationMessage(
            message,
            'プレビューを表示',
            '変更を適用',
            '変更を却下'
        ).then(selection => {
            switch (selection) {
                case 'プレビューを表示':
                    this.showDiffEditor(changeId, filePath);
                    break;
                case '変更を適用':
                    this.applyChange(changeId, filePath);
                    break;
                case '変更を却下':
                    this.rejectChange(changeId);
                    break;
            }
        });
    }

    /**
     * 差分エディターを表示
     */
    public async showDiffEditor(changeId: string, filePath: string): Promise<void> {
        try {
            const change = this.changeDataManager.getChange(changeId);
            if (!change) {
                vscode.window.showErrorMessage('変更データが見つかりません。');
                return;
            }

            const originalUri = vscode.Uri.file(filePath);
            const previewUri = PreviewContentProvider.createPreviewUri(changeId, filePath);
            const fileName = this.getFileName(filePath);
            const changeType = this.getChangeTypeText(change.type);

            // 差分エディターを開く
            await vscode.commands.executeCommand('vscode.diff',
                originalUri,
                previewUri,
                `${fileName} - ${changeType} (プレビュー)`,
                {
                    preview: true,
                    viewColumn: vscode.ViewColumn.Beside
                }
            );

            // アクションボタンを表示
            this.showActionButtons(changeId, filePath);

        } catch (error) {
            console.error('差分エディター表示エラー:', error);
            vscode.window.showErrorMessage('差分エディターの表示に失敗しました。');
        }
    }

    /**
     * アクションボタンを表示
     */
    private showActionButtons(changeId: string, filePath: string): void {
        const fileName = this.getFileName(filePath);

        vscode.window.showInformationMessage(
            `変更の確認: ${fileName}`,
            '変更を適用',
            '変更を却下'
        ).then(selection => {
            switch (selection) {
                case '変更を適用':
                    this.applyChange(changeId, filePath);
                    break;
                case '変更を却下':
                    this.rejectChange(changeId);
                    break;
            }
        });
    }

    /**
     * 変更を適用
     */
    public async applyChange(changeId: string, filePath: string): Promise<void> {
        try {
            const change = this.changeDataManager.getChange(changeId);
            if (!change) {
                vscode.window.showErrorMessage('変更データが見つかりません。');
                return;
            }

            // ファイルを開く
            const document = await vscode.workspace.openTextDocument(filePath);
            const originalContent = document.getText();

            // プレビューコンテンツを生成
            const previewContent = this.changeDataManager.generatePreviewContent(originalContent, change);

            // ファイルを更新
            const edit = new vscode.WorkspaceEdit();
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(originalContent.length)
            );
            edit.replace(document.uri, fullRange, previewContent);

            await vscode.workspace.applyEdit(edit);
            await document.save();

            // 成功メッセージ
            const fileName = this.getFileName(filePath);
            vscode.window.showInformationMessage(`変更を適用しました: ${fileName}`);

            // クリーンアップ
            this.cleanupChange(changeId);

        } catch (error) {
            console.error('変更適用エラー:', error);
            vscode.window.showErrorMessage('変更の適用に失敗しました。');
        }
    }

    /**
     * 変更を却下
     */
    public rejectChange(changeId: string): void {
        const change = this.changeDataManager.getChange(changeId);
        if (change) {
            const fileName = this.getFileName(change.url);
            vscode.window.showInformationMessage(`変更を却下しました: ${fileName}`);
        }

        this.cleanupChange(changeId);
    }

    /**
     * 変更のクリーンアップ
     */
    private cleanupChange(changeId: string): void {
        this.changeDataManager.removeChange(changeId);
        this.statusBarItem.hide();

        // 差分エディターを閉じる
        if (this.activeDiffEditor) {
            vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        }
    }

    /**
     * ファイル名を取得
     */
    private getFileName(filePath: string): string {
        const path = require('path');
        return path.basename(filePath);
    }

    /**
     * 変更タイプのテキストを取得
     */
    private getChangeTypeText(type: string): string {
        switch (type) {
            case 'attribute_change':
                return '属性変更';
            case 'style_change':
                return 'スタイル変更';
            case 'text_change':
                return 'テキスト変更';
            case 'element_add':
                return '要素追加';
            case 'element_remove':
                return '要素削除';
            default:
                return '変更';
        }
    }

    /**
     * ステータスバーアイテムを取得
     */
    public getStatusBarItem(): vscode.StatusBarItem {
        return this.statusBarItem;
    }

    /**
     * リソースを破棄
     */
    public dispose(): void {
        this.statusBarItem.dispose();
    }
} 