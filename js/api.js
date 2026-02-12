// ========================================
// RESTful API通信
// ========================================

const API = {
    /**
     * 全レコード取得
     */
    async getAll(tableName, page = 1, limit = 100) {
        try {
            const response = await fetch(`tables/${tableName}?page=${page}&limit=${limit}`);
            if (!response.ok) throw new Error('データの取得に失敗しました');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    /**
     * 単一レコード取得
     */
    async getById(tableName, recordId) {
        try {
            const response = await fetch(`tables/${tableName}/${recordId}`);
            if (!response.ok) throw new Error('データの取得に失敗しました');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    /**
     * レコード作成
     */
    async create(tableName, data) {
        try {
            const response = await fetch(`tables/${tableName}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('データの作成に失敗しました');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    /**
     * レコード更新（完全更新）
     */
    async update(tableName, recordId, data) {
        try {
            const response = await fetch(`tables/${tableName}/${recordId}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('データの更新に失敗しました');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    /**
     * レコード更新（部分更新）
     */
    async patch(tableName, recordId, data) {
        try {
            const response = await fetch(`tables/${tableName}/${recordId}`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('データの更新に失敗しました');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    /**
     * レコード削除
     */
    async delete(tableName, recordId) {
        try {
            const response = await fetch(`tables/${tableName}/${recordId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('データの削除に失敗しました');
            return true;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    /**
     * 検索機能付き取得
     */
    async search(tableName, searchQuery, page = 1, limit = 100) {
        try {
            const response = await fetch(`tables/${tableName}?search=${encodeURIComponent(searchQuery)}&page=${page}&limit=${limit}`);
            if (!response.ok) throw new Error('検索に失敗しました');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
};

// ========================================
// データ操作用のヘルパー関数
// ========================================

/**
 * ユーザーを作成または取得
 */
async function getOrCreateUser(name, email, role) {
    try {
        const users = await API.getAll('users');
        const existingUser = users.data.find(u => u.email === email);
        
        if (existingUser) {
            return existingUser;
        }
        
        return await API.create('users', {
            name: name,
            email: email,
            role: role,
            created_at: new Date().toISOString()
        });
    } catch (error) {
        console.error('User creation error:', error);
        throw error;
    }
}

/**
 * 問題を取得（カテゴリフィルタ付き）
 */
async function getQuestions(category = null) {
    try {
        const result = await API.getAll('questions');
        let questions = result.data;
        
        if (category && category !== 'all') {
            questions = questions.filter(q => q.category === category);
        }
        
        return questions;
    } catch (error) {
        console.error('Questions fetch error:', error);
        throw error;
    }
}

/**
 * 特定ユーザーの回答を取得
 */
async function getUserAnswers(userId) {
    try {
        const result = await API.getAll('answers');
        return result.data.filter(a => a.user_id === userId);
    } catch (error) {
        console.error('Answers fetch error:', error);
        throw error;
    }
}

/**
 * 回答に対するフィードバックを取得
 */
async function getFeedbackByAnswerId(answerId) {
    try {
        const result = await API.getAll('feedbacks');
        return result.data.find(f => f.answer_id === answerId);
    } catch (error) {
        console.error('Feedback fetch error:', error);
        return null;
    }
}

/**
 * 学習者一覧を取得
 */
async function getLearners() {
    try {
        const result = await API.getAll('users');
        return result.data.filter(u => u.role === 'learner');
    } catch (error) {
        console.error('Learners fetch error:', error);
        throw error;
    }
}
