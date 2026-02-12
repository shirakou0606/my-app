// ========================================
// セキュリティ機能
// ========================================

/**
 * パスワードをハッシュ化（SHA-256）
 */
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

/**
 * データを暗号化（AES-GCM）
 */
async function encryptData(data, key) {
    try {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(JSON.stringify(data));
        
        // IVを生成
        const iv = crypto.getRandomValues(new Uint8Array(12));
        
        // 暗号化キーを生成
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            await crypto.subtle.digest('SHA-256', encoder.encode(key)),
            { name: 'AES-GCM' },
            false,
            ['encrypt']
        );
        
        // 暗号化
        const encryptedBuffer = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            cryptoKey,
            dataBuffer
        );
        
        // IVと暗号化データを結合
        const result = new Uint8Array(iv.length + encryptedBuffer.byteLength);
        result.set(iv, 0);
        result.set(new Uint8Array(encryptedBuffer), iv.length);
        
        // Base64エンコード
        return btoa(String.fromCharCode(...result));
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('データの暗号化に失敗しました');
    }
}

/**
 * データを復号化（AES-GCM）
 */
async function decryptData(encryptedData, key) {
    try {
        const encoder = new TextEncoder();
        
        // Base64デコード
        const encryptedBytes = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
        
        // IVと暗号化データを分離
        const iv = encryptedBytes.slice(0, 12);
        const data = encryptedBytes.slice(12);
        
        // 復号化キーを生成
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            await crypto.subtle.digest('SHA-256', encoder.encode(key)),
            { name: 'AES-GCM' },
            false,
            ['decrypt']
        );
        
        // 復号化
        const decryptedBuffer = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            cryptoKey,
            data
        );
        
        const decoder = new TextDecoder();
        return JSON.parse(decoder.decode(decryptedBuffer));
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('データの復号化に失敗しました');
    }
}

/**
 * メールアドレスのバリデーション
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * パスワードの強度チェック
 */
function validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const errors = [];
    
    if (password.length < minLength) {
        errors.push(`${minLength}文字以上である必要があります`);
    }
    if (!hasUpperCase) {
        errors.push('大文字を含む必要があります');
    }
    if (!hasLowerCase) {
        errors.push('小文字を含む必要があります');
    }
    if (!hasNumbers) {
        errors.push('数字を含む必要があります');
    }
    if (!hasSpecialChar) {
        errors.push('記号を含む必要があります');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * XSS対策：入力のサニタイズ
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * セキュアなランダム文字列を生成
 */
function generateSecureToken(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * セッショントークンを生成
 */
function generateSessionToken() {
    return generateSecureToken(32);
}

/**
 * セッションの有効期限をチェック
 */
function isSessionValid(session) {
    if (!session || !session.expiresAt) return false;
    return new Date().getTime() < session.expiresAt;
}

/**
 * セッションを作成
 */
function createSession(user, durationHours = 24) {
    const token = generateSessionToken();
    const expiresAt = new Date().getTime() + (durationHours * 60 * 60 * 1000);
    
    return {
        token: token,
        user: user,
        expiresAt: expiresAt,
        createdAt: new Date().getTime()
    };
}

/**
 * 管理者パスワードをローカルストレージに安全に保存
 */
async function saveAdminPassword(email, password) {
    const hashedPassword = await hashPassword(password);
    const admins = getFromStorage('admins') || {};
    admins[email] = {
        passwordHash: hashedPassword,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
    };
    saveToStorage('admins', admins);
}

/**
 * 管理者パスワードを検証
 */
async function verifyAdminPassword(email, password) {
    const admins = getFromStorage('admins') || {};
    const admin = admins[email];
    
    if (!admin) {
        return false;
    }
    
    const hashedPassword = await hashPassword(password);
    return admin.passwordHash === hashedPassword;
}

/**
 * 管理者が登録済みかチェック
 */
function isAdminRegistered(email) {
    const admins = getFromStorage('admins') || {};
    return !!admins[email];
}

/**
 * 最終ログイン時刻を更新
 */
function updateAdminLastLogin(email) {
    const admins = getFromStorage('admins') || {};
    if (admins[email]) {
        admins[email].lastLogin = new Date().toISOString();
        saveToStorage('admins', admins);
    }
}

/**
 * レート制限（ブルートフォース攻撃対策）
 */
class RateLimiter {
    constructor(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
        this.maxAttempts = maxAttempts;
        this.windowMs = windowMs;
        this.attempts = {};
    }
    
    /**
     * 試行を記録
     */
    recordAttempt(identifier) {
        const now = Date.now();
        
        if (!this.attempts[identifier]) {
            this.attempts[identifier] = [];
        }
        
        // 古い試行を削除
        this.attempts[identifier] = this.attempts[identifier].filter(
            timestamp => now - timestamp < this.windowMs
        );
        
        this.attempts[identifier].push(now);
    }
    
    /**
     * レート制限に達しているかチェック
     */
    isLimited(identifier) {
        const now = Date.now();
        
        if (!this.attempts[identifier]) {
            return false;
        }
        
        // 古い試行を削除
        this.attempts[identifier] = this.attempts[identifier].filter(
            timestamp => now - timestamp < this.windowMs
        );
        
        return this.attempts[identifier].length >= this.maxAttempts;
    }
    
    /**
     * 残り試行回数を取得
     */
    getRemainingAttempts(identifier) {
        if (!this.attempts[identifier]) {
            return this.maxAttempts;
        }
        
        const now = Date.now();
        const recentAttempts = this.attempts[identifier].filter(
            timestamp => now - timestamp < this.windowMs
        );
        
        return Math.max(0, this.maxAttempts - recentAttempts.length);
    }
    
    /**
     * 試行履歴をリセット
     */
    reset(identifier) {
        delete this.attempts[identifier];
    }
}

// グローバルなレート制限インスタンス
const loginRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 15分間に5回まで

/**
 * セキュリティヘッダーの設定（可能な範囲で）
 */
function setSecurityHeaders() {
    // Content Security Policyの設定（metaタグで設定済みの場合は不要）
    // この関数は将来的な拡張用として残す
}

/**
 * 入力フィールドのセキュリティ設定
 */
function setupSecureInput(inputElement) {
    // オートコンプリートの設定
    if (inputElement.type === 'password') {
        inputElement.setAttribute('autocomplete', 'current-password');
    }
    
    // Paste防止（パスワードの場合）
    if (inputElement.dataset.noPaste === 'true') {
        inputElement.addEventListener('paste', (e) => {
            e.preventDefault();
        });
    }
    
    // Copy防止（パスワードの場合）
    if (inputElement.dataset.noCopy === 'true') {
        inputElement.addEventListener('copy', (e) => {
            e.preventDefault();
        });
    }
}

/**
 * セキュアなログアウト
 */
function secureLogout() {
    // セッション情報をクリア
    removeFromStorage('currentUser');
    removeFromStorage('sessionToken');
    
    // メモリ上のデータをクリア
    if (window.currentUser) {
        window.currentUser = null;
    }
    if (window.currentAdmin) {
        window.currentAdmin = null;
    }
    if (window.currentLearner) {
        window.currentLearner = null;
    }
}

/**
 * CSRF トークンを生成
 */
function generateCSRFToken() {
    return generateSecureToken(32);
}

/**
 * データの整合性チェック
 */
function validateDataIntegrity(data, expectedFields) {
    if (!data || typeof data !== 'object') {
        return false;
    }
    
    for (const field of expectedFields) {
        if (!(field in data)) {
            return false;
        }
    }
    
    return true;
}
