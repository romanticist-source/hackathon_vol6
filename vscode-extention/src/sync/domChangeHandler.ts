import * as vscode from 'vscode';
import { FileEditor } from './fileEditor.js';
import { resolveFilePath } from './utils.js';
import { FileSyncManager } from '../fileSyncManager.js';

export class DOMChangeHandler {
    private fileEditor: FileEditor;
    private fileSyncManager: FileSyncManager;

    constructor(fileSyncManager: FileSyncManager) {
        this.fileEditor = new FileEditor();
        this.fileSyncManager = fileSyncManager;
    }

    public async handleMessage(message: any): Promise<void> {
        try {
            console.log('ブラウザからのメッセージを受信:', message);

            switch (message.type) {
                case 'dom_change':
                    await this.handleDOMChange(message.data, message.url);
                    break;
                case 'element_added':
                    await this.handleElementAdded(message);
                    break;
                case 'element_removed':
                    await this.handleElementRemoved(message);
                    break;
                case 'attribute_changed':
                    await this.handleAttributeChanged(message);
                    break;
                case 'text_changed':
                    await this.handleTextChanged(message);
                    break;
                case 'attribute_change':
                    await this.fileSyncManager.handleAttributeChange(message.data);
                    break;
                case 'style_change':
                    await this.fileSyncManager.handleStyleChange(message.data);
                    break;
                default:
                    console.warn('未知のメッセージタイプ:', message.type);
            }
        } catch (error) {
            console.error('メッセージ処理エラー:', error);
            vscode.window.showErrorMessage('ブラウザからの変更の処理に失敗しました。');
        }
    }

    private async handleDOMChange(data: any, url: string): Promise<void> {
        console.log('DOM変更を受信:', data);
        vscode.window.showInformationMessage(`DOM変更を受信: ${data.type || '不明'}`);

        switch (data.type) {
            case 'element_added':
                await this.handleElementAdded({ ...data, url });
                break;
            case 'element_removed':
                await this.handleElementRemoved({ ...data, url });
                break;
            case 'attribute_changed':
                await this.handleAttributeChanged({ ...data, url });
                break;
            case 'style_changed':
                await this.handleStyleChanged({ ...data, url });
                break;
            case 'text_changed':
                await this.handleTextChanged({ ...data, url });
                break;
            default:
                console.warn('未知のDOM変更タイプ:', data.type);
        }
    }

    private async handleStyleChanged(message: any): Promise<void> {
        console.log('style変更を受信:', message);
        vscode.window.showInformationMessage(`style変更: "${message.newValue}"`);

        if (message.element && message.url) {
            const filePath = resolveFilePath(message.url);
            if (filePath) {
                await this.fileEditor.updateAttribute(filePath, message.element, 'style', message.newValue);
            }
        }
    }

    private async handleElementAdded(message: any): Promise<void> {
        console.log('DEBUG: メッセージ全体:', message);
        console.log('DEBUG: message.url:', message.url);
        vscode.window.showInformationMessage(`要素追加: ${message.element?.tagName || '不明'}`);

        if (message.element && message.url) {
            const filePath = resolveFilePath(message.url);
            console.log('実際のfilePath:', filePath);
            if (filePath) {
                await this.fileEditor.addElement(filePath, message.element, message.parent);
            }
        }
    }

    private async handleElementRemoved(message: any): Promise<void> {
        console.log('要素削除を受信:', message);
        vscode.window.showInformationMessage(`要素削除: ${message.element?.tagName || '不明'}`);

        if (message.element && message.url) {
            const filePath = resolveFilePath(message.url);
            if (filePath) {
                await this.fileEditor.removeElement(filePath, message.element);
            }
        }
    }

    private async handleAttributeChanged(message: any): Promise<void> {
        if (message.attributeName === 'style') {
            console.warn('style属性はstyle_changedで処理されます');
            return;
        }
        console.log('属性変更を受信:', message);
        console.log('element.attributes:', message.element.attributes);
        console.log('attributeName:', message.attributeName);
        console.log('newValue:', message.newValue);
        vscode.window.showInformationMessage(`属性変更: ${message.attributeName}="${message.newValue}"`);

        if (message.element && message.url) {
            const filePath = resolveFilePath(message.url);
            if (filePath) {
                await this.fileEditor.updateAttribute(filePath, message.element, message.attributeName, message.newValue);
            }
        }
    }

    private async handleTextChanged(message: any): Promise<void> {
        console.log('テキスト変更を受信:', message);
        vscode.window.showInformationMessage(`テキスト変更: "${message.newValue}"`);

        if (message.parentElement && message.url) {
            const filePath = resolveFilePath(message.url);
            if (filePath) {
                await this.fileEditor.updateText(filePath, message.parentElement, message.newValue);
            }
        }
    }
}