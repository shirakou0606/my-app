// ========================================
// 管理者画面のロジック
// ========================================

let currentAdmin = null;
let generatedQuestions = []; // 生成された問題を一時保存

/**
 * 管理者画面を初期化
 */
function initAdminScreen(user) {
    currentAdmin = user;
    document.getElementById('adminUserName').textContent = user.name;
    
    // タブ切り替え
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchAdminTab(tabName);
        });
    });
    
    // 問題フォームの初期化
    initQuestionForm();
    
    // 自動生成フォームの初期化
    initAutoGenerateForm();
    
    // 問題一覧の読み込み
    loadQuestionsList();
    
    // ログアウトボタン
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    console.log('Admin logout button:', adminLogoutBtn);
    if (adminLogoutBtn) {
        // 既存のリスナーをクリアして新しく設定
        const newLogoutBtn = adminLogoutBtn.cloneNode(true);
        adminLogoutBtn.parentNode.replaceChild(newLogoutBtn, adminLogoutBtn);
        newLogoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('=== Admin logout button clicked ===');
            if (typeof logout === 'function') {
                logout();
            } else {
                console.error('logout function not found!');
            }
        });
        console.log('Admin logout button listener added');
    } else {
        console.error('Admin logout button not found!');
    }
}

/**
 * タブ切り替え
 */
function switchAdminTab(tabName) {
    // タブボタンのアクティブ状態
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });
    
    // タブコンテンツの表示切り替え
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    if (tabName === 'questions') {
        document.getElementById('questionsTab').classList.add('active');
    } else if (tabName === 'dashboard') {
        document.getElementById('dashboardTab').classList.add('active');
        loadDashboard();
    }
}

/**
 * 自動問題生成フォームの初期化
 */
function initAutoGenerateForm() {
    console.log('=== initAutoGenerateForm called ===');
    
    const form = document.getElementById('autoGenerateForm');
    const saveBtn = document.getElementById('saveGeneratedBtn');
    const cancelBtn = document.getElementById('cancelPreviewBtn');
    
    console.log('Form element:', form);
    console.log('Save button:', saveBtn);
    console.log('Cancel button:', cancelBtn);
    
    if (!form) {
        console.error('autoGenerateForm not found');
        return;
    }
    
    console.log('Initializing auto generate form...');
    
    // submitボタンにもイベントを追加（デバッグ用）
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        console.log('Submit button found:', submitBtn);
        submitBtn.addEventListener('click', (e) => {
            console.log('=== Submit button clicked directly ===');
        });
    } else {
        console.warn('Submit button not found');
    }
    
    // 自動生成フォームの送信
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('=== Form submitted ===');
        console.log('Category:', document.getElementById('autoCategory')?.value);
        console.log('Mid Topic:', document.getElementById('autoMidTopic')?.value);
        console.log('Source Text length:', document.getElementById('sourceText')?.value?.length);
        await generateQuestionsPreview();
    });
    
    console.log('Form submit event listener added');
    
    // 生成された問題を保存
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            console.log('Save button clicked');
            await saveGeneratedQuestions();
        });
    }
    
    // プレビューをキャンセル
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            console.log('Cancel button clicked');
            document.getElementById('previewArea').style.display = 'none';
            generatedQuestions = [];
        });
    }
    
    console.log('=== initAutoGenerateForm completed ===');
}

/**
 * 問題生成のプレビュー
 */
async function generateQuestionsPreview() {
    console.log('=== generateQuestionsPreview START ===');
    
    try {
        showLoading();
        
        const categoryElement = document.getElementById('autoCategory');
        const midTopicElement = document.getElementById('autoMidTopic');
        const sourceTextElement = document.getElementById('sourceText');
        
        console.log('Elements found:', {
            categoryElement: !!categoryElement,
            midTopicElement: !!midTopicElement,
            sourceTextElement: !!sourceTextElement
        });
        
        const category = categoryElement ? categoryElement.value : '';
        const midTopic = midTopicElement ? midTopicElement.value.trim() : '';
        const sourceText = sourceTextElement ? sourceTextElement.value.trim() : '';
        
        console.log('Values:', {
            category: category,
            midTopic: midTopic,
            sourceTextLength: sourceText.length
        });
        
        if (!category) {
            alert('カテゴリを選択してください');
            hideLoading();
            return;
        }
        
        if (!midTopic) {
            alert('中トピック名を入力してください');
            hideLoading();
            return;
        }
        
        if (sourceText.length < 50) {
            alert('テキストが短すぎます。より詳しい内容を入力してください（推奨：200文字以上）');
            hideLoading();
            return;
        }
        
        console.log('Generating questions...');
        
        // 問題生成関数が存在するかチェック
        if (typeof previewGeneratedQuestions !== 'function') {
            console.error('previewGeneratedQuestions function not found');
            alert('問題生成機能の読み込みに失敗しました。ページを再読み込みしてください。');
            hideLoading();
            return;
        }
        
        // 問題を生成
        const questions = previewGeneratedQuestions(sourceText, category);
        console.log('Generated questions:', questions);
        
        if (!questions || questions.length === 0) {
            alert('問題の生成に失敗しました。テキストを確認してください。');
            hideLoading();
            return;
        }
        
        generatedQuestions = questions.map(q => ({
            ...q,
            category: category,
            midTopic: midTopic,
            sourceText: sourceText
        }));
        
        console.log('Stored questions:', generatedQuestions);
        
        // プレビューを表示
        displayQuestionsPreview(questions, midTopic);
        
        // プレビューエリアを表示
        const previewArea = document.getElementById('previewArea');
        if (previewArea) {
            previewArea.style.display = 'block';
            // プレビューエリアまでスクロール
            setTimeout(() => {
                previewArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
        
        hideLoading();
        
    } catch (error) {
        console.error('Generate questions error:', error);
        showAlert('問題の生成に失敗しました: ' + error.message, 'error');
        hideLoading();
    }
}

/**
 * プレビュー表示
 */
function displayQuestionsPreview(questions, midTopic) {
    console.log('Displaying preview for', questions.length, 'questions');
    
    const container = document.getElementById('previewContent');
    
    if (!container) {
        console.error('previewContent not found');
        return;
    }
    
    if (!questions || questions.length === 0) {
        container.innerHTML = '<p style="color: var(--danger-color);">問題の生成に失敗しました。</p>';
        return;
    }
    
    // 中トピック表示
    const topicHeader = midTopic ? `
        <div style="background: var(--primary-color); color: white; padding: 1rem 1.5rem; border-radius: 0.75rem; margin-bottom: 1.5rem;">
            <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.25rem;">中トピック</div>
            <div style="font-size: 1.25rem; font-weight: 600;">
                <i class="fas fa-book"></i> ${sanitizeHTML(midTopic)}
            </div>
        </div>
    ` : '';
    
    // 配点情報を表示
    const scoringInfo = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1.5rem; border-radius: 0.75rem; margin-bottom: 2rem;">
            <h3 style="margin: 0 0 1rem 0; font-size: 1.25rem;">
                <i class="fas fa-calculator"></i> 配点構成（合計100点満点）
            </h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div style="background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 0.5rem;">
                    <div style="font-size: 0.9rem; opacity: 0.9;">選択式（問1-3）</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">15点 × 3問 = 45点</div>
                </div>
                <div style="background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 0.5rem;">
                    <div style="font-size: 0.9rem; opacity: 0.9;">記述式（問4-5）</div>
                    <div style="font-size: 1.75rem; font-weight: 700;">25点 + 30点 = 55点</div>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = topicHeader + scoringInfo + questions.map(q => {
        // 問題番号から配点を決定
        const questionNumber = q.number;
        let maxScore;
        if (questionNumber <= 3) {
            maxScore = 15; // 選択式
        } else if (questionNumber === 4) {
            maxScore = 25; // 記述式1問目
        } else {
            maxScore = 30; // 記述式2問目
        }
        
        let choicesHtml = '';
        if (q.type === '選択式') {
            try {
                const choices = typeof q.choices === 'string' ? JSON.parse(q.choices) : q.choices;
                choicesHtml = `
                    <div style="margin-top: 1rem;">
                        <strong>選択肢：</strong>
                        ${choices.map((choice, idx) => `
                            <div style="padding: 0.5rem; background: var(--bg-color); margin: 0.5rem 0; border-radius: 0.25rem;">
                                ${idx + 1}. ${escapeHtml(choice)}
                                ${parseInt(q.correct_answer) === idx + 1 ? '<span style="color: var(--success-color); margin-left: 0.5rem;"><i class="fas fa-check-circle"></i> 正解</span>' : ''}
                            </div>
                        `).join('')}
                    </div>
                `;
            } catch (e) {
                console.error('Error parsing choices:', e);
                choicesHtml = '<p style="color: var(--danger-color);">選択肢の表示に失敗しました</p>';
            }
        }
        
        return `
            <div class="preview-question-card" style="border: 2px solid var(--border-color); border-radius: 0.5rem; padding: 1.5rem; margin-bottom: 1.5rem; background: var(--card-bg);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <h4 style="margin: 0; color: var(--primary-color);">
                        <i class="fas ${q.typeIcon || 'fa-question'}"></i> 
                        問題${q.number}: ${escapeHtml(q.title)}
                    </h4>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <span class="badge badge-${q.type === '選択式' ? 'success' : 'primary'}">
                            ${q.type}
                        </span>
                        <span style="background: #fbbf24; color: #78350f; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 600;">
                            ${maxScore}点
                        </span>
                    </div>
                </div>
                
                <div style="background: var(--bg-color); padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
                    <strong>問題文：</strong><br>
                    ${escapeHtml(q.question_text)}
                </div>
                
                ${choicesHtml}
                
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                    <strong>解説・評価基準：</strong><br>
                    <div style="color: var(--text-secondary); white-space: pre-wrap; margin-top: 0.5rem;">
                        ${escapeHtml(q.explanation.substring(0, 200))}${q.explanation.length > 200 ? '...' : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    console.log('Preview displayed successfully');
}

/**
 * 生成された問題を保存
 */
async function saveGeneratedQuestions() {
    if (!generatedQuestions || generatedQuestions.length === 0) {
        showAlert('保存する問題がありません', 'warning');
        return;
    }
    
    try {
        showLoading();
        
        const sourceText = generatedQuestions[0].sourceText;
        const category = generatedQuestions[0].category;
        const midTopic = generatedQuestions[0].midTopic;
        
        // 1. 問題セットを作成
        const setTitle = `${new Date().toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`;
        const questionSet = await API.create('question_sets', {
            title: setTitle,
            category: category,
            mid_topic: midTopic,
            source_text: sourceText,
            created_by: currentAdmin.id,
            created_at: new Date().toISOString()
        });
        
        console.log('Question set created:', questionSet);
        
        // 2. 5問すべてを保存（set_idを含める）
        for (let i = 0; i < generatedQuestions.length; i++) {
            const q = generatedQuestions[i];
            
            // 問題番号を判定（1-3が選択式、4-5が記述式）
            const questionNumber = i + 1;
            const maxScore = questionNumber <= 3 ? 15 : (questionNumber === 4 ? 25 : 30);
            
            const questionData = {
                title: `[セット${questionSet.id.substring(0, 8)}] 問${questionNumber}/${maxScore}点: ${q.title}`,
                category: q.category,
                type: q.type === '選択式' ? 'choice' : 'essay',
                question_text: q.question_text,
                choices: q.choices,
                correct_answer: q.correct_answer,
                explanation: `【問題セットID】${questionSet.id}\n【問題番号】${questionNumber}/5\n【配点】${maxScore}点\n【中トピック】${midTopic}\n【元テキスト】\n${q.sourceText}\n\n${q.explanation}`,
                created_by: currentAdmin.id,
                created_at: new Date().toISOString()
            };
            
            await API.create('questions', questionData);
        }
        
        showAlert(`問題セットを保存しました！\n【カテゴリ】${category}\n【中トピック】${midTopic}\n【配点】選択式15点×3問＝45点、記述式25点+30点＝55点（合計100点満点）`, 'success');
        
        // フォームとプレビューをリセット
        document.getElementById('autoGenerateForm').reset();
        document.getElementById('previewArea').style.display = 'none';
        generatedQuestions = [];
        
        // 問題一覧を更新
        loadQuestionsList();
        
    } catch (error) {
        console.error('Save generated questions error:', error);
        showAlert('問題の保存に失敗しました: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 問題フォームの初期化
 */
function initQuestionForm() {
    const form = document.getElementById('questionForm');
    const typeSelect = document.getElementById('questionType');
    const choicesSection = document.getElementById('choicesSection');
    const correctAnswerSection = document.getElementById('correctAnswerSection');
    const addChoiceBtn = document.getElementById('addChoiceBtn');
    const resetBtn = document.getElementById('resetFormBtn');
    
    // 問題形式変更時
    typeSelect.addEventListener('change', () => {
        const type = typeSelect.value;
        if (type === 'choice') {
            choicesSection.style.display = 'block';
            correctAnswerSection.style.display = 'block';
            if (document.getElementById('choicesContainer').children.length === 0) {
                addChoice();
                addChoice();
            }
        } else if (type === 'essay') {
            choicesSection.style.display = 'none';
            correctAnswerSection.style.display = 'block';
        } else {
            choicesSection.style.display = 'none';
            correctAnswerSection.style.display = 'none';
        }
    });
    
    // 選択肢追加
    addChoiceBtn.addEventListener('click', () => {
        addChoice();
    });
    
    // フォーム送信
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveQuestion();
    });
    
    // リセット
    resetBtn.addEventListener('click', () => {
        form.reset();
        document.getElementById('choicesContainer').innerHTML = '';
        choicesSection.style.display = 'none';
        correctAnswerSection.style.display = 'none';
    });
}

/**
 * 選択肢を追加
 */
function addChoice() {
    const container = document.getElementById('choicesContainer');
    const index = container.children.length + 1;
    
    const choiceDiv = document.createElement('div');
    choiceDiv.className = 'choice-item';
    choiceDiv.innerHTML = `
        <input type="text" placeholder="選択肢 ${index}" class="choice-input" required>
        <button type="button" class="btn btn-danger btn-sm remove-choice">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    choiceDiv.querySelector('.remove-choice').addEventListener('click', () => {
        choiceDiv.remove();
        updateChoiceNumbers();
    });
    
    container.appendChild(choiceDiv);
}

/**
 * 選択肢番号を更新
 */
function updateChoiceNumbers() {
    const choices = document.querySelectorAll('.choice-input');
    choices.forEach((input, index) => {
        input.placeholder = `選択肢 ${index + 1}`;
    });
}

/**
 * 問題を保存
 */
async function saveQuestion() {
    try {
        showLoading();
        
        const title = document.getElementById('questionTitle').value;
        const category = document.getElementById('questionCategory').value;
        const type = document.getElementById('questionType').value;
        const questionText = document.getElementById('questionText').value;
        const correctAnswer = document.getElementById('correctAnswer').value;
        const explanation = document.getElementById('explanation').value;
        
        let choices = [];
        if (type === 'choice') {
            const choiceInputs = document.querySelectorAll('.choice-input');
            choices = Array.from(choiceInputs).map(input => input.value);
            
            if (choices.length < 2) {
                alert('選択肢は2つ以上入力してください');
                hideLoading();
                return;
            }
        }
        
        const questionData = {
            title: title,
            category: category,
            type: type,
            question_text: questionText,
            choices: JSON.stringify(choices),
            correct_answer: correctAnswer,
            explanation: explanation,
            created_by: currentAdmin.id,
            created_at: new Date().toISOString()
        };
        
        await API.create('questions', questionData);
        
        showAlert('問題を保存しました', 'success');
        document.getElementById('questionForm').reset();
        document.getElementById('choicesContainer').innerHTML = '';
        document.getElementById('choicesSection').style.display = 'none';
        document.getElementById('correctAnswerSection').style.display = 'none';
        
        loadQuestionsList();
        
    } catch (error) {
        console.error('Save question error:', error);
        showAlert('問題の保存に失敗しました', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 問題一覧を読み込み
 */
async function loadQuestionsList() {
    try {
        const questions = await getQuestions();
        const container = document.getElementById('questionsList');
        
        if (questions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>まだ問題が登録されていません</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = questions.map(q => `
            <div class="question-item">
                <div class="question-item-header">
                    <div>
                        <div class="question-item-title">${escapeHtml(q.title)}</div>
                        <div class="question-item-meta">
                            <span class="badge badge-primary">${escapeHtml(q.category)}</span>
                            <span class="badge badge-success">${q.type === 'choice' ? '選択式' : '記述式'}</span>
                        </div>
                    </div>
                    <div class="question-item-actions">
                        <button class="btn btn-danger btn-sm" onclick="deleteQuestion('${q.id}')">
                            <i class="fas fa-trash"></i> 削除
                        </button>
                    </div>
                </div>
                <div class="question-item-text">
                    ${escapeHtml(q.question_text.substring(0, 100))}${q.question_text.length > 100 ? '...' : ''}
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Load questions error:', error);
    }
}

/**
 * 問題を削除
 */
async function deleteQuestion(questionId) {
    if (!showConfirm('この問題を削除してもよろしいですか?')) {
        return;
    }
    
    try {
        showLoading();
        await API.delete('questions', questionId);
        showAlert('問題を削除しました', 'success');
        loadQuestionsList();
    } catch (error) {
        console.error('Delete question error:', error);
        showAlert('問題の削除に失敗しました', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * ダッシュボードを読み込み
 */
async function loadDashboard() {
    try {
        showLoading();
        
        const learners = await getLearners();
        const allAnswers = await API.getAll('answers');
        const container = document.getElementById('learnersList');
        
        if (learners.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>まだ学習者が登録されていません</p>
                </div>
            `;
            return;
        }
        
        const learnersWithStats = await Promise.all(learners.map(async learner => {
            const userAnswers = allAnswers.data.filter(a => a.user_id === learner.id);
            const feedbacksData = await API.getAll('feedbacks');
            const feedbackCount = userAnswers.filter(a => 
                feedbacksData.data.some(f => f.answer_id === a.id)
            ).length;
            
            return {
                ...learner,
                answerCount: userAnswers.length,
                feedbackCount: feedbackCount
            };
        }));
        
        container.innerHTML = learnersWithStats.map(learner => `
            <div class="learner-card">
                <div class="learner-card-header">
                    <div class="learner-name">
                        <i class="fas fa-user"></i> ${escapeHtml(learner.name)}
                    </div>
                    <div style="color: var(--text-secondary); font-size: 0.875rem;">
                        ${escapeHtml(learner.email)}
                    </div>
                </div>
                <div class="learner-stats">
                    <div class="stat-item">
                        <div class="stat-value">${learner.answerCount}</div>
                        <div class="stat-label">回答数</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${learner.feedbackCount}</div>
                        <div class="stat-label">フィードバック数</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${learner.answerCount > 0 ? Math.round(learner.feedbackCount / learner.answerCount * 100) : 0}%</div>
                        <div class="stat-label">完了率</div>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Load dashboard error:', error);
    } finally {
        hideLoading();
    }
}
