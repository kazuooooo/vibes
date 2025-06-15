// ゲーム状態管理
class ZubonAgeGame {
    constructor() {
        this.gameState = 'ready'; // ready, playing, game-over
        this.score = 0;
        this.life = 3;
        this.combo = 0;
        this.gameTime = 0;
        this.currentPhase = 'normal'; // normal, warning, danger, falling
        this.phaseStartTime = 0;
        this.nextEventTime = 0;
        this.gameStartTime = 0;
        this.animationFrame = null;
        this.canClick = false;
        
        // 難易度設定
        this.difficultySettings = {
            0: { interval: [3000, 5000], speed: 1.0 },
            30: { interval: [2000, 4000], speed: 1.2 },
            60: { interval: [1500, 3000], speed: 1.5 },
            90: { interval: [1000, 2000], speed: 2.0 }
        };
        
        // DOM要素の取得
        this.elements = {
            startButton: document.getElementById('start-button'),
            retryButton: document.getElementById('retry-button'),
            characterArea: document.getElementById('character-area'),
            zubon: document.getElementById('zubon'),
            score: document.getElementById('score'),
            life: document.getElementById('life'),
            combo: document.getElementById('combo'),
            status: document.getElementById('status'),
            effects: document.getElementById('effects'),
            gameContainer: document.querySelector('.game-container')
        };
        
        this.initializeEventListeners();
        this.updateUI();
    }
    
    initializeEventListeners() {
        this.elements.startButton.addEventListener('click', () => this.startGame());
        this.elements.retryButton.addEventListener('click', () => this.retryGame());
        this.elements.characterArea.addEventListener('click', () => this.handleClick());
        
        // モバイル対応
        this.elements.characterArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleClick();
        });
    }
    
    startGame() {
        this.gameState = 'playing';
        this.gameStartTime = Date.now();
        this.scheduleNextEvent();
        this.updateUI();
        this.gameLoop();
        
        this.elements.startButton.style.display = 'none';
        this.elements.gameContainer.className = 'game-container playing';
    }
    
    retryGame() {
        this.score = 0;
        this.life = 3;
        this.combo = 0;
        this.gameTime = 0;
        this.currentPhase = 'normal';
        this.canClick = false;
        
        this.resetZubon();
        this.startGame();
        
        this.elements.retryButton.style.display = 'none';
    }
    
    gameLoop() {
        if (this.gameState !== 'playing') return;
        
        const currentTime = Date.now();
        this.gameTime = (currentTime - this.gameStartTime) / 1000;
        
        this.checkEventTrigger(currentTime);
        this.updateZubonPhase(currentTime);
        
        this.animationFrame = requestAnimationFrame(() => this.gameLoop());
    }
    
    scheduleNextEvent() {
        const difficulty = this.getCurrentDifficulty();
        const minInterval = difficulty.interval[0];
        const maxInterval = difficulty.interval[1];
        const interval = Math.random() * (maxInterval - minInterval) + minInterval;
        
        this.nextEventTime = Date.now() + interval;
    }
    
    getCurrentDifficulty() {
        const gameTimeSeconds = Math.floor(this.gameTime);
        
        if (gameTimeSeconds >= 90) return this.difficultySettings[90];
        if (gameTimeSeconds >= 60) return this.difficultySettings[60];
        if (gameTimeSeconds >= 30) return this.difficultySettings[30];
        return this.difficultySettings[0];
    }
    
    checkEventTrigger(currentTime) {
        if (currentTime >= this.nextEventTime && this.currentPhase === 'normal') {
            this.startZubonEvent();
        }
    }
    
    startZubonEvent() {
        this.currentPhase = 'warning';
        this.phaseStartTime = Date.now();
        this.canClick = true;
        
        const difficulty = this.getCurrentDifficulty();
        this.phaseDurations = {
            warning: 1000 / difficulty.speed,
            danger: 500 / difficulty.speed,
            falling: 300 / difficulty.speed
        };
        
        this.updateZubonVisual();
        this.elements.characterArea.classList.add('clickable');
    }
    
    updateZubonPhase(currentTime) {
        if (this.currentPhase === 'normal') return;
        
        const elapsed = currentTime - this.phaseStartTime;
        
        switch (this.currentPhase) {
            case 'warning':
                if (elapsed >= this.phaseDurations.warning) {
                    this.currentPhase = 'danger';
                    this.phaseStartTime = currentTime;
                    this.updateZubonVisual();
                }
                break;
                
            case 'danger':
                if (elapsed >= this.phaseDurations.danger) {
                    this.currentPhase = 'falling';
                    this.phaseStartTime = currentTime;
                    this.updateZubonVisual();
                }
                break;
                
            case 'falling':
                if (elapsed >= this.phaseDurations.falling) {
                    this.zubonFell();
                }
                break;
        }
    }
    
    updateZubonVisual() {
        this.elements.zubon.className = 'zubon';
        
        switch (this.currentPhase) {
            case 'warning':
                this.elements.zubon.classList.add('warning');
                break;
            case 'danger':
                this.elements.zubon.classList.add('danger');
                break;
            case 'falling':
                this.elements.zubon.classList.add('falling');
                break;
        }
    }
    
    handleClick() {
        if (!this.canClick || this.gameState !== 'playing') return;
        
        this.canClick = false;
        this.elements.characterArea.classList.remove('clickable');
        
        const timing = this.getClickTiming();
        this.processClickResult(timing);
        
        this.resetZubonAfterSave();
        this.scheduleNextEvent();
    }
    
    getClickTiming() {
        const elapsed = Date.now() - this.phaseStartTime;
        
        switch (this.currentPhase) {
            case 'warning':
                return 'early';
            case 'danger':
                if (elapsed < this.phaseDurations.danger * 0.5) {
                    return 'good';
                } else {
                    return 'perfect';
                }
            case 'falling':
                return 'miss'; // 実際には落ちた後なので基本的にここには来ない
            default:
                return 'miss';
        }
    }
    
    processClickResult(timing) {
        let points = 0;
        let effectClass = '';
        let effectText = '';
        
        switch (timing) {
            case 'perfect':
                points = 20;
                effectClass = 'effect-perfect';
                effectText = 'パーフェクト!';
                this.combo++;
                break;
            case 'good':
                points = 10;
                effectClass = 'effect-good';
                effectText = 'グッド!';
                this.combo++;
                break;
            case 'early':
                points = 5;
                effectClass = 'effect-early';
                effectText = '早い!';
                this.combo++;
                break;
            default:
                this.combo = 0;
                return;
        }
        
        // コンボボーナス
        if (this.combo >= 2) {
            const comboBonus = this.combo * 5;
            points += comboBonus;
        }
        
        this.score += points;
        this.showEffect(effectText, effectClass, points);
        this.updateUI();
    }
    
    zubonFell() {
        if (this.gameState !== 'playing') return;
        
        this.life--;
        this.combo = 0;
        this.canClick = false;
        this.elements.characterArea.classList.remove('clickable');
        
        this.showEffect('ズボンが落ちた!', 'effect-miss');
        
        if (this.life <= 0) {
            this.gameOver();
        } else {
            this.resetZubonAfterFall();
            this.scheduleNextEvent();
        }
        
        this.updateUI();
    }
    
    resetZubonAfterSave() {
        this.elements.zubon.className = 'zubon saved';
        this.currentPhase = 'normal';
        
        setTimeout(() => {
            this.elements.zubon.className = 'zubon';
        }, 500);
    }
    
    resetZubonAfterFall() {
        setTimeout(() => {
            this.resetZubon();
        }, 1000);
    }
    
    resetZubon() {
        this.elements.zubon.className = 'zubon';
        this.currentPhase = 'normal';
    }
    
    gameOver() {
        this.gameState = 'game-over';
        this.canClick = false;
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        this.elements.retryButton.style.display = 'inline-block';
        this.elements.gameContainer.className = 'game-container game-over';
        this.elements.characterArea.classList.remove('clickable');
        
        this.updateUI();
    }
    
    showEffect(text, className, points = null) {
        const effect = document.createElement('div');
        effect.className = className;
        effect.textContent = text;
        
        if (points && points > 10) {
            effect.textContent += ` +${points}`;
        }
        
        // エフェクトの位置をランダムに設定
        const characterArea = this.elements.characterArea.getBoundingClientRect();
        const gameContainer = this.elements.gameContainer.getBoundingClientRect();
        
        effect.style.left = (characterArea.left - gameContainer.left + Math.random() * 100) + 'px';
        effect.style.top = (characterArea.top - gameContainer.top + Math.random() * 100) + 'px';
        
        this.elements.effects.appendChild(effect);
        
        // スパークルエフェクトを追加
        if (className === 'effect-perfect') {
            this.createSparkles();
        }
        
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 1000);
    }
    
    createSparkles() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const sparkle = document.createElement('div');
                sparkle.className = 'effect-sparkle';
                
                const characterArea = this.elements.characterArea.getBoundingClientRect();
                const gameContainer = this.elements.gameContainer.getBoundingClientRect();
                
                sparkle.style.left = (characterArea.left - gameContainer.left + Math.random() * 200) + 'px';
                sparkle.style.top = (characterArea.top - gameContainer.top + Math.random() * 200) + 'px';
                
                this.elements.effects.appendChild(sparkle);
                
                setTimeout(() => {
                    if (sparkle.parentNode) {
                        sparkle.parentNode.removeChild(sparkle);
                    }
                }, 1000);
            }, i * 100);
        }
    }
    
    updateUI() {
        this.elements.score.textContent = this.score;
        this.elements.life.textContent = this.life;
        this.elements.combo.textContent = this.combo;
        
        // 状態メッセージの更新
        this.elements.status.className = 'status-message';
        switch (this.gameState) {
            case 'ready':
                this.elements.status.textContent = '準備中';
                this.elements.status.classList.add('ready');
                break;
            case 'playing':
                this.elements.status.textContent = 'ゲーム中';
                this.elements.status.classList.add('playing');
                break;
            case 'game-over':
                this.elements.status.textContent = 'ゲームオーバー';
                this.elements.status.classList.add('game-over');
                break;
        }
    }
}

// ゲーム初期化
let game;

document.addEventListener('DOMContentLoaded', () => {
    game = new ZubonAgeGame();
});

// テスト用のヘルパー関数
if (typeof window !== 'undefined') {
    window.testHelpers = {
        getGameState: () => game?.gameState,
        getScore: () => game?.score,
        getLife: () => game?.life,
        getCombo: () => game?.combo,
        getCurrentPhase: () => game?.currentPhase,
        forceZubonEvent: () => game?.startZubonEvent(),
        forceGameOver: () => {
            if (game) {
                game.life = 0;
                game.gameOver();
            }
        }
    };
}