// ========================================
// 100点満点の採点システム（セット単位）
// 選択式: 15点 × 3問 = 45点
// 記述式: 25点 + 30点 = 55点
// 合計: 100点
// ========================================

/**
 * 問題の配点を取得
 * @param {number} questionIndex - 問題番号（0-4）
 * @param {string} type - 問題タイプ（choice/essay）
 */
function getQuestionScore(questionIndex, type) {
    if (type === 'choice') {
        // 選択式は全て15点
        return 15;
    } else {
        // 記述式は1問目が25点、2問目が30点
        const essayIndex = questionIndex - 3; // 記述式は4問目(index=3)と5問目(index=4)
        return essayIndex === 0 ? 25 : 30;
    }
}

/**
 * セット全体の採点
 * @param {Array} answers - 回答の配列（5問分）
 * @param {string} sourceText - 元テキスト
 */
async function scoreQuestionSet(answers, sourceText) {
    let totalScore = 0;
    const breakdown = [];
    
    for (let i = 0; i < answers.length; i++) {
        const answer = answers[i];
        const maxScore = getQuestionScore(i, answer.question.type);
        
        let score = 0;
        if (answer.question.type === 'choice') {
            score = scoreChoiceAnswerForSet(answer.question, answer.answer_text, maxScore);
        } else {
            score = await scoreEssayAnswerForSet(answer.question, answer.answer_text, sourceText, maxScore);
        }
        
        totalScore += score;
        breakdown.push({
            questionNumber: i + 1,
            type: answer.question.type,
            score: score,
            maxScore: maxScore
        });
    }
    
    return {
        totalScore: totalScore,
        maxScore: 100,
        breakdown: breakdown,
        grade: getGrade(totalScore)
    };
}

/**
 * 選択式問題の採点（15点 or 0点）
 */
function scoreChoiceAnswerForSet(question, answer, maxScore) {
    const correctAnswer = parseInt(question.correct_answer);
    const userAnswer = parseInt(answer);
    
    return correctAnswer === userAnswer ? maxScore : 0;
}

/**
 * 記述式問題の採点（25点 or 30点満点）
 */
async function scoreEssayAnswerForSet(question, answer, sourceText, maxScore) {
    try {
        console.log('=== scoreEssayAnswerForSet START ===');
        console.log('Question:', question.id);
        console.log('Answer length:', answer.length);
        console.log('SourceText length:', sourceText.length);
        console.log('MaxScore:', maxScore);
        
        // 元テキストから評価基準を抽出
        const evaluationCriteria = question.correct_answer || '';
        console.log('Evaluation criteria:', evaluationCriteria);
        
        const criteriaKeywords = evaluationCriteria.split(/[、,]/).map(k => k.trim()).filter(k => k.length > 0);
        console.log('Criteria keywords:', criteriaKeywords);
        
        // 採点の観点（記述式用）
        let score = 0;
        
        // 各観点の配点を動的に計算
        const textAlignmentWeight = 0.50;      // 50%
        const keywordWeight = 0.20;            // 20%
        const specificityWeight = 0.15;        // 15%
        const structureWeight = 0.15;          // 15%
        
        // 1. テキストとの一致度
        const textAlignmentScore = evaluateTextAlignment(answer, sourceText, criteriaKeywords);
        console.log('Text alignment score:', textAlignmentScore);
        score += (textAlignmentScore / 50) * (maxScore * textAlignmentWeight);
        
        // 2. キーワードの使用
        const keywordScore = evaluateKeywordUsage(answer, criteriaKeywords);
        console.log('Keyword score:', keywordScore);
        score += (keywordScore / 20) * (maxScore * keywordWeight);
        
        // 3. 具体性
        const specificityScore = evaluateSpecificity(answer);
        console.log('Specificity score:', specificityScore);
        score += (specificityScore / 15) * (maxScore * specificityWeight);
        
        // 4. 論理性・構造
        const structureScore = evaluateStructure(answer);
        console.log('Structure score:', structureScore);
        score += (structureScore / 15) * (maxScore * structureWeight);
        
        const finalScore = Math.round(score);
        console.log('Final score:', finalScore, '/', maxScore);
        console.log('=== scoreEssayAnswerForSet END ===');
        
        return Math.min(finalScore, maxScore);
    } catch (error) {
        console.error('=== scoreEssayAnswerForSet ERROR ===');
        console.error('Error:', error);
        console.error('Stack:', error.stack);
        throw new Error(`記述式採点エラー (scoreEssayAnswerForSet): ${error.message}`);
    }
    
    return Math.round(score);
}

/**
 * テキストとの一致度を評価（0-50点）
 * 
 * 【評価の原則】
 * 1. キーワード使用の正確性（25点）
 * 2. テキスト内容の理解度（15点）
 * 3. 文脈の適切性（10点）
 */
function evaluateTextAlignment(answer, sourceText, keywords) {
    console.log('=== evaluateTextAlignment START ===');
    
    let score = 0;
    
    // 引数の型チェック
    if (!Array.isArray(keywords)) {
        console.warn('evaluateTextAlignment: keywords is not an array, converting...');
        keywords = [];
    }
    
    if (!sourceText || sourceText.length === 0) {
        console.warn('evaluateTextAlignment: sourceText is empty');
        return 0;
    }
    
    if (!answer || answer.trim().length === 0) {
        console.warn('evaluateTextAlignment: answer is empty');
        return 0;
    }
    
    // ===== 1. キーワード使用の正確性（0-25点）=====
    let keywordScore = 0;
    let usedKeywords = 0;
    let properlyUsedKeywords = 0;
    
    keywords.forEach(keyword => {
        if (answer.includes(keyword)) {
            usedKeywords++;
            
            // キーワードが適切な文脈で使われているかチェック
            const keywordIndex = answer.indexOf(keyword);
            const contextStart = Math.max(0, keywordIndex - 10);
            const contextEnd = Math.min(answer.length, keywordIndex + keyword.length + 10);
            const context = answer.substring(contextStart, contextEnd);
            
            // 助詞や接続詞と共に使われているか（文脈の適切性）
            if (/[はがをにでと、。]/.test(context)) {
                properlyUsedKeywords++;
            }
        }
    });
    
    // キーワード使用率（0-20点）
    const keywordUsageRate = keywords.length > 0 ? usedKeywords / keywords.length : 0;
    keywordScore += keywordUsageRate * 20;
    
    // 文脈適切性ボーナス（0-5点）
    const contextAppropriatenessRate = usedKeywords > 0 ? properlyUsedKeywords / usedKeywords : 0;
    keywordScore += contextAppropriatenessRate * 5;
    
    score += keywordScore;
    
    console.log(`Keyword score: ${keywordScore} (used: ${usedKeywords}/${keywords.length}, proper: ${properlyUsedKeywords})`);
    
    // ===== 2. テキスト内容の理解度（0-15点）=====
    const sourceSentences = sourceText.split(/[。！？\n]/).filter(s => s.trim().length > 15);
    let understandingScore = 0;
    let maxSimilarity = 0;
    
    // テキストの各文との類似度を計算
    sourceSentences.forEach(sentence => {
        const similarity = calculateSimilarity(answer, sentence);
        maxSimilarity = Math.max(maxSimilarity, similarity);
    });
    
    understandingScore = maxSimilarity * 15;
    score += understandingScore;
    
    console.log(`Understanding score: ${understandingScore} (max similarity: ${maxSimilarity.toFixed(2)})`);
    
    // ===== 3. 文脈の適切性（0-10点）=====
    let contextScore = 0;
    
    // テキストのキーワードの共起関係を回答が保っているか
    if (keywords.length >= 2) {
        let cooccurrenceCount = 0;
        for (let i = 0; i < keywords.length - 1; i++) {
            for (let j = i + 1; j < keywords.length; j++) {
                const kw1 = keywords[i];
                const kw2 = keywords[j];
                
                // 両方のキーワードがテキストと回答の両方に存在するか
                if (sourceText.includes(kw1) && sourceText.includes(kw2) &&
                    answer.includes(kw1) && answer.includes(kw2)) {
                    
                    // 距離の近さも評価
                    const answerIndex1 = answer.indexOf(kw1);
                    const answerIndex2 = answer.indexOf(kw2);
                    const distance = Math.abs(answerIndex1 - answerIndex2);
                    
                    // 近い距離で使われていればボーナス
                    if (distance < 50) {
                        cooccurrenceCount += 1.5;
                    } else if (distance < 100) {
                        cooccurrenceCount += 1;
                    } else {
                        cooccurrenceCount += 0.5;
                    }
                }
            }
        }
        
        const totalPairs = (keywords.length * (keywords.length - 1)) / 2;
        contextScore = Math.min((cooccurrenceCount / totalPairs) * 10, 10);
    } else if (keywords.length === 1) {
        // キーワードが1つの場合は、使用されていれば満点
        contextScore = answer.includes(keywords[0]) ? 10 : 0;
    }
    
    score += contextScore;
    
    console.log(`Context score: ${contextScore}`);
    console.log(`Total text alignment score: ${score}`);
    console.log('=== evaluateTextAlignment END ===');
    
    return Math.min(Math.round(score), 50);
}

/**
 * キーワード使用の評価（0-20点）
 */
function evaluateKeywordUsage(answer, keywords) {
    // 引数チェック
    if (!Array.isArray(keywords)) {
        console.warn('evaluateKeywordUsage: keywords is not an array');
        return 0;
    }
    
    if (!answer || answer.length === 0) {
        console.warn('evaluateKeywordUsage: answer is empty');
        return 0;
    }
    
    let score = 0;
    let usedKeywords = 0;
    
    keywords.forEach(keyword => {
        if (keyword && answer.includes(keyword)) {
            usedKeywords++;
        }
    });
    
    const usageRate = usedKeywords / Math.max(keywords.length, 1);
    score = usageRate * 20;
    
    return Math.min(score, 20);
}

/**
 * 具体性の評価（0-15点）
 * 
 * 【評価の原則】
 * 1. 具体例の有無（0-6点）
 * 2. 数値・固有名詞の使用（0-4点）
 * 3. 詳細な描写（0-3点）
 * 4. 実践的な内容（0-2点）
 */
function evaluateSpecificity(answer) {
    console.log('=== evaluateSpecificity START ===');
    
    if (!answer || answer.length === 0) {
        console.warn('evaluateSpecificity: answer is empty');
        return 0;
    }
    
    let score = 0;
    
    // ===== 1. 具体例の有無（0-6点）=====
    const examplePhrases = ['例えば', '具体的には', '実際に', 'たとえば', 'ケースとして', '〜の場合', '〜のとき'];
    let exampleCount = 0;
    examplePhrases.forEach(phrase => {
        if (answer.includes(phrase)) exampleCount++;
    });
    
    if (exampleCount >= 2) {
        score += 6; // 複数の具体例
    } else if (exampleCount === 1) {
        score += 4; // 1つの具体例
    }
    
    console.log(`Example phrases: ${exampleCount}, score: ${score}`);
    
    // ===== 2. 数値・固有名詞の使用（0-4点）=====
    // 数字の使用
    const numberMatches = answer.match(/\d+/g);
    const hasNumbers = numberMatches && numberMatches.length > 0;
    if (hasNumbers) {
        if (numberMatches.length >= 3) {
            score += 3; // 複数の数値
        } else {
            score += 2; // 数値あり
        }
    }
    
    // パーセンテージや単位
    const hasUnits = /[%％点円人日時間分秒件個回]/.test(answer);
    if (hasUnits) score += 1;
    
    console.log(`Numbers: ${hasNumbers}, units: ${hasUnits}, score addition: ${hasNumbers ? 2 : 0} + ${hasUnits ? 1 : 0}`);
    
    // ===== 3. 詳細な描写（0-3点）=====
    const answerLength = answer.trim().length;
    if (answerLength >= 200) {
        score += 3; // 詳細な記述
    } else if (answerLength >= 150) {
        score += 2;
    } else if (answerLength >= 100) {
        score += 1;
    }
    
    console.log(`Length: ${answerLength}, score addition: ${answerLength >= 200 ? 3 : answerLength >= 150 ? 2 : answerLength >= 100 ? 1 : 0}`);
    
    // ===== 4. 実践的な内容（0-2点）=====
    // ステップや手順の記述
    const stepPhrases = ['まず', '次に', '最後に', '1つ目', '2つ目', '3つ目', '第一に', '第二に', '第三に', 'ステップ'];
    let stepCount = 0;
    stepPhrases.forEach(phrase => {
        if (answer.includes(phrase)) stepCount++;
    });
    
    if (stepCount >= 2) {
        score += 2; // 明確な手順
    } else if (stepCount === 1) {
        score += 1;
    }
    
    console.log(`Step phrases: ${stepCount}, score addition: ${stepCount >= 2 ? 2 : stepCount === 1 ? 1 : 0}`);
    console.log(`Total specificity score: ${score}`);
    console.log('=== evaluateSpecificity END ===');
    
    return Math.min(score, 15);
}

/**
 * 論理性・構造の評価（0-15点）
 * 
 * 【評価の原則】
 * 1. 文章の長さの適切性（0-4点）
 * 2. 論理展開の明確さ（0-5点）
 * 3. 構造の整理（0-3点）
 * 4. 接続詞の使用（0-3点）
 */
function evaluateStructure(answer) {
    console.log('=== evaluateStructure START ===');
    
    if (!answer || answer.length === 0) {
        console.warn('evaluateStructure: answer is empty');
        return 0;
    }
    
    let score = 0;
    
    // ===== 1. 文章の長さの適切性（0-4点）=====
    const length = answer.trim().length;
    if (length >= 150 && length <= 400) {
        score += 4; // 理想的な長さ
    } else if (length >= 100 && length < 500) {
        score += 3; // 適切な長さ
    } else if (length >= 80 || length < 600) {
        score += 2; // まずまず
    } else if (length >= 50) {
        score += 1; // やや短い/長い
    }
    
    console.log(`Length: ${length}, score: ${score}`);
    
    // ===== 2. 論理展開の明確さ（0-5点）=====
    // 因果関係を示す言葉
    const causalWords = ['ため', 'ので', 'から', 'よって', 'したがって', 'だから', 'そのため', 'それゆえ'];
    let causalCount = 0;
    causalWords.forEach(word => {
        const regex = new RegExp(word, 'g');
        const matches = answer.match(regex);
        if (matches) causalCount += matches.length;
    });
    
    if (causalCount >= 3) {
        score += 5; // 明確な論理展開
    } else if (causalCount >= 2) {
        score += 4;
    } else if (causalCount >= 1) {
        score += 3;
    } else {
        score += 1; // 因果関係が不明瞭
    }
    
    console.log(`Causal words count: ${causalCount}, score addition: ${causalCount >= 3 ? 5 : causalCount >= 2 ? 4 : causalCount >= 1 ? 3 : 1}`);
    
    // ===== 3. 構造の整理（0-3点）=====
    // 段落分け・改行
    const paragraphs = answer.split('\n').filter(p => p.trim().length > 0);
    if (paragraphs.length >= 3) {
        score += 3; // 明確な段落構成
    } else if (paragraphs.length === 2) {
        score += 2;
    } else if (answer.includes('\n')) {
        score += 1;
    }
    
    console.log(`Paragraphs: ${paragraphs.length}, score addition: ${paragraphs.length >= 3 ? 3 : paragraphs.length === 2 ? 2 : answer.includes('\\n') ? 1 : 0}`);
    
    // ===== 4. 接続詞の使用（0-3点）=====
    const connectors = ['しかし', 'そして', 'また', 'さらに', 'そのため', 'したがって', 'つまり', 'ただし', 'なぜなら', 'すなわち', 'このように', 'これにより'];
    let connectorCount = 0;
    connectors.forEach(connector => {
        if (answer.includes(connector)) connectorCount++;
    });
    
    if (connectorCount >= 3) {
        score += 3; // 豊富な接続詞
    } else if (connectorCount >= 2) {
        score += 2;
    } else if (connectorCount >= 1) {
        score += 1;
    }
    
    console.log(`Connectors: ${connectorCount}, score addition: ${connectorCount >= 3 ? 3 : connectorCount >= 2 ? 2 : connectorCount >= 1 ? 1 : 0}`);
    console.log(`Total structure score: ${score}`);
    console.log('=== evaluateStructure END ===');
    
    return Math.min(score, 15);
}

/**
 * 簡易的な文の類似度計算
 */
function calculateSimilarity(text1, text2) {
    if (!text1 || !text2) {
        return 0;
    }
    
    const words1 = text1.split('');
    const words2 = text2.split('');
    
    let matches = 0;
    const minLength = Math.min(words1.length, words2.length);
    
    for (let i = 0; i < minLength; i++) {
        if (words1[i] === words2[i]) {
            matches++;
        }
    }
    
    // 共通する文字の割合
    return matches / Math.max(words1.length, words2.length, 1);
}

/**
 * スコアから成績評価を取得
 */
function getGrade(score) {
    if (score >= 90) return 'S';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'E';
}

/**
 * スコアに基づいたフィードバックコメント
 */
function getScoreComment(score) {
    if (score >= 90) {
        return '素晴らしい！テキストの内容を深く理解し、的確に表現できています。';
    } else if (score >= 80) {
        return '良くできています。テキストの重要なポイントを押さえています。';
    } else if (score >= 70) {
        return 'よくできました。テキストの内容を理解していますが、さらに具体性を加えると良いでしょう。';
    } else if (score >= 60) {
        return '基本的な理解はできています。テキストとの関連性をより明確にしましょう。';
    } else if (score >= 50) {
        return '理解は進んでいますが、テキストの内容により深く沿った回答を目指しましょう。';
    } else {
        return 'テキストの内容を再度確認し、重要なキーワードや概念を意識して回答してみましょう。';
    }
}

/**
 * 記述式問題の採点（互換性のためのラッパー関数）
 * @param {string} answer - 学習者の回答
 * @param {string} sourceText - 元テキスト
 * @param {number} maxScore - 満点（25 or 30）
 * @returns {Object} { totalScore, breakdown }
 */
function scoreEssayAnswer(answer, sourceText, maxScore) {
    console.log('=== scoreEssayAnswer START ===');
    console.log('Answer length:', answer.length);
    console.log('SourceText length:', sourceText.length);
    console.log('MaxScore:', maxScore);
    
    // キーワード抽出（簡易版）
    const keywords = sourceText.split(/[、。,.\s]+/)
        .filter(w => w && w.length > 2)
        .slice(0, 10);
    
    console.log('Extracted keywords:', keywords);
    
    // 4つの観点で評価
    try {
        // テキスト一致度の評価（配列として渡す）
        const textSimilarity = evaluateTextAlignment(answer, sourceText, keywords);
        console.log('Text similarity score:', textSimilarity);
        
        // キーワード使用の評価
        const keywordScore = evaluateKeywordUsage(answer, keywords);
        console.log('Keyword usage score:', keywordScore);
        
        // 具体性の評価
        const specificityScore = evaluateSpecificity(answer);
        console.log('Specificity score:', specificityScore);
        
        // 論理性・構造の評価
        const structureScore = evaluateStructure(answer);
        console.log('Structure score:', structureScore);
        
        // スコアを満点に応じて調整
        const adjustedTextSimilarity = (textSimilarity / 50) * (maxScore * 0.5); // 50%
        const adjustedKeywordScore = (keywordScore / 20) * (maxScore * 0.2);      // 20%
        const adjustedSpecificity = (specificityScore / 15) * (maxScore * 0.15);  // 15%
        const adjustedStructure = (structureScore / 15) * (maxScore * 0.15);      // 15%
        
        console.log('Adjusted scores:', {
            textSimilarity: adjustedTextSimilarity,
            keywordScore: adjustedKeywordScore,
            specificity: adjustedSpecificity,
            structure: adjustedStructure
        });
        
        const totalScore = Math.round(
            adjustedTextSimilarity + 
            adjustedKeywordScore + 
            adjustedSpecificity + 
            adjustedStructure
        );
        
        console.log('Total score before cap:', totalScore);
        console.log('Final score:', Math.min(totalScore, maxScore));
        console.log('=== scoreEssayAnswer END ===');
        
        return {
            totalScore: Math.min(totalScore, maxScore),
            breakdown: {
                textAlignment: Math.round(adjustedTextSimilarity),
                keywordUsage: Math.round(adjustedKeywordScore),
                specificity: Math.round(adjustedSpecificity),
                structure: Math.round(adjustedStructure)
            }
        };
    } catch (error) {
        console.error('=== scoreEssayAnswer ERROR ===');
        console.error('Error:', error);
        console.error('Stack:', error.stack);
        throw new Error(`記述式採点エラー: ${error.message}`);
    }
}

/**
 * 単一問題の採点（個別フィードバック用）
 */
async function scoreAnswer(question, answer, sourceText, questionIndex) {
    const maxScore = getQuestionScore(questionIndex, question.type);
    
    if (question.type === 'choice') {
        const correctAnswer = parseInt(question.correct_answer);
        const userAnswer = parseInt(answer);
        const score = correctAnswer === userAnswer ? maxScore : 0;
        
        return {
            score: score,
            maxScore: maxScore,
            isCorrect: correctAnswer === userAnswer,
            percentage: (score / maxScore * 100).toFixed(0)
        };
    } else {
        const score = await scoreEssayAnswerForSet(question, answer, sourceText, maxScore);
        
        // 詳細な内訳を計算
        const evaluationCriteria = question.correct_answer;
        const criteriaKeywords = evaluationCriteria.split(/[、,]/).map(k => k.trim());
        
        const breakdown = {
            'テキストとの一致度': {
                score: Math.round(evaluateTextAlignment(answer, sourceText, criteriaKeywords) / 50 * maxScore * 0.50),
                maxScore: Math.round(maxScore * 0.50),
                description: '元テキストの内容にどれだけ沿っているか'
            },
            '重要キーワードの使用': {
                score: Math.round(evaluateKeywordUsage(answer, criteriaKeywords) / 20 * maxScore * 0.20),
                maxScore: Math.round(maxScore * 0.20),
                description: '評価基準のキーワードをどれだけ使用しているか'
            },
            '具体性': {
                score: Math.round(evaluateSpecificity(answer) / 15 * maxScore * 0.15),
                maxScore: Math.round(maxScore * 0.15),
                description: '具体例や実践的な内容が含まれているか'
            },
            '論理性・構造': {
                score: Math.round(evaluateStructure(answer) / 15 * maxScore * 0.15),
                maxScore: Math.round(maxScore * 0.15),
                description: '論理的に構成され、わかりやすいか'
            }
        };
        
        return {
            score: score,
            maxScore: maxScore,
            breakdown: breakdown,
            percentage: (score / maxScore * 100).toFixed(0),
            grade: getGrade(score / maxScore * 100)
        };
    }
}

/**
 * フィードバック生成（採点結果付き）
 */
async function generateFeedbackWithScore(question, answer, sourceText, questionIndex) {
    // スコアリング
    const scoreResult = await scoreAnswer(question, answer, sourceText, questionIndex);
    
    // 既存のフィードバック生成
    const feedback = await generateFeedback(question, answer);
    
    // スコア情報を追加
    feedback.score = scoreResult.score;
    feedback.maxScore = scoreResult.maxScore;
    feedback.percentage = scoreResult.percentage;
    feedback.grade = scoreResult.grade || null;
    feedback.breakdown = scoreResult.breakdown || null;
    feedback.scoreComment = getScoreComment(scoreResult.score / scoreResult.maxScore * 100);
    
    // 記述式の場合、フィードバックにスコアの詳細を追加
    if (question.type === 'essay' && scoreResult.breakdown) {
        const breakdownText = Object.entries(scoreResult.breakdown)
            .map(([category, data]) => {
                const percentage = (data.score / data.maxScore * 100).toFixed(0);
                return `・${category}: ${data.score}/${data.maxScore}点 (${percentage}%)`;
            })
            .join('\n');
        
        feedback.reason = `【採点結果】\n${questionIndex + 1}問目の配点: ${scoreResult.maxScore}点\n獲得点数: ${scoreResult.score}点\n\n${breakdownText}\n\n` + feedback.reason;
    } else if (question.type === 'choice') {
        feedback.reason = `【採点結果】\n${questionIndex + 1}問目の配点: ${scoreResult.maxScore}点\n獲得点数: ${scoreResult.score}点\n\n` + feedback.reason;
    }
    
    return feedback;
}

/**
 * スコアの内訳を表示用に整形
 */
function formatScoreBreakdown(breakdown) {
    return Object.entries(breakdown).map(([category, data]) => {
        const percentage = (data.score / data.maxScore * 100).toFixed(0);
        return {
            category: category,
            score: data.score,
            maxScore: data.maxScore,
            percentage: percentage,
            description: data.description
        };
    });
}
