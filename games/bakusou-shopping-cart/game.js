class ShoppingCartGame {
    constructor() {
        this.gameArea = document.getElementById('gameArea');
        this.player = document.getElementById('player');
        this.scoreElement = document.getElementById('score');
        this.speedElement = document.getElementById('speed');
        this.gameStatus = document.getElementById('gameStatus');
        this.startButton = document.getElementById('startButton');
        this.restartButton = document.getElementById('restartButton');
        this.gameOverModal = document.getElementById('gameOverModal');
        this.finalScore = document.getElementById('finalScore');
        this.modalRestartButton = document.getElementById('modalRestartButton');

        // ゲーム状態
        this.gameState = 'waiting'; // 'waiting', 'playing', 'gameOver'
        this.score = 0;
        this.speed = 5;
        this.playerPosition = 250; // 初期位置（中央）
        this.gameObjects = []; // アイテムと障害物
        this.keys = {};
        this.lastSpeedDecay = Date.now();
        this.lastScoreUpdate = Date.now();

        // ゲーム設定
        this.gameAreaWidth = 560;
        this.gameAreaHeight = 400;
        this.playerWidth = 40;
        this.playerSpeed = 5;
        this.maxSpeed = 15;
        this.minSpeed = 1;

        // アイテムと障害物の種類
        this.items = ['🍎', '🍞', '🥛', '🍌', '🥕', '🧀', '🍊', '🥖'];
        this.obstacles = ['📦', '🛒', '🗃️', '🚧', '⚠️'];

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDisplay();
    }

    setupEventListeners() {
        // スタートボタン
        this.startButton.addEventListener('click', () => this.startGame());
        this.restartButton.addEventListener('click', () => this.restartGame());
        this.modalRestartButton.addEventListener('click', () => this.restartGame());

        // キーボード操作
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            e.preventDefault();
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // タッチ操作（モバイル）
        this.gameArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.gameArea.getBoundingClientRect();
            const touchX = touch.clientX - rect.left;
            const centerX = rect.width / 2;

            if (touchX < centerX) {
                this.keys['ArrowLeft'] = true;
            } else {
                this.keys['ArrowRight'] = true;
            }
        });

        this.gameArea.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys['ArrowLeft'] = false;
            this.keys['ArrowRight'] = false;
        });

        // クリック操作（PC）
        this.gameArea.addEventListener('mousedown', (e) => {
            if (this.gameState !== 'playing') return;
            
            const rect = this.gameArea.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const centerX = rect.width / 2;

            if (clickX < centerX) {
                this.keys['ArrowLeft'] = true;
            } else {
                this.keys['ArrowRight'] = true;
            }
        });

        this.gameArea.addEventListener('mouseup', () => {
            this.keys['ArrowLeft'] = false;
            this.keys['ArrowRight'] = false;
        });
    }

    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.speed = 5;
        this.playerPosition = this.gameAreaWidth / 2 - this.playerWidth / 2;
        this.gameObjects = [];
        this.lastSpeedDecay = Date.now();
        this.lastScoreUpdate = Date.now();

        this.startButton.style.display = 'none';
        this.restartButton.style.display = 'none';
        this.gameOverModal.style.display = 'none';

        this.updateDisplay();
        this.gameLoop();
        this.spawnObjects();
    }

    restartGame() {
        this.gameState = 'waiting';
        this.startButton.style.display = 'inline-block';
        this.restartButton.style.display = 'none';
        this.gameOverModal.style.display = 'none';
        
        // ゲームオブジェクトを削除
        this.gameObjects.forEach(obj => {
            if (obj.element && obj.element.parentNode) {
                obj.element.parentNode.removeChild(obj.element);
            }
        });
        this.gameObjects = [];
        
        this.score = 0;
        this.speed = 5;
        this.playerPosition = this.gameAreaWidth / 2 - this.playerWidth / 2;
        this.updateDisplay();
    }

    gameLoop() {
        if (this.gameState !== 'playing') return;

        this.handleInput();
        this.updatePlayer();
        this.updateGameObjects();
        this.checkCollisions();
        this.updateScore();
        this.checkSpeedDecay();
        this.checkGameOver();
        this.updateDisplay();

        requestAnimationFrame(() => this.gameLoop());
    }

    handleInput() {
        // 左移動
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.playerPosition = Math.max(0, this.playerPosition - this.playerSpeed);
        }

        // 右移動
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.playerPosition = Math.min(
                this.gameAreaWidth - this.playerWidth,
                this.playerPosition + this.playerSpeed
            );
        }
    }

    updatePlayer() {
        this.player.style.left = this.playerPosition + 'px';
    }

    spawnObjects() {
        if (this.gameState !== 'playing') return;

        // アイテム生成（2-4秒間隔）
        setTimeout(() => {
            if (this.gameState === 'playing') {
                this.createItem();
                this.spawnObjects();
            }
        }, Math.random() * 2000 + 2000);

        // 障害物生成（3-6秒間隔）
        setTimeout(() => {
            if (this.gameState === 'playing') {
                this.createObstacle();
            }
        }, Math.random() * 3000 + 3000);
    }

    createItem() {
        const item = {
            type: 'item',
            x: Math.random() * (this.gameAreaWidth - 30),
            y: -50,
            element: document.createElement('div'),
            emoji: this.items[Math.floor(Math.random() * this.items.length)]
        };

        item.element.className = 'item';
        item.element.textContent = item.emoji;
        item.element.style.left = item.x + 'px';
        item.element.style.top = item.y + 'px';
        item.element.style.animationDuration = (10 / this.speed) + 's';

        this.gameArea.appendChild(item.element);
        this.gameObjects.push(item);
    }

    createObstacle() {
        const obstacle = {
            type: 'obstacle',
            x: Math.random() * (this.gameAreaWidth - 35),
            y: -50,
            element: document.createElement('div'),
            emoji: this.obstacles[Math.floor(Math.random() * this.obstacles.length)]
        };

        obstacle.element.className = 'obstacle';
        obstacle.element.textContent = obstacle.emoji;
        obstacle.element.style.left = obstacle.x + 'px';
        obstacle.element.style.top = obstacle.y + 'px';
        obstacle.element.style.animationDuration = (10 / this.speed) + 's';

        this.gameArea.appendChild(obstacle.element);
        this.gameObjects.push(obstacle);
    }

    updateGameObjects() {
        this.gameObjects.forEach((obj, index) => {
            const rect = obj.element.getBoundingClientRect();
            const gameAreaRect = this.gameArea.getBoundingClientRect();
            
            // オブジェクトが画面下に出たら削除
            if (rect.top > gameAreaRect.bottom) {
                obj.element.parentNode.removeChild(obj.element);
                this.gameObjects.splice(index, 1);
            }
        });
    }

    checkCollisions() {
        const playerRect = this.player.getBoundingClientRect();

        this.gameObjects.forEach((obj, index) => {
            const objRect = obj.element.getBoundingClientRect();

            // 当たり判定
            if (this.isColliding(playerRect, objRect)) {
                if (obj.type === 'item') {
                    this.collectItem();
                } else if (obj.type === 'obstacle') {
                    this.hitObstacle();
                }

                // オブジェクトを削除
                obj.element.parentNode.removeChild(obj.element);
                this.gameObjects.splice(index, 1);
            }
        });
    }

    isColliding(rect1, rect2) {
        return !(rect1.right < rect2.left ||
                rect1.left > rect2.right ||
                rect1.bottom < rect2.top ||
                rect1.top > rect2.bottom);
    }

    collectItem() {
        this.score += 100;
        this.speed = Math.min(this.maxSpeed, this.speed + 1);
    }

    hitObstacle() {
        this.speed = Math.max(this.minSpeed, this.speed - 1);
        
        // ヒットエフェクト
        this.player.classList.add('hit');
        setTimeout(() => {
            this.player.classList.remove('hit');
        }, 500);

        // 一時停止効果
        const originalGameState = this.gameState;
        this.gameState = 'paused';
        setTimeout(() => {
            if (originalGameState === 'playing') {
                this.gameState = 'playing';
            }
        }, 500);
    }

    updateScore() {
        const now = Date.now();
        const deltaTime = (now - this.lastScoreUpdate) / 1000;

        if (deltaTime >= 1) {
            // 距離ボーナス
            this.score += 10;
            
            // スピードボーナス
            this.score += this.speed * 5;
            
            this.lastScoreUpdate = now;
        }
    }

    checkSpeedDecay() {
        const now = Date.now();
        const deltaTime = (now - this.lastSpeedDecay) / 1000;

        if (deltaTime >= 10) {
            this.speed = Math.max(this.minSpeed, this.speed - 1);
            this.lastSpeedDecay = now;
        }
    }

    checkGameOver() {
        // スピードが0以下になった場合
        if (this.speed <= 0) {
            this.gameOver();
        }

        // プレイヤーがコース外に出た場合
        if (this.playerPosition < -this.playerWidth || 
            this.playerPosition > this.gameAreaWidth) {
            this.gameOver();
        }
    }

    gameOver() {
        this.gameState = 'gameOver';
        
        // ゲームオブジェクトを停止
        this.gameObjects.forEach(obj => {
            obj.element.style.animationPlayState = 'paused';
        });

        // 最終スコア表示
        this.finalScore.textContent = this.score;
        this.gameOverModal.style.display = 'flex';
    }

    updateDisplay() {
        this.scoreElement.textContent = this.score;
        this.speedElement.textContent = this.speed;
        
        switch (this.gameState) {
            case 'waiting':
                this.gameStatus.textContent = '待機中';
                break;
            case 'playing':
                this.gameStatus.textContent = 'プレイ中';
                break;
            case 'paused':
                this.gameStatus.textContent = '一時停止';
                break;
            case 'gameOver':
                this.gameStatus.textContent = 'ゲームオーバー';
                break;
        }
    }
}

// ゲーム開始
document.addEventListener('DOMContentLoaded', () => {
    new ShoppingCartGame();
});