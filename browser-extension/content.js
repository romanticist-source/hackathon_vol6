// 監視対象のノード（ここでは body）
const targetNode = document.body;

// 監視する変化のタイプ
const config = {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true
};

// 一時的な変更を追跡するためのマップ
const pendingChanges = new Map();
const CHANGE_DELAY = 500; // 500ms後に変更が持続していればログに記録

// VSCode拡張機能との通信用WebSocketクライアント
let wsConnection = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// WebSocket接続を初期化
function initWebSocketConnection() {
    try {
        wsConnection = new WebSocket('ws://localhost:3001');

        wsConnection.onopen = () => {
            console.log('VSCode拡張機能との接続が確立されました');
            reconnectAttempts = 0;
            // 接続状態をストレージに保存
            chrome.storage.local.set({ wsStatus: 'connected' });
        };

        wsConnection.onclose = () => {
            console.log('VSCode拡張機能との接続が切断されました');
            // 接続状態をストレージに保存
            chrome.storage.local.set({ wsStatus: 'disconnected' });

            // 再接続を試行
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                reconnectAttempts++;
                setTimeout(() => {
                    console.log(`再接続試行中... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
                    initWebSocketConnection();
                }, 3000);
            }
        };

        wsConnection.onerror = (error) => {
            console.error('WebSocket接続エラー:', error);
            chrome.storage.local.set({ wsStatus: 'disconnected' });
        };
    } catch (error) {
        console.error('WebSocket接続の初期化に失敗:', error);
        chrome.storage.local.set({ wsStatus: 'disconnected' });
    }
}

// VSCode拡張機能にDOM変更を送信
function sendChangeToVSCode(changeData) {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        const message = {
            type: 'dom_change',
            timestamp: new Date().toISOString(),
            url: window.location.href,
            data: changeData
        };

        wsConnection.send(JSON.stringify(message));
    }
}

// 安全にclassNameを取得する関数
function getClassNameString(element) {
    if (!element || !element.className) {
        return '';
    }

    // SVGAnimatedStringの場合はbaseValプロパティを使用
    if (typeof element.className === 'object' && element.className.baseVal !== undefined) {
        return element.className.baseVal;
    }

    // 通常の文字列の場合
    if (typeof element.className === 'string') {
        return element.className;
    }

    // その他の場合は空文字列を返す
    return '';
}

// 要素のCSS セレクタを生成
function generateCSSSelector(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
        return null;
    }

    const path = [];
    let current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
        let selector = current.tagName.toLowerCase();

        if (current.id) {
            selector += `#${current.id}`;
            path.unshift(selector);
            break; // IDがある場合はそこで停止
        }

        const classNameStr = getClassNameString(current);
        if (classNameStr) {
            const classes = classNameStr.trim().split(/\s+/);
            selector += '.' + classes.join('.');
        }

        // 同じタグの兄弟要素がある場合は nth-child を追加
        const parent = current.parentElement;
        if (parent) {
            const siblings = Array.from(parent.children).filter(child =>
                child.tagName.toLowerCase() === current.tagName.toLowerCase()
            );
            if (siblings.length > 1) {
                const index = siblings.indexOf(current) + 1;
                selector += `:nth-child(${index})`;
            }
        }

        path.unshift(selector);
        current = current.parentElement;
    }

    return path.join(' > ');
}

// 要素のインデックスを取得（同じclassName+tagNameの要素群での位置）
function getElementIndex(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
        return -1;
    }

    const tagName = element.tagName.toLowerCase();
    const classNameStr = getClassNameString(element);

    // classNameがない場合は-1を返す
    if (!classNameStr) {
        return -1;
    }

    // 同じclassNameとtagNameを持つ要素をすべて取得
    const classes = classNameStr.trim().split(/\s+/);
    const selector = `${tagName}.${classes.join('.')}`;

    try {
        const elements = document.querySelectorAll(selector);
        // 対象要素のインデックスを取得
        return Array.from(elements).indexOf(element);
    } catch (error) {
        console.warn('Invalid selector:', selector, error);
        return -1;
    }
}

// 要素の詳細情報を取得
function getElementDetails(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
        return null;
    }

    const tagName = element.tagName.toLowerCase();
    const id = element.id || null;
    const className = getClassNameString(element) || null;

    // IDがある場合は優先的に使用、ない場合はclassName+tagName+indexで特定
    let index = null;
    if (!id && className) {
        index = getElementIndex(element);
        // インデックスが取得できない場合は-1を設定
        if (index === -1) {
            index = null;
        }
    }

    return {
        tagName: tagName,
        id: id,
        className: className,
        index: index,
        textContent: element.textContent ? element.textContent.substring(0, 100) : null,
        cssSelector: generateCSSSelector(element),
        outerHTML: element.outerHTML ? element.outerHTML.substring(0, 200) : null,
        computedStyle: window.getComputedStyle ? {
            display: window.getComputedStyle(element).display,
            position: window.getComputedStyle(element).position,
            visibility: window.getComputedStyle(element).visibility
        } : null
    };
}

// ログを保存する関数
function saveLog(logMessage) {
    chrome.storage.local.get({ logs: [] }, (result) => {
        const logs = result.logs;
        logs.push(logMessage);
        // 最新100件のみ保持
        if (logs.length > 100) {
            logs.shift();
        }
        chrome.storage.local.set({ logs: logs });
    });
}

// 遅延ログ記録関数
function scheduleLogIfPersistent(changeKey, logMessage, element, attributeName = null, originalValue = null, changeData = null) {
    // 既存の保留中の変更があればキャンセル
    if (pendingChanges.has(changeKey)) {
        clearTimeout(pendingChanges.get(changeKey).timeoutId);
    }

    // 変更後の状態を記録
    const changedState = attributeName ?
        element.getAttribute(attributeName) :
        element.textContent;

    const timeoutId = setTimeout(() => {
        // 指定時間後に状態を再確認
        const finalState = attributeName ?
            element.getAttribute(attributeName) :
            element.textContent;

        // 元の値に戻っていない場合はログに記録
        if (finalState !== originalValue) {
            saveLog(logMessage);

            // VSCode拡張機能に変更を送信
            if (changeData) {
                sendChangeToVSCode(changeData);
            }
        }

        // 保留中の変更から削除
        pendingChanges.delete(changeKey);
    }, CHANGE_DELAY);

    pendingChanges.set(changeKey, {
        timeoutId,
        logMessage,
        changedState,
        originalValue,
        element
    });
}

function getElementInfo(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
        return 'テキストノードまたは不明な要素';
    }

    const tagName = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const classNameStr = getClassNameString(element);
    const className = classNameStr ? `.${classNameStr.replace(/\s+/g, '.')}` : '';
    const textContent = element.textContent ? element.textContent.substring(0, 50) : '';

    return `<${tagName}${id}${className}>${textContent}${textContent.length > 50 ? '...' : ''}`;
}

function getElementKey(element, attributeName) {
    if (!element || !attributeName) return null;
    const tagName = element.tagName.toLowerCase();
    const id = element.id || '';
    const classNameStr = getClassNameString(element);
    const className = classNameStr ? classNameStr.replace(/\s+/g, '.') : '';
    return `${tagName}#${id}.${className}.${attributeName}`;
}

// iframe内の要素かどうかを判定する関数
function isInsideIframe(element) {
    let current = element;
    while (current && current !== document.body) {
        if (current.tagName && current.tagName.toLowerCase() === 'iframe') {
            return true;
        }
        // iframe内のdocumentの場合
        if (current.ownerDocument && current.ownerDocument !== document) {
            return true;
        }
        current = current.parentNode || current.parentElement;
    }
    return false;
}

// 要素の堅牢なCSSセレクタを生成
function getElementSelector(element) {
    if (!element) return '';
    if (element.id) return `#${element.id}`;
    if (element.getAttribute && element.getAttribute('data-testid')) {
        return `[data-testid="${element.getAttribute('data-testid')}"]`;
    }
    if (element.className && typeof element.className === 'string') {
        const classSelector = '.' + element.className.trim().split(/\s+/).join('.');
        return element.tagName.toLowerCase() + classSelector;
    }
    return element.tagName ? element.tagName.toLowerCase() : '';
}

// コールバック関数
const callback = function (mutationsList, observer) {
    for (const mutation of mutationsList) {
        // iframe内の変更は無視
        if (isInsideIframe(mutation.target)) {
            continue;
        }

        const timestamp = new Date().toLocaleTimeString();

        switch (mutation.type) {
            case 'childList':
                // 子要素の追加・削除は即座にログに記録（構造的変更のため）
                if (mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE && !isInsideIframe(node)) {
                            const logMessage = `[${timestamp}] 要素追加: ${getElementInfo(node)} → 親: ${getElementInfo(mutation.target)}`;
                            saveLog(logMessage);

                            // VSCode拡張機能に送信
                            const changeData = {
                                type: 'element_added',
                                element: getElementDetails(node),
                                parent: getElementDetails(mutation.target),
                                selector: getElementSelector(node),
                                timestamp: new Date().toISOString()
                            };
                            sendChangeToVSCode(changeData);
                        }
                    }
                }
                if (mutation.removedNodes.length > 0) {
                    for (const node of mutation.removedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE && !isInsideIframe(node)) {
                            const logMessage = `[${timestamp}] 要素削除: ${getElementInfo(node)} → 親: ${getElementInfo(mutation.target)}`;
                            saveLog(logMessage);

                            // VSCode拡張機能に送信
                            const changeData = {
                                type: 'element_removed',
                                element: getElementDetails(node),
                                parent: getElementDetails(mutation.target),
                                selector: getElementSelector(node),
                                timestamp: new Date().toISOString()
                            };
                            sendChangeToVSCode(changeData);
                        }
                    }
                }
                break;

            case 'attributes':

                if (mutation.attributeName === 'style') {
                    const logMessage = `[${timestamp}] style属性変更: ${getElementInfo(mutation.target)} → "${mutation.oldValue}" → "${mutation.target.getAttribute('style')}"`;

                    const changeData = {
                        type: 'style_changed',
                        element: getElementDetails(mutation.target),
                        oldValue: mutation.oldValue,
                        newValue: mutation.target.getAttribute('style'),
                        selector: getElementSelector(mutation.target),
                        timestamp: new Date().toISOString()
                    };

                    // ★ここでデバッグ出力
                    console.log('[DEBUG] style_changed送信changeData', changeData);

                    saveLog(logMessage);
                    sendChangeToVSCode(changeData);
                    break;
                }

                // 属性変更は遅延ログ記録（hover等の一時的変更を除外）
                const elementKey = getElementKey(mutation.target, mutation.attributeName);
                if (elementKey && mutation.target.isConnected) {
                    const oldValue = mutation.oldValue || '(不明)';
                    const newValue = mutation.target.getAttribute(mutation.attributeName) || '(削除)';

                    // hover関連の属性変更かどうかを判定
                    const isHoverRelated = mutation.attributeName === 'class' &&
                        (oldValue.includes('hover') || newValue.includes('hover'));

                    const logMessage = `[${timestamp}] 属性変更: ${getElementInfo(mutation.target)} → ${mutation.attributeName}: "${oldValue}" → "${newValue}"`;

                    const changeData = {
                        type: 'attribute_changed',
                        element: getElementDetails(mutation.target),
                        attributeName: mutation.attributeName,
                        oldValue: oldValue,
                        newValue: newValue,
                        selector: getElementSelector(mutation.target),
                        timestamp: new Date().toISOString()
                    };

                    if (isHoverRelated) {
                        // hover関連の場合は遅延ログ記録
                        scheduleLogIfPersistent(elementKey, logMessage, mutation.target, mutation.attributeName, oldValue, changeData);
                    } else {
                        // 通常の属性変更は即座にログ記録
                        saveLog(logMessage);
                        sendChangeToVSCode(changeData);
                    }
                }
                break;

            case 'characterData':
                // テキスト変更は即座にログ記録
                const logMessage = `[${timestamp}] テキスト変更: "${mutation.oldValue}" → "${mutation.target.textContent}"`;
                saveLog(logMessage);

                // 親要素を堅牢に取得
                let parentElem = mutation.target.parentElement;
                if (!parentElem && mutation.target.parentNode && mutation.target.parentNode.nodeType === Node.ELEMENT_NODE) {
                    parentElem = mutation.target.parentNode;
                }
                const selector = getElementSelector(parentElem);

                if (!selector) {
                    console.warn('text_changed: 適切なselectorが特定できません', {
                        type: 'text_changed',
                        oldValue: mutation.oldValue,
                        newValue: mutation.target.textContent,
                        parentElement: getElementDetails(parentElem),
                        timestamp: new Date().toISOString()
                    });
                }
                // VSCode拡張機能に送信
                const changeData = {
                    type: 'text_changed',
                    oldValue: mutation.oldValue,
                    newValue: mutation.target.textContent,
                    parentElement: getElementDetails(parentElem),
                    selector: selector,
                    timestamp: new Date().toISOString()
                };

                sendChangeToVSCode(changeData);
                break;
        }
    }
};

// オブザーバーを作成
const observer = new MutationObserver(callback);

// 監視を開始（oldValueも取得するように設定を更新）
const enhancedConfig = {
    ...config,
    attributeOldValue: true,
    characterDataOldValue: true
};

observer.observe(targetNode, enhancedConfig);

// WebSocket接続を初期化
initWebSocketConnection();

console.log("MutationObserverによる監視を開始しました。");
console.log("VSCode拡張機能との接続を試行中...");

// 初期化時にストレージをクリア（オプション）
chrome.storage.local.set({ logs: [], wsStatus: 'disconnected' });

// popup.jsからの再接続メッセージを受信
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'reconnect') {
        console.log('再接続要求を受信');
        reconnectAttempts = 0; // 再接続回数をリセット
        initWebSocketConnection();
        sendResponse({ success: true });
    }
});