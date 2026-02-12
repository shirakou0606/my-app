// ========================================
// メインアプリケーション（セキュリティ強化版）
// ========================================

let currentUser = null;

/**
 * アプリケーション初期化
 */
document.addEventListener('DOMContentLoaded', () => {
    // セキュリティヘッダーの設定
    setSecurityHeaders();
    
    // セッションチェック
    const savedUser = getFromStorage('currentUser');
    const sessionToken = getFromStorage('sessionToken');
    
    if (savedUser && sessionToken) {
        const session = getFromStorage('session_' + savedUser.id);
        
        // セッションの有効性をチェック
        if (session && isSessionValid(session)) {
            currentUser = savedUser;
            if (savedUser.role === 'admin') {
                showScreen('adminScreen');
                initAdminScreen(savedUser);
            } else {
                showScreen('learnerScreen');
                initLearnerScreen(savedUser);
            }
        } else {
            // セッション期限切れ
            secureLogout();
            showScreen('loginScreen');
            initLogin();
            showAlert('セッションの有効期限が切れました。再度ログインしてください。', 'warning');
        }
    } else {
        showScreen('loginScreen');
        initLogin();
    }
});

/**
 * ログイン画面の初期化
 */
function initLogin() {
    console.log('initLogin called');
    const loginBtn = document.getElementById('loginBtn');
    const nameInput = document.getElementById('userName');
    const emailInput = document.getElementById('userEmail');
    
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const adminNameInput = document.getElementById('adminName');
    const adminEmailInput = document.getElementById('adminEmail');
    const adminPasswordInput = document.getElementById('adminPassword');
    
    const adminLoginLink = document.getElementById('adminLoginLink');
    const learnerLoginLink = document.getElementById('learnerLoginLink');
    
    console.log('adminLoginLink:', adminLoginLink);
    console.log('learnerLoginLink:', learnerLoginLink);
    
    // グローバル関数として公開
    window.switchToAdminLogin = function() {
        console.log('=== switchToAdminLogin called ===');
        showScreen('adminLoginScreen');
    };
    
    window.switchToLearnerLogin = function() {
        console.log('=== switchToLearnerLogin called ===');
        showScreen('loginScreen');
    };
    
    // 学習者ログイン画面と管理者ログイン画面の切り替え
    if (adminLoginLink) {
        console.log('Adding click handler to adminLoginLink');
        
        // 既存のイベントリスナーをクリア
        const newAdminLoginLink = adminLoginLink.cloneNode(true);
        adminLoginLink.parentNode.replaceChild(newAdminLoginLink, adminLoginLink);
        
        // 新しい要素にイベントリスナーを追加
        const refreshedAdminLoginLink = document.getElementById('adminLoginLink');
        
        refreshedAdminLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('=== Admin login link clicked ===');
            showScreen('adminLoginScreen');
        }, { capture: false, passive: false });
        
        // グローバル関数としても公開
        refreshedAdminLoginLink.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('=== Admin login link clicked (onclick) ===');
            showScreen('adminLoginScreen');
            return false;
        };
        
        // スタイルを確認（クリック可能かどうか）
        refreshedAdminLoginLink.style.cursor = 'pointer';
        refreshedAdminLoginLink.style.pointerEvents = 'auto';
        refreshedAdminLoginLink.style.display = 'inline-block';
        refreshedAdminLoginLink.style.padding = '10px';
        
        console.log('Admin login link setup complete');
    } else {
        console.error('adminLoginLink not found!');
    }
    
    if (learnerLoginLink) {
        console.log('Adding click handler to learnerLoginLink');
        
        // 既存のイベントリスナーをクリア
        const newLearnerLoginLink = learnerLoginLink.cloneNode(true);
        learnerLoginLink.parentNode.replaceChild(newLearnerLoginLink, learnerLoginLink);
        
        // 新しい要素にイベントリスナーを追加
        const refreshedLearnerLoginLink = document.getElementById('learnerLoginLink');
        
        refreshedLearnerLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('=== Learner login link clicked ===');
            showScreen('loginScreen');
        }, { capture: false, passive: false });
        
        // グローバル関数としても公開
        refreshedLearnerLoginLink.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('=== Learner login link clicked (onclick) ===');
            showScreen('loginScreen');
            return false;
        };
        
        // スタイルを確認（クリック可能かどうか）
        refreshedLearnerLoginLink.style.cursor = 'pointer';
        refreshedLearnerLoginLink.style.pointerEvents = 'auto';
        refreshedLearnerLoginLink.style.display = 'inline-block';
        refreshedLearnerLoginLink.style.padding = '10px';
        
        console.log('Learner login link setup complete');
    } else {
        console.error('learnerLoginLink not found!');
    }
    
    // 学習者ログイン
    if (nameInput && emailInput && loginBtn) {
        [nameInput, emailInput].forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    loginBtn.click();
                }
            });
        });
        
        loginBtn.addEventListener('click', async () => {
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        
        if (!name) {
            showAlert('お名前を入力してください', 'warning');
            nameInput.focus();
            return;
        }
        
        if (!email) {
            showAlert('メールアドレスを入力してください', 'warning');
            emailInput.focus();
            return;
        }
        
        if (!validateEmail(email)) {
            showAlert('正しいメールアドレスを入力してください', 'warning');
            emailInput.focus();
            return;
        }
        
        // XSS対策：入力をサニタイズ
        const sanitizedName = sanitizeInput(name);
        const sanitizedEmail = sanitizeInput(email);
        
        await loginAsLearner(sanitizedName, sanitizedEmail);
        });
    }
    
    // 管理者ログイン
    if (adminNameInput && adminEmailInput && adminPasswordInput && adminLoginBtn) {
        [adminNameInput, adminEmailInput, adminPasswordInput].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                adminLoginBtn.click();
            }
        });
    });
    
    adminLoginBtn.addEventListener('click', async () => {
        const name = adminNameInput.value.trim();
        const email = adminEmailInput.value.trim();
        const password = adminPasswordInput.value;
        
        if (!name) {
            showAlert('お名前を入力してください', 'warning');
            adminNameInput.focus();
            return;
        }
        
        if (!email) {
            showAlert('メールアドレスを入力してください', 'warning');
            adminEmailInput.focus();
            return;
        }
        
        if (!validateEmail(email)) {
            showAlert('正しいメールアドレスを入力してください', 'warning');
            adminEmailInput.focus();
            return;
        }
        
        if (!password) {
            showAlert('パスワードを入力してください', 'warning');
            adminPasswordInput.focus();
            return;
        }
        
        // レート制限チェック
        if (loginRateLimiter.isLimited(email)) {
            const remaining = loginRateLimiter.getRemainingAttempts(email);
            showAlert('ログイン試行回数が上限に達しました。15分後に再度お試しください。', 'error');
            return;
        }
        
        // XSS対策：入力をサニタイズ
        const sanitizedName = sanitizeInput(name);
        const sanitizedEmail = sanitizeInput(email);
        
        await loginAsAdmin(sanitizedName, sanitizedEmail, password);
        });
    }
}

/**
 * 学習者としてログイン
 */
async function loginAsLearner(name, email) {
    try {
        showLoading();
        
        // ユーザーを作成または取得
        const user = await getOrCreateUser(name, email, 'learner');
        currentUser = user;
        
        // セッションを作成
        const session = createSession(user, 24); // 24時間有効
        
        // セッション情報を保存
        saveToStorage('currentUser', user);
        saveToStorage('sessionToken', session.token);
        saveToStorage('session_' + user.id, session);
        
        // 学習者画面に遷移
        showScreen('learnerScreen');
        initLearnerScreen(user);
        
    } catch (error) {
        console.error('Login error:', error);
        showAlert('ログインに失敗しました。もう一度お試しください。', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 管理者としてログイン
 */
async function loginAsAdmin(name, email, password) {
    try {
        showLoading();
        
        // レート制限の試行を記録
        loginRateLimiter.recordAttempt(email);
        
        // 初回登録かチェック
        if (!isAdminRegistered(email)) {
            // 初回登録：パスワードの強度チェック
            const validation = validatePasswordStrength(password);
            
            if (!validation.isValid) {
                hideLoading();
                showAlert('パスワードの強度が不足しています:\n\n' + validation.errors.join('\n'), 'error');
                return;
            }
            
            // パスワードを保存
            await saveAdminPassword(email, password);
            
            showAlert('管理者として登録されました。', 'success');
        } else {
            // 既存管理者：パスワード検証
            const isValid = await verifyAdminPassword(email, password);
            
            if (!isValid) {
                const remaining = loginRateLimiter.getRemainingAttempts(email);
                hideLoading();
                showAlert(
                    `パスワードが正しくありません。\n残り試行回数: ${remaining}回`,
                    'error'
                );
                return;
            }
            
            // ログイン成功：試行履歴をリセット
            loginRateLimiter.reset(email);
        }
        
        // 最終ログイン時刻を更新
        updateAdminLastLogin(email);
        
        // ユーザーを作成または取得
        const user = await getOrCreateUser(name, email, 'admin');
        currentUser = user;
        
        // セッションを作成
        const session = createSession(user, 8); // 8時間有効（管理者は短めに）
        
        // セッション情報を保存
        saveToStorage('currentUser', user);
        saveToStorage('sessionToken', session.token);
        saveToStorage('session_' + user.id, session);
        
        // 管理者画面に遷移
        showScreen('adminScreen');
        initAdminScreen(user);
        
        // パスワードフィールドをクリア
        document.getElementById('adminPassword').value = '';
        
    } catch (error) {
        console.error('Admin login error:', error);
        showAlert('ログインに失敗しました。もう一度お試しください。', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * ログアウト処理
 */
function logout() {
    console.log('=== logout function called ===');
    if (!showConfirm('ログアウトしてもよろしいですか?')) {
        console.log('User cancelled logout');
        return;
    }
    console.log('User confirmed logout');
    
    // セキュアなログアウト
    secureLogout();
    
    // ログイン画面に戻る
    if (currentUser && currentUser.role === 'admin') {
        showScreen('adminLoginScreen');
        // 管理者フォームをリセット
        document.getElementById('adminName').value = '';
        document.getElementById('adminEmail').value = '';
        document.getElementById('adminPassword').value = '';
    } else {
        showScreen('loginScreen');
        // 学習者フォームをリセット
        document.getElementById('userName').value = '';
        document.getElementById('userEmail').value = '';
    }
    
    currentUser = null;
}

// グローバルに公開（HTML側から呼び出すため）
// Note: これらの関数は現在使用されていないため、コメントアウト
// window.selectQuestion = selectQuestion;
// window.deleteQuestion = deleteQuestion;
// window.selectChoice = selectChoice;
