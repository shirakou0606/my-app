// ========================================
// デバッグ用ヘルパー関数
// ========================================

/**
 * システムの状態をチェック
 */
function checkSystemStatus() {
    console.log('=== System Status Check ===');
    console.log('question-generator.js loaded:', typeof previewGeneratedQuestions === 'function');
    console.log('scoring.js loaded:', typeof scoreEssayAnswer === 'function');
    console.log('autoGenerateForm exists:', !!document.getElementById('autoGenerateForm'));
    console.log('autoCategory exists:', !!document.getElementById('autoCategory'));
    console.log('autoMidTopic exists:', !!document.getElementById('autoMidTopic'));
    console.log('sourceText exists:', !!document.getElementById('sourceText'));
    console.log('previewArea exists:', !!document.getElementById('previewArea'));
    
    // フォームの詳細チェック
    const form = document.getElementById('autoGenerateForm');
    if (form) {
        console.log('Form details:');
        console.log('  - Form id:', form.id);
        console.log('  - Form tag:', form.tagName);
        const submitBtn = form.querySelector('button[type="submit"]');
        console.log('  - Submit button:', submitBtn);
        if (submitBtn) {
            console.log('  - Submit button text:', submitBtn.textContent);
        }
    }
    
    console.log('===========================');
}

// ページ読み込み時にチェック
window.addEventListener('load', () => {
    console.log('Page loaded, running system check...');
    setTimeout(checkSystemStatus, 1000);
});

// グローバルに公開
window.checkSystemStatus = checkSystemStatus;
