// 開発者ツールの変更を監視するコンテンツスクリプト
class DevToolsObserver {
    constructor() {
        this.websocket = null;
        this.isConnected = false;
        this.port = 3001; // VS Code拡張機能のデフォルトポート
        this.init();
    }

    init() {
        this.connectWebSocket();
        this.injectObserverScript();
    }

    connectWebSocket() {
        try {
            this.websocket = new WebSocket(`ws://localhost:${this.port}`);

            this.websocket.onopen = () => {
                console.log('Browser to VSCode Sync: WebSocket接続が確立されました');
                this.isConnected = true;
                this.sendMessage({
                    type: 'connection',
                    data: {
                        url: window.location.href,
                        timestamp: Date.now()
                    }
                });
            };

            this.websocket.onclose = () => {
                console.log('Browser to VSCode Sync: WebSocket接続が切断されました');
                this.isConnected = false;
                // 再接続を試行
                setTimeout(() => this.connectWebSocket(), 5000);
            };

            this.websocket.onerror = (error) => {
                console.error('Browser to VSCode Sync: WebSocketエラー:', error);
                this.isConnected = false;
            };

        } catch (error) {
            console.error('Browser to VSCode Sync: WebSocket接続エラー:', error);
        }
    }

    sendMessage(message) {
        if (this.isConnected && this.websocket) {
            this.websocket.send(JSON.stringify(message));
        }
    }

    injectObserverScript() {
        // 開発者ツールの変更を監視するスクリプトを注入
        const script = document.createElement('script');
        script.textContent = `
            (function() {
                // 開発者ツールの変更を監視する関数
                function observeDevToolsChanges() {
                    // 属性変更の監視
                    const originalSetAttribute = Element.prototype.setAttribute;
                    Element.prototype.setAttribute = function(name, value) {
                        const result = originalSetAttribute.call(this, name, value);
                        
                        // 開発者ツールからの変更かどうかを判定
                        if (window.devtools && window.devtools.isActive) {
                            const selector = generateSelector(this);
                            window.postMessage({
                                type: 'attribute_change',
                                data: {
                                    selector: selector,
                                    attribute: name,
                                    value: value,
                                    url: window.location.href
                                }
                            }, '*');
                        }
                        
                        return result;
                    };

                    // style属性の変更を監視
                    const originalStyleSetter = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'style').set;
                    Object.defineProperty(HTMLElement.prototype, 'style', {
                        set: function(value) {
                            const result = originalStyleSetter.call(this, value);
                            
                            if (window.devtools && window.devtools.isActive) {
                                const selector = generateSelector(this);
                                window.postMessage({
                                    type: 'style_change',
                                    data: {
                                        selector: selector,
                                        style: value,
                                        url: window.location.href
                                    }
                                }, '*');
                            }
                            
                            return result;
                        },
                        get: function() {
                            return originalStyleSetter.get.call(this);
                        }
                    });

                    // CSSプロパティの変更を監視
                    const originalCSSStyleDeclaration = CSSStyleDeclaration.prototype.setProperty;
                    CSSStyleDeclaration.prototype.setProperty = function(property, value, priority) {
                        const result = originalCSSStyleDeclaration.call(this, property, value, priority);
                        
                        if (window.devtools && window.devtools.isActive) {
                            const element = this.ownerNode || this.ownerElement;
                            if (element) {
                                const selector = generateSelector(element);
                                window.postMessage({
                                    type: 'style_property_change',
                                    data: {
                                        selector: selector,
                                        property: property,
                                        value: value,
                                        url: window.location.href
                                    }
                                }, '*');
                            }
                        }
                        
                        return result;
                    };
                }

                // セレクタを生成する関数
                function generateSelector(element) {
                    if (element.id) {
                        return '#' + element.id;
                    }
                    
                    if (element.className) {
                        const classes = element.className.split(' ').filter(c => c.trim());
                        if (classes.length > 0) {
                            return '.' + classes[0];
                        }
                    }
                    
                    // タグ名と位置でセレクタを生成
                    const tagName = element.tagName.toLowerCase();
                    const siblings = Array.from(element.parentNode.children).filter(child => child.tagName === element.tagName);
                    const index = siblings.indexOf(element);
                    
                    if (siblings.length === 1) {
                        return tagName;
                    } else {
                        return tagName + ':nth-child(' + (index + 1) + ')';
                    }
                }

                // 開発者ツールの状態を監視
                let devtools = {
                    isActive: false,
                    orientation: null
                };

                const threshold = 160;
                const emitEvent = (isOpen, orientation) => {
                    window.devtools = {
                        isActive: isOpen,
                        orientation: orientation
                    };
                };

                setInterval(() => {
                    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
                    const heightThreshold = window.outerHeight - window.innerHeight > threshold;
                    const orientation = widthThreshold ? 'vertical' : 'horizontal';

                    if (widthThreshold || heightThreshold) {
                        if (!devtools.isOpen || devtools.orientation !== orientation) {
                            emitEvent(true, orientation);
                        }
                    } else {
                        if (devtools.isOpen) {
                            emitEvent(false, null);
                        }
                    }
                }, 500);

                // 初期化
                observeDevToolsChanges();
            })();
        `;

        document.head.appendChild(script);
    }
}

// メッセージリスナーを設定
window.addEventListener('message', (event) => {
    if (event.source !== window) return;

    const { type, data } = event.data;

    switch (type) {
        case 'attribute_change':
            if (window.devToolsObserver) {
                window.devToolsObserver.sendMessage({
                    type: 'attribute_change',
                    data: data
                });
            }
            break;

        case 'style_change':
            if (window.devToolsObserver) {
                window.devToolsObserver.sendMessage({
                    type: 'style_change',
                    data: data
                });
            }
            break;

        case 'style_property_change':
            if (window.devToolsObserver) {
                window.devToolsObserver.sendMessage({
                    type: 'style_change',
                    data: {
                        url: data.url,
                        selector: data.selector,
                        property: data.property,
                        value: data.value
                    }
                });
            }
            break;
    }
});

// 開発者ツール監視を開始
window.devToolsObserver = new DevToolsObserver(); 