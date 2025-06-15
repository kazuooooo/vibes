// ゲーム状態管理
class SlowLifeSwordsmanGame {
    constructor() {
        this.gameField = document.getElementById('game-field');
        this.swordsman = document.getElementById('swordsman');
        this.attackRange = document.getElementById('attack-range');
        this.slashButton = document.getElementById('slash-button');
        this.scoreElement = document.getElementById('score');
        this.healthElement = document.getElementById('health');
        this.timerElement = document.getElementById('timer');
        this.resultArea = document.getElementById('result-area');
        this.restartButton = document.getElementById('restart-button');
        
        // ゲーム状態
        this.score = 0;
        this.health = 3;
        this.timeLeft = 60;
        this.enemies = [];
        this.isGameRunning = false;
        this.gameLoop = null;
        this.enemySpawnTimer = null;
        this.gameTimer = null;
        this.enemiesDefeated = 0;
        
        // ゲーム設定
        this.ENEMY_SPEED = 20; // pixels per second (very slow)
        this.ENEMY_SPAWN_INTERVAL_MIN = 2000; // 2 seconds
        this.ENEMY_SPAWN_INTERVAL_MAX = 4000; // 4 seconds
        this.ATTACK_RANGE = 80; // pixels
        this.SWORDSMAN_POS = { x: 400, y: 200 }; // center of 800x400 field
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.startGame();
    }
    
    setupEventListeners() {
        this.slashButton.addEventListener('click', () => this.attack());
        this.restartButton.addEventListener('click', () => this.restartGame());
    }
    
    startGame() {
        this.isGameRunning = true;
        this.score = 0;
        this.health = 3;
        this.timeLeft = 60;
        this.enemies = [];
        this.enemiesDefeated = 0;
        
        this.updateUI();
        this.hideResult();
        
        // ゲームループ開始
        this.gameLoop = setInterval(() => this.update(), 16); // ~60 FPS
        
        // 敵のスポーン開始
        this.scheduleEnemySpawn();
        
        // タイマー開始
        this.gameTimer = setInterval(() => this.updateTimer(), 1000);
    }
    
    update() {
        if (!this.isGameRunning) return;
        
        this.updateEnemies();
        this.checkCollisions();
    }
    
    updateEnemies() {
        const deltaTime = 16 / 1000; // 16ms in seconds
        
        this.enemies.forEach((enemy, index) => {
            if (enemy.element.classList.contains('defeated')) {
                return; // Skip defeated enemies
            }
            
            // 敵を剣士に向かって移動
            const dx = this.SWORDSMAN_POS.x - enemy.x;
            const dy = this.SWORDSMAN_POS.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 15) { // まだ剣士に到達していない
                const moveX = (dx / distance) * this.ENEMY_SPEED * deltaTime;
                const moveY = (dy / distance) * this.ENEMY_SPEED * deltaTime;
                
                enemy.x += moveX;
                enemy.y += moveY;
                
                // 敵の位置を更新
                enemy.element.style.left = (enemy.x - 15) + 'px'; // center the enemy
                enemy.element.style.top = (enemy.y - 15) + 'px';
            } else {
                // 剣士に到達 - ダメージを与える
                this.takeDamage();
                this.removeEnemy(index);
            }
        });
    }
    
    checkCollisions() {
        // 攻撃中でない場合は当たり判定をスキップ
        if (!this.attackRange.classList.contains('visible')) {
            return;
        }
        
        this.enemies.forEach((enemy, index) => {
            if (enemy.element.classList.contains('defeated')) {
                return; // Skip already defeated enemies
            }
            
            const distance = Math.sqrt(
                Math.pow(enemy.x - this.SWORDSMAN_POS.x, 2) + 
                Math.pow(enemy.y - this.SWORDSMAN_POS.y, 2)
            );
            
            if (distance <= this.ATTACK_RANGE) {
                this.defeatEnemy(index);
            }
        });
    }
    
    attack() {
        if (!this.isGameRunning) return;
        
        // 攻撃エフェクト
        this.swordsman.classList.add('attacking');
        this.attackRange.classList.add('visible');
        
        // エフェクトを短時間表示
        setTimeout(() => {
            this.swordsman.classList.remove('attacking');
            this.attackRange.classList.remove('visible');
        }, 300);
    }
    
    defeatEnemy(index) {
        const enemy = this.enemies[index];
        if (!enemy || enemy.element.classList.contains('defeated')) {
            return;
        }
        
        // 敵を倒すエフェクト
        enemy.element.classList.add('defeated');
        
        // スコア加算
        this.score += 10;
        this.enemiesDefeated++;
        this.updateUI();
        
        // 敵を削除（アニメーション後）
        setTimeout(() => {
            this.removeEnemy(index);
        }, 300);
    }
    
    removeEnemy(index) {
        if (this.enemies[index]) {
            const enemy = this.enemies[index];
            if (enemy.element.parentNode) {
                enemy.element.parentNode.removeChild(enemy.element);
            }
            this.enemies.splice(index, 1);
        }
    }
    
    spawnEnemy() {
        if (!this.isGameRunning) return;
        
        const enemy = document.createElement('div');
        enemy.className = 'enemy';
        enemy.setAttribute('data-testid', 'enemy');
        
        // ランダムな出現位置（左端または右端）
        const side = Math.random() < 0.5 ? 'left' : 'right';
        const x = side === 'left' ? 50 : 750; // field width is 800px
        const y = 100 + Math.random() * 200; // random height in middle area
        
        enemy.style.left = (x - 15) + 'px';
        enemy.style.top = (y - 15) + 'px';
        
        this.gameField.appendChild(enemy);
        
        this.enemies.push({
            element: enemy,
            x: x,
            y: y
        });
        
        // 次の敵のスポーンをスケジュール
        this.scheduleEnemySpawn();
    }
    
    scheduleEnemySpawn() {
        if (!this.isGameRunning) return;
        
        const delay = this.ENEMY_SPAWN_INTERVAL_MIN + 
                     Math.random() * (this.ENEMY_SPAWN_INTERVAL_MAX - this.ENEMY_SPAWN_INTERVAL_MIN);
        
        this.enemySpawnTimer = setTimeout(() => this.spawnEnemy(), delay);
    }
    
    takeDamage() {
        this.health--;
        this.updateUI();
        
        if (this.health <= 0) {
            this.endGame();
        }
    }
    
    updateTimer() {
        if (!this.isGameRunning) return;
        
        this.timeLeft--;
        this.updateUI();
        
        if (this.timeLeft <= 0) {
            this.endGame();
        }
    }
    
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.healthElement.textContent = this.health;
        this.timerElement.textContent = this.timeLeft;
    }
    
    endGame() {
        this.isGameRunning = false;
        
        // タイマーとループを停止
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        if (this.enemySpawnTimer) {
            clearTimeout(this.enemySpawnTimer);
            this.enemySpawnTimer = null;
        }
        
        // パーフェクトボーナス
        if (this.health === 3) {
            this.score += 50;
        }
        
        this.showResult();
    }
    
    showResult() {
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('enemies-defeated').textContent = this.enemiesDefeated;
        this.resultArea.style.display = 'block';
    }
    
    hideResult() {
        this.resultArea.style.display = 'none';
    }
    
    restartGame() {
        // 全ての敵を削除
        this.enemies.forEach(enemy => {
            if (enemy.element.parentNode) {
                enemy.element.parentNode.removeChild(enemy.element);
            }
        });
        
        // タイマーをクリア
        if (this.gameLoop) clearInterval(this.gameLoop);
        if (this.gameTimer) clearInterval(this.gameTimer);
        if (this.enemySpawnTimer) clearTimeout(this.enemySpawnTimer);
        
        // ゲーム再開
        this.startGame();
    }
}

// ゲーム開始
document.addEventListener('DOMContentLoaded', () => {
    new SlowLifeSwordsmanGame();
});