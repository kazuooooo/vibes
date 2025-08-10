class RhythmNinjaGame {
    constructor() {
        // ゲーム状態
        this.score = 0;
        this.hp = 3;
        this.maxHp = 3;
        this.bpm = 80;
        this.combo = 0;
        this.maxCombo = 0;
        this.gameState = 'initial'; // initial, countdown, playing, gameOver
        
        // タイミング関連
        this.beatInterval = null;
        this.lastBeatTime = 0;
        this.beatTolerance = {
            perfect: 100, // ±100ms
            good: 200     // ±200ms
        };
        
        // 敵管理
        this.enemies = [];
        this.enemySpawnTimer = null;
        
        // ゲーム進行
        this.gameStartTime = 0;
        this.bpmIncreaseInterval = null;
        
        this.initializeElements();
        this.bindEvents();
        this.updateDisplay();
        this.initializeAudio();
    }
    
    initializeElements() {
        this.elements = {
            // メイン要素
            startButton: document.getElementById('start-button'),
            retryButton: document.getElementById('retry-button'),
            countdown: document.getElementById('countdown'),
            countdownNumber: document.getElementById('countdown-number'),
            
            // ゲームエリア
            ninjaCharacter: document.getElementById('ninja-character'),
            groundEnemy: document.getElementById('ground-enemy'),
            airEnemy: document.getElementById('air-enemy'),
            beatIndicator: document.getElementById('beat-indicator'),
            beatPulse: document.querySelector('.beat-pulse'),
            
            // エフェクト
            actionEffect: document.getElementById('action-effect'),
            effectText: document.getElementById('effect-text'),
            timingResult: document.getElementById('timing-result'),
            timingText: document.getElementById('timing-text'),
            
            // UI表示
            scoreDisplay: document.getElementById('score-display'),
            hpDisplay: document.getElementById('hp-display'),
            bpmDisplay: document.getElementById('bpm-display'),
            comboDisplay: document.getElementById('combo-display'),
            
            // ゲームオーバー
            gameOverScreen: document.getElementById('game-over'),
            finalScore: document.getElementById('final-score'),
            maxComboDisplay: document.getElementById('max-combo'),
            finalBpmDisplay: document.getElementById('final-bpm'),
            
            // アクションボタン
            slashButton: document.getElementById('slash-button'),
            jumpButton: document.getElementById('jump-button'),
            
            // オーディオ
            audioMetronome: document.getElementById('audio-metronome'),
            audioSlash: document.getElementById('audio-slash'),
            audioJump: document.getElementById('audio-jump'),
            audioDamage: document.getElementById('audio-damage'),
            audioPerfect: document.getElementById('audio-perfect')
        };
    }
    
    initializeAudio() {
        // Web Audio APIを使用してメトロノーム音を生成
        this.audioContext = null;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }
    
    bindEvents() {
        // ボタンイベント
        this.elements.startButton.addEventListener('click', () => this.startGame());
        this.elements.retryButton.addEventListener('click', () => this.restartGame());
        
        // アクションボタンイベント
        this.elements.slashButton.addEventListener('click', () => this.performAction('slash'));
        this.elements.jumpButton.addEventListener('click', () => this.performAction('jump'));
        
        // キーボードイベント
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // ページの可視性変更時（タブ切り替え時）の処理
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.gameState === 'playing') {
                this.pauseGame();
            }
        });
    }
    
    handleKeydown(event) {
        if (this.gameState !== 'playing') return;
        
        switch (event.code) {
            case 'Space':
                event.preventDefault();
                this.performAction('slash');
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.performAction('jump');
                break;
        }
    }
    
    async startGame() {
        this.gameState = 'countdown';
        this.elements.startButton.style.display = 'none';
        this.elements.countdown.style.display = 'block';
        
        // カウントダウン
        for (let i = 3; i >= 1; i--) {
            this.elements.countdownNumber.textContent = i;
            await this.delay(1000);
        }
        
        this.elements.countdown.style.display = 'none';
        this.beginGame();
    }
    
    beginGame() {
        this.gameState = 'playing';
        this.gameStartTime = Date.now();
        
        // UI要素を有効化
        this.elements.slashButton.disabled = false;
        this.elements.jumpButton.disabled = false;
        this.elements.beatIndicator.style.display = 'block';
        
        // ビート開始
        this.startBeat();
        
        // 敵のスポーン開始
        this.startEnemySpawn();
        
        // BPM上昇タイマー開始
        this.startBpmIncrease();
        
        // テスト用敵表示
        this.showTestEnemies();
    }
    
    showTestEnemies() {
        // テスト用に敵を表示（実際のゲームではビートに合わせて出現）
        setTimeout(() => {
            this.elements.groundEnemy.style.display = 'block';
        }, 500);
        
        setTimeout(() => {
            this.elements.airEnemy.style.display = 'block';
        }, 1000);
    }
    
    startBeat() {
        const beatInterval = 60000 / this.bpm; // ms
        this.lastBeatTime = Date.now();
        
        this.beatInterval = setInterval(() => {
            this.processBeat();
        }, beatInterval);
        
        // 最初のビート
        this.processBeat();
    }
    
    processBeat() {
        this.lastBeatTime = Date.now();
        
        // ビートインジケーターのアニメーション
        this.elements.beatPulse.classList.add('active');
        setTimeout(() => {
            this.elements.beatPulse.classList.remove('active');
        }, 200);
        
        // メトロノーム音の再生
        this.playMetronomeSound();
    }
    
    playMetronomeSound() {
        if (!this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.1);
        } catch (e) {
            console.warn('Cannot play metronome sound:', e);
        }
    }
    
    startEnemySpawn() {
        // 実際の実装では、ビートに合わせて敵を出現させる
        // ここではテスト用の簡易実装
    }
    
    startBpmIncrease() {
        this.bpmIncreaseInterval = setInterval(() => {
            if (this.bpm < 160) {
                this.bpm += 10;
                this.updateDisplay();
                
                // ビート間隔を更新
                if (this.beatInterval) {
                    clearInterval(this.beatInterval);
                    this.startBeat();
                }
            }
        }, 30000); // 30秒ごと（テスト用は5秒）
    }
    
    performAction(action) {
        if (this.gameState !== 'playing') return;
        
        const currentTime = Date.now();
        const timingResult = this.evaluateTiming(currentTime);
        
        // アクションアニメーション
        this.playActionAnimation(action);
        
        // タイミング判定
        this.processTimingResult(timingResult);
        
        // スコア更新
        this.updateScore(timingResult);
        
        // エフェクト表示
        this.showActionEffect(action, timingResult);
    }
    
    evaluateTiming(currentTime) {
        const timeDiff = Math.abs(currentTime - this.lastBeatTime);
        const beatInterval = 60000 / this.bpm;
        
        // 次のビートまでの時間も考慮
        const nextBeatTime = this.lastBeatTime + beatInterval;
        const nextBeatDiff = Math.abs(currentTime - nextBeatTime);
        const minDiff = Math.min(timeDiff, nextBeatDiff);
        
        if (minDiff <= this.beatTolerance.perfect) {
            return 'perfect';
        } else if (minDiff <= this.beatTolerance.good) {
            return 'good';
        } else {
            return 'miss';
        }
    }
    
    processTimingResult(result) {
        if (result === 'miss') {
            this.takeDamage();
            this.combo = 0;
        } else {
            this.combo++;
            if (this.combo > this.maxCombo) {
                this.maxCombo = this.combo;
            }
        }
        
        this.showTimingResult(result);
        this.updateDisplay();
    }
    
    updateScore(timingResult) {
        let points = 0;
        
        switch (timingResult) {
            case 'perfect':
                points = 100;
                break;
            case 'good':
                points = 50;
                break;
            case 'miss':
                points = 0;
                break;
        }
        
        // コンボ倍率適用
        if (timingResult !== 'miss') {
            const comboMultiplier = Math.min(1 + (this.combo - 1) * 0.1, 5);
            points = Math.floor(points * comboMultiplier);
        }
        
        // テンポボーナス
        if (this.bpm > 100 && timingResult !== 'miss') {
            const tempoBonus = Math.floor((this.bpm - 80) / 10) * 10;
            points += tempoBonus;
        }
        
        this.score += points;
    }
    
    takeDamage() {
        this.hp--;
        this.updateHearts();
        
        if (this.hp <= 0) {
            this.gameOver();
        }
        
        // ダメージエフェクト
        this.elements.ninjaCharacter.style.filter = 'hue-rotate(0deg) brightness(0.5)';
        setTimeout(() => {
            this.elements.ninjaCharacter.style.filter = '';
        }, 300);
    }
    
    playActionAnimation(action) {
        this.elements.ninjaCharacter.setAttribute('data-action', action);
        
        setTimeout(() => {
            this.elements.ninjaCharacter.setAttribute('data-action', 'idle');
        }, 300);
    }
    
    showActionEffect(action, timing) {
        const effectText = action === 'slash' ? '⚔️' : '⬆️';
        this.elements.effectText.textContent = effectText;
        this.elements.actionEffect.classList.add('show');
        
        setTimeout(() => {
            this.elements.actionEffect.classList.remove('show');
        }, 500);
    }
    
    showTimingResult(result) {
        let text = '';
        let className = '';
        
        switch (result) {
            case 'perfect':
                text = 'Perfect!';
                className = 'perfect';
                break;
            case 'good':
                text = 'Good!';
                className = 'good';
                break;
            case 'miss':
                text = 'Miss...';
                className = 'miss';
                break;
        }
        
        this.elements.timingText.textContent = text;
        this.elements.timingText.className = className;
        this.elements.timingResult.classList.add('show');
        
        setTimeout(() => {
            this.elements.timingResult.classList.remove('show');
        }, 1000);
    }
    
    updateDisplay() {
        this.elements.scoreDisplay.textContent = this.score;
        this.elements.bpmDisplay.textContent = this.bpm;
        this.elements.comboDisplay.textContent = this.combo;
        this.updateHearts();
    }
    
    updateHearts() {
        const hearts = this.elements.hpDisplay.querySelectorAll('.heart');
        hearts.forEach((heart, index) => {
            if (index < this.hp) {
                heart.style.opacity = '1';
                heart.style.filter = 'drop-shadow(0 0 3px #ff0000)';
            } else {
                heart.style.opacity = '0.3';
                heart.style.filter = 'grayscale(100%)';
            }
        });
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        // タイマーをクリア
        if (this.beatInterval) {
            clearInterval(this.beatInterval);
            this.beatInterval = null;
        }
        
        if (this.bpmIncreaseInterval) {
            clearInterval(this.bpmIncreaseInterval);
            this.bpmIncreaseInterval = null;
        }
        
        // UI無効化
        this.elements.slashButton.disabled = true;
        this.elements.jumpButton.disabled = true;
        
        // 敵を隠す
        this.elements.groundEnemy.style.display = 'none';
        this.elements.airEnemy.style.display = 'none';
        
        // ゲームオーバー画面表示
        this.showGameOverScreen();
    }
    
    showGameOverScreen() {
        this.elements.finalScore.textContent = this.score;
        this.elements.maxComboDisplay.textContent = this.maxCombo;
        this.elements.finalBpmDisplay.textContent = this.bpm;
        this.elements.gameOverScreen.style.display = 'flex';
    }
    
    restartGame() {
        // ゲーム状態リセット
        this.score = 0;
        this.hp = this.maxHp;
        this.bpm = 80;
        this.combo = 0;
        this.maxCombo = 0;
        this.gameState = 'initial';
        
        // タイマークリア
        if (this.beatInterval) {
            clearInterval(this.beatInterval);
            this.beatInterval = null;
        }
        
        if (this.bpmIncreaseInterval) {
            clearInterval(this.bpmIncreaseInterval);
            this.bpmIncreaseInterval = null;
        }
        
        // UI リセット
        this.elements.gameOverScreen.style.display = 'none';
        this.elements.startButton.style.display = 'block';
        this.elements.slashButton.disabled = true;
        this.elements.jumpButton.disabled = true;
        this.elements.groundEnemy.style.display = 'none';
        this.elements.airEnemy.style.display = 'none';
        this.elements.beatIndicator.style.display = 'none';
        this.elements.ninjaCharacter.setAttribute('data-action', 'idle');
        
        // 表示更新
        this.updateDisplay();
    }
    
    pauseGame() {
        if (this.gameState === 'playing') {
            // 実装：一時停止機能（オプション）
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ゲーム開始
document.addEventListener('DOMContentLoaded', () => {
    new RhythmNinjaGame();
});