import * as vscode from 'vscode';
import { ChangeDataManager } from './ChangeDataManager.js';
import { PreviewContentProvider } from './PreviewContentProvider.js';
import { DiffEditorManager } from './DiffEditorManager.js';
import { FileSyncManager } from '../fileSyncManager.js';

export class ChangePreviewManager {
    private changeDataManager: ChangeDataManager;
    private previewContentProvider: PreviewContentProvider;
    private diffEditorManager: DiffEditorManager;
    private fileSyncManager: FileSyncManager;
    private isEnabled: boolean = true;

    constructor(fileSyncManager: FileSyncManager) {
        this.changeDataManager = new ChangeDataManager();
        this.previewContentProvider = new PreviewContentProvider(this.changeDataManager);
        this.diffEditorManager = new DiffEditorManager(this.changeDataManager, this.previewContentProvider);
        this.fileSyncManager = fileSyncManager;

        this.registerContentProvider();
        this.registerCommands();
    }

    /**
     * コンテンツプロバイダーを登録
     */
    private registerContentProvider(): void {
        vscode.workspace.registerTextDocumentContentProvider(
            PreviewContentProvider.scheme,
            this.previewContentProvider
        );
    }

    /**
     * コマンドを登録
     */
    private registerCommands(): void {
        // プレビュー表示コマンド
        vscode.commands.registerCommand('browser-to-vscode-sync.showPreview', () => {
            const currentChangeId = this.changeDataManager.getCurrentChangeId();
            if (currentChangeId) {
                const change = this.changeDataManager.getChange(currentChangeId);
                if (change) {
                    const filePath = this.resolveFilePath(change.url);
                    if (filePath) {
                        this.diffEditorManager.showDiffEditor(currentChangeId, filePath);
                    }
                }
            }
        });

        // 変更適用コマンド
        vscode.commands.registerCommand('browser-to-vscode-sync.applyChange', (changeId: string) => {
            const change = this.changeDataManager.getChange(changeId);
            if (change) {
                const filePath = this.resolveFilePath(change.url);
                if (filePath) {
                    this.diffEditorManager.applyChange(changeId, filePath);
                }
            }
        });

        // 変更却下コマンド
        vscode.commands.registerCommand('browser-to-vscode-sync.rejectChange', (changeId: string) => {
            this.diffEditorManager.rejectChange(changeId);
        });

        // プレビュー機能の有効/無効切り替え
        vscode.commands.registerCommand('browser-to-vscode-sync.togglePreview', () => {
            this.isEnabled = !this.isEnabled;
            const status = this.isEnabled ? '有効' : '無効';
            vscode.window.showInformationMessage(`変更プレビュー機能を${status}にしました。`);
        });
    }

    /**
     * 属性変更を処理
     */
    public async handleAttributeChange(data: any): Promise<void> {
        console.log('ChangePreviewManager.handleAttributeChange', data);
        if (!this.isEnabled) {
            // プレビュー機能が無効な場合は直接適用
            return this.applyChangeDirectly(data);
        }

        const filePath = this.resolveFilePath(data.url);
        if (!filePath) {
            console.warn('ファイルパスを解決できませんでした:', data.url);
            return;
        }

        // 変更データを追加
        const changeId = this.changeDataManager.addChange({
            type: 'attribute_change',
            url: data.url,
            selector: data.selector,
            attribute: data.attribute,
            value: data.value
        });

        // 通知を表示
        this.diffEditorManager.showChangeNotification(changeId, filePath);
    }

    /**
     * スタイル変更を処理
     */
    public async handleStyleChange(data: any): Promise<void> {
        console.log('ChangePreviewManager.handleStyleChange', data);
        if (!this.isEnabled) {
            // プレビュー機能が無効な場合は直接適用
            return this.applyChangeDirectly(data);
        }

        const filePath = this.resolveFilePath(data.url);
        if (!filePath) {
            console.warn('ファイルパスを解決できませんでした:', data.url);
            return;
        }

        // 変更データを追加
        const changeId = this.changeDataManager.addChange({
            type: 'style_change',
            url: data.url,
            selector: data.selector,
            property: data.property,
            value: data.value
        });

        // 通知を表示
        this.diffEditorManager.showChangeNotification(changeId, filePath);
    }

    /**
     * テキスト変更を処理
     */
    public async handleTextChange(data: any): Promise<void> {
        console.log('ChangePreviewManager.handleTextChange', data);
        if (!this.isEnabled) {
            // プレビュー機能が無効な場合は直接適用
            return this.applyChangeDirectly(data);
        }

        const filePath = this.resolveFilePath(data.url);
        if (!filePath) {
            console.warn('ファイルパスを解決できませんでした:', data.url);
            return;
        }

        // 変更データを追加
        const changeId = this.changeDataManager.addChange({
            type: 'text_change',
            url: data.url,
            selector: data.selector,
            value: data.value
        });

        // 通知を表示
        this.diffEditorManager.showChangeNotification(changeId, filePath);
    }

    /**
     * 要素追加を処理
     */
    public async handleElementAdded(data: any): Promise<void> {
        console.log('ChangePreviewManager.handleElementAdded', data);
        if (!this.isEnabled) {
            // プレビュー機能が無効な場合は直接適用
            return this.applyChangeDirectly({ ...data, type: 'element_add' });
        }
        const filePath = this.resolveFilePath(data.url);
        if (!filePath) {
            console.warn('ファイルパスを解決できませんでした:', data.url);
            return;
        }
        const changeId = this.changeDataManager.addChange({
            type: 'element_add',
            url: data.url,
            selector: data.selector,
            value: data.elementHTML || data.value // outerHTMLなど
        });
        this.diffEditorManager.showChangeNotification(changeId, filePath);
    }

    /**
     * 要素削除を処理
     */
    public async handleElementRemoved(data: any): Promise<void> {
        console.log('ChangePreviewManager.handleElementRemoved', data);
        if (!this.isEnabled) {
            // プレビュー機能が無効な場合は直接適用
            return this.applyChangeDirectly({ ...data, type: 'element_remove' });
        }
        const filePath = this.resolveFilePath(data.url);
        if (!filePath) {
            console.warn('ファイルパスを解決できませんでした:', data.url);
            return;
        }
        const changeId = this.changeDataManager.addChange({
            type: 'element_remove',
            url: data.url,
            selector: data.selector,
            value: ''
        });
        this.diffEditorManager.showChangeNotification(changeId, filePath);
    }

    /**
     * 変更を直接適用（プレビュー機能が無効な場合）
     */
    private async applyChangeDirectly(data: any): Promise<void> {
        if (data.type === 'attribute_change') {
            await this.fileSyncManager.handleAttributeChange(data);
        } else if (data.type === 'style_change') {
            await this.fileSyncManager.handleStyleChange(data);
        } else if (data.type === 'text_change') {
            // 必要に応じてテキスト変更も追加
        } else if (data.type === 'element_add') {
            // fileEditor経由で直接追加
            const fileEditor = new (await import('../sync/fileEditor.js')).FileEditor();
            await fileEditor.addElement(this.resolveFilePath(data.url), { outerHTML: data.value }, null);
        } else if (data.type === 'element_remove') {
            const fileEditor = new (await import('../sync/fileEditor.js')).FileEditor();
            await fileEditor.removeElement(this.resolveFilePath(data.url), { id: data.selector?.replace('#', '') });
        }
    }

    /**
     * ファイルパスを解決
     */
    private resolveFilePath(url: string): string | null {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;

            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!workspaceRoot) return null;

            const path = require('path');
            const fs = require('fs');

            let relativePath = pathname.startsWith('/') ? pathname.substring(1) : pathname;

            // .htmlがなければ補完
            if (!relativePath.endsWith('.html')) {
                relativePath += '.html';
            }
            const fullPath = path.join(workspaceRoot, relativePath);

            if (fs.existsSync(fullPath)) {
                return fullPath;
            }

            return null;
        } catch (error) {
            console.error('URL解決エラー:', error);
            return null;
        }
    }

    /**
     * ステータスバーアイテムを取得
     */
    public getStatusBarItem(): vscode.StatusBarItem {
        return this.diffEditorManager.getStatusBarItem();
    }

    /**
     * プレビュー機能が有効かどうかを取得
     */
    public isPreviewEnabled(): boolean {
        return this.isEnabled;
    }

    /**
     * リソースを破棄
     */
    public dispose(): void {
        this.diffEditorManager.dispose();
        this.previewContentProvider.dispose();
    }
} 