// ========================================
// AIフィードバック生成（シミュレーション）
// ========================================

/**
 * AIフィードバックを生成（拡張版）
 * @param {Object} question - 問題オブジェクト
 * @param {string} answer - 学習者の回答
 * @param {number} score - 獲得した得点
 * @param {number} maxScore - 満点
 * @param {string} sourceText - 元テキスト
 * @param {Object} breakdown - 採点内訳（記述式の場合）
 * @returns {string} フィードバックHTML
 */
async function generateFeedback(question, answer, score = null, maxScore = null, sourceText = '', breakdown = null) {
    console.log('=== generateFeedback START ===');
    console.log('Question type:', question.type);
    console.log('Score:', score, '/', maxScore);
    
    // シミュレーション用の待機
    await new Promise(resolve => setTimeout(resolve, 500));

    if (question.type === 'choice') {
        const feedbackObj = generateChoiceFeedback(question, answer, score, maxScore);
        return formatFeedbackHTML(feedbackObj, score, maxScore);
    } else {
        const feedbackObj = generateEssayFeedback(question, answer, sourceText, breakdown, score, maxScore);
        return formatFeedbackHTML(feedbackObj, score, maxScore, breakdown, sourceText);
    }
}

/**
 * フィードバックをHTML形式にフォーマット
 */
function formatFeedbackHTML(feedback, score, maxScore, breakdown = null, sourceText = '') {
    let html = '<div class="feedback-sections">';
    
    // できている点
    if (feedback.good_point) {
        html += `
            <div class="feedback-section good">
                <h4><i class="fas fa-check-circle"></i> できている点</h4>
                <p>${sanitizeHTML(feedback.good_point)}</p>
            </div>
        `;
    }
    
    // 惜しい点
    if (feedback.partial_point) {
        html += `
            <div class="feedback-section partial">
                <h4><i class="fas fa-exclamation-circle"></i> 惜しい点</h4>
                <p>${sanitizeHTML(feedback.partial_point)}</p>
            </div>
        `;
    }
    
    // 修正が必要な点
    if (feedback.correction_point) {
        html += `
            <div class="feedback-section correction">
                <h4><i class="fas fa-times-circle"></i> 修正が必要な点</h4>
                <p>${sanitizeHTML(feedback.correction_point)}</p>
            </div>
        `;
    }
    
    // 詳細な採点内訳（記述式の場合）
    if (breakdown && feedback.detailed_breakdown) {
        html += `
            <div class="feedback-section breakdown">
                <h4><i class="fas fa-calculator"></i> 詳細な採点内訳（満点${maxScore}点）</h4>
                <div class="breakdown-details">
                    ${sanitizeHTML(feedback.detailed_breakdown)}
                </div>
            </div>
        `;
    }
    
    // 理由
    if (feedback.reason) {
        html += `
            <div class="feedback-section reason">
                <h4><i class="fas fa-lightbulb"></i> 評価の理由</h4>
                <div style="white-space: pre-wrap;">${sanitizeHTML(feedback.reason)}</div>
            </div>
        `;
    }
    
    // 模範解答
    if (feedback.model_answer) {
        html += `
            <div class="feedback-section model-answer" style="background: #f0f9ff; border-left: 4px solid #3b82f6;">
                <h4><i class="fas fa-star"></i> 模範解答</h4>
                <div style="white-space: pre-wrap; line-height: 1.8;">${sanitizeHTML(feedback.model_answer)}</div>
            </div>
        `;
    }
    
    // 次に意識する一点
    if (feedback.next_action) {
        html += `
            <div class="feedback-section next-action">
                <h4><i class="fas fa-arrow-right"></i> 次に意識する一点</h4>
                <p>${sanitizeHTML(feedback.next_action)}</p>
            </div>
        `;
    }
    
    html += '</div>';
    
    return html;
}

/**
 * AIフィードバックを生成（旧バージョン - 互換性のため保持）
 */
async function generateFeedbackLegacy(question, answer) {
    // シミュレーション用の待機
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (question.type === 'choice') {
        return generateChoiceFeedback(question, answer);
    } else {
        return generateEssayFeedback(question, answer);
    }
}

/**
 * 選択式問題のフィードバック生成（改善版）
 */
function generateChoiceFeedback(question, answer, score, maxScore) {
    console.log('=== generateChoiceFeedback START ===');
    
    const correctAnswer = parseInt(question.correct_answer);
    const userAnswer = parseInt(answer);
    const isCorrect = correctAnswer === userAnswer;
    
    console.log('Correct:', correctAnswer, 'User:', userAnswer, 'Is correct:', isCorrect);
    
    const choices = JSON.parse(question.choices);
    const selectedChoice = choices[userAnswer - 1] || '';
    const correctChoice = choices[correctAnswer - 1] || '';

    let feedback = {
        good_point: '',
        partial_point: '',
        correction_point: '',
        reason: '',
        next_action: '',
        model_answer: ''
    };

    if (isCorrect) {
        // 正解の場合
        feedback.good_point = `✓ 正解です！（${maxScore}点獲得）\n\n` +
            `選択肢${correctAnswer}「${correctChoice}」を選ばれた判断は的確でした。\n` +
            `テキストの内容を正しく理解し、適切な選択ができています。`;
        
        feedback.partial_point = '今回の設問では完璧な回答でした。\n\n' +
            'さらにレベルアップするには、なぜこの選択肢が正解なのかを自分の言葉で説明できるようにしましょう。';
        
        feedback.correction_point = '特に修正が必要な点はありません。この調子で学習を続けてください。';
        
        feedback.reason = `【正解の理由】\n${question.explanation}\n\n` +
            `【あなたの選択】\n選択肢${correctAnswer}: ${correctChoice}\n\n` +
            `✓ この選択はテキストの内容に最も忠実であり、正確な理解に基づいています。`;
        
        feedback.next_action = '次のステップとして、「なぜその選択が正しいのか」を自分の言葉で説明できるよう意識してみましょう。\n\n' +
            '「わかる」から「説明できる」へのステップアップを目指してください。';
        
        feedback.model_answer = `【正解】選択肢${correctAnswer}\n\n` +
            `${correctChoice}\n\n` +
            `【理由】\n${question.explanation}`;
        
    } else {
        // 不正解の場合
        feedback.good_point = `選択肢${userAnswer}「${selectedChoice}」に着目された視点には、${question.category}における一つの要素が含まれています。\n\n` +
            '問題に真剣に向き合い、自分なりの判断をした点は評価できます。';
        
        feedback.partial_point = `選択肢${userAnswer}を選ばれた理由は理解できますが、今回の設問ではテキストの内容により忠実な選択肢が他にあります。\n\n` +
            'テキストで「何が最も強調されていたか」という視点で再考してみましょう。';
        
        feedback.correction_point = `今回の問いでは、選択肢${correctAnswer}「${correctChoice}」が正解でした。\n\n` +
            `【選択肢${userAnswer}と${correctAnswer}の違い】\n` +
            `選択肢${userAnswer}は一般的な考え方や部分的な要素を含んでいますが、` +
            `選択肢${correctAnswer}はテキストで述べられている内容により正確に対応しています。`;
        
        feedback.reason = `【正解の理由】\n${question.explanation}\n\n` +
            `【あなたの選択】\n選択肢${userAnswer}: ${selectedChoice}\n\n` +
            `【正しい選択】\n選択肢${correctAnswer}: ${correctChoice}\n\n` +
            `× 選択肢${userAnswer}を選ばれた背景には部分的な理解がありましたが、` +
            `テキスト全体の文脈では選択肢${correctAnswer}の方がより適切です。`;
        
        feedback.next_action = '次回は、問題を解く前にテキストをもう一度読み返し、' +
            '「このテキストで最も言いたいことは何か」を考えてから選択肢を見てみましょう。\n\n' +
            'テキストの主張の「核心」を捉える訓練です。';
        
        feedback.model_answer = `【正解】選択肢${correctAnswer}\n\n` +
            `${correctChoice}\n\n` +
            `【理由】\n${question.explanation}\n\n` +
            `【ポイント】\nテキストでは、この内容が中心的なテーマとして述べられています。` +
            `選択肢を選ぶ際は、「テキストで最も強調されている内容」という視点で判断しましょう。`;
    }
    
    console.log('=== generateChoiceFeedback END ===');
    return feedback;
}

/**
 * 記述式問題のフィードバック生成（世界最高峰の教育者レベル）
 * 
 * 【フィードバックの原則】
 * 1. 建設的な批評: 学習者の努力を認めつつ、具体的な改善点を示す
 * 2. 成長志向: 「できない」ではなく「まだできていない」の視点
 * 3. 具体性: 抽象的な助言ではなく、実行可能なアクションを提示
 * 4. 公平性: 評価基準を明確にし、透明性を保つ
 * 5. 励まし: 学習者の自信と意欲を高める言葉選び
 */
function generateEssayFeedback(question, answer, sourceText = '', breakdown = null, score = 0, maxScore = 25) {
    console.log('=== generateEssayFeedback START (World-Class Educator Mode) ===');
    console.log('Answer length:', answer.length);
    console.log('Score:', score, '/', maxScore);
    console.log('Breakdown:', breakdown);
    
    // 評価基準キーワードを取得
    const evaluationCriteria = question.correct_answer || '';
    const criteriaKeywords = evaluationCriteria.split(/[、,]/).map(k => k.trim()).filter(k => k.length > 0);
    console.log('Criteria keywords:', criteriaKeywords);
    
    // 回答に含まれるキーワードを分析
    const usedKeywords = criteriaKeywords.filter(kw => answer.includes(kw));
    const missingKeywords = criteriaKeywords.filter(kw => !answer.includes(kw));
    
    console.log('Used keywords:', usedKeywords);
    console.log('Missing keywords:', missingKeywords);
    
    // 回答の基本分析
    const answerLength = answer.trim().length;
    const hasStructure = answer.includes('\n') || answer.length > 100;
    const hasSpecificExample = /例えば|具体的には|実際に|たとえば/.test(answer);
    const hasSteps = /まず|次に|最後に|第一に|第二に|1つ目|2つ目/.test(answer);
    
    let feedback = {
        good_point: '',
        partial_point: '',
        correction_point: '',
        detailed_breakdown: '',
        reason: '',
        next_action: '',
        model_answer: ''
    };

    // 達成率を計算
    const achievementRate = Math.round((score / maxScore) * 100);
    
    // ===== できている点（具体的な強みを特定）=====
    let goodPoints = [];
    
    // キーワード使用の評価
    if (usedKeywords.length > 0) {
        const keywordUsageRate = Math.round((usedKeywords.length / criteriaKeywords.length) * 100);
        if (keywordUsageRate >= 80) {
            goodPoints.push(`✓ 【優れた点】テキストの重要なキーワード「${usedKeywords.join('」「')}」を的確に使用しています（達成率${keywordUsageRate}%）。これらのキーワードを自然な文脈の中で活用できており、テキストの内容を正確に理解していることが伝わります。`);
        } else if (keywordUsageRate >= 50) {
            goodPoints.push(`✓ テキストの重要なキーワード「${usedKeywords.join('」「')}」を使用しています（${usedKeywords.length}/${criteriaKeywords.length}個、達成率${keywordUsageRate}%）。これらの概念を適切に回答に組み込めています。`);
        } else {
            goodPoints.push(`✓ キーワード「${usedKeywords.join('」「')}」を使用しています。これらの概念に着目できた点は評価できます。`);
        }
    }
    
    // 文量の評価（詳細さの観点）
    if (answerLength >= 200) {
        goodPoints.push('✓ 【優れた点】十分な文量で多角的に回答されています。複数の観点から丁寧に説明しようという姿勢が見られます。');
    } else if (answerLength >= 150) {
        goodPoints.push('✓ 適切な文量で丁寧に回答されています。要点を詳しく説明しようとする意識が見られます。');
    } else if (answerLength >= 80) {
        goodPoints.push('✓ 要点を押さえて回答しています。簡潔にまとめる力があります。');
    }
    
    // 具体性の評価
    if (hasSpecificExample) {
        goodPoints.push('✓ 【優れた点】具体例を用いて説明されています。抽象的な概念を具体化できており、実践的な理解があることがわかります。');
    }
    
    // 論理構造の評価
    if (hasSteps) {
        goodPoints.push('✓ 【優れた点】論理的な構造で記述されています。「まず〜、次に〜」などの接続詞を使い、段階的に説明できています。読み手に配慮した書き方です。');
    }
    
    // 回答への取り組み姿勢
    if (answerLength >= 50) {
        goodPoints.push('✓ 問いに対して真摯に向き合い、自分の言葉で表現しようとする姿勢が伝わります。');
    }
    
    if (goodPoints.length > 0) {
        feedback.good_point = goodPoints.join('\n\n');
    } else {
        feedback.good_point = '✓ 問いに対して向き合い、回答を記述された点は評価できます。まだ発展途上ですが、学習に取り組む姿勢を大切にしてください。';
    }
    
    // ===== 惜しい点（成長の機会として提示）=====
    let partialPoints = [];
    
    // キーワード不足の指摘（建設的に）
    if (missingKeywords.length > 0) {
        if (missingKeywords.length === criteriaKeywords.length) {
            // 全てのキーワードが欠けている場合
            partialPoints.push(`△ 【重要な改善点】テキストで強調されていた重要なキーワード「${missingKeywords.join('」「')}」が回答に含まれていません。\n\nこれらのキーワードは、テキストの核心となる概念です。もう一度テキストを読み返し、これらの言葉が「なぜ重要なのか」を考えてみましょう。\n\n💡 ヒント: テキスト中で繰り返し出てくる言葉や、強調されている概念に注目してください。`);
        } else if (missingKeywords.length > criteriaKeywords.length / 2) {
            // 半分以上のキーワードが欠けている場合
            partialPoints.push(`△ 【改善の余地あり】テキストの重要なキーワード「${missingKeywords.join('」「')}」が回答に含まれていません（未使用${missingKeywords.length}/${criteriaKeywords.length}個）。\n\nこれらのキーワードを使うことで、テキストの内容により忠実な回答になります。\n\n💡 改善策: 次回は回答を書く前に「テキストで最も重要な言葉は何か？」と自問してみましょう。`);
        } else {
            // 一部のキーワードが欠けている場合
            partialPoints.push(`△ テキストのキーワード「${missingKeywords.join('」「')}」も含めると、さらに完成度が高まります。\n\n💡 次のステップ: これらの言葉を使って、あと1〜2文追加してみましょう。回答の深みが増します。`);
        }
    }
    
    // 文量不足の指摘
    if (answerLength < 80) {
        const needed = 100 - answerLength;
        partialPoints.push(`△ 【文量】現在${answerLength}文字です。もう少し詳しく説明してみましょう（目安：100文字以上、あと約${needed}文字）。\n\n💡 展開のコツ:\n• 「何を」- その概念は何か\n• 「なぜ」- なぜ重要なのか\n• 「どのように」- どう実践するのか\n\nこの3つの観点で書いてみると、自然に深まります。`);
    } else if (answerLength < 150 && achievementRate < 70) {
        partialPoints.push(`△ 【深さ】現在${answerLength}文字です。要点は押さえていますが、もう少し掘り下げると理解の深さが伝わります。\n\n💡 深めるヒント: 「その理由は何か」「具体的にはどういうことか」を1〜2文加えてみましょう。`);
    }
    
    // 具体例不足の指摘
    if (!hasSpecificExample && answerLength >= 80) {
        partialPoints.push(`△ 【具体性】概念の説明はできていますが、具体例があるとさらに説得力が増します。\n\n💡 具体化の技術:\n• 「例えば、〜」で実際の場面を描写する\n• 「具体的には、〜」で詳細を補足する\n• 数字や固有名詞を使って臨場感を出す\n\n抽象的な理解を実践に結びつける力が育ちます。`);
    }
    
    // 構造不足の指摘
    if (!hasSteps && answerLength > 200) {
        partialPoints.push(`△ 【構造】内容は充実していますが、文章を整理するとさらに読みやすくなります。\n\n💡 構造化のテクニック:\n• 「まず〜、次に〜、最後に〜」で段階的に説明\n• 「第一に〜、第二に〜」で複数の観点を整理\n• 改行や段落分けで視覚的に整える\n\n読み手に配慮した書き方は、ビジネスでも重要なスキルです。`);
    }
    
    // 論理性の確認
    if (answerLength >= 100 && !answer.includes('ため') && !answer.includes('ので') && !answer.includes('から')) {
        partialPoints.push(`△ 【論理性】「〜ため」「〜ので」「〜から」などの因果関係を示す言葉があると、主張の根拠が明確になります。\n\n💡 論理展開の型: 「〜である。なぜなら〜だからである。」という構造を意識してみましょう。`);
    }
    
    if (partialPoints.length > 0) {
        feedback.partial_point = partialPoints.join('\n\n');
    } else {
        feedback.partial_point = '全体的によくできています！\n\nさらにブラッシュアップするなら、具体例を1つ追加するか、「なぜそう言えるのか」という根拠を一文加えると、より説得力が増します。';
    }
    
    // ===== 修正が必要な点 =====
    let correctionPoints = [];
    
    if (missingKeywords.length > criteriaKeywords.length / 2) {
        correctionPoints.push(`✗ テキストの重要なキーワードのうち、半分以上（${missingKeywords.length}個）が回答に含まれていません\n` +
            `　不足キーワード：「${missingKeywords.join('」「')}」\n` +
            `　→ テキストを再度読み、これらのキーワードを意識して回答を組み立てましょう`);
    }
    
    if (answerLength < 50) {
        correctionPoints.push('✗ 回答が短すぎて、問いが求める内容を十分に表現できていません\n' +
            '　→ 最低でも80〜150文字程度を目安に、詳しく記述してみましょう');
    }
    
    if (usedKeywords.length === 0) {
        correctionPoints.push('✗ テキストの重要なキーワードが一つも使用されていません\n' +
            '　→ テキストの内容を踏まえて回答する必要があります');
    }
    
    if (correctionPoints.length > 0) {
        feedback.correction_point = correctionPoints.join('\n\n');
    } else {
        feedback.correction_point = '大きな修正点はありません。この調子で学習を続けてください。';
    }
    
    // ===== 詳細な採点内訳 =====
    if (breakdown) {
        let breakdownText = `【満点：${maxScore}点 / 獲得：${score}点 / 達成率：${achievementRate}%】\n\n`;
        
        // テキスト一致度
        const textAlignmentMax = Math.round(maxScore * 0.5);
        breakdownText += `1️⃣ テキスト一致度（配点${textAlignmentMax}点）：${breakdown.textAlignment}点\n`;
        if (breakdown.textAlignment >= textAlignmentMax * 0.8) {
            breakdownText += `   ✓ テキストの内容をよく理解しています\n`;
        } else if (breakdown.textAlignment >= textAlignmentMax * 0.5) {
            breakdownText += `   △ テキストの内容をある程度理解していますが、より深く読み込みましょう\n`;
        } else {
            breakdownText += `   ✗ テキストの内容への理解が不足しています。もう一度読み直しましょう\n`;
        }
        breakdownText += '\n';
        
        // キーワード使用
        const keywordMax = Math.round(maxScore * 0.2);
        breakdownText += `2️⃣ 重要キーワード使用（配点${keywordMax}点）：${breakdown.keywordUsage}点\n`;
        breakdownText += `   使用したキーワード：「${usedKeywords.join('」「')}」（${usedKeywords.length}/${criteriaKeywords.length}個）\n`;
        if (missingKeywords.length > 0) {
            breakdownText += `   未使用キーワード：「${missingKeywords.join('」「')}」\n`;
            breakdownText += `   → これらのキーワードを使うと+${Math.floor((missingKeywords.length / criteriaKeywords.length) * keywordMax)}点アップ可能\n`;
        }
        breakdownText += '\n';
        
        // 具体性
        const specificityMax = Math.round(maxScore * 0.15);
        breakdownText += `3️⃣ 具体性（配点${specificityMax}点）：${breakdown.specificity}点\n`;
        if (hasSpecificExample) {
            breakdownText += `   ✓ 具体例が含まれています\n`;
        } else {
            breakdownText += `   △ 具体例がありません。「例えば〜」を追加すると+${Math.floor(specificityMax * 0.3)}点アップ\n`;
        }
        breakdownText += '\n';
        
        // 論理性・構造
        const structureMax = Math.round(maxScore * 0.15);
        breakdownText += `4️⃣ 論理性・構造（配点${structureMax}点）：${breakdown.structure}点\n`;
        if (hasSteps) {
            breakdownText += `   ✓ 構造的に記述されています\n`;
        } else if (hasStructure) {
            breakdownText += `   △ ある程度整理されていますが、「まず」「次に」などでさらに明確化できます\n`;
        } else {
            breakdownText += `   △ 段落分けや接続詞で構造を整理しましょう\n`;
        }
        
        feedback.detailed_breakdown = breakdownText;
    }
    
    // ===== 理由 =====
    feedback.reason = `【あなたの得点】${score}点 / ${maxScore}点（達成率 ${achievementRate}%）\n\n`;
    
    if (achievementRate >= 80) {
        feedback.reason += '✓ 優秀な回答です。テキストの内容を深く理解し、適切に表現できています。\n\n';
    } else if (achievementRate >= 60) {
        feedback.reason += '○ 良い回答です。基本的な理解はできていますが、さらに詳しく記述する余地があります。\n\n';
    } else if (achievementRate >= 40) {
        feedback.reason += '△ 基本的な理解は見られますが、テキストの重要ポイントをもっと盛り込みましょう。\n\n';
    } else {
        feedback.reason += '✗ テキストの内容を再度確認し、重要なキーワードを意識して回答を見直しましょう。\n\n';
    }
    
    feedback.reason += `【評価のポイント】\n`;
    feedback.reason += `・テキストの重要キーワード（${criteriaKeywords.join('、')}）を使用しているか\n`;
    feedback.reason += `・テキストの内容を正確に理解しているか\n`;
    feedback.reason += `・具体的に記述しているか\n`;
    feedback.reason += `・論理的に構成されているか`;
    
    // ===== 次のアクション =====
    if (missingKeywords.length > 0) {
        feedback.next_action = `次回は、テキストを読んだ後に重要なキーワード（${criteriaKeywords.slice(0, 3).join('、')}など）をメモし、` +
            `それらを必ず回答に含めるよう意識しましょう。\n\n` +
            `キーワードを使うことで、テキストの内容に沿った回答になります。`;
    } else if (!hasSpecificExample) {
        feedback.next_action = '次回は、抽象的な表現を使ったら「例えば?」と自問し、具体例を1つ加える癖をつけましょう。\n\n' +
            '具体例があると、理解の深さが伝わります。';
    } else if (answerLength < 100) {
        feedback.next_action = '回答する前に、「何を」「なぜ」「どのように」の3点を意識して、もう少し詳しく記述してみましょう。\n\n' +
            '各ポイントを30文字以上で説明することを目標にしてください。';
    } else {
        feedback.next_action = 'この調子で、実際の業務場面でも「言語化して伝える」機会を増やすと、さらに実践力が向上するでしょう。';
    }
    
    // ===== 模範解答 =====
    feedback.model_answer = generateModelAnswer(question, sourceText, criteriaKeywords);
    
    console.log('=== generateEssayFeedback END ===');
    return feedback;
}

/**
 * 模範解答を生成（世界最高峰の教育者レベル）
 * 
 * 【模範解答の原則】
 * 1. テキストの内容を正確に反映
 * 2. 全ての評価基準キーワードを自然に使用
 * 3. 具体例を含める
 * 4. 論理的な構造で記述
 * 5. 実践的で応用可能な内容
 */
function generateModelAnswer(question, sourceText, keywords) {
    console.log('=== generateModelAnswer START ===');
    console.log('Keywords:', keywords);
    
    // テキストから最も関連性の高い文を抽出
    const sentences = sourceText.split(/[。！？\n]/).filter(s => s.trim().length > 15);
    const relevantSentences = sentences
        .map(sentence => {
            const keywordCount = keywords.filter(kw => sentence.includes(kw)).length;
            return { sentence: sentence.trim(), keywordCount };
        })
        .filter(item => item.keywordCount > 0)
        .sort((a, b) => b.keywordCount - a.keywordCount)
        .slice(0, 4)
        .map(item => item.sentence);
    
    console.log('Relevant sentences:', relevantSentences.length);
    
    let modelAnswer = '';
    
    // 問題タイトルから判断（理解問題 or 実践問題）
    const isUnderstandingQuestion = question.title.includes('理解') || 
                                   question.question_text.includes('説明してください') ||
                                   question.question_text.includes('述べてください');
    
    const isPracticeQuestion = question.title.includes('実践') || 
                               question.title.includes('活用') ||
                               question.question_text.includes('どのように') ||
                               question.question_text.includes('実際に');
    
    modelAnswer += `【模範解答例】\n\n`;
    
    if (isUnderstandingQuestion) {
        // ======= 理解を問う問題の模範解答 =======
        modelAnswer += `【概要】\n`;
        
        // キーワードを使った概要文
        if (keywords.length >= 3) {
            modelAnswer += `テキストでは、${keywords[0]}、${keywords[1]}、${keywords[2]}`;
            if (keywords.length > 3) {
                modelAnswer += `、${keywords[3]}`;
            }
            modelAnswer += `などの要素が重要であると述べられています。\n\n`;
        } else if (keywords.length > 0) {
            modelAnswer += `テキストでは、${keywords.join('や')}が重要であると述べられています。\n\n`;
        }
        
        // テキストの内容を詳述
        if (relevantSentences.length >= 2) {
            modelAnswer += `【詳細】\n`;
            modelAnswer += `まず、${relevantSentences[0]}。\n\n`;
            modelAnswer += `さらに、${relevantSentences[1]}。`;
            
            if (relevantSentences.length >= 3) {
                modelAnswer += `\n\nまた、${relevantSentences[2]}。`;
            }
        } else if (relevantSentences.length === 1) {
            modelAnswer += `【詳細】\n${relevantSentences[0]}。`;
        }
        
        // 具体例を追加
        modelAnswer += `\n\n【具体例】\n`;
        if (keywords[0]) {
            modelAnswer += `例えば、${keywords[0]}を実践する場面では、`;
            if (relevantSentences.length > 0) {
                const firstSentence = relevantSentences[0];
                const shortExample = firstSentence.length > 60 ? firstSentence.substring(0, 60) + '...' : firstSentence;
                modelAnswer += `「${shortExample}」という考え方が重要になります。`;
            } else {
                modelAnswer += `相手の立場に立って、具体的な行動を考えることが大切です。`;
            }
        }
        
    } else if (isPracticeQuestion) {
        // ======= 実践・応用を問う問題の模範解答 =======
        modelAnswer += `【実践のポイント】\n`;
        
        // ステップバイステップで説明
        if (keywords.length >= 3) {
            modelAnswer += `まず第一に、${keywords[0]}を意識することが重要です。`;
            if (relevantSentences[0]) {
                modelAnswer += `${relevantSentences[0]}。`;
            }
            
            modelAnswer += `\n\n次に、${keywords[1]}の観点も欠かせません。`;
            if (relevantSentences[1]) {
                modelAnswer += `${relevantSentences[1]}。`;
            }
            
            modelAnswer += `\n\nさらに、${keywords[2]}も重要な要素です。`;
            if (relevantSentences[2]) {
                modelAnswer += `${relevantSentences[2]}。`;
            }
        } else if (keywords.length > 0) {
            modelAnswer += `${keywords[0]}を意識し、`;
            if (relevantSentences[0]) {
                modelAnswer += `${relevantSentences[0]}。`;
            }
            if (keywords[1]) {
                modelAnswer += `\n\nまた、${keywords[1]}の視点も大切です。`;
            }
        }
        
        // 具体的な実践例
        modelAnswer += `\n\n【具体的な実践例】\n`;
        modelAnswer += `実際の場面では、`;
        if (keywords[0] && keywords[1]) {
            modelAnswer += `${keywords[0]}と${keywords[1]}をバランスよく実践することで、より効果的な結果を得ることができます。`;
        } else if (keywords[0]) {
            modelAnswer += `${keywords[0]}を日々の業務で意識的に取り入れることで、スキルが向上します。`;
        }
        
        // 期待される成果
        modelAnswer += `\n\n【期待される成果】\n`;
        modelAnswer += `これらを継続的に実践することで、`;
        if (keywords.length >= 2) {
            modelAnswer += `${keywords[0]}や${keywords[1]}のスキルが向上し、`;
        }
        modelAnswer += `より高い成果を上げることができるようになります。`;
        
    } else {
        // ======= その他の問題の模範解答 =======
        modelAnswer += `【回答のポイント】\n`;
        
        // キーワードを中心に構成
        if (keywords.length > 0) {
            modelAnswer += `テキストでは、`;
            keywords.forEach((kw, idx) => {
                if (idx > 0) modelAnswer += `、`;
                if (idx === keywords.length - 1 && keywords.length > 1) {
                    modelAnswer += `そして`;
                }
                modelAnswer += `${kw}`;
            });
            modelAnswer += `が重要な要素として述べられています。\n\n`;
        }
        
        // テキストの内容を組み込む
        if (relevantSentences.length > 0) {
            modelAnswer += `【内容】\n`;
            relevantSentences.forEach((sentence, idx) => {
                if (idx > 0) modelAnswer += `\n\n`;
                modelAnswer += `${sentence}。`;
            });
        }
    }
    
    // 最後に要約
    modelAnswer += `\n\n【要約】\n`;
    if (keywords.length >= 3) {
        modelAnswer += `${keywords[0]}、${keywords[1]}、${keywords[2]}`;
        if (keywords.length > 3) {
            modelAnswer += `、${keywords[3]}`;
        }
        modelAnswer += `という観点から、テキストの内容を的確に理解し、自分の言葉で表現することが重要です。`;
    } else if (keywords.length > 0) {
        modelAnswer += `${keywords.join('や')}を意識して、テキストの要点を押さえた回答を心がけましょう。`;
    } else {
        modelAnswer += `テキストの内容を正確に理解し、具体的かつ論理的に表現することが大切です。`;
    }
    
    // 文字数の目安を追加
    const estimatedLength = modelAnswer.length - 30; // ヘッダー分を除く
    modelAnswer += `\n\n【この模範解答の文字数】約${estimatedLength}文字\n`;
    modelAnswer += `（実際の回答では150〜300文字程度が目安です）`;
    
    console.log('Model answer length:', modelAnswer.length);
    console.log('=== generateModelAnswer END ===');
    
    return modelAnswer;
}

/**
 * キーワード分析
 */
function analyzeKeywords(answer, category) {
    const keywords = {
        '営業': ['信頼', '課題', 'ヒアリング', '提案', '関係構築', '価値', 'ニーズ', '解決', '顧客', 'メリット'],
        'コミュニケーション': ['傾聴', '共感', '質問', '理解', '伝える', '相手', '関係', '配慮', '対話', '双方向']
    };
    
    const targetKeywords = keywords[category] || [];
    const foundKeywords = targetKeywords.filter(keyword => answer.includes(keyword));
    
    return foundKeywords;
}

/**
 * 記述式のルーブリック評価
 */
function evaluateEssay(answer, question, hasKeywords, hasSpecificExample) {
    const answerLength = answer.trim().length;
    
    // 各観点を評価（0-5点）
    const scores = {
        '論点理解': 0,
        '思考の方向性': 0,
        '具体性': 0,
        '再現性': 0,
        '表現の明瞭さ': 0
    };

    // 論点理解
    if (answerLength > 50 && hasKeywords.length > 0) {
        scores['論点理解'] = 4;
    } else if (answerLength > 30) {
        scores['論点理解'] = 3;
    } else if (answerLength > 10) {
        scores['論点理解'] = 2;
    } else {
        scores['論点理解'] = 1;
    }

    // 思考の方向性
    if (hasKeywords.length >= 2) {
        scores['思考の方向性'] = 4;
    } else if (hasKeywords.length >= 1) {
        scores['思考の方向性'] = 3;
    } else if (answerLength > 50) {
        scores['思考の方向性'] = 2;
    } else {
        scores['思考の方向性'] = 1;
    }

    // 具体性
    if (hasSpecificExample && answerLength > 100) {
        scores['具体性'] = 5;
    } else if (hasSpecificExample) {
        scores['具体性'] = 4;
    } else if (answerLength > 100) {
        scores['具体性'] = 3;
    } else if (answerLength > 50) {
        scores['具体性'] = 2;
    } else {
        scores['具体性'] = 1;
    }

    // 再現性
    const hasSteps = /まず|次に|最後に|1つ目|2つ目/.test(answer);
    if (hasSteps && hasSpecificExample) {
        scores['再現性'] = 5;
    } else if (hasSteps || hasSpecificExample) {
        scores['再現性'] = 3;
    } else if (answerLength > 80) {
        scores['再現性'] = 2;
    } else {
        scores['再現性'] = 1;
    }

    // 表現の明瞭さ
    const hasStructure = answer.includes('\n') || /。.*。.*。/.test(answer);
    if (hasStructure && answerLength > 100 && answerLength < 500) {
        scores['表現の明瞭さ'] = 5;
    } else if (hasStructure) {
        scores['表現の明瞭さ'] = 4;
    } else if (answerLength > 50 && answerLength < 300) {
        scores['表現の明瞭さ'] = 3;
    } else if (answerLength > 20) {
        scores['表現の明瞭さ'] = 2;
    } else {
        scores['表現の明瞭さ'] = 1;
    }

    return scores;
}
