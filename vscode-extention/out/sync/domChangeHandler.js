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
const utils_js_1 = require("./utils.js");
class DOMChangeHandler {
    constructor(fileSyncManager) {
        this.fileEditor = new fileEditor_js_1.FileEditor();
        this.fileSyncManager = fileSyncManager;
    }
    async handleMessage(message) {
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
        }
        catch (error) {
            console.error('メッセージ処理エラー:', error);
            vscode.window.showErrorMessage('ブラウザからの変更の処理に失敗しました。');
        }
    }
    async handleDOMChange(data, url) {
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
    async handleStyleChanged(message) {
        console.log('style変更を受信:', message);
        vscode.window.showInformationMessage(`style変更: "${message.newValue}"`);
        if (message.element && message.url) {
            const filePath = (0, utils_js_1.resolveFilePath)(message.url);
            if (filePath) {
                await this.fileEditor.updateAttribute(filePath, message.element, 'style', message.newValue);
            }
        }
    }
    async handleElementAdded(message) {
        console.log('DEBUG: メッセージ全体:', message);
        console.log('DEBUG: message.url:', message.url);
        vscode.window.showInformationMessage(`要素追加: ${message.element?.tagName || '不明'}`);
        if (message.element && message.url) {
            const filePath = (0, utils_js_1.resolveFilePath)(message.url);
            console.log('実際のfilePath:', filePath);
            if (filePath) {
                await this.fileEditor.addElement(filePath, message.element, message.parent);
            }
        }
    }
    async handleElementRemoved(message) {
        console.log('要素削除を受信:', message);
        vscode.window.showInformationMessage(`要素削除: ${message.element?.tagName || '不明'}`);
        if (message.element && message.url) {
            const filePath = (0, utils_js_1.resolveFilePath)(message.url);
            if (filePath) {
                await this.fileEditor.removeElement(filePath, message.element);
            }
        }
    }
    async handleAttributeChanged(message) {
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
            const filePath = (0, utils_js_1.resolveFilePath)(message.url);
            if (filePath) {
                await this.fileEditor.updateAttribute(filePath, message.element, message.attributeName, message.newValue);
            }
        }
    }
    async handleTextChanged(message) {
        console.log('テキスト変更を受信:', message);
        vscode.window.showInformationMessage(`テキスト変更: "${message.newValue}"`);
        if (message.parentElement && message.url) {
            const filePath = (0, utils_js_1.resolveFilePath)(message.url);
            if (filePath) {
                await this.fileEditor.updateText(filePath, message.parentElement, message.newValue);
            }
        }
    }
}
exports.DOMChangeHandler = DOMChangeHandler;
//# sourceMappingURL=domChangeHandler.js.map