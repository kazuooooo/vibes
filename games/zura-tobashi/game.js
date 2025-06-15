// ゲーム状態管理
class ZuraTobashiGame {
    constructor() {
        this.gameField = document.getElementById('gameField');
        this.player = document.getElementById('player');
        this.scoreDisplay = document.getElementById('score');
        this.lifeDisplay = document.getElementById('life');
        this.statusMessage = document.getElementById('statusMessage');
        this.comboDisplay = document.getElementById('comboDisplay');
        this.startButton = document.getElementById('startButton');
        this.retryButton = document.getElementById('retryButton');
        this.touchLeft = document.getElementById('touchLeft');
        this.touchRight = document.getElementById('touchRight');

        // ゲーム状態
        this.gameState = 'ready'; // 'ready', 'countdown', 'playing', 'gameover'
        this.score = 0;
        this.life = 3;
        this.combo = 0;
        this.gameTime = 0;
        this.wigs = [];
        this.playerPosition = 50; // パーセント単位
        this.playerSpeed = 3;
        this.gameSpeed = 1;
        
        // タイマー
        this.gameInterval = null;
        this.wigSpawnInterval = null;
        this.countdownInterval = null;

        // キー状態
        this.keys = {
            left: false,
            right: false
        };

        // 設定値
        this.config = {
            fieldWidth: 800,
            fieldHeight: 500,
            playerSize: 60,
            wigSize: 40,
            wigSpeed: 2,
            wigSpawnRate: 2000, // ミリ秒
            speedIncreaseRate: 0.1,
            comboBonus: 5
        };

        // テストモード
        this.testMode = new URLSearchParams(window.location.search).has('test');
        if (this.testMode) {
            this.config.wigSpawnRate = 500; // テスト時は高速
        }

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateUI();
        this.updatePlayerPosition();
    }

    setupEventListeners() {
        // スタートボタン
        this.startButton.addEventListener('click', () => this.startGame());
        
        // リトライボタン
        this.retryButton.addEventListener('click', () => this.resetGame());

        // キーボード操作
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // タッチ操作
        this.touchLeft.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys.left = true;
        });
        this.touchLeft.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys.left = false;
        });
        this.touchRight.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys.right = true;
        });
        this.touchRight.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys.right = false;
        });

        // マウス操作（PC）
        this.touchLeft.addEventListener('mousedown', () => {
            this.keys.left = true;
        });
        this.touchLeft.addEventListener('mouseup', () => {
            this.keys.left = false;
        });
        this.touchRight.addEventListener('mousedown', () => {
            this.keys.right = true;
        });
        this.touchRight.addEventListener('mouseup', () => {
            this.keys.right = false;
        });

        // マウスリーブ時のキー解除
        document.addEventListener('mouseleave', () => {
            this.keys.left = false;
            this.keys.right = false;
        });
    }

    handleKeyDown(e) {
        if (this.gameState !== 'playing') return;

        switch(e.key.toLowerCase()) {
            case 'a':
            case 'arrowleft':
                this.keys.left = true;
                e.preventDefault();
                break;
            case 'd':
            case 'arrowright':
                this.keys.right = true;
                e.preventDefault();
                break;
            case ' ':
                if (this.gameState === 'ready') {
                    this.startGame();
                } else if (this.gameState === 'gameover') {
                    this.resetGame();
                }
                e.preventDefault();
                break;
        }
    }

    handleKeyUp(e) {
        switch(e.key.toLowerCase()) {
            case 'a':
            case 'arrowleft':
                this.keys.left = false;
                e.preventDefault();
                break;
            case 'd':
            case 'arrowright':
                this.keys.right = false;
                e.preventDefault();
                break;
        }
    }

    startGame() {
        if (this.gameState !== 'ready') return;
        
        this.gameState = 'countdown';
        this.startButton.style.display = 'none';
        this.startCountdown();
    }

    startCountdown() {
        let count = 3;
        this.statusMessage.textContent = count.toString();
        
        this.countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                this.statusMessage.textContent = count.toString();
            } else if (count === 0) {
                this.statusMessage.textContent = 'スタート！';
            } else {
                clearInterval(this.countdownInterval);
                this.beginGame();
            }
        }, 1000);
    }

    beginGame() {
        this.gameState = 'playing';
        this.statusMessage.textContent = '';
        this.gameTime = 0;
        
        // ゲームループ開始
        this.gameInterval = setInterval(() => this.gameLoop(), 16); // 約60FPS
        
        // ヅラ生成開始
        this.scheduleWigSpawn();
    }

    gameLoop() {
        if (this.gameState !== 'playing') return;

        this.gameTime += 16;
        this.updatePlayerMovement();
        this.updateWigs();
        this.updateGameSpeed();
        this.checkCollisions();
        this.updateUI();
    }

    updatePlayerMovement() {
        if (this.keys.left && this.playerPosition > 0) {
            this.playerPosition -= this.playerSpeed;
            if (this.playerPosition < 0) this.playerPosition = 0;
        }
        if (this.keys.right && this.playerPosition < 100) {
            this.playerPosition += this.playerSpeed;
            if (this.playerPosition > 100) this.playerPosition = 100;
        }
        this.updatePlayerPosition();
    }

    updatePlayerPosition() {
        this.player.style.left = `${this.playerPosition}%`;
    }

    scheduleWigSpawn() {
        if (this.gameState !== 'playing') return;

        this.wigSpawnInterval = setTimeout(() => {
            this.spawnWig();
            this.scheduleWigSpawn();
        }, this.config.wigSpawnRate / this.gameSpeed);
    }

    spawnWig() {
        const wig = {
            id: Date.now() + Math.random(),
            x: Math.random() * 90 + 5, // 5-95%の範囲
            y: -10,
            element: null,
            isSpecial: this.gameTime > 60000 && Math.random() < 0.1 // 60秒後に10%の確率
        };

        // DOM要素作成
        const wigElement = document.createElement('div');
        wigElement.className = wig.isSpecial ? 'wig special' : 'wig normal';
        wigElement.textContent = '🎩'; // ヅラの絵文字
        wigElement.style.left = `${wig.x}%`;
        wigElement.style.top = `${wig.y}%`;
        
        wig.element = wigElement;
        this.gameField.appendChild(wigElement);
        this.wigs.push(wig);
    }

    updateWigs() {
        this.wigs = this.wigs.filter(wig => {
            if (!wig.element.parentNode) return false;

            wig.y += this.config.wigSpeed * this.gameSpeed;
            wig.element.style.top = `${wig.y}%`;

            // 画面下部に到達した場合
            if (wig.y > 100) {
                this.gameField.removeChild(wig.element);
                this.loseLife();
                return false;
            }

            return true;
        });
    }

    updateGameSpeed() {
        // 30秒ごとに速度アップ
        const newSpeed = 1 + Math.floor(this.gameTime / 30000) * this.config.speedIncreaseRate;
        this.gameSpeed = newSpeed;
    }

    checkCollisions() {
        const playerRect = this.getPlayerRect();

        this.wigs.forEach((wig, index) => {
            const wigRect = this.getWigRect(wig);
            
            if (this.isColliding(playerRect, wigRect)) {
                this.catchWig(wig, index);
            }
        });
    }

    getPlayerRect() {
        const rect = this.player.getBoundingClientRect();
        const fieldRect = this.gameField.getBoundingClientRect();
        
        return {
            left: rect.left - fieldRect.left,
            right: rect.right - fieldRect.left,
            top: rect.top - fieldRect.top,
            bottom: rect.bottom - fieldRect.top
        };
    }

    getWigRect(wig) {
        const rect = wig.element.getBoundingClientRect();
        const fieldRect = this.gameField.getBoundingClientRect();
        
        return {
            left: rect.left - fieldRect.left,
            right: rect.right - fieldRect.left,
            top: rect.top - fieldRect.top,
            bottom: rect.bottom - fieldRect.top
        };
    }

    isColliding(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                rect1.left > rect2.right || 
                rect1.bottom < rect2.top || 
                rect1.top > rect2.bottom);
    }

    catchWig(wig, index) {
        // スコア加算
        const baseScore = wig.isSpecial ? 50 : 10;
        const comboBonus = this.combo * this.config.comboBonus;
        const totalScore = baseScore + comboBonus;
        
        this.score += totalScore;
        this.combo++;

        // エフェクト表示
        this.showCatchEffect(wig.element, totalScore);

        // コンボ表示
        if (this.combo >= 3) {
            this.showComboEffect();
        }

        // ヅラ削除
        this.gameField.removeChild(wig.element);
        this.wigs.splice(index, 1);
    }

    showCatchEffect(wigElement, score) {
        const effect = document.createElement('div');
        effect.className = 'catch-effect';
        effect.textContent = `+${score}`;
        
        const rect = wigElement.getBoundingClientRect();
        const fieldRect = this.gameField.getBoundingClientRect();
        
        effect.style.left = `${rect.left - fieldRect.left}px`;
        effect.style.top = `${rect.top - fieldRect.top}px`;
        
        this.gameField.appendChild(effect);
        
        setTimeout(() => {
            if (effect.parentNode) {
                this.gameField.removeChild(effect);
            }
        }, 1000);
    }

    showComboEffect() {
        this.comboDisplay.textContent = `COMBO x${this.combo}!`;
        this.comboDisplay.style.display = 'block';
        
        setTimeout(() => {
            this.comboDisplay.style.display = 'none';
        }, 2000);
    }

    loseLife() {
        this.life--;
        this.combo = 0; // コンボリセット
        
        // ライフ減少エフェクト
        this.gameField.classList.add('life-loss-effect');
        setTimeout(() => {
            this.gameField.classList.remove('life-loss-effect');
        }, 500);

        if (this.life <= 0) {
            this.gameOver();
        }
    }

    gameOver() {
        this.gameState = 'gameover';
        
        // タイマー停止
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            this.gameInterval = null;
        }
        if (this.wigSpawnInterval) {
            clearTimeout(this.wigSpawnInterval);
            this.wigSpawnInterval = null;
        }

        // UI更新
        this.statusMessage.textContent = 'ゲームオーバー';
        this.retryButton.style.display = 'inline-block';
        
        // 残りのヅラを削除
        this.wigs.forEach(wig => {
            if (wig.element.parentNode) {
                this.gameField.removeChild(wig.element);
            }
        });
        this.wigs = [];
    }

    resetGame() {
        // ゲーム状態リセット
        this.gameState = 'ready';
        this.score = 0;
        this.life = 3;
        this.combo = 0;
        this.gameTime = 0;
        this.playerPosition = 50;
        this.gameSpeed = 1;

        // タイマー停止
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            this.gameInterval = null;
        }
        if (this.wigSpawnInterval) {
            clearTimeout(this.wigSpawnInterval);
            this.wigSpawnInterval = null;
        }
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }

        // キー状態リセット
        this.keys.left = false;
        this.keys.right = false;

        // 残りのヅラとエフェクトを削除
        this.wigs.forEach(wig => {
            if (wig.element.parentNode) {
                this.gameField.removeChild(wig.element);
            }
        });
        this.wigs = [];

        // エフェクト要素も削除
        const effects = this.gameField.querySelectorAll('.catch-effect');
        effects.forEach(effect => {
            if (effect.parentNode) {
                this.gameField.removeChild(effect);
            }
        });

        // UI リセット
        this.statusMessage.textContent = 'スタートボタンを押してゲーム開始！';
        this.startButton.style.display = 'inline-block';
        this.retryButton.style.display = 'none';
        this.comboDisplay.style.display = 'none';
        
        this.updateUI();
        this.updatePlayerPosition();
    }

    updateUI() {
        this.scoreDisplay.textContent = this.score;
        this.lifeDisplay.textContent = this.life;
    }
}

// ゲーム初期化
let game;

document.addEventListener('DOMContentLoaded', () => {
    game = new ZuraTobashiGame();
});