class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.timeDisplay = document.getElementById('timeDisplay');
        this.gameMessage = document.getElementById('gameMessage');
        this.restartButton = document.getElementById('restartButton');
        
        this.init();
        this.setupEventListeners();
        this.gameLoop();
    }

    init() {
        // ゲーム状態
        this.gameState = 'playing'; // 'playing', 'gameOver', 'gameCleared'
        this.startTime = Date.now();
        this.gameTime = 0;
        this.clearTime = 30000; // 30秒でクリア
        
        // プレイヤー設定
        this.player = {
            x: 400, // 画面中央
            y: 200, // 床の上
            radius: 10,
            color: '#007bff',
            velocityY: 0,
            onGround: false,
            jumpPower: -15,
            gravity: 0.8
        };
        
        // 床設定
        this.platform = {
            width: 200,
            height: 20,
            color: '#8b4513',
            centerX: 400,
            centerY: 300,
            distance: 100, // 中心からの距離
            angle: 0,
            rotationSpeed: 2 // 度/フレーム
        };
        
        // 床の実際の位置を計算
        this.updatePlatformPosition();
        
        // プレイヤーを床の上に配置
        this.player.x = this.platform.x + this.platform.width / 2;
        this.player.y = this.platform.y - this.player.radius;
        this.player.onGround = true;
        
        // UI更新
        this.gameMessage.textContent = '';
        this.restartButton.style.display = 'none';
    }

    updatePlatformPosition() {
        // 角度をラジアンに変換
        const radian = (this.platform.angle * Math.PI) / 180;
        
        // 回転による床の位置
        this.platform.x = this.platform.centerX + Math.cos(radian) * this.platform.distance - this.platform.width / 2;
        this.platform.y = this.platform.centerY + Math.sin(radian) * this.platform.distance - this.platform.height / 2;
    }

    setupEventListeners() {
        // スペースキーでジャンプ
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.jump();
            }
        });
        
        // クリックでジャンプ
        this.canvas.addEventListener('click', () => {
            this.jump();
        });
        
        // リスタートボタン
        this.restartButton.addEventListener('click', () => {
            this.init();
        });
    }

    jump() {
        if (this.gameState === 'playing' && this.player.onGround) {
            this.player.velocityY = this.player.jumpPower;
            this.player.onGround = false;
        }
    }

    update() {
        if (this.gameState !== 'playing') return;
        
        // 時間更新
        this.gameTime = Date.now() - this.startTime;
        this.timeDisplay.textContent = (this.gameTime / 1000).toFixed(1) + '秒';
        
        // クリア判定
        if (this.gameTime >= this.clearTime) {
            this.gameState = 'gameCleared';
            this.gameMessage.textContent = 'Game Clear!';
            this.restartButton.style.display = 'inline-block';
            return;
        }
        
        // 床の回転
        this.platform.angle += this.platform.rotationSpeed;
        this.updatePlatformPosition();
        
        // プレイヤーの物理演算
        if (!this.player.onGround) {
            this.player.velocityY += this.player.gravity;
        }
        this.player.y += this.player.velocityY;
        
        // 床との衝突判定
        this.checkPlatformCollision();
        
        // ゲームオーバー判定（画面下端に落下）
        if (this.player.y > this.canvas.height + this.player.radius) {
            this.gameState = 'gameOver';
            this.gameMessage.textContent = 'Game Over!';
            this.restartButton.style.display = 'inline-block';
        }
    }

    checkPlatformCollision() {
        // プレイヤーが床と接触しているかチェック
        const playerBottom = this.player.y + this.player.radius;
        const playerTop = this.player.y - this.player.radius;
        const playerLeft = this.player.x - this.player.radius;
        const playerRight = this.player.x + this.player.radius;
        
        const platformTop = this.platform.y;
        const platformBottom = this.platform.y + this.platform.height;
        const platformLeft = this.platform.x;
        const platformRight = this.platform.x + this.platform.width;
        
        // 床の上から落下している場合の着地判定
        if (this.player.velocityY >= 0 && 
            playerBottom >= platformTop && 
            playerTop <= platformBottom &&
            playerRight >= platformLeft && 
            playerLeft <= platformRight) {
            
            // 床に着地
            this.player.y = platformTop - this.player.radius;
            this.player.velocityY = 0;
            this.player.onGround = true;
            
            // 床と一緒に回転移動
            const radian = (this.platform.angle * Math.PI) / 180;
            const rotationSpeed = this.platform.rotationSpeed * Math.PI / 180;
            
            // 回転による横移動
            this.player.x += -Math.sin(radian) * this.platform.distance * rotationSpeed;
        } else if (this.player.onGround) {
            // 床から離れた場合
            this.player.onGround = false;
        }
    }

    render() {
        // 画面クリア
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 床を描画
        this.ctx.fillStyle = this.platform.color;
        this.ctx.fillRect(this.platform.x, this.platform.y, this.platform.width, this.platform.height);
        
        // 回転軸を描画（デバッグ用の小さな点）
        this.ctx.fillStyle = '#333';
        this.ctx.beginPath();
        this.ctx.arc(this.platform.centerX, this.platform.centerY, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // プレイヤーを描画
        this.ctx.fillStyle = this.player.color;
        this.ctx.beginPath();
        this.ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// ゲーム開始
window.addEventListener('load', () => {
    new Game();
});