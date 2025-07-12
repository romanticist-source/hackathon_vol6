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
exports.FileEditor = void 0;
const vscode = __importStar(require("vscode"));
const utils_js_1 = require("./utils.js");
class FileEditor {
    async addElement(filePath, element, parentSelector) {
        const document = await vscode.workspace.openTextDocument(filePath);
        const text = document.getText();
        const newHtml = element.outerHTML || `<div>New Element</div>`;
        const updated = text.replace('</body>', `${newHtml}\n</body>`);
        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(text.length));
        edit.replace(document.uri, fullRange, updated);
        await vscode.workspace.applyEdit(edit);
        await document.save();
        vscode.window.showInformationMessage('要素を追加しました');
    }
    async removeElement(filePath, element) {
        const document = await vscode.workspace.openTextDocument(filePath);
        const text = document.getText();
        let regex;
        let elementMatch = null;
        if (element.id) {
            regex = new RegExp(`<[^>]*id=["']${element.id}["'][^>]*>.*?</[^>]+>`, 'gs');
            elementMatch = regex.exec(text);
        }
        else if (element.cssSelector && element.className && element.tagName) {
            const extractedIndex = (0, utils_js_1.extractIndexFromCssSelector)(element.cssSelector, element.tagName.toLowerCase(), element.className);
            if (extractedIndex !== null) {
                const tagName = element.tagName;
                const classNames = element.className.trim().split(/\s+/).join('.*?');
                const classRegex = new RegExp(`<${tagName}[^>]*class=["'][^"']*\\b${classNames}\\b[^"']*["'][^>]*>.*?</${tagName}>`, 'gs');
                const matches = [];
                let match;
                while ((match = classRegex.exec(text)) !== null) {
                    matches.push(match);
                    if (matches.length > 1000)
                        break;
                }
                if (extractedIndex < matches.length) {
                    elementMatch = matches[extractedIndex];
                    console.log(`cssSelectorから抽出したindex: ${extractedIndex}, 該当要素: ${matches.length}個中${extractedIndex + 1}番目`);
                }
            }
        }
        else if (element.className && element.tagName && element.index !== null && element.index >= 0) {
            const tagName = element.tagName;
            const classNames = element.className.trim().split(/\s+/).join('.*?');
            const classRegex = new RegExp(`<${tagName}[^>]*class=["'][^"']*\\b${classNames}\\b[^"']*["'][^>]*>.*?</${tagName}>`, 'gs');
            const matches = [];
            let match;
            while ((match = classRegex.exec(text)) !== null) {
                matches.push(match);
                if (matches.length > 1000)
                    break;
            }
            if (element.index < matches.length) {
                elementMatch = matches[element.index];
            }
        }
        if (!elementMatch) {
            console.warn('対象要素が見つかりません', element);
            console.log('検索情報:', {
                id: element.id,
                tagName: element.tagName,
                className: element.className,
                cssSelector: element.cssSelector,
                extractedIndex: element.cssSelector ? (0, utils_js_1.extractIndexFromCssSelector)(element.cssSelector, element.tagName?.toLowerCase() || '', element.className || '') : null
            });
            return;
        }
        const startPos = document.positionAt(elementMatch.index);
        const endPos = document.positionAt(elementMatch.index + elementMatch[0].length);
        const range = new vscode.Range(startPos, endPos);
        const edit = new vscode.WorkspaceEdit();
        edit.delete(document.uri, range);
        await vscode.workspace.applyEdit(edit);
        await document.save();
        vscode.window.showInformationMessage(`要素を削除しました`);
    }
    async updateAttribute(filePath, element, attributeName, newValue) {
        const document = await vscode.workspace.openTextDocument(filePath);
        const text = document.getText();
        let regex;
        let elementMatch = null;
        if (element.id) {
            regex = new RegExp(`<[^>]*id=["']${element.id}["'][^>]*>`, 'g');
            elementMatch = regex.exec(text);
        }
        else if (element.cssSelector && element.className && element.tagName) {
            const extractedIndex = (0, utils_js_1.extractIndexFromCssSelector)(element.cssSelector, element.tagName.toLowerCase(), element.className);
            if (extractedIndex !== null) {
                const tagName = element.tagName;
                const classNames = element.className.trim().split(/\s+/).join('.*?');
                const classRegex = new RegExp(`<${tagName}[^>]*class=["'][^"']*\\b${classNames}\\b[^"']*["'][^>]*>`, 'g');
                const matches = [];
                let match;
                while ((match = classRegex.exec(text)) !== null) {
                    matches.push(match);
                    if (matches.length > 1000)
                        break;
                }
                if (extractedIndex < matches.length) {
                    elementMatch = matches[extractedIndex];
                    console.log(`cssSelectorから抽出したindex: ${extractedIndex}`);
                }
            }
        }
        else if (element.className && element.tagName && element.index !== null && element.index >= 0) {
            const tagName = element.tagName;
            const classNames = element.className.trim().split(/\s+/).join('.*?');
            const classRegex = new RegExp(`<${tagName}[^>]*class=["'][^"']*\\b${classNames}\\b[^"']*["'][^>]*>`, 'g');
            const matches = [];
            let match;
            while ((match = classRegex.exec(text)) !== null) {
                matches.push(match);
                if (matches.length > 1000)
                    break;
            }
            if (element.index < matches.length) {
                elementMatch = matches[element.index];
            }
        }
        if (!elementMatch) {
            console.warn('対象要素が見つかりません', element);
            return;
        }
        const startPos = document.positionAt(elementMatch.index);
        const endPos = document.positionAt(elementMatch.index + elementMatch[0].length);
        const range = new vscode.Range(startPos, endPos);
        let tagText = elementMatch[0];
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
    async updateText(filePath, parentElement, newValue) {
        const document = await vscode.workspace.openTextDocument(filePath);
        const text = document.getText();
        let elementMatch = null;
        const tagName = parentElement.tagName.toLowerCase();
        if (parentElement.id) {
            const regex = new RegExp(`<${tagName}[^>]*id=["']${parentElement.id}["'][^>]*>[\\s\\S]*?</${tagName}>`, 'g');
            elementMatch = regex.exec(text);
        }
        else if (parentElement.cssSelector && parentElement.className) {
            const extractedIndex = (0, utils_js_1.extractIndexFromCssSelector)(parentElement.cssSelector, tagName, parentElement.className);
            if (extractedIndex !== null) {
                const classNames = parentElement.className.trim().split(/\s+/).join('.*?');
                const classRegex = new RegExp(`<${tagName}[^>]*class=["'][^"']*\\b${classNames}\\b[^"']*["'][^>]*>[\\s\\S]*?</${tagName}>`, 'g');
                const matches = [];
                let match;
                while ((match = classRegex.exec(text)) !== null) {
                    matches.push(match);
                    if (matches.length > 1000)
                        break;
                }
                if (extractedIndex < matches.length) {
                    elementMatch = matches[extractedIndex];
                }
            }
        }
        else if (parentElement.className && parentElement.index !== null && parentElement.index >= 0) {
            const classNames = parentElement.className.trim().split(/\s+/).join('.*?');
            const classRegex = new RegExp(`<${tagName}[^>]*class=["'][^"']*\\b${classNames}\\b[^"']*["'][^>]*>[\\s\\S]*?</${tagName}>`, 'g');
            const matches = [];
            let match;
            while ((match = classRegex.exec(text)) !== null) {
                matches.push(match);
                if (matches.length > 1000)
                    break;
            }
            if (parentElement.index < matches.length) {
                elementMatch = matches[parentElement.index];
            }
        }
        if (!elementMatch) {
            console.warn('対象要素が見つかりません', parentElement);
            return;
        }
        const startPos = document.positionAt(elementMatch.index);
        const endPos = document.positionAt(elementMatch.index + elementMatch[0].length);
        const range = new vscode.Range(startPos, endPos);
        const newTag = elementMatch[0].replace(/>(.*?)</s, `>${newValue}<`);
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, range, newTag);
        await vscode.workspace.applyEdit(edit);
        await document.save();
        vscode.window.showInformationMessage(`テキストを更新しました`);
    }
}
exports.FileEditor = FileEditor;
//# sourceMappingURL=fileEditor.js.map