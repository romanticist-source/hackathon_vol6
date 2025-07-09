// WebSocket接続状態を管理
let wsStatus = 'disconnected';

// ログを表示する関数
function displayLogs() {
    chrome.storage.local.get({ logs: [] }, (result) => {
        const logList = document.getElementById("log-list");
        logList.innerHTML = ''; // 既存のログをクリア

        if (result.logs.length === 0) {
            const noLogsDiv = document.createElement("div");
            noLogsDiv.className = "no-logs";
            noLogsDiv.textContent = "まだ変更はありません";
            logList.appendChild(noLogsDiv);
            return;
        }

        // 最新のログから表示（逆順）
        result.logs.reverse().forEach(log => {
            const logItem = document.createElement("div");
            logItem.className = "log-item";
            logItem.textContent = log;

            // ログのタイプに応じてスタイルを設定
            if (log.includes('要素追加')) {
                logItem.classList.add('addition');
            } else if (log.includes('要素削除')) {
                logItem.classList.add('removal');
            } else if (log.includes('属性変更')) {
                logItem.classList.add('attribute');
            } else if (log.includes('テキスト変更')) {
                logItem.classList.add('text');
            }

            logList.appendChild(logItem);
        });
    });
}

// 接続状態を更新
function updateConnectionStatus(connected) {
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    const reconnectButton = document.getElementById('reconnect-button');

    if (connected) {
        statusIndicator.className = 'status-indicator connected';
        statusText.textContent = 'VS Codeに接続済み';
        reconnectButton.disabled = true;
        reconnectButton.textContent = '接続済み';
    } else {
        statusIndicator.className = 'status-indicator disconnected';
        statusText.textContent = 'VS Codeに接続していません';
        reconnectButton.disabled = false;
        reconnectButton.textContent = '再接続';
    }
}

// クリアボタンの機能
function clearLogs() {
    chrome.storage.local.set({ logs: [] }, () => {
        displayLogs();
    });
}

// 再接続ボタンの機能
function reconnect() {
    // content scriptに再接続メッセージを送信
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'reconnect' }, function (response) {
            if (chrome.runtime.lastError) {
                console.log('Content script not ready:', chrome.runtime.lastError.message);
            }
        });
    });
}

// 接続状態をチェック
function checkConnectionStatus() {
    chrome.storage.local.get({ wsStatus: 'disconnected' }, (result) => {
        updateConnectionStatus(result.wsStatus === 'connected');
    });
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    displayLogs();
    checkConnectionStatus();

    // イベントリスナーを追加
    document.getElementById('clear-button').addEventListener('click', clearLogs);
    document.getElementById('reconnect-button').addEventListener('click', reconnect);
});

// 定期的にログと接続状態を更新
setInterval(() => {
    displayLogs();
    checkConnectionStatus();
}, 1000);