// ========================================
// 学習者画面のロジック（3階層対応版）
// ========================================

let currentLearner = null;
let selectedCategory = null;
let selectedMidTopic = null;
let currentTestSet = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let testAnswers = [];

/**
 * 学習者画面を初期化
 */
function initLearnerScreen(user) {
    console.log('=== initLearnerScreen called ===');
    console.log('User:', user);
    
    currentLearner = user;
    const userNameElement = document.getElementById('learnerUserName');
    if (userNameElement) {
        userNameElement.textContent = user.name;
    }
    
    // 1. カテゴリー選択画面に戻る
    showView('categorySelectView');
    loadCategories();
    
    // カテゴリーカードのクリックイベント（イベントデリゲーション使用）
    const categoryList = document.getElementById('categoryList');
    if (categoryList) {
        // 既存のリスナーをクリア（クローン方式）
        const newCategoryList = categoryList.cloneNode(true);
        categoryList.parentNode.replaceChild(newCategoryList, categoryList);
        
        // 新しいイベントリスナーを設定（イベントデリゲーション）
        newCategoryList.addEventListener('click', function(e) {
            const card = e.target.closest('.category-card');
            if (card) {
                const category = card.dataset.category;
                console.log('Category clicked:', category);
                selectCategory(category);
            }
        });
        console.log('Category list listener added');
    }
    
    // 戻るボタン
    const backToCategoryBtn = document.getElementById('backToCategoryBtn');
    if (backToCategoryBtn) {
        backToCategoryBtn.onclick = function() {
            console.log('Back to category');
            showView('categorySelectView');
            loadCategories();
        };
    }
    
    const backToMidTopicBtn = document.getElementById('backToMidTopicBtn');
    if (backToMidTopicBtn) {
        backToMidTopicBtn.onclick = function() {
            console.log('Back to mid topic');
            showView('midTopicSelectView');
            loadMidTopics(selectedCategory);
        };
    }
    
    const backToTopicsBtn = document.getElementById('backToTopicsBtn');
    if (backToTopicsBtn) {
        backToTopicsBtn.onclick = function() {
            console.log('Back to topics');
            showView('topicSelectView');
            loadSmallTopics(selectedCategory, selectedMidTopic);
        };
    }
    
    const backToTopicsFromResultBtn = document.getElementById('backToTopicsFromResultBtn');
    if (backToTopicsFromResultBtn) {
        backToTopicsFromResultBtn.onclick = function() {
            console.log('Back to topics from result');
            showView('topicSelectView');
            loadSmallTopics(selectedCategory, selectedMidTopic);
        };
    }
    
    // 次の問題へボタン
    const nextBtn = document.getElementById('nextQuestionBtn');
    if (nextBtn) {
        nextBtn.onclick = async function() {
            console.log('Next question clicked');
            await saveCurrentAnswerAndProceed();
        };
    }
    
    // ログアウトボタン（イベント重複を避けるため、既存のリスナーをクリア）
    const logoutBtn = document.getElementById('learnerLogoutBtn');
    console.log('Logout button:', logoutBtn);
    if (logoutBtn) {
        // 既存のonclickをクリア
        logoutBtn.onclick = null;
        // 新しいイベントリスナーを設定
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('=== Learner logout button clicked ===');
            if (typeof logout === 'function') {
                logout();
            } else {
                console.error('logout function not found!');
            }
        }, { once: false });
        console.log('Logout button listener added');
    } else {
        console.error('Logout button not found!');
    }
    
    console.log('=== initLearnerScreen completed ===');
}

/**
 * カテゴリー一覧を読み込み
 */
async function loadCategories() {
    try {
        showLoading();
        
        // 問題セットを取得
        const setsResult = await API.getAll('question_sets');
        const questionSets = setsResult.data;
        
        // カテゴリーごとの中トピック数をカウント
        const salesTopics = new Set(questionSets.filter(s => s.category === '営業').map(s => s.mid_topic)).size;
        const communicationTopics = new Set(questionSets.filter(s => s.category === 'コミュニケーション').map(s => s.mid_topic)).size;
        
        document.getElementById('sales-topics-count').textContent = `${salesTopics}トピック`;
        document.getElementById('communication-topics-count').textContent = `${communicationTopics}トピック`;
        
        hideLoading();
    } catch (error) {
        console.error('Load categories error:', error);
        hideLoading();
    }
}

/**
 * カテゴリーを選択
 */
function selectCategory(category) {
    selectedCategory = category;
    document.getElementById('selectedCategoryName').textContent = category;
    showView('midTopicSelectView');
    loadMidTopics(category);
}

/**
 * 中トピック一覧を読み込み
 */
async function loadMidTopics(category) {
    try {
        showLoading();
        
        // 問題セットを取得
        const setsResult = await API.getAll('question_sets');
        let questionSets = setsResult.data.filter(s => s.category === category);
        
        // 中トピックでグループ化
        const midTopicsMap = {};
        questionSets.forEach(set => {
            const midTopic = set.mid_topic || '未分類';
            if (!midTopicsMap[midTopic]) {
                midTopicsMap[midTopic] = [];
            }
            midTopicsMap[midTopic].push(set);
        });
        
        const container = document.getElementById('midTopicsList');
        
        if (Object.keys(midTopicsMap).length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>まだ学習トピックが登録されていません</p>
                </div>
            `;
            hideLoading();
            return;
        }
        
        // 中トピックカードを表示
        container.innerHTML = Object.entries(midTopicsMap).map(([midTopic, sets]) => {
            return `
                <div class="mid-topic-card" data-mid-topic="${sanitizeHTML(midTopic)}">
                    <div class="mid-topic-header">
                        <div class="mid-topic-title">
                            <i class="fas fa-book"></i> ${sanitizeHTML(midTopic)}
                        </div>
                        <div class="mid-topic-badge">${sets.length}セット</div>
                    </div>
                    <div class="mid-topic-stats">
                        <span><i class="fas fa-list"></i> ${sets.length}個の小トピック</span>
                        <span><i class="fas fa-question-circle"></i> ${sets.length * 5}問</span>
                    </div>
                </div>
            `;
        }).join('');
        
        // クリックイベントを追加
        container.querySelectorAll('.mid-topic-card').forEach(card => {
            card.addEventListener('click', () => {
                const midTopic = card.dataset.midTopic;
                selectMidTopic(midTopic);
            });
        });
        
        hideLoading();
    } catch (error) {
        console.error('Load mid topics error:', error);
        hideLoading();
    }
}

/**
 * 中トピックを選択
 */
function selectMidTopic(midTopic) {
    selectedMidTopic = midTopic;
    document.getElementById('selectedMidTopicName').textContent = midTopic;
    showView('topicSelectView');
    loadSmallTopics(selectedCategory, midTopic);
}

/**
 * 小トピック一覧を読み込み
 */
async function loadSmallTopics(category, midTopic) {
    try {
        showLoading();
        
        // 問題セットを取得
        const setsResult = await API.getAll('question_sets');
        let questionSets = setsResult.data.filter(s => 
            s.category === category && (s.mid_topic || '未分類') === midTopic
        );
        
        // ユーザーの回答履歴を取得
        const answersResult = await API.getAll('answers');
        const userAnswers = answersResult.data.filter(a => a.user_id === currentLearner.id);
        
        // 問題を取得してセットIDでグループ化
        const questionsResult = await API.getAll('questions');
        const allQuestions = questionsResult.data;
        
        const container = document.getElementById('topicsList');
        
        if (questionSets.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>まだ学習トピックが登録されていません</p>
                </div>
            `;
            hideLoading();
            return;
        }
        
        // 各セットの完了状況を確認
        const topicsWithStatus = questionSets.map(set => {
            const setQuestions = allQuestions.filter(q => 
                q.explanation && q.explanation.includes(`【問題セットID】${set.id}`)
            );
            
            const answeredQuestions = setQuestions.filter(q =>
                userAnswers.some(a => a.question_id === q.id)
            );
            
            const isCompleted = setQuestions.length > 0 && answeredQuestions.length === setQuestions.length;
            const progress = setQuestions.length > 0 ? Math.round(answeredQuestions.length / setQuestions.length * 100) : 0;
            
            return { ...set, isCompleted, progress, questionCount: setQuestions.length };
        });
        
        // トピックカードを表示
        container.innerHTML = topicsWithStatus.map(topic => {
            const completedIcon = topic.isCompleted ? '<i class="fas fa-check-circle" style="color: var(--success-color);"></i>' : '';
            const statusText = topic.isCompleted ? '完了' : `進捗 ${topic.progress}%`;
            
            return `
                <div class="topic-card ${topic.isCompleted ? 'completed' : ''}" data-set-id="${topic.id}">
                    <div class="topic-header">
                        <h3 class="topic-title">
                            ${completedIcon}
                            ${sanitizeHTML(topic.title)}
                        </h3>
                        <span class="topic-category-badge">${sanitizeHTML(topic.category)}</span>
                    </div>
                    <div class="topic-meta">
                        <span><i class="fas fa-question-circle"></i> ${topic.questionCount}問・100点満点</span>
                        <span><i class="fas fa-clock"></i> 約15分</span>
                    </div>
                    <div class="topic-progress">
                        <div class="progress-text">${statusText}</div>
                        <div class="progress-bar-mini">
                            <div class="progress-fill" style="width: ${topic.progress}%"></div>
                        </div>
                    </div>
                    <button class="btn ${topic.isCompleted ? 'btn-secondary' : 'btn-primary'}" 
                            onclick="startTest('${topic.id}')">
                        ${topic.isCompleted ? '<i class="fas fa-redo"></i> 再挑戦' : '<i class="fas fa-play"></i> テストを開始'}
                    </button>
                </div>
            `;
        }).join('');
        
        hideLoading();
    } catch (error) {
        console.error('Load small topics error:', error);
        showAlert('トピックの読み込みに失敗しました', 'error');
        hideLoading();
    }
}

/**
 * テストを開始
 */
async function startTest(setId) {
    try {
        showLoading();
        
        // 問題セットを取得
        const questionSet = await API.getById('question_sets', setId);
        currentTestSet = questionSet;
        
        // 問題を取得
        const questionsResult = await API.getAll('questions');
        const allQuestions = questionsResult.data;
        
        // セットIDでフィルター
        currentQuestions = allQuestions.filter(q => 
            q.explanation && q.explanation.includes(`【問題セットID】${setId}`)
        ).sort((a, b) => {
            // 問題番号でソート
            const getNumber = (q) => {
                const match = q.explanation.match(/【問題番号】(\d+)/);
                return match ? parseInt(match[1]) : 0;
            };
            return getNumber(a) - getNumber(b);
        });
        
        if (currentQuestions.length === 0) {
            showAlert('このセットには問題がありません', 'warning');
            hideLoading();
            return;
        }
        
        // テスト開始確認画面を表示
        showTestStartConfirmation();
        
        hideLoading();
    } catch (error) {
        console.error('Start test error:', error);
        showAlert('テストの開始に失敗しました', 'error');
        hideLoading();
    }
}

/**
 * テスト開始確認画面を表示
 */
function showTestStartConfirmation() {
    const content = document.getElementById('testStartContent');
    content.innerHTML = `
        <div class="test-start-info">
            <div class="info-row">
                <div class="info-label"><i class="fas fa-folder"></i> 大カテゴリー</div>
                <div class="info-value">${sanitizeHTML(currentTestSet.category)}</div>
            </div>
            <div class="info-row">
                <div class="info-label"><i class="fas fa-book"></i> 中トピック</div>
                <div class="info-value">${sanitizeHTML(currentTestSet.mid_topic || '未分類')}</div>
            </div>
            <div class="info-row">
                <div class="info-label"><i class="fas fa-book-open"></i> 小トピック</div>
                <div class="info-value">${sanitizeHTML(currentTestSet.title)}</div>
            </div>
            <div class="info-row">
                <div class="info-label"><i class="fas fa-question-circle"></i> 問題数</div>
                <div class="info-value">${currentQuestions.length}問</div>
            </div>
            <div class="info-row">
                <div class="info-label"><i class="fas fa-star"></i> 満点</div>
                <div class="info-value">100点</div>
            </div>
            <div class="info-row">
                <div class="info-label"><i class="fas fa-clock"></i> 所要時間</div>
                <div class="info-value">約15分</div>
            </div>
        </div>

        <div class="test-flow">
            <h4><i class="fas fa-route"></i> テストの流れ</h4>
            <ol>
                <li>5つの問題に連続で回答します（選択式3問 + 記述式2問）</li>
                <li>各問題の配点は表示されます（15点/25点/30点）</li>
                <li>すべての問題に回答後、自動で採点されます</li>
                <li>100点満点で評価とフィードバックを受け取ります</li>
            </ol>
        </div>

        <button id="startTestBtn" class="btn btn-primary btn-lg btn-block">
            <i class="fas fa-play-circle"></i> テストを開始する
        </button>
    `;
    
    showView('testStartView');
    
    // テスト開始ボタン
    document.getElementById('startTestBtn').addEventListener('click', () => {
        beginTest();
    });
}

/**
 * テストを開始（実際の問題表示）
 */
function beginTest() {
    currentQuestionIndex = 0;
    testAnswers = [];
    showView('testView');
    displayCurrentQuestion();
}

/**
 * 現在の問題を表示
 */
function displayCurrentQuestion() {
    const question = currentQuestions[currentQuestionIndex];
    const questionNumber = currentQuestionIndex + 1;
    const totalQuestions = currentQuestions.length;
    
    // 進行状況バーを更新
    const progressPercent = Math.round((questionNumber / totalQuestions) * 100);
    document.getElementById('progressText').textContent = `問 ${questionNumber}/${totalQuestions}`;
    document.getElementById('progressPercentage').textContent = `${progressPercent}%`;
    document.getElementById('progressBar').style.width = `${progressPercent}%`;
    
    // 配点を取得
    const maxScoreMatch = question.explanation.match(/【配点】(\d+)点/);
    const maxScore = maxScoreMatch ? maxScoreMatch[1] : '?';
    
    // 問題情報を表示
    document.getElementById('currentQuestionTitle').textContent = `問${questionNumber}`;
    document.getElementById('currentQuestionScore').textContent = `${maxScore}点`;
    document.getElementById('currentQuestionText').textContent = question.question_text;
    
    // 回答セクションを表示
    const choiceSection = document.getElementById('choiceAnswerSection');
    const essaySection = document.getElementById('essayAnswerSection');
    
    if (question.type === 'choice') {
        // 選択式
        choiceSection.style.display = 'block';
        essaySection.style.display = 'none';
        
        let choices = [];
        try {
            choices = typeof question.choices === 'string' ? JSON.parse(question.choices) : question.choices;
        } catch (e) {
            console.error('Failed to parse choices:', e);
            choices = [];
        }
        
        const container = document.getElementById('choicesAnswerContainer');
        container.innerHTML = choices.map((choice, index) => `
            <div class="choice-option">
                <input type="radio" 
                       name="answer" 
                       id="choice${index}" 
                       value="${index + 1}">
                <label for="choice${index}">${sanitizeHTML(choice)}</label>
            </div>
        `).join('');
    } else {
        // 記述式
        choiceSection.style.display = 'none';
        essaySection.style.display = 'block';
        document.getElementById('essayAnswer').value = '';
    }
    
    // ボタンのテキストを変更
    const nextBtn = document.getElementById('nextQuestionBtn');
    if (questionNumber === totalQuestions) {
        nextBtn.innerHTML = '<i class="fas fa-check"></i> 回答を完了する';
    } else {
        nextBtn.innerHTML = '<i class="fas fa-arrow-right"></i> 次の問題へ';
    }
}

/**
 * 現在の回答を保存して次へ
 */
async function saveCurrentAnswerAndProceed() {
    const question = currentQuestions[currentQuestionIndex];
    let answer = '';
    
    if (question.type === 'choice') {
        const selected = document.querySelector('input[name="answer"]:checked');
        if (!selected) {
            showAlert('選択肢を選んでください', 'warning');
            return;
        }
        answer = selected.value;
    } else {
        answer = document.getElementById('essayAnswer').value.trim();
        if (!answer) {
            showAlert('回答を入力してください', 'warning');
            return;
        }
    }
    
    // 回答を保存
    testAnswers.push({
        questionId: question.id,
        answer: answer,
        question: question
    });
    
    // 次の問題へ、または完了
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        displayCurrentQuestion();
    } else {
        // テスト完了
        await completeTest();
    }
}

/**
 * テスト完了処理
 */
async function completeTest() {
    try {
        console.log('=== Complete Test START ===');
        console.log('Test answers:', testAnswers);
        console.log('Current learner:', currentLearner);
        console.log('Current test set:', currentTestSet);
        
        if (!testAnswers || testAnswers.length === 0) {
            throw new Error('回答データが存在しません');
        }
        
        if (!currentLearner || !currentLearner.id) {
            throw new Error('学習者情報が不正です');
        }
        
        showLoading();
        
        // すべての回答をデータベースに保存
        console.log('Saving answers to database...');
        for (const answer of testAnswers) {
            console.log('Saving answer:', answer);
            try {
                await API.create('answers', {
                    user_id: currentLearner.id,
                    question_id: answer.questionId,
                    answer_text: answer.answer,
                    submitted_at: new Date().toISOString()
                });
                console.log('Answer saved successfully');
            } catch (saveError) {
                console.error('Error saving answer:', saveError);
                throw new Error(`回答の保存に失敗しました: ${saveError.message}`);
            }
        }
        console.log('All answers saved');
        
        // 採点とフィードバック生成
        const results = [];
        let totalScore = 0;
        
        console.log('Starting scoring and feedback generation...');
        for (let i = 0; i < testAnswers.length; i++) {
            const answer = testAnswers[i];
            const question = answer.question;
            
            console.log(`Processing question ${i + 1}/${testAnswers.length}:`, question.id);
            console.log('Question object:', question);
            
            if (!question.explanation) {
                console.warn('Question explanation is missing');
            }
            
            // 配点を取得
            const maxScoreMatch = question.explanation ? question.explanation.match(/【配点】(\d+)点/) : null;
            const maxScore = maxScoreMatch ? parseInt(maxScoreMatch[1]) : 15; // デフォルト15点
            console.log('Max score:', maxScore);
            
            if (!maxScoreMatch) {
                console.warn('Could not extract max score from explanation, using default: 15');
            }
            
            // 元テキストを取得
            const sourceTextMatch = question.explanation ? question.explanation.match(/【元テキスト】\n([\s\S]+?)\n\n/) : null;
            const sourceText = sourceTextMatch ? sourceTextMatch[1] : '';
            console.log('Source text length:', sourceText.length);
            
            if (!sourceTextMatch) {
                console.warn('Could not extract source text from explanation');
            }
            
            let score, feedback;
            
            if (question.type === 'choice') {
                console.log('Scoring choice question...');
                // 選択式の採点
                const isCorrect = answer.answer.toString() === question.correct_answer.toString();
                score = isCorrect ? maxScore : 0;
                console.log('Choice score:', score);
                
                console.log('Generating feedback for choice question...');
                try {
                    feedback = await generateFeedback(
                        question,
                        answer.answer,
                        score,
                        maxScore,
                        sourceText
                    );
                    console.log('Feedback generated successfully');
                } catch (feedbackError) {
                    console.error('Feedback generation error:', feedbackError);
                    throw new Error(`フィードバック生成エラー（選択式）: ${feedbackError.message}`);
                }
            } else {
                console.log('Scoring essay question...');
                // 記述式の採点
                try {
                    const scoringResult = scoreEssayAnswer(
                        answer.answer,
                        sourceText,
                        maxScore
                    );
                    console.log('Essay scoring result:', scoringResult);
                    
                    score = scoringResult.totalScore;
                    
                    console.log('Generating feedback for essay question...');
                    feedback = await generateFeedback(
                        question,
                        answer.answer,
                        score,
                        maxScore,
                        sourceText,
                        scoringResult.breakdown
                    );
                    console.log('Feedback generated successfully');
                } catch (essayError) {
                    console.error('Essay scoring/feedback error:', essayError);
                    throw new Error(`記述式採点エラー: ${essayError.message}`);
                }
            }
            
            totalScore += score;
            console.log('Current total score:', totalScore);
            
            results.push({
                question: question,
                answer: answer.answer,
                score: score,
                maxScore: maxScore,
                feedback: feedback
            });
        }
        
        console.log('Final total score:', totalScore);
        console.log('Results:', results);
        
        // 結果画面を表示
        console.log('Displaying test results...');
        try {
            displayTestResults(results, totalScore);
            console.log('Test results displayed successfully');
        } catch (displayError) {
            console.error('Error displaying results:', displayError);
            throw new Error(`結果表示エラー: ${displayError.message}`);
        }
        
        console.log('=== Complete Test END ===');
        hideLoading();
    } catch (error) {
        console.error('=== Complete test error ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Error name:', error.name);
        console.error('Current learner:', currentLearner);
        console.error('Test answers count:', testAnswers ? testAnswers.length : 0);
        console.error('Current test set:', currentTestSet);
        
        hideLoading();
        
        // 詳細なエラーメッセージを表示
        let errorDetail = `テストの完了処理に失敗しました。\n\nエラー: ${error.message}\n\n`;
        
        if (error.message.includes('sanitizeHTML')) {
            errorDetail += '【原因】sanitizeHTML関数が見つかりません。\n【対処】ページを再読み込みしてください。';
        } else if (error.message.includes('回答データ')) {
            errorDetail += '【原因】回答データが正しく保存されていません。\n【対処】もう一度テストを受けてください。';
        } else if (error.message.includes('学習者情報')) {
            errorDetail += '【原因】ログイン情報が失われています。\n【対処】再度ログインしてください。';
        } else if (error.message.includes('フィードバック生成')) {
            errorDetail += '【原因】AIフィードバックの生成に失敗しました。\n【対処】ブラウザのコンソールでエラーを確認してください。';
        } else if (error.message.includes('記述式採点')) {
            errorDetail += '【原因】記述式問題の採点処理でエラーが発生しました。\n【対処】ブラウザのコンソールでエラーを確認してください。';
        } else {
            errorDetail += '【対処】ブラウザのF12キーを押して、Consoleタブでエラーの詳細を確認してください。';
        }
        
        showAlert(errorDetail, 'error');
    }
}

/**
 * テスト結果を表示
 */
function displayTestResults(results, totalScore) {
    console.log('=== Display Test Results START ===');
    console.log('Results count:', results.length);
    console.log('Total score:', totalScore);
    
    // sanitizeHTML関数の存在確認
    if (typeof sanitizeHTML !== 'function') {
        console.error('sanitizeHTML function is not defined!');
        throw new Error('sanitizeHTML関数が定義されていません');
    }
    
    // 評価を判定
    let grade, gradeColor;
    if (totalScore >= 90) {
        grade = 'S';
        gradeColor = '#10b981';
    } else if (totalScore >= 80) {
        grade = 'A';
        gradeColor = '#3b82f6';
    } else if (totalScore >= 70) {
        grade = 'B';
        gradeColor = '#8b5cf6';
    } else if (totalScore >= 60) {
        grade = 'C';
        gradeColor = '#f59e0b';
    } else if (totalScore >= 50) {
        grade = 'D';
        gradeColor = '#f97316';
    } else {
        grade = 'E';
        gradeColor = '#ef4444';
    }
    
    console.log('Grade:', grade, 'Color:', gradeColor);
    
    const content = document.getElementById('resultContent');
    
    if (!content) {
        console.error('resultContent element not found!');
        showAlert('結果表示エリアが見つかりません', 'error');
        return;
    }
    
    console.log('Building results HTML...');
    
    content.innerHTML = `
        <div class="result-header">
            <div class="result-score-display">
                <div class="result-label">総合得点</div>
                <div class="result-score">${totalScore}<span class="result-max">/100</span></div>
                <div class="result-grade" style="color: ${gradeColor};">${grade}評価</div>
            </div>
        </div>

        <div class="result-details">
            <h3><i class="fas fa-list-check"></i> 各問題の結果</h3>
            ${results.map((result, index) => {
                const questionNumber = index + 1;
                const achievement = Math.round((result.score / result.maxScore) * 100);
                
                return `
                    <div class="result-item">
                        <div class="result-item-header">
                            <h4>問${questionNumber}</h4>
                            <div class="result-item-score">
                                ${result.score}/${result.maxScore}点 (${achievement}%)
                            </div>
                        </div>
                        <div class="result-item-question">
                            ${sanitizeHTML(result.question.question_text)}
                        </div>
                        <div class="result-item-answer">
                            <strong>あなたの回答:</strong> ${sanitizeHTML(result.answer)}
                        </div>
                        <div class="feedback-section">
                            ${result.feedback}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    console.log('Results HTML built successfully');
    console.log('Showing resultView...');
    
    showView('resultView');
    
    console.log('=== Display Test Results END ===');
}

// グローバル関数として公開
window.startTest = startTest;
