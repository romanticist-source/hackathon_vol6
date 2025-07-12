import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function resolveFilePath(url: string): string | null {
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

    } catch (error) {
        console.error('URL解決エラー:', error);
        return null;
    }
}

export function extractIndexFromCssSelector(cssSelector: string, tagName: string, className: string): number | null {
    const escapedClassName = className.replace(/\s+/g, '\\.');
    const pattern = new RegExp(`${tagName}\\.${escapedClassName}:nth-child\\((\\d+)\\)`);
    const match = cssSelector.match(pattern);
    
    if (match) {
        return parseInt(match[1]) - 1;
    }
    
    return null;
}