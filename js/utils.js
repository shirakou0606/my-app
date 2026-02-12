// ========================================
// ユーティリティ関数
// ========================================

/**
 * UUIDを生成
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * 日時をフォーマット
 */
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * ローディング表示
 */
function showLoading() {
    document.getElementById('loading').classList.add('active');
}

function hideLoading() {
    document.getElementById('loading').classList.remove('active');
}

/**
 * 画面切り替え
 */
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

/**
 * ビュー切り替え
 */
function showView(viewId) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(viewId).classList.add('active');
}

/**
 * アラート表示
 */
function showAlert(message, type = 'info') {
    alert(message);
}

/**
 * 確認ダイアログ
 */
function showConfirm(message) {
    return confirm(message);
}

/**
 * LocalStorageへの保存
 */
function saveToStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

/**
 * LocalStorageから取得
 */
function getFromStorage(key) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
}

/**
 * LocalStorageから削除
 */
function removeFromStorage(key) {
    localStorage.removeItem(key);
}

/**
 * エスケープHTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * HTMLをサニタイズ（エスケープ）
 * セキュリティのため、ユーザー入力をHTMLとして表示する前に使用
 */
function sanitizeHTML(text) {
    if (!text) return '';
    return escapeHtml(String(text));
}

/**
 * テキストを改行保持でHTMLに変換
 */
function textToHtml(text) {
    return escapeHtml(text).replace(/\n/g, '<br>');
}
