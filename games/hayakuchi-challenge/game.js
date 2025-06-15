class TongueTwisterGame {
    constructor() {
        this.level = 1;
        this.score = 0;
        this.currentTwister = '';
        this.currentTimeLimit = 5;
        this.timeRemaining = 5;
        this.timer = null;
        this.gameState = 'initial'; // initial, playing, recognizing, correct, wrong, gameover
        this.isPlaying = false;
        this.recognition = null;
        this.hasSpeechRecognition = false;
        
        // 早口言葉データ
        this.tongueTwisters = [
            { text: '生麦生米生卵', timeLimit: 5 },
            { text: '隣の客はよく柿食う客だ', timeLimit: 6 },
            { text: '東京特許許可局', timeLimit: 4 },
            { text: '赤巻紙青巻紙黄巻紙', timeLimit: 5 },
            { text: '坊主が屏風に上手に坊主の絵を描いた', timeLimit: 8 },
            { text: '新進シャンソン歌手総出演新春シャンソンショー', timeLimit: 10 },
            { text: '庭には二羽鶏がいる', timeLimit: 4 },
            { text: '青は藍より出でて藍より青し', timeLimit: 6 },
            { text: '右目右耳右肩', timeLimit: 3 },
            { text: '竹垣に竹立てかけたのは竹立てかけたかったから竹立てかけた', timeLimit: 12 }
        ];
        
        this.initializeElements();
        this.initializeSpeechRecognition();
        this.bindEvents();
        this.updateDisplay();
    }
    
    initializeElements() {
        this.elements = {
            startButton: document.getElementById('start-button'),
            retryButton: document.getElementById('retry-button'),
            tongueTwisterDisplay: document.getElementById('tongue-twister-display'),
            micButton: document.getElementById('mic-button'),
            statusMessage: document.getElementById('status-message'),
            levelDisplay: document.getElementById('level-display'),
            scoreDisplay: document.getElementById('score-display'),
            timeDisplay: document.getElementById('time-display'),
            recognitionResult: document.getElementById('recognition-result'),
            waveEffect: document.getElementById('wave-effect'),
            fallbackSection: document.querySelector('.fallback-section'),
            fallbackInput: document.getElementById('fallback-input'),
            fallbackSubmit: document.getElementById('fallback-submit')
        };
    }
    
    initializeSpeechRecognition() {
        // Web Speech API の対応確認
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'ja-JP';
            
            this.recognition.onstart = () => {
                this.onRecognitionStart();
            };
            
            this.recognition.onresult = (event) => {
                const result = event.results[0][0].transcript;
                this.onRecognitionResult(result);
            };
            
            this.recognition.onend = () => {
                this.onRecognitionEnd();
            };
            
            this.recognition.onerror = (event) => {
                this.onRecognitionError(event.error);
            };
            
            this.hasSpeechRecognition = true;
        } else {
            this.hasSpeechRecognition = false;
            this.showFallbackMode();
        }
    }
    
    bindEvents() {
        this.elements.startButton.addEventListener('click', () => this.startGame());
        this.elements.retryButton.addEventListener('click', () => this.restartGame());
        this.elements.micButton.addEventListener('click', () => this.startVoiceRecognition());
        this.elements.fallbackSubmit.addEventListener('click', () => this.submitFallbackInput());
        
        this.elements.fallbackInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitFallbackInput();
            }
        });
    }
    
    startGame() {
        this.gameState = 'playing';
        this.isPlaying = true;
        this.elements.startButton.style.display = 'none';
        this.elements.retryButton.style.display = 'none';
        
        // 現在のレベルの早口言葉を設定
        const twisterData = this.tongueTwisters[this.level - 1];
        this.currentTwister = twisterData.text;
        this.currentTimeLimit = twisterData.timeLimit;
        this.timeRemaining = this.currentTimeLimit;
        
        // UI更新
        this.elements.tongueTwisterDisplay.textContent = this.currentTwister;
        this.elements.tongueTwisterDisplay.classList.add('highlight');
        this.elements.statusMessage.textContent = '挑戦してください';
        this.elements.statusMessage.className = 'status-message';
        this.elements.recognitionResult.textContent = '';
        this.elements.recognitionResult.className = 'recognition-result';
        
        // マイクボタンまたは代替手段を有効化
        if (this.hasSpeechRecognition) {
            this.elements.micButton.disabled = false;
        } else {
            this.elements.fallbackInput.disabled = false;
            this.elements.fallbackSubmit.disabled = false;
        }
        
        this.updateDisplay();
        this.startTimer();
        
        // ハイライト効果を削除
        setTimeout(() => {
            this.elements.tongueTwisterDisplay.classList.remove('highlight');
        }, 500);
    }
    
    restartGame() {
        this.level = 1;
        this.score = 0;
        this.currentTwister = '';
        this.timeRemaining = 5;
        this.gameState = 'initial';
        this.isPlaying = false;
        
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        this.elements.retryButton.style.display = 'none';
        this.elements.startButton.style.display = 'inline-block';
        this.elements.statusMessage.textContent = '準備完了';
        this.elements.statusMessage.className = 'status-message';
        this.elements.tongueTwisterDisplay.textContent = '';
        this.elements.tongueTwisterDisplay.className = 'tongue-twister-display';
        this.elements.recognitionResult.textContent = '';
        this.elements.recognitionResult.className = 'recognition-result';
        this.elements.timeDisplay.textContent = '5';
        this.elements.timeDisplay.className = '';
        
        this.elements.micButton.disabled = true;
        this.elements.micButton.className = 'mic-button';
        this.elements.waveEffect.style.display = 'none';
        
        this.elements.fallbackInput.disabled = true;
        this.elements.fallbackSubmit.disabled = true;
        this.elements.fallbackInput.value = '';
        
        this.updateDisplay();
    }
    
    startTimer() {
        this.timer = setInterval(() => {
            this.timeRemaining--;
            this.updateTimeDisplay();
            
            if (this.timeRemaining <= 0) {
                this.handleTimeUp();
            }
        }, 1000);
    }
    
    updateTimeDisplay() {
        this.elements.timeDisplay.textContent = this.timeRemaining.toString();
        
        if (this.timeRemaining <= 3) {
            this.elements.timeDisplay.classList.add('warning');
        } else {
            this.elements.timeDisplay.classList.remove('warning');
        }
    }
    
    handleTimeUp() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        if (this.recognition && this.gameState === 'recognizing') {
            this.recognition.stop();
        }
        
        this.gameState = 'wrong';
        this.elements.statusMessage.textContent = 'ゲームオーバー';
        this.elements.statusMessage.className = 'status-message wrong';
        this.elements.recognitionResult.textContent = '時間切れです';
        this.elements.recognitionResult.className = 'recognition-result incorrect';
        
        this.disableInputs();
        
        setTimeout(() => {
            this.elements.retryButton.style.display = 'inline-block';
            this.gameState = 'gameover';
        }, 1500);
    }
    
    startVoiceRecognition() {
        if (!this.hasSpeechRecognition || this.gameState !== 'playing') return;
        
        this.gameState = 'recognizing';
        this.elements.micButton.disabled = true;
        this.elements.micButton.classList.add('recording');
        this.elements.statusMessage.textContent = '認識中...';
        this.elements.waveEffect.style.display = 'flex';
        
        try {
            this.recognition.start();
        } catch (error) {
            this.onRecognitionError('start-failed');
        }
    }
    
    onRecognitionStart() {
        // 認識開始時の処理はstartVoiceRecognitionで既に実行済み
    }
    
    onRecognitionResult(result) {
        this.elements.recognitionResult.textContent = `認識結果: ${result}`;
        this.judgeResult(result);
    }
    
    onRecognitionEnd() {
        this.elements.micButton.classList.remove('recording');
        this.elements.waveEffect.style.display = 'none';
        
        if (this.gameState === 'recognizing') {
            // 認識が完了したが結果が来ていない場合
            this.elements.statusMessage.textContent = '音声を認識できませんでした';
            this.elements.micButton.disabled = false;
        }
    }
    
    onRecognitionError(error) {
        console.error('音声認識エラー:', error);
        this.elements.micButton.classList.remove('recording');
        this.elements.waveEffect.style.display = 'none';
        
        if (error === 'not-allowed') {
            this.showFallbackMode();
            this.elements.statusMessage.textContent = 'マイクの許可が必要です。テキスト入力をご利用ください。';
        } else {
            this.elements.statusMessage.textContent = '音声認識でエラーが発生しました';
            this.elements.micButton.disabled = false;
        }
    }
    
    showFallbackMode() {
        this.elements.fallbackSection.style.display = 'block';
        if (this.gameState === 'playing') {
            this.elements.fallbackInput.disabled = false;
            this.elements.fallbackSubmit.disabled = false;
        }
    }
    
    submitFallbackInput() {
        if (this.gameState !== 'playing') return;
        
        const inputText = this.elements.fallbackInput.value.trim();
        if (inputText) {
            this.elements.recognitionResult.textContent = `入力結果: ${inputText}`;
            this.judgeResult(inputText);
        }
    }
    
    judgeResult(result) {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        // 類似度を計算（簡易的な判定）
        const similarity = this.calculateSimilarity(result, this.currentTwister);
        const isCorrect = similarity >= 0.7; // 70%以上で正解
        
        if (isCorrect) {
            this.handleCorrectAnswer();
        } else {
            this.handleWrongAnswer();
        }
    }
    
    calculateSimilarity(str1, str2) {
        // 空白や句読点を除去して比較
        const clean1 = str1.replace(/[\s\u3000。、！？]/g, '');
        const clean2 = str2.replace(/[\s\u3000。、！？]/g, '');
        
        if (clean1 === clean2) return 1.0;
        
        // レーベンシュタイン距離を使用した類似度計算
        const maxLength = Math.max(clean1.length, clean2.length);
        if (maxLength === 0) return 1.0;
        
        const distance = this.levenshteinDistance(clean1, clean2);
        return (maxLength - distance) / maxLength;
    }
    
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // 代入
                        matrix[i][j - 1] + 1,     // 挿入
                        matrix[i - 1][j] + 1      // 削除
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }
    
    handleCorrectAnswer() {
        this.gameState = 'correct';
        this.elements.statusMessage.textContent = '正解！';
        this.elements.statusMessage.className = 'status-message correct';
        this.elements.recognitionResult.className = 'recognition-result correct';
        
        // スコア計算
        const baseScore = this.level * 100;
        const timeBonus = this.timeRemaining * 10;
        const perfectBonus = this.elements.recognitionResult.textContent.includes(this.currentTwister) ? 50 : 0;
        const totalScore = baseScore + timeBonus + perfectBonus;
        
        this.score += totalScore;
        this.level++;
        
        this.disableInputs();
        this.updateDisplay();
        
        // 次のレベルへ進む
        setTimeout(() => {
            if (this.level <= this.tongueTwisters.length) {
                this.startGame();
            } else {
                // ゲームクリア
                this.elements.statusMessage.textContent = 'ゲームクリア！お疲れさまでした！';
                this.elements.statusMessage.className = 'status-message correct';
                this.elements.retryButton.style.display = 'inline-block';
                this.gameState = 'gameover';
            }
        }, 2000);
    }
    
    handleWrongAnswer() {
        this.gameState = 'wrong';
        this.elements.statusMessage.textContent = 'ゲームオーバー';
        this.elements.statusMessage.className = 'status-message wrong';
        this.elements.recognitionResult.className = 'recognition-result incorrect';
        
        this.disableInputs();
        
        setTimeout(() => {
            this.elements.retryButton.style.display = 'inline-block';
            this.gameState = 'gameover';
        }, 1500);
    }
    
    disableInputs() {
        this.elements.micButton.disabled = true;
        this.elements.micButton.classList.remove('recording');
        this.elements.waveEffect.style.display = 'none';
        this.elements.fallbackInput.disabled = true;
        this.elements.fallbackSubmit.disabled = true;
    }
    
    updateDisplay() {
        this.elements.levelDisplay.textContent = this.level.toString();
        this.elements.scoreDisplay.textContent = this.score.toString();
        this.elements.timeDisplay.textContent = this.timeRemaining.toString();
    }
}

// ゲーム初期化
document.addEventListener('DOMContentLoaded', () => {
    new TongueTwisterGame();
});