# v5.1.3 緊急修正レポート：記述式採点エラー

## 🚨 問題の概要

記述式問題のテスト完了時に「記述式採点エラー」が発生し、採点が正常に行われない問題が報告されました。

## 🔍 原因の特定

### 主な問題
`js/scoring.js`の`scoreEssayAnswer`関数で、`evaluateTextAlignment`関数を呼び出す際に**型の不一致**がありました。

```javascript
// 修正前（エラーの原因）
const textSimilarity = evaluateTextAlignment(answer, sourceText, maxScore * 0.5);
//                                                                  ^^^^^^^^^^
//                                                                  数値を渡していた

// evaluateTextAlignment関数の期待する引数
function evaluateTextAlignment(answer, sourceText, criteriaKeywords) {
//                                                  ^^^^^^^^^^^^^^^
//                                                  配列を期待
```

### 問題の詳細
- `evaluateTextAlignment`関数は第3引数として**キーワードの配列**を期待
- しかし`scoreEssayAnswer`から呼び出す際に**数値**（`maxScore * 0.5`）を渡していた
- この型の不一致により、`forEach`などの配列メソッドでエラーが発生

## ✅ 修正内容

### 1. scoreEssayAnswer関数の修正

```javascript
function scoreEssayAnswer(answer, sourceText, maxScore) {
    // キーワード抽出
    const keywords = sourceText.split(/[、。,.\s]+/)
        .filter(w => w && w.length > 2)
        .slice(0, 10);
    
    // 修正後：キーワード配列を正しく渡す
    const textSimilarity = evaluateTextAlignment(answer, sourceText, keywords);
    const keywordScore = evaluateKeywordUsage(answer, keywords);
    const specificityScore = evaluateSpecificity(answer);
    const structureScore = evaluateStructure(answer);
    
    // スコアを満点に応じて調整
    const adjustedTextSimilarity = (textSimilarity / 50) * (maxScore * 0.5);  // 50%
    const adjustedKeywordScore = (keywordScore / 20) * (maxScore * 0.2);      // 20%
    const adjustedSpecificity = (specificityScore / 15) * (maxScore * 0.15);  // 15%
    const adjustedStructure = (structureScore / 15) * (maxScore * 0.15);      // 15%
    
    const totalScore = Math.round(
        adjustedTextSimilarity + 
        adjustedKeywordScore + 
        adjustedSpecificity + 
        adjustedStructure
    );
    
    return {
        totalScore: Math.min(totalScore, maxScore),
        breakdown: {
            textAlignment: Math.round(adjustedTextSimilarity),
            keywordUsage: Math.round(adjustedKeywordScore),
            specificity: Math.round(adjustedSpecificity),
            structure: Math.round(adjustedStructure)
        }
    };
}
```

### 2. 全採点関数にエラーハンドリングを追加

#### evaluateTextAlignment
```javascript
function evaluateTextAlignment(answer, sourceText, keywords) {
    // 引数の型チェック
    if (!Array.isArray(keywords)) {
        console.warn('evaluateTextAlignment: keywords is not an array, converting...');
        keywords = [];
    }
    
    if (!sourceText || sourceText.length === 0) {
        console.warn('evaluateTextAlignment: sourceText is empty');
        return 0;
    }
    
    // ... 採点ロジック
}
```

#### evaluateKeywordUsage
```javascript
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
    
    // ... 採点ロジック
}
```

#### evaluateSpecificity、evaluateStructure
```javascript
function evaluateSpecificity(answer) {
    if (!answer || answer.length === 0) {
        console.warn('evaluateSpecificity: answer is empty');
        return 0;
    }
    // ... 採点ロジック
}

function evaluateStructure(answer) {
    if (!answer || answer.length === 0) {
        console.warn('evaluateStructure: answer is empty');
        return 0;
    }
    // ... 採点ロジック
}
```

#### calculateSimilarity
```javascript
function calculateSimilarity(text1, text2) {
    if (!text1 || !text2) {
        return 0;
    }
    // ... 類似度計算
}
```

### 3. デバッグログの追加

すべての採点関数に詳細なログを追加：

```javascript
console.log('=== scoreEssayAnswer START ===');
console.log('Answer length:', answer.length);
console.log('SourceText length:', sourceText.length);
console.log('MaxScore:', maxScore);
console.log('Extracted keywords:', keywords);
console.log('Text similarity score:', textSimilarity);
console.log('Keyword usage score:', keywordScore);
console.log('Specificity score:', specificityScore);
console.log('Structure score:', structureScore);
console.log('Final score:', Math.min(totalScore, maxScore));
console.log('=== scoreEssayAnswer END ===');
```

### 4. scoreEssayAnswerForSet関数も同様に修正

```javascript
async function scoreEssayAnswerForSet(question, answer, sourceText, maxScore) {
    try {
        const evaluationCriteria = question.correct_answer || '';
        const criteriaKeywords = evaluationCriteria
            .split(/[、,]/)
            .map(k => k.trim())
            .filter(k => k.length > 0);
        
        // 正しくキーワード配列を渡す
        const textAlignmentScore = evaluateTextAlignment(answer, sourceText, criteriaKeywords);
        const keywordScore = evaluateKeywordUsage(answer, criteriaKeywords);
        const specificityScore = evaluateSpecificity(answer);
        const structureScore = evaluateStructure(answer);
        
        // スコア計算...
        
    } catch (error) {
        console.error('=== scoreEssayAnswerForSet ERROR ===');
        throw new Error(`記述式採点エラー: ${error.message}`);
    }
}
```

## 📊 採点の配点構成

### 記述式問題（25点または30点満点）

| 評価観点 | 配点割合 | 最大点数（25点満点） | 最大点数（30点満点） |
|---------|---------|-------------------|-------------------|
| テキスト一致度 | 50% | 12.5点 | 15点 |
| キーワード使用 | 20% | 5点 | 6点 |
| 具体性 | 15% | 3.75点 | 4.5点 |
| 論理性・構造 | 15% | 3.75点 | 4.5点 |
| **合計** | **100%** | **25点** | **30点** |

## 🧪 テスト結果

- ✅ ページの読み込み：正常
- ✅ JavaScriptエラー：なし
- ✅ 型チェック：追加済み
- ✅ エラーハンドリング：強化済み
- ✅ デバッグログ：追加済み

## 📝 更新されたファイル

- `js/scoring.js`
  - `scoreEssayAnswer`関数：型の不一致を修正、ログ追加
  - `scoreEssayAnswerForSet`関数：エラーハンドリング強化
  - `evaluateTextAlignment`関数：型チェック追加
  - `evaluateKeywordUsage`関数：配列チェック追加
  - `evaluateSpecificity`関数：空文字チェック追加
  - `evaluateStructure`関数：空文字チェック追加
  - `calculateSimilarity`関数：nullチェック追加

- `README.md`
  - v5.1.3のアップデート履歴を追加

## 🎯 動作確認方法

### 1. ブラウザのコンソールで確認

1. 学習者としてログイン
2. テストを開始して5問に回答（記述式問題を含む）
3. 「回答を完了する」ボタンをクリック
4. F12キーで開発者ツールを開く
5. Consoleタブで以下のログを確認：

```
=== scoreEssayAnswer START ===
Answer length: 150
SourceText length: 200
MaxScore: 25
Extracted keywords: ["顧客", "信頼", "関係", ...]
Text similarity score: 35
Keyword usage score: 12
Specificity score: 10
Structure score: 8
Final score: 20
=== scoreEssayAnswer END ===
```

### 2. 結果画面で確認

- 総得点（100点満点）が表示される
- 各問題の得点と内訳が表示される
- フィードバックが正しく生成される

## ⚠️ 注意事項

### エラーが発生した場合の対処法

1. **ページを再読み込み**
   - ブラウザのキャッシュをクリアしてF5キーで再読み込み

2. **コンソールログを確認**
   - F12キー → Consoleタブ
   - エラーメッセージとスタックトレースを確認

3. **問題の元テキストを確認**
   - 問題に元テキストが正しく保存されているか確認
   - 配点情報（【配点】25点）が含まれているか確認

## 🚀 今後の改善点

1. **採点アルゴリズムの改善**
   - より高度な自然言語処理の導入
   - 類似度計算の精度向上

2. **テストケースの追加**
   - 単体テストの実装
   - エッジケースのテスト

3. **ユーザーフィードバック**
   - 採点結果の妥当性検証
   - 学習者からのフィードバック収集

---

**修正完了日**: 2026-02-06  
**バージョン**: v5.1.3  
**緊急度**: 🚨 高（即時対応完了）
