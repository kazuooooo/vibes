class TsumamiChallenge {
    constructor() {
        this.level = 1;
        this.score = 0;
        this.timer = 30;
        this.isGameRunning = false;
        this.isPaused = false;
        this.consecutiveSuccess = 0;
        this.parentState = 'safe'; // 'safe', 'warning', 'danger'
        this.parentTimer = null;
        this.gameTimer = null;
        this.isSnackClickable = true;
        this.currentSnackEaten = false;

        this.snackTypes = ['🍪', '🍫', '🍟', '🍭', '🧁', '🍩', '🍰', '🥨'];
        this.currentSnackIndex = 0;

        this.initializeElements();
        this.initializeEvents();
        this.updateDisplay();
    }

    initializeElements() {
        this.elements = {
            startButton: document.querySelector('[data-testid="start-button"]'),
            retryButton: document.querySelector('[data-testid="retry-button"]'),
            parentCharacter: document.querySelector('[data-testid="parent-character"]'),
            snackArea: document.querySelector('[data-testid="snack-area"]'),
            currentSnack: document.querySelector('[data-testid="current-snack"]'),
            levelDisplay: document.querySelector('[data-testid="level-display"]'),
            scoreDisplay: document.querySelector('[data-testid="score-display"]'),
            timerDisplay: document.querySelector('[data-testid="timer-display"]'),
            statusMessage: document.querySelector('[data-testid="status-message"]')
        };
    }

    initializeEvents() {
        this.elements.startButton.addEventListener('click', () => this.startGame());
        this.elements.retryButton.addEventListener('click', () => this.retryGame());
        this.elements.currentSnack.addEventListener('click', () => this.eatSnack());
    }

    startGame() {
        this.isGameRunning = true;
        this.elements.startButton.classList.add('hidden');
        this.elements.retryButton.classList.add('hidden');
        this.elements.currentSnack.classList.remove('hidden');
        
        this.resetGameState();
        this.updateDisplay();
        this.generateNewSnack();
        this.startParentPattern();
        this.startGameTimer();
        this.updateStatusMessage('チャンス！');
    }

    resetGameState() {
        this.parentState = 'safe';
        this.elements.parentCharacter.setAttribute('data-state', 'safe');
        this.isSnackClickable = true;
        this.currentSnackEaten = false;
        this.elements.currentSnack.classList.remove('disabled');
    }

    retryGame() {
        this.level = 1;
        this.score = 0;
        this.timer = 30;
        this.consecutiveSuccess = 0;
        this.stopAllTimers();
        this.startGame();
    }

    stopAllTimers() {
        if (this.parentTimer) {
            clearTimeout(this.parentTimer);
            this.parentTimer = null;
        }
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
    }

    startGameTimer() {
        this.gameTimer = setInterval(() => {
            this.timer--;
            this.updateDisplay();
            
            if (this.timer <= 0) {
                this.levelComplete();
            }
        }, 1000);
    }

    startParentPattern() {
        if (!this.isGameRunning) return;

        const levelConfig = this.getLevelConfig();
        const safeTime = this.getRandomTime(levelConfig.minSafeTime, levelConfig.maxSafeTime);
        
        // 安全な時間
        this.parentState = 'safe';
        this.elements.parentCharacter.setAttribute('data-state', 'safe');
        this.isSnackClickable = true;
        this.elements.currentSnack.classList.remove('disabled');
        this.updateStatusMessage('チャンス！');

        this.parentTimer = setTimeout(() => {
            this.showWarning();
        }, safeTime);
    }

    showWarning() {
        if (!this.isGameRunning) return;

        this.parentState = 'warning';
        this.isSnackClickable = true; // まだクリック可能
        this.updateStatusMessage('危険！');

        this.parentTimer = setTimeout(() => {
            this.parentTurnAround();
        }, 1000); // 1秒間の警告時間
    }

    parentTurnAround() {
        if (!this.isGameRunning) return;

        this.parentState = 'danger';
        this.elements.parentCharacter.setAttribute('data-state', 'danger');
        this.isSnackClickable = false;
        this.elements.currentSnack.classList.add('disabled');
        this.updateStatusMessage('');

        const levelConfig = this.getLevelConfig();
        const dangerTime = this.getRandomTime(levelConfig.minDangerTime, levelConfig.maxDangerTime);

        this.parentTimer = setTimeout(() => {
            this.startParentPattern(); // 次のサイクルを開始
        }, dangerTime);
    }

    getLevelConfig() {
        switch (this.level) {
            case 1:
                return {
                    minSafeTime: 2500,
                    maxSafeTime: 3500,
                    minDangerTime: 2000,
                    maxDangerTime: 3000,
                    scoreMultiplier: 1.0
                };
            case 2:
                return {
                    minSafeTime: 2000,
                    maxSafeTime: 4000,
                    minDangerTime: 2000,
                    maxDangerTime: 3000,
                    scoreMultiplier: 1.2
                };
            case 3:
                return {
                    minSafeTime: 1000,
                    maxSafeTime: 3000,
                    minDangerTime: 1500,
                    maxDangerTime: 2500,
                    scoreMultiplier: 1.5
                };
            default:
                return {
                    minSafeTime: 500,
                    maxSafeTime: 2000,
                    minDangerTime: 1000,
                    maxDangerTime: 2000,
                    scoreMultiplier: this.level * 0.3
                };
        }
    }

    getRandomTime(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    eatSnack() {
        if (!this.isGameRunning || this.currentSnackEaten) return;

        if (this.parentState === 'danger') {
            // 親に見つかった！
            this.gameOver();
            return;
        }

        if (!this.isSnackClickable) return;

        // お菓子を成功して食べた
        this.currentSnackEaten = true;
        this.consecutiveSuccess++;
        
        const baseScore = 10;
        const consecutiveBonus = this.consecutiveSuccess > 1 ? (this.consecutiveSuccess - 1) * 5 : 0;
        const levelConfig = this.getLevelConfig();
        const totalScore = Math.floor((baseScore + consecutiveBonus) * levelConfig.scoreMultiplier);
        
        this.score += totalScore;
        this.updateDisplay();
        
        // 新しいお菓子を生成
        setTimeout(() => {
            this.generateNewSnack();
        }, 500);
    }

    generateNewSnack() {
        if (!this.isGameRunning) return;

        this.currentSnackIndex = Math.floor(Math.random() * this.snackTypes.length);
        const snackType = this.snackTypes[this.currentSnackIndex];
        
        this.elements.currentSnack.textContent = snackType;
        this.elements.currentSnack.setAttribute('data-snack-type', this.getSnackTypeName(snackType));
        this.currentSnackEaten = false;
        
        // 親の状態に応じてクリック可能性を設定
        if (this.parentState === 'danger') {
            this.elements.currentSnack.classList.add('disabled');
        } else {
            this.elements.currentSnack.classList.remove('disabled');
        }
    }

    getSnackTypeName(emoji) {
        const snackMap = {
            '🍪': 'cookie',
            '🍫': 'chocolate',
            '🍟': 'fries',
            '🍭': 'candy',
            '🧁': 'cupcake',
            '🍩': 'donut',
            '🍰': 'cake',
            '🥨': 'pretzel'
        };
        return snackMap[emoji] || 'cookie';
    }

    gameOver() {
        this.isGameRunning = false;
        this.stopAllTimers();
        this.consecutiveSuccess = 0;
        
        this.updateStatusMessage('バレた！');
        this.elements.currentSnack.classList.add('hidden');
        this.elements.retryButton.classList.remove('hidden');
    }

    levelComplete() {
        this.isGameRunning = false;
        this.stopAllTimers();
        
        // レベルクリアボーナス
        this.score += 100;
        
        // 次のレベルへ
        this.level++;
        this.timer = this.getTimerForLevel(this.level);
        
        this.updateDisplay();
        this.updateStatusMessage('レベルクリア！');
        
        // 少し待ってから次のレベルを開始
        setTimeout(() => {
            if (this.level <= 10) { // 最大レベル制限
                this.startGame();
            } else {
                this.updateStatusMessage('ゲームクリア！');
                this.elements.retryButton.classList.remove('hidden');
            }
        }, 2000);
    }

    getTimerForLevel(level) {
        switch (level) {
            case 1: return 30;
            case 2: return 35;
            case 3: return 40;
            default: return 45;
        }
    }

    updateStatusMessage(message) {
        this.elements.statusMessage.textContent = message;
        
        // CSSアニメーション用のクラスを動的に適用
        this.elements.statusMessage.className = 'status-message';
        if (message === 'チャンス！') {
            this.elements.statusMessage.classList.add('safe');
        } else if (message === '危険！') {
            this.elements.statusMessage.classList.add('warning');
        } else if (message === 'バレた！') {
            this.elements.statusMessage.classList.add('danger');
        }
    }

    updateDisplay() {
        this.elements.levelDisplay.textContent = this.level;
        this.elements.scoreDisplay.textContent = this.score;
        this.elements.timerDisplay.textContent = this.timer;
    }
}

// ゲーム初期化
document.addEventListener('DOMContentLoaded', () => {
    new TsumamiChallenge();
});