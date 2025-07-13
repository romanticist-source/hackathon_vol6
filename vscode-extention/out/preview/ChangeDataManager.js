"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeDataManager = void 0;
class ChangeDataManager {
    constructor() {
        this.changes = new Map();
        this.currentChangeId = null;
    }
    /**
     * 新しい変更データを追加
     */
    addChange(changeData) {
        const id = this.generateChangeId();
        const change = {
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
    getChange(id) {
        return this.changes.get(id);
    }
    /**
     * 現在の変更IDを取得
     */
    getCurrentChangeId() {
        return this.currentChangeId;
    }
    /**
     * 変更データを削除
     */
    removeChange(id) {
        const removed = this.changes.delete(id);
        if (this.currentChangeId === id) {
            this.currentChangeId = null;
        }
        return removed;
    }
    /**
     * すべての変更データを取得
     */
    getAllChanges() {
        return Array.from(this.changes.values());
    }
    /**
     * 古い変更データをクリーンアップ
     */
    cleanupOldChanges(maxAge = 30 * 60 * 1000) {
        const now = Date.now();
        const toDelete = [];
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
    generatePreviewContent(originalContent, change) {
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
    applyAttributeChange(content, change) {
        if (!change.selector || !change.attribute)
            return content;
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
                    return elementStart.replace(new RegExp(`${attribute}\\s*=\\s*["'][^"']*["']`), `${attribute}="${value}"`);
                }
                else {
                    return `${elementStart} ${attribute}="${value}"`;
                }
            });
        }
        return content;
    }
    applyStyleChange(content, change) {
        if (!change.selector || !change.property)
            return content;
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
                    return elementStart.replace(/style\s*=\s*["']([^"']*)["']/, (styleMatch, existingStyles) => {
                        const updatedStyles = this.updateStyleString(existingStyles, property, value);
                        return `style="${updatedStyles}"`;
                    });
                }
                else {
                    // 新しいstyle属性を追加
                    return `${elementStart} style="${property}: ${value};"`;
                }
            });
        }
        return content;
    }
    applyTextChange(content, change) {
        if (!change.selector)
            return content;
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
    applyElementAdd(content, change) {
        if (!change.selector || !change.value)
            return content;
        // IDセレクタの直前にelementHTMLを挿入（MVP実装）
        const id = change.selector.substring(1);
        const regex = new RegExp(`(<[^>]*id\\s*=\\s*["']${id}["'][^>]*>)`, 'g');
        return content.replace(regex, `$1${change.value}`);
    }
    applyElementRemove(content, change) {
        if (!change.selector)
            return content;
        // IDセレクタで該当要素ごと削除（MVP実装）
        const id = change.selector.substring(1);
        const regex = new RegExp(`<[^>]*id\\s*=\\s*["']${id}["'][^>]*>.*?</[^>]+>`, 'gs');
        return content.replace(regex, '');
    }
    updateStyleString(existingStyles, property, value) {
        const stylePairs = existingStyles.split(';').filter(pair => pair.trim());
        const styleMap = new Map();
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
    generateChangeId() {
        return `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.ChangeDataManager = ChangeDataManager;
//# sourceMappingURL=ChangeDataManager.js.map