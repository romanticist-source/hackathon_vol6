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
exports.extractIndexFromCssSelector = exports.resolveFilePath = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function resolveFilePath(url) {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            console.error('ワークスペースが開かれていません');
            return null;
        }
        const relativePath = pathname.startsWith('/') ? pathname.substring(1) : pathname;
        console.log('workspaceRoot:', workspaceRoot);
        console.log('relativePath:', relativePath);
        const fullPath = path.join(workspaceRoot, relativePath);
        if (fs.existsSync(fullPath)) {
            console.log('Found file at:', fullPath);
            return fullPath;
        }
        if (pathname.endsWith('/') || pathname === '') {
            const indexPath = path.join(workspaceRoot, relativePath, 'index.html');
            console.log('indexPath:', indexPath);
            if (fs.existsSync(indexPath)) {
                console.log('Found index.html at:', indexPath);
                return indexPath;
            }
        }
        const fallbackPath = path.join(workspaceRoot, `${relativePath}.html`);
        console.log('fallbackPath:', fallbackPath);
        if (fs.existsSync(fallbackPath)) {
            console.log('Found fallback .html file at:', fallbackPath);
            return fallbackPath;
        }
        console.error('ファイルが見つかりません:', fullPath);
        return null;
    }
    catch (error) {
        console.error('URL解決エラー:', error);
        return null;
    }
}
exports.resolveFilePath = resolveFilePath;
function extractIndexFromCssSelector(cssSelector, tagName, className) {
    const escapedClassName = className.replace(/\s+/g, '\\.');
    const pattern = new RegExp(`${tagName}\\.${escapedClassName}:nth-child\\((\\d+)\\)`);
    const match = cssSelector.match(pattern);
    if (match) {
        return parseInt(match[1]) - 1;
    }
    return null;
}
exports.extractIndexFromCssSelector = extractIndexFromCssSelector;
//# sourceMappingURL=utils.js.map