// ========================================
// 自動問題生成機能
// ========================================

/**
 * テキストから自動的に問題を生成
 * @param {string} sourceText - 元となる学習テキスト
 * @param {string} category - カテゴリ（営業 or コミュニケーション）
 * @returns {Array} 生成された問題の配列（5問）
 */
function generateQuestionsFromText(sourceText, category) {
    console.log('generateQuestionsFromText called');
    console.log('Category:', category, 'Text length:', sourceText.length);
    
    try {
        // テキストを分析
        const analysis = analyzeText(sourceText, category);
        console.log('Text analysis:', analysis);
        
        // 5問の問題を生成（選択式3問 + 記述式2問）
        const questions = [];
        
        // 選択式問題を3問生成
        for (let i = 0; i < 3; i++) {
            console.log('Generating choice question', i + 1);
            questions.push(generateChoiceQuestion(sourceText, analysis, category, i + 1));
        }
        
        // 記述式問題を2問生成
        for (let i = 0; i < 2; i++) {
            console.log('Generating essay question', i + 1);
            questions.push(generateEssayQuestion(sourceText, analysis, category, i + 1));
        }
        
        console.log('Generated', questions.length, 'questions');
        return questions;
        
    } catch (error) {
        console.error('Error in generateQuestionsFromText:', error);
        throw error;
    }
}

/**
 * テキストを分析してキーポイントを抽出
 */
function analyzeText(text, category) {
    console.log('=== analyzeText START ===');
    console.log('Text length:', text.length);
    console.log('Category:', category);
    
    // 文に分割
    const sentences = text.split(/[。\n]/).filter(s => s.trim().length > 10);
    console.log('Sentences count:', sentences.length);
    
    // カテゴリ別のキーワード
    const keywords = {
        '営業': [
            '顧客', '提案', 'ニーズ', 'ヒアリング', '信頼', '関係構築',
            '課題', '解決', '価値', 'メリット', '競合', 'クロージング',
            'アプローチ', 'フォロー', '成約', '予算', '決裁', '商談',
            '見込み客', '受注', '契約', '交渉', 'プレゼン', '質問'
        ],
        'コミュニケーション': [
            '傾聴', '共感', '質問', '理解', '伝える', '対話',
            '相手', '関係', '配慮', '双方向', '表現', 'フィードバック',
            '非言語', 'ボディランゲージ', 'アクティブリスニング', '要約',
            '言葉', '意見', '気持ち', '感情', '話す', '聞く'
        ]
    };
    
    const categoryKeywords = keywords[category] || [];
    
    // キーワードの出現頻度を分析
    const keywordFrequency = {};
    categoryKeywords.forEach(keyword => {
        const count = (text.match(new RegExp(keyword, 'g')) || []).length;
        if (count > 0) {
            keywordFrequency[keyword] = count;
        }
    });
    
    console.log('Keyword frequency:', keywordFrequency);
    
    // 重要なキーワードを抽出（出現頻度順、上位10個）
    const topKeywords = Object.entries(keywordFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([keyword]) => keyword);
    
    console.log('Top keywords:', topKeywords);
    
    // 重要な文を抽出（キーワードを含む文）
    const importantSentences = sentences
        .map(sentence => {
            const keywordCount = topKeywords.filter(kw => sentence.includes(kw)).length;
            return { sentence, keywordCount };
        })
        .filter(item => item.keywordCount > 0)
        .sort((a, b) => b.keywordCount - a.keywordCount)
        .slice(0, 10)
        .map(item => item.sentence);
    
    console.log('Important sentences:', importantSentences.length);
    
    // テキストから主要な概念を抽出
    const mainConcepts = extractMainConcepts(text, topKeywords);
    console.log('Main concepts:', mainConcepts);
    
    console.log('=== analyzeText END ===');
    
    return {
        sentences: sentences,
        importantSentences: importantSentences,
        topKeywords: topKeywords,
        mainConcepts: mainConcepts,
        textLength: text.length,
        sentenceCount: sentences.length
    };
}

/**
 * テキストから主要な概念を抽出
 */
function extractMainConcepts(text, keywords) {
    const concepts = [];
    
    // キーワードを含む文から概念を抽出
    keywords.forEach(keyword => {
        const regex = new RegExp(`[^。]*${keyword}[^。]*。`, 'g');
        const matches = text.match(regex);
        if (matches && matches.length > 0) {
            concepts.push({
                keyword: keyword,
                context: matches[0].replace(/。$/, '').trim()
            });
        }
    });
    
    return concepts;
}

/**
 * 選択式問題を生成（テキスト内容に基づく）
 */
function generateChoiceQuestion(sourceText, analysis, category, questionNumber) {
    console.log('=== generateChoiceQuestion START ===');
    console.log('Question number:', questionNumber);
    console.log('Category:', category);
    
    try {
        // テキストから重要な文を選択
        const baseSentence = analysis.importantSentences[questionNumber - 1] || analysis.sentences[0];
        const keyword = analysis.topKeywords[questionNumber - 1] || analysis.topKeywords[0] || 'ポイント';
        const concept = analysis.mainConcepts[questionNumber - 1] || analysis.mainConcepts[0];
        
        console.log('Base sentence:', baseSentence);
        console.log('Keyword:', keyword);
        console.log('Concept:', concept);
        
        // 問題文をテキスト内容から生成
        let questionText = '';
        let choices = [];
        let correctAnswer = 2; // デフォルトは2番目
        let explanation = '';
        
        if (concept && concept.context) {
            // テキストの内容に基づいて問題を作成
            questionText = `テキストでは「${keyword}」について述べられています。テキストの内容に最も合致するのはどれですか？`;
            
            // 正解の選択肢（テキストの内容を完全に使用、文末で切る）
            let correctChoice = concept.context;
            
            // 長すぎる場合は文で区切る（最大200文字まで許容）
            if (correctChoice.length > 200) {
                // まず完全な文で区切る
                const sentences = correctChoice.match(/[^。！？]+[。！？]/g) || [correctChoice];
                
                if (sentences.length > 1 && sentences[0].length <= 200) {
                    // 最初の文を使用
                    correctChoice = sentences[0];
                } else if (sentences[0].length > 200) {
                    // 句読点で区切って短縮
                    const parts = correctChoice.split(/[、，]/);
                    let result = parts[0];
                    for (let i = 1; i < parts.length && (result + '、' + parts[i]).length <= 200; i++) {
                        result += '、' + parts[i];
                    }
                    correctChoice = result + (result.endsWith('。') ? '' : '。');
                } else {
                    // それでも長い場合は強制的に切る
                    correctChoice = correctChoice.substring(0, 197) + '...';
                }
            }
            
            // ダミー選択肢を生成（もっともらしい選択肢）
            const dummyChoices = generatePlausibleDummyChoices(
                keyword, 
                category, 
                correctChoice, 
                analysis,
                questionNumber
            );
            
            // 選択肢をシャッフル
            choices = [correctChoice, ...dummyChoices];
            correctAnswer = 1; // 最初に正解を配置
            
            // ランダムにシャッフル
            const shuffled = shuffleArray(choices.map((choice, index) => ({ choice, isCorrect: index === 0 })));
            choices = shuffled.map(item => item.choice);
            correctAnswer = shuffled.findIndex(item => item.isCorrect) + 1;
            
            explanation = `テキストでは、「${keyword}」について「${concept.context}」と述べられています。これが本文の内容に最も忠実な記述です。`;
            
        } else {
            // フォールバック：一般的な問題を生成
            questionText = `テキストで述べられている「${keyword}」に関する記述として、最も適切なものはどれですか？`;
            
            choices = [
                `${keyword}は一般的な常識である`,
                `テキストでは${keyword}の重要性が強調されている`,
                `${keyword}は考慮する必要がない`,
                `${keyword}について詳しく説明されていない`
            ];
            correctAnswer = 2;
            explanation = `テキスト全体を通じて、${keyword}が重要なテーマとして扱われています。`;
        }
        
        const question = {
            title: `【問${questionNumber}】${keyword}について`,
            question_text: questionText,
            choices: JSON.stringify(choices),
            correct_answer: correctAnswer.toString(),
            explanation: explanation
        };
        
        console.log('Generated choice question:', question);
        console.log('=== generateChoiceQuestion END ===');
        
        return question;
        
    } catch (error) {
        console.error('Error generating choice question:', error);
        throw error;
    }
}

/**
 * テキスト内容に基づくリアルで紛らわしいダミー選択肢を生成
 */
function generatePlausibleDummyChoices(keyword, category, correctChoice, analysis, questionNumber) {
    console.log('=== generatePlausibleDummyChoices START ===');
    console.log('keyword:', keyword);
    console.log('category:', category);
    console.log('correctChoice length:', correctChoice.length);
    
    const dummyChoices = [];
    
    // テキストから他のキーワードを取得
    const otherKeywords = analysis?.topKeywords?.filter(k => k !== keyword) || [];
    const mainConcepts = analysis?.mainConcepts || [];
    
    try {
        // パターン1: テキスト内の他のコンセプトから部分的に正しい選択肢を作る
        if (mainConcepts.length > questionNumber) {
            const otherConcept = mainConcepts[questionNumber];
            if (otherConcept.context && otherConcept.keyword !== keyword) {
                let dummy1 = otherConcept.context;
                // 長すぎる場合は適切に短縮（ダミーは120文字まで）
                if (dummy1.length > 120) {
                    const sentences = dummy1.match(/[^。！？]+[。！？]/g) || [dummy1];
                    if (sentences.length > 1 && sentences[0].length <= 120) {
                        dummy1 = sentences[0];
                    } else {
                        // 句読点で区切る
                        const parts = dummy1.split(/[、，]/);
                        let result = parts[0];
                        for (let i = 1; i < parts.length && (result + '、' + parts[i]).length <= 120; i++) {
                            result += '、' + parts[i];
                        }
                        dummy1 = result + '。';
                    }
                }
                dummyChoices.push(dummy1);
            }
        }
        
        // パターン2: キーワードを混ぜた紛らわしい選択肢
        if (otherKeywords.length > 0 && dummyChoices.length < 3) {
            const otherKeyword = otherKeywords[Math.floor(Math.random() * otherKeywords.length)];
            if (category === '営業') {
                dummyChoices.push(`${keyword}は${otherKeyword}と密接に関連しており、両方をバランスよく実践することが顧客との信頼関係構築に繋がる`);
            } else if (category === 'コミュニケーション') {
                dummyChoices.push(`${keyword}では${otherKeyword}の要素も重要であり、相手の立場を考慮しながら対話を進めることが効果的である`);
            } else {
                dummyChoices.push(`${keyword}と${otherKeyword}を組み合わせることで、より効果的な結果を得ることができる`);
            }
        }
        
        // パターン3: 部分的に正しいが不完全な選択肢
        if (dummyChoices.length < 3) {
            if (category === '営業') {
                dummyChoices.push(`${keyword}においては顧客のニーズを的確に把握し、適切な提案を行うことが基本となる`);
                if (dummyChoices.length < 3) {
                    dummyChoices.push(`${keyword}では、製品やサービスの特徴を分かりやすく説明し、顧客の課題解決に繋げることが重要である`);
                }
            } else if (category === 'コミュニケーション') {
                dummyChoices.push(`${keyword}では相手の話を注意深く聞き、適切なタイミングで自分の意見を述べることが大切である`);
                if (dummyChoices.length < 3) {
                    dummyChoices.push(`${keyword}においては言葉だけでなく、表情や態度なども含めた総合的なメッセージの伝達が求められる`);
                }
            } else {
                dummyChoices.push(`${keyword}については、理論的な理解と実践的なスキルの両方が必要とされる`);
                if (dummyChoices.length < 3) {
                    dummyChoices.push(`${keyword}を効果的に活用するためには、状況に応じた柔軟な対応が重要である`);
                }
            }
        }
        
        // 確実に3つ返す
        while (dummyChoices.length < 3) {
            dummyChoices.push(`${keyword}に関する一般的な理解として、継続的な学習と実践が成長に繋がる`);
        }
        
    } catch (error) {
        console.error('Error generating plausible dummy choices:', error);
        // エラー時はシンプルなダミーを返す
        return [
            `${keyword}は一般的なビジネススキルとして重要である`,
            `${keyword}については実践を通じて理解を深めることができる`,
            `${keyword}に関する知識は幅広い場面で活用できる`
        ];
    }
    
    console.log('Generated dummy choices:', dummyChoices.slice(0, 3));
    console.log('=== generatePlausibleDummyChoices END ===');
    
    return dummyChoices.slice(0, 3);
}

/**
 * 旧ダミー選択肢生成関数（後方互換性のため残す）
 */
function generateDummyChoices(keyword, category, correctChoice) {
    return generatePlausibleDummyChoices(keyword, category, correctChoice, null, 0);
}

/**
 * 配列をシャッフル
 */
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

/**
 * 記述式問題を生成（テキスト内容に基づく）
 */
function generateEssayQuestion(sourceText, analysis, category, questionNumber) {
    console.log('=== generateEssayQuestion START ===');
    console.log('Question number:', questionNumber + 3); // 4問目と5問目
    console.log('Category:', category);
    
    try {
        const actualQuestionNumber = questionNumber + 3; // 4 or 5
        const keywordIndex = questionNumber + 2; // 3 or 4
        const keyword = analysis.topKeywords[keywordIndex] || analysis.topKeywords[0] || 'テーマ';
        const concept = analysis.mainConcepts[keywordIndex] || analysis.mainConcepts[0];
        
        console.log('Keyword:', keyword);
        console.log('Concept:', concept);
        
        let questionText = '';
        let evaluationCriteria = '';
        let explanation = '';
        
        if (questionNumber === 1) {
            // 4問目：テキスト内容の理解を問う
            questionText = `テキストで述べられている「${keyword}」について、あなた自身の言葉で説明してください。テキストの内容を踏まえて、具体的に記述してください。`;
            
            // 評価基準：テキストの重要キーワード
            const criteriaKeywords = analysis.topKeywords.slice(0, 5).join('、');
            evaluationCriteria = criteriaKeywords;
            
            explanation = `【評価のポイント】\n` +
                `1. テキストで述べられている${keyword}の内容を正確に理解しているか\n` +
                `2. 重要なキーワード（${criteriaKeywords}）を適切に使用しているか\n` +
                `3. 自分の言葉で分かりやすく説明できているか\n` +
                `4. 具体的な内容が含まれているか\n\n` +
                `【元テキスト】\n${sourceText}`;
            
        } else {
            // 5問目：テキスト内容の応用を問う
            questionText = `テキストで学んだ「${keyword}」を実際の場面で活用するには、どのような点に注意すべきでしょうか。テキストの内容を踏まえて、具体的な実践方法を記述してください。`;
            
            // 評価基準：テキストの重要キーワード + 実践
            const criteriaKeywords = analysis.topKeywords.slice(0, 5).join('、');
            evaluationCriteria = criteriaKeywords + '、実践、活用、具体例';
            
            explanation = `【評価のポイント】\n` +
                `1. テキストの内容を正しく理解した上で応用しているか\n` +
                `2. ${keyword}に関連するキーワード（${criteriaKeywords}）を活用しているか\n` +
                `3. 実践的で具体的な内容が含まれているか\n` +
                `4. テキストで学んだ内容と実際の応用が結びついているか\n\n` +
                `【元テキスト】\n${sourceText}`;
        }
        
        const question = {
            title: `【問${actualQuestionNumber}】${keyword}の${questionNumber === 1 ? '理解' : '実践'}`,
            question_text: questionText,
            choices: '[]', // 記述式なので空配列
            correct_answer: evaluationCriteria,
            explanation: explanation
        };
        
        console.log('Generated essay question:', question);
        console.log('=== generateEssayQuestion END ===');
        
        return question;
        
    } catch (error) {
        console.error('Error generating essay question:', error);
        throw error;
    }
}

/**
 * 選択式問題のテンプレート（営業）
 */
function getChoiceQuestionTemplates(category) {
    if (category === '営業') {
        return [
            {
                title: '顧客との信頼関係構築について',
                question: 'テキストの内容に基づき、営業活動において最も重視すべき要素は何ですか？',
                choices: [
                    '短期的な売上目標の達成を最優先する',
                    '顧客のニーズを深く理解し、長期的な信頼関係を構築する',
                    '競合他社の動向を常に監視する',
                    '商品知識を完璧に習得する'
                ],
                correctAnswer: 2,
                explanation: 'テキストでは、顧客との信頼関係構築が営業の基盤であることが強調されています。短期的な成果よりも、顧客のニーズに寄り添った長期的な関係性が重要です。'
            },
            {
                title: 'ヒアリングの重要性',
                question: '効果的なヒアリングを行うために最も重要なことは何ですか？',
                choices: [
                    '自社商品の説明を詳しく行う',
                    '顧客の話を傾聴し、潜在的なニーズを引き出す',
                    'できるだけ多くの質問をする',
                    '競合商品との比較を提示する'
                ],
                correctAnswer: 2,
                explanation: 'テキストでは、傾聴による顧客理解が強調されています。一方的な説明ではなく、顧客の課題や要望を深く理解することが、適切な提案につながります。'
            },
            {
                title: '提案の質を高める方法',
                question: '顧客に響く提案を行うために必要な要素は何ですか？',
                choices: [
                    '価格を最も安く設定する',
                    '顧客の課題に対する具体的な解決策を提示する',
                    '多くの機能を詰め込む',
                    '競合との差別化だけを強調する'
                ],
                correctAnswer: 2,
                explanation: 'テキストの内容から、顧客の課題に対する具体的で実現可能な解決策の提示が最も重要です。価格や機能の羅列ではなく、顧客にとっての価値を明確にすることが求められます。'
            }
        ];
    } else if (category === 'コミュニケーション') {
        return [
            {
                title: '効果的な傾聴について',
                question: 'テキストの内容に基づき、良いコミュニケーションの基本は何ですか？',
                choices: [
                    '自分の意見を明確に主張する',
                    '相手の話を最後まで聴き、理解しようとする姿勢',
                    '専門用語を使って説明する',
                    '結論を先に述べる'
                ],
                correctAnswer: 2,
                explanation: 'テキストでは、傾聴がコミュニケーションの基礎であることが示されています。相手の話を遮らず、理解しようとする姿勢が信頼関係を築きます。'
            },
            {
                title: '共感の重要性',
                question: '相手との良好な関係を築くために最も重要な要素は何ですか？',
                choices: [
                    '論理的な説明をする',
                    '相手の感情や立場に共感を示す',
                    '自分の経験談を話す',
                    '解決策をすぐに提示する'
                ],
                correctAnswer: 2,
                explanation: 'テキストでは、共感の重要性が強調されています。相手の感情や立場を理解し、それに寄り添うことで、心理的な距離が縮まり、建設的な対話が可能になります。'
            },
            {
                title: '質問力の向上',
                question: '効果的な質問をするために心がけるべきことは何ですか？',
                choices: [
                    'クローズドクエスチョンを多用する',
                    '相手の状況を理解し、オープンクエスチョンで深掘りする',
                    '質問の数を増やす',
                    '難しい質問をして相手を試す'
                ],
                correctAnswer: 2,
                explanation: 'テキストの内容から、オープンクエスチョンによる深掘りが効果的であることがわかります。相手が自由に答えられる質問により、本質的な情報を引き出すことができます。'
            }
        ];
    }
    
    // デフォルト
    return [
        {
            title: '基本的な理解',
            question: 'テキストの内容に基づき、最も重要なポイントは何ですか？',
            choices: [
                'テキストに書かれていない内容',
                'テキストで強調されている核心的な内容',
                '一般的な常識',
                '関連する別の話題'
            ],
            correctAnswer: 2,
            explanation: 'テキストで繰り返し述べられている内容が最も重要なポイントです。'
        },
        {
            title: '実践的な応用',
            question: 'テキストの内容を実践する際に重要なことは何ですか？',
            choices: [
                '理論だけを学ぶ',
                '実際の場面で具体的に行動する',
                '他人の真似をする',
                '完璧を目指す'
            ],
            correctAnswer: 2,
            explanation: 'テキストでは、実践的な行動の重要性が示されています。'
        },
        {
            title: '継続的な改善',
            question: 'スキル向上のために必要な姿勢は何ですか？',
            choices: [
                '一度学んだら終わり',
                '継続的に振り返り、改善を重ねる',
                '完璧になってから実践する',
                '他人と比較する'
            ],
            correctAnswer: 2,
            explanation: 'テキストの内容から、継続的な学びと改善が成長につながることがわかります。'
        }
    ];
}

/**
 * 記述式問題のテンプレート
 */
function getEssayQuestionTemplates(category) {
    if (category === '営業') {
        return [
            {
                title: '顧客ニーズの把握と提案',
                question: 'テキストで学んだ内容を踏まえ、顧客の潜在的なニーズを把握し、効果的な提案を行うためにはどのようなアプローチが必要ですか？具体的な手順やポイントを説明してください。',
                evaluationCriteria: 'ヒアリング、課題把握、解決策の提示、価値の明確化',
                explanation: '【評価のポイント】\n・テキストの内容に沿っているか\n・ヒアリングの重要性に言及しているか\n・顧客の課題を理解するプロセスが含まれているか\n・具体的な提案のステップが示されているか\n・顧客にとっての価値が明確化されているか'
            },
            {
                title: '信頼関係構築の実践',
                question: 'テキストの内容に基づき、顧客と長期的な信頼関係を構築するために、営業担当者が日々実践すべきことは何ですか？具体例を交えて説明してください。',
                evaluationCriteria: '継続的なコミュニケーション、約束の遵守、顧客視点、フォロー',
                explanation: '【評価のポイント】\n・テキストの内容を理解しているか\n・継続的な関わりについて言及しているか\n・顧客視点に立った行動が示されているか\n・具体的な実践例が含まれているか\n・フォローアップの重要性が述べられているか'
            }
        ];
    } else if (category === 'コミュニケーション') {
        return [
            {
                title: '効果的な傾聴の実践',
                question: 'テキストで学んだ傾聴の技術を用いて、相手の本音を引き出し、深い理解を得るためには、どのような姿勢や行動が必要ですか？具体的に説明してください。',
                evaluationCriteria: 'アクティブリスニング、共感、質問、非言語コミュニケーション',
                explanation: '【評価のポイント】\n・テキストの傾聴に関する内容を理解しているか\n・アクティブリスニングの技術が含まれているか\n・共感的な姿勢について言及しているか\n・適切な質問の重要性が述べられているか\n・非言語コミュニケーションへの配慮があるか'
            },
            {
                title: '対話の質を高める方法',
                question: 'テキストの内容を踏まえ、相手との対話の質を高め、互いに理解し合える関係を築くためには、どのようなコミュニケーションを心がけるべきですか？実践的な視点で説明してください。',
                evaluationCriteria: '双方向性、オープンな質問、フィードバック、相互理解',
                explanation: '【評価のポイント】\n・テキストの対話に関する内容に沿っているか\n・双方向のコミュニケーションが意識されているか\n・オープンクエスチョンの活用が含まれているか\n・フィードバックの重要性が述べられているか\n・相互理解を深めるプロセスが示されているか'
            }
        ];
    }
    
    // デフォルト
    return [
        {
            title: 'テキストの理解と応用',
            question: 'テキストで学んだ内容を、実際の場面でどのように活用できますか？具体的な例を挙げて説明してください。',
            evaluationCriteria: 'テキストの理解、具体性、実践可能性',
            explanation: '【評価のポイント】\n・テキストの内容を正確に理解しているか\n・具体的な例が示されているか\n・実践可能な内容か'
        },
        {
            title: '学びの実践',
            question: 'テキストから得た学びを、今後どのように実践していきますか？あなたの考えを述べてください。',
            evaluationCriteria: 'テキストへの理解、実践計画、継続性',
            explanation: '【評価のポイント】\n・テキストの内容が反映されているか\n・実践的な計画が含まれているか\n・継続的な取り組みが示されているか'
        }
    ];
}

/**
 * 問題生成プレビュー
 */
function previewGeneratedQuestions(sourceText, category) {
    console.log('previewGeneratedQuestions called');
    
    try {
        const questions = generateQuestionsFromText(sourceText, category);
        
        const preview = questions.map((q, index) => {
            const type = index < 3 ? '選択式' : '記述式';
            const typeIcon = index < 3 ? 'fa-list-ul' : 'fa-pen';
            
            return {
                number: index + 1,
                type: type,
                typeIcon: typeIcon,
                ...q
            };
        });
        
        console.log('Preview generated:', preview);
        return preview;
        
    } catch (error) {
        console.error('Error in previewGeneratedQuestions:', error);
        throw error;
    }
}
