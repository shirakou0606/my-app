// テスト用のコンソールコマンド

// フォームの状態を確認
function testFormStatus() {
    console.log('=== FORM STATUS TEST ===');
    
    const form = document.getElementById('autoGenerateForm');
    const category = document.getElementById('autoCategory');
    const midTopic = document.getElementById('autoMidTopic');
    const sourceText = document.getElementById('sourceText');
    const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
    
    console.log('Form:', form ? '✅ Found' : '❌ Not found');
    console.log('Category select:', category ? '✅ Found' : '❌ Not found');
    console.log('Mid Topic input:', midTopic ? '✅ Found' : '❌ Not found');
    console.log('Source Text textarea:', sourceText ? '✅ Found' : '❌ Not found');
    console.log('Submit button:', submitBtn ? '✅ Found' : '❌ Not found');
    
    if (form) {
        console.log('\nForm details:');
        console.log('  ID:', form.id);
        console.log('  Tag:', form.tagName);
        console.log('  Children count:', form.children.length);
    }
    
    if (category) {
        console.log('\nCategory select:');
        console.log('  Value:', category.value);
        console.log('  Options:', category.options.length);
    }
    
    if (midTopic) {
        console.log('\nMid Topic input:');
        console.log('  Value:', midTopic.value);
        console.log('  Required:', midTopic.required);
    }
    
    if (sourceText) {
        console.log('\nSource Text textarea:');
        console.log('  Value length:', sourceText.value.length);
        console.log('  Required:', sourceText.required);
    }
    
    console.log('========================');
}

// フォームに自動入力してテスト送信
function testAutoFill() {
    console.log('=== AUTO FILL TEST ===');
    
    const category = document.getElementById('autoCategory');
    const midTopic = document.getElementById('autoMidTopic');
    const sourceText = document.getElementById('sourceText');
    
    if (!category || !midTopic || !sourceText) {
        console.error('❌ Required elements not found');
        return;
    }
    
    // 自動入力
    category.value = '営業';
    midTopic.value = 'テスト中トピック';
    sourceText.value = 'これはテスト用のテキストです。'.repeat(10); // 200文字以上
    
    console.log('✅ Form filled with test data');
    console.log('Category:', category.value);
    console.log('Mid Topic:', midTopic.value);
    console.log('Source Text length:', sourceText.value.length);
    
    console.log('\n次に、「5問を自動生成してプレビュー」ボタンをクリックしてください');
    console.log('または、testSubmitForm() を実行してください');
    console.log('========================');
}

// プログラム的にフォームを送信
function testSubmitForm() {
    console.log('=== SUBMIT FORM TEST ===');
    
    const form = document.getElementById('autoGenerateForm');
    
    if (!form) {
        console.error('❌ Form not found');
        return;
    }
    
    console.log('Submitting form programmatically...');
    
    // フォームイベントを発火
    const event = new Event('submit', {
        bubbles: true,
        cancelable: true
    });
    
    form.dispatchEvent(event);
    
    console.log('✅ Form submit event dispatched');
    console.log('========================');
}

// 問題生成関数を直接呼び出し
async function testGenerateDirectly() {
    console.log('=== DIRECT GENERATION TEST ===');
    
    const category = document.getElementById('autoCategory');
    const midTopic = document.getElementById('autoMidTopic');
    const sourceText = document.getElementById('sourceText');
    
    if (!category || !midTopic || !sourceText) {
        console.error('❌ Required elements not found');
        return;
    }
    
    if (!category.value || !midTopic.value || sourceText.value.length < 50) {
        console.warn('⚠️ Please fill all fields first. Run testAutoFill() first.');
        return;
    }
    
    console.log('Calling generateQuestionsPreview() directly...');
    
    try {
        await generateQuestionsPreview();
        console.log('✅ generateQuestionsPreview() completed');
    } catch (error) {
        console.error('❌ Error:', error);
    }
    
    console.log('========================');
}

console.log('%c🧪 Test Commands Available', 'color: #2563eb; font-size: 16px; font-weight: bold');
console.log('%ctestFormStatus()', 'color: #10b981; font-weight: bold', '- Check form element status');
console.log('%ctestAutoFill()', 'color: #10b981; font-weight: bold', '- Fill form with test data');
console.log('%ctestSubmitForm()', 'color: #10b981; font-weight: bold', '- Submit form programmatically');
console.log('%ctestGenerateDirectly()', 'color: #10b981; font-weight: bold', '- Call generation function directly');
