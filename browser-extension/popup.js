// ポップアップのJavaScript
document.addEventListener('DOMContentLoaded', () => {
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const reconnectButton = document.getElementById('reconnectButton');

    // 現在のタブを取得
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];

        if (currentTab && (currentTab.url.includes('localhost') || currentTab.url.includes('127.0.0.1'))) {
            // localhostのページの場合、接続状態を確認
            checkConnectionStatus();
        } else {
            // localhost以外のページの場合
            statusIndicator.className = 'status-indicator disconnected';
            statusText.textContent = 'localhostページでのみ動作します';
            reconnectButton.disabled = true;
        }
    });

    // 再接続ボタンのクリックイベント
    reconnectButton.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            if (currentTab) {
                // コンテンツスクリプトを再実行
                chrome.scripting.executeScript({
                    target: { tabId: currentTab.id },
                    files: ['content.js']
                }).then(() => {
                    statusText.textContent = '再接続中...';
                    setTimeout(checkConnectionStatus, 2000);
                }).catch(err => {
                    console.error('再接続エラー:', err);
                    statusText.textContent = '再接続に失敗しました';
                });
            }
        });
    });

    function checkConnectionStatus() {
        // WebSocket接続状態を確認
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            if (currentTab) {
                chrome.scripting.executeScript({
                    target: { tabId: currentTab.id },
                    func: () => {
                        return window.devToolsObserver && window.devToolsObserver.isConnected;
                    }
                }).then((results) => {
                    const isConnected = results[0]?.result;

                    if (isConnected) {
                        statusIndicator.className = 'status-indicator connected';
                        statusText.textContent = 'VS Codeに接続中';
                        reconnectButton.textContent = '再接続';
                    } else {
                        statusIndicator.className = 'status-indicator disconnected';
                        statusText.textContent = 'VS Codeに接続していません';
                        reconnectButton.textContent = '接続';
                    }
                }).catch(err => {
                    console.error('接続状態確認エラー:', err);
                    statusIndicator.className = 'status-indicator disconnected';
                    statusText.textContent = '接続状態を確認できません';
                });
            }
        });
    }
}); 