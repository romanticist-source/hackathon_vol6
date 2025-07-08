// バックグラウンドスクリプト
chrome.runtime.onInstalled.addListener(() => {
    console.log('Browser to VSCode Sync extension installed');
});

// タブが更新されたときにコンテンツスクリプトを再注入
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // localhostのページでのみ動作
        if (tab.url.includes('localhost') || tab.url.includes('127.0.0.1')) {
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['content.js']
            }).catch(err => {
                console.error('コンテンツスクリプトの注入に失敗:', err);
            });
        }
    }
});

// 拡張機能のアイコンがクリックされたときの処理
chrome.action.onClicked.addListener((tab) => {
    if (tab.url && (tab.url.includes('localhost') || tab.url.includes('127.0.0.1'))) {
        // ポップアップを表示
        chrome.action.setPopup({
            tabId: tab.id,
            popup: 'popup.html'
        });
    }
}); 