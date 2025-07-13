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
exports.DOMChangeHandler = void 0;
const vscode = __importStar(require("vscode"));
const fileEditor_js_1 = require("./fileEditor.js");
class DOMChangeHandler {
    constructor(fileSyncManager, changePreviewManager) {
        this.fileEditor = new fileEditor_js_1.FileEditor();
        this.fileSyncManager = fileSyncManager;
        this.changePreviewManager = changePreviewManager;
    }
    async handleMessage(message) {
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
                default:
                    console.warn('未知のメッセージタイプ:', message.type);
            }
        }
        catch (error) {
            console.error('メッセージ処理エラー:', error);
            vscode.window.showErrorMessage('ブラウザからの変更の処理に失敗しました。');
        }
    }
    async handleDOMChange(data, url) {
        // text_changedはparent.idやelement.idを最優先で使う
        if (data.type === 'text_changed') {
            let selector = data.selector;
            if (!selector && data.parent && data.parent.id) {
                selector = `#${data.parent.id}`;
            }
            else if (!selector && data.element && data.element.id) {
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
            }
            else if (data.parent && data.parent.id) {
                selector = `#${data.parent.id}`;
            }
            else if (data.target && data.target.id) {
                selector = `#${data.target.id}`;
            }
            else if (data.element && data.element.className) {
                selector = '.' + data.element.className.split(' ').join('.');
            }
            else if (data.parent && data.parent.className) {
                selector = '.' + data.parent.className.split(' ').join('.');
            }
            else if (data.element && data.element.tagName) {
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
            case 'style_changed':
                await this.changePreviewManager.handleStyleChange({
                    url,
                    selector,
                    property: data.property,
                    value: data.newValue
                });
                break;
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
    async handleStyleChanged(message) {
        // 何もしない（全てhandleStyleChange経由に統一）
    }
    async handleElementAdded(message) {
        // 何もしない（全てhandleElementAdded経由に統一）
    }
    async handleElementRemoved(message) {
        // 何もしない（全てhandleElementRemoved経由に統一）
    }
    async handleAttributeChanged(message) {
        // 何もしない（全てhandleAttributeChange経由に統一）
    }
    async handleTextChanged(message) {
        // 何もしない（全てhandleTextChange経由に統一）
    }
}
exports.DOMChangeHandler = DOMChangeHandler;
//# sourceMappingURL=domChangeHandler.js.map