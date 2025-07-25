import * as vscode from 'vscode';

export interface ChangeData {
    id: string;
    type: 'attribute_change' | 'style_change' | 'text_change' | 'element_add' | 'element_remove';
    url: string;
    selector: string;
    attribute?: string;
    property?: string;
    value: string;
    timestamp: number;
    originalContent?: string;
    previewContent?: string;
}

export class ChangeDataManager {
    private changes: Map<string, ChangeData> = new Map();
    private currentChangeId: string | null = null;

    /**
     * 新しい変更データを追加
     */
    addChange(changeData: Omit<ChangeData, 'id' | 'timestamp'>): string {
        const id = this.generateChangeId();
        const change: ChangeData = {
            ...changeData,
            id,
            timestamp: Date.now()
        };

        this.changes.set(id, change);
        this.currentChangeId = id;

        return id;
    }

    /**
     * 変更データを取得
     */
    getChange(id: string): ChangeData | undefined {
        return this.changes.get(id);
    }

    /**
     * 現在の変更IDを取得
     */
    getCurrentChangeId(): string | null {
        return this.currentChangeId;
    }

    /**
     * 変更データを削除
     */
    removeChange(id: string): boolean {
        const removed = this.changes.delete(id);
        if (this.currentChangeId === id) {
            this.currentChangeId = null;
        }
        return removed;
    }

    /**
     * すべての変更データを取得
     */
    getAllChanges(): ChangeData[] {
        return Array.from(this.changes.values());
    }

    /**
     * 古い変更データをクリーンアップ
     */
    cleanupOldChanges(maxAge: number = 30 * 60 * 1000): void { // デフォルト30分
        const now = Date.now();
        const toDelete: string[] = [];

        for (const [id, change] of this.changes) {
            if (now - change.timestamp > maxAge) {
                toDelete.push(id);
            }
        }

        toDelete.forEach(id => this.removeChange(id));
    }

    /**
     * プレビューコンテンツを生成
     */
    generatePreviewContent(originalContent: string, change: ChangeData): string {
        switch (change.type) {
            case 'attribute_change':
                return this.applyAttributeChange(originalContent, change);
            case 'style_change':
                return this.applyStyleChange(originalContent, change);
            case 'text_change':
                return this.applyTextChange(originalContent, change);
            case 'element_add':
                return this.applyElementAdd(originalContent, change);
            case 'element_remove':
                return this.applyElementRemove(originalContent, change);
            default:
                return originalContent;
        }
    }

    private applyAttributeChange(content: string, change: ChangeData): string {
        if (!change.selector || !change.attribute) return content;

        // 簡易的な属性変更適用
        const selector = change.selector;
        const attribute = change.attribute;
        const value = change.value;

        // IDセレクタの場合
        if (selector.startsWith('#')) {
            const id = selector.substring(1);
            const regex = new RegExp(`(<[^>]*id\\s*=\\s*["']${id}["'][^>]*)`, 'g');
            return content.replace(regex, (match, elementStart) => {
                // 既存の属性を更新または追加
                if (elementStart.includes(`${attribute}=`)) {
                    return elementStart.replace(
                        new RegExp(`${attribute}\\s*=\\s*["'][^"']*["']`),
                        `${attribute}="${value}"`
                    );
                } else {
                    return `${elementStart} ${attribute}="${value}"`;
                }
            });
        }

        return content;
    }

    private applyStyleChange(content: string, change: ChangeData): string {
        console.log('[DEBUG] applyStyleChange', change);
        if (!change.selector || !change.property) return content;

        const selector = change.selector;
        const property = change.property;
        const value = change.value;

        // IDセレクタの場合
        if (selector.startsWith('#')) {
            const id = selector.substring(1);
            const regex = new RegExp(`(<[^>]*id\\s*=\\s*["']${id}["'][^>]*)`, 'g');
            return content.replace(regex, (match, elementStart) => {
                if (elementStart.includes('style=')) {
                    // 既存のstyle属性を更新
                    return elementStart.replace(
                        /style\s*=\s*["']([^"']*)["']/,
                        (styleMatch, existingStyles) => {
                            const updatedStyles = this.updateStyleString(existingStyles, property, value);
                            return `style="${updatedStyles}"`;
                        }
                    );
                } else {
                    // 新しいstyle属性を追加
                    return `${elementStart} style="${property}: ${value};"`;
                }
            });
        }

        return content;
    }

    private applyTextChange(content: string, change: ChangeData): string {
        if (!change.selector) return content;
        const selector = change.selector;
        const newValue = change.value;

        // IDセレクタの場合
        if (selector.startsWith('#')) {
            const id = selector.substring(1);
            // <div id="text-test" ...>...</div> の ... 部分だけを置換
            const regex = new RegExp(`(<[^>]*id\\s*=\\s*["']${id}["'][^>]*>)([\\s\\S]*?)(</[^>]+>)`, 'g');
            return content.replace(regex, `$1${newValue}$3`);
        }

        return content;
    }

    private applyElementAdd(content: string, change: ChangeData): string {
        if (!change.selector || !change.value) return content;
        // IDセレクタの直前にelementHTMLを挿入（MVP実装）
        const id = change.selector.substring(1);
        const regex = new RegExp(`(<[^>]*id\\s*=\\s*["']${id}["'][^>]*>)`, 'g');
        return content.replace(regex, `$1${change.value}`);
    }

    private applyElementRemove(content: string, change: ChangeData): string {
        if (!change.selector) return content;
        // IDセレクタで該当要素ごと削除（MVP実装）
        const id = change.selector.substring(1);
        const regex = new RegExp(`<[^>]*id\\s*=\\s*["']${id}["'][^>]*>.*?</[^>]+>`, 'gs');
        return content.replace(regex, '');
    }

    private updateStyleString(existingStyles: string, property: string, value: string): string {
        const stylePairs = existingStyles.split(';').filter(pair => pair.trim());
        const styleMap = new Map<string, string>();

        // 既存のスタイルを解析
        for (const pair of stylePairs) {
            const [key, val] = pair.split(':').map(s => s.trim());
            if (key && val) {
                styleMap.set(key, val);
            }
        }

        // 新しいスタイルを追加/更新
        styleMap.set(property, value);

        // スタイル文字列を再構築
        return Array.from(styleMap.entries())
            .map(([key, val]) => `${key}: ${val}`)
            .join('; ');
    }

    private generateChangeId(): string {
        return `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
} 