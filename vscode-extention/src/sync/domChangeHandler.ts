import * as vscode from 'vscode';
import { FileEditor } from './fileEditor.js';
import { resolveFilePath } from './utils.js';
import { FileSyncManager } from '../fileSyncManager.js';
import { ChangePreviewManager } from '../preview/ChangePreviewManager.js';

export class DOMChangeHandler {
    private fileEditor: FileEditor;
    private fileSyncManager: FileSyncManager;
    private changePreviewManager: ChangePreviewManager;

    constructor(fileSyncManager: FileSyncManager, changePreviewManager: ChangePreviewManager) {
        this.fileEditor = new FileEditor();
        this.fileSyncManager = fileSyncManager;
        this.changePreviewManager = changePreviewManager;
    }

    public async handleMessage(message: any): Promise<void> {
        console.log('受信type:', message.type, 'payload:', message);
        try {
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
                    console.log('プレビュー分岐: attribute_change', message.data);
                    await this.changePreviewManager.handleAttributeChange(message.data);
                    break;
                case 'style_change':
                    console.log('プレビュー分岐: style_change', message.data);
                    await this.changePreviewManager.handleStyleChange(message.data);
                    break;
                case 'text_change':
                    console.log('プレビュー分岐: text_change', message.data);
                    await this.changePreviewManager.handleTextChange(message.data);
                    break;
                case 'element_add':
                    console.log('プレビュー分岐: element_add', message.data);
                    await this.changePreviewManager.handleElementAdded(message.data);
                    break;
                case 'element_remove':
                    console.log('プレビュー分岐: element_remove', message.data);
                    await this.changePreviewManager.handleElementRemoved(message.data);
                    break;
                case 'style_changed': {
                    // 旧styleと新styleをオブジェクト化
                    const oldStyles = parseStyleString(message.data.oldValue || '');
                    const newStyles = parseStyleString(message.data.newValue || '');
                    // 変化したプロパティだけ抽出して1つずつhandleStyleChange
                    for (const prop in newStyles) {
                        if (oldStyles[prop] !== newStyles[prop]) {
                            console.log('[DEBUG] style_changed→handleStyleChange', {
                                url: message.url,
                                selector: message.data.selector,
                                property: prop,
                                value: newStyles[prop]
                            });
                            await this.changePreviewManager.handleStyleChange({
                                url: message.url,
                                selector: message.data.selector,
                                property: prop,
                                value: newStyles[prop]
                            });
                        }
                    }
                    break;
                }
                default:
                    console.warn('未知のメッセージタイプ:', message.type);
            }
        } catch (error) {
            console.error('メッセージ処理エラー:', error);
            vscode.window.showErrorMessage('ブラウザからの変更の処理に失敗しました。');
        }
    }

    private async handleDOMChange(data: any, url: string): Promise<void> {
        // text_changedはparent.idやelement.idを最優先で使う
        if (data.type === 'text_changed') {
            let selector = data.selector;
            if (!selector && data.parent && data.parent.id) {
                selector = `#${data.parent.id}`;
            } else if (!selector && data.element && data.element.id) {
                selector = `#${data.element.id}`;
            }
            if (!selector || selector === 'script' || selector === 'div') {
                console.warn('text_changed: 適切なselectorが特定できません', data);
                return;
            }
            await this.changePreviewManager.handleTextChange({
                url,
                selector,
                value: data.newValue
            });
            return;
        }
        // それ以外は従来通り
        let selector = data.selector;
        if (!selector) {
            if (data.element && data.element.id) {
                selector = `#${data.element.id}`;
            } else if (data.parent && data.parent.id) {
                selector = `#${data.parent.id}`;
            } else if (data.target && data.target.id) {
                selector = `#${data.target.id}`;
            } else if (data.element && data.element.className) {
                selector = '.' + data.element.className.split(' ').join('.');
            } else if (data.parent && data.parent.className) {
                selector = '.' + data.parent.className.split(' ').join('.');
            } else if (data.element && data.element.tagName) {
                selector = data.element.tagName.toLowerCase();
            }
        }
        if (!selector) {
            console.warn('selectorを特定できませんでした', data);
        }
        switch (data.type) {
            case 'attribute_changed':
                await this.changePreviewManager.handleAttributeChange({
                    url,
                    selector,
                    attribute: data.attributeName,
                    value: data.newValue
                });
                break;
            case 'style_changed': {
                // 旧styleと新styleをオブジェクト化
                const oldStyles = parseStyleString(data.oldValue || '');
                const newStyles = parseStyleString(data.newValue || '');
                // 変化したプロパティだけ抽出して1つずつhandleStyleChange
                for (const prop in newStyles) {
                    if (oldStyles[prop] !== newStyles[prop]) {
                        console.log('[DEBUG] domChangeHandler.ts handleDOMChange→handleStyleChange', {
                            url,
                            selector,
                            property: prop,
                            value: newStyles[prop]
                        });
                        await this.changePreviewManager.handleStyleChange({
                            url,
                            selector,
                            property: prop,
                            value: newStyles[prop]
                        });
                    }
                }
                break;
            }
            case 'element_added':
                await this.changePreviewManager.handleElementAdded({
                    url,
                    selector,
                    elementHTML: data.element?.outerHTML
                });
                break;
            case 'element_removed':
                await this.changePreviewManager.handleElementRemoved({
                    url,
                    selector
                });
                break;
            default:
                console.warn('未知のDOM変更タイプ:', data.type);
        }
    }

    private async handleStyleChanged(message: any): Promise<void> {
        // 何もしない（全てhandleStyleChange経由に統一）
    }

    private async handleElementAdded(message: any): Promise<void> {
        // 何もしない（全てhandleElementAdded経由に統一）
    }

    private async handleElementRemoved(message: any): Promise<void> {
        // 何もしない（全てhandleElementRemoved経由に統一）
    }

    private async handleAttributeChanged(message: any): Promise<void> {
        // 何もしない（全てhandleAttributeChange経由に統一）
    }

    private async handleTextChanged(message: any): Promise<void> {
        // 何もしない（全てhandleTextChange経由に統一）
    }
}

function parseStyleString(styleStr: string): Record<string, string> {
    const obj: Record<string, string> = {};
    styleStr.split(';').forEach(pair => {
        const [k, v] = pair.split(':').map(s => s && s.trim());
        if (k && v) obj[k] = v;
    });
    return obj;
}