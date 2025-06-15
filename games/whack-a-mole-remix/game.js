// ゲーム状態管理
class WhackAMoleGame {
    constructor() {
        this.score = 0;
        this.timeLeft = 30;
        this.isGameRunning = false;
        this.gameTimer = null;
        this.spawnTimer = null;
        this.activeCharacters = new Set();
        this.stats = {
            enemyHits: 0,
            allyHits: 0,
            allyMisses: 0
        };
        
        this.initializeElements();
        this.bindEvents();
        this.resetGame();
    }
    
    initializeElements() {
        this.scoreElement = document.getElementById('score');
        this.timerElement = document.getElementById('timer');
        this.startButton = document.getElementById('startButton');
        this.retryButton = document.getElementById('retryButton');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.finalScoreElement = document.getElementById('finalScore');
        this.gameStatsElement = document.getElementById('gameStats');
        
        this.holes = [];
        this.characters = [];
        
        for (let i = 0; i < 9; i++) {
            this.holes.push(document.getElementById(`hole-${i}`));
            this.characters.push(document.querySelector(`[data-testid="character-${i}"]`));
        }
    }
    
    bindEvents() {
        this.startButton.addEventListener('click', () => this.startGame());
        this.retryButton.addEventListener('click', () => this.retryGame());
        
        // キャラクターのクリックイベント
        this.characters.forEach((character, index) => {
            character.addEventListener('click', (e) => this.hitCharacter(index, e));
        });
        
        // 穴のクリックイベント（空の穴をクリックしても何も起こらない）
        this.holes.forEach((hole, index) => {
            hole.addEventListener('click', (e) => {
                // キャラクターのクリックイベントが先に処理されるため、ここでは何もしない
                e.stopPropagation();
            });
        });
    }
    
    startGame() {
        this.isGameRunning = true;
        this.startButton.disabled = true;
        this.startTimer();
        this.startSpawning();
    }
    
    startTimer() {
        this.gameTimer = setInterval(() => {
            this.timeLeft--;
            this.updateTimer();
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }
    
    startSpawning() {
        const spawn = () => {
            if (!this.isGameRunning) return;
            
            this.spawnCharacter();
            
            // 次のスポーン時間をランダムに設定（500ms〜2000ms）
            const nextSpawnTime = Math.random() * 1500 + 500;
            this.spawnTimer = setTimeout(spawn, nextSpawnTime);
        };
        
        // 最初のスポーンを1秒後に開始
        this.spawnTimer = setTimeout(spawn, 1000);
    }
    
    spawnCharacter() {
        // 空いている穴を探す
        const availableHoles = [];
        for (let i = 0; i < 9; i++) {
            if (!this.activeCharacters.has(i)) {
                availableHoles.push(i);
            }
        }
        
        if (availableHoles.length === 0) return;
        
        // ランダムな穴を選択
        const holeIndex = availableHoles[Math.floor(Math.random() * availableHoles.length)];
        
        // キャラクターの種類を決定（70%が敵、30%が味方）
        const isEnemy = Math.random() < 0.7;
        const character = this.characters[holeIndex];
        
        // キャラクターのタイプを設定
        character.classList.remove('enemy', 'ally');
        character.classList.add(isEnemy ? 'enemy' : 'ally');
        character.setAttribute('data-type', isEnemy ? 'enemy' : 'ally');
        
        // キャラクターを表示
        this.showCharacter(holeIndex);
        
        // 1.5秒後に自動的に隠す
        setTimeout(() => {
            if (this.activeCharacters.has(holeIndex)) {
                this.hideCharacter(holeIndex, false);
                
                // 味方を見逃した場合はボーナス点
                if (!isEnemy) {
                    this.addScore(5);
                    this.stats.allyMisses++;
                }
            }
        }, 1500);
    }
    
    showCharacter(index) {
        const character = this.characters[index];
        this.activeCharacters.add(index);
        
        character.style.display = 'block';
        character.classList.add('appearing');
        
        setTimeout(() => {
            character.classList.remove('appearing');
        }, 300);
    }
    
    hideCharacter(index, wasHit = false) {
        const character = this.characters[index];
        this.activeCharacters.delete(index);
        
        if (wasHit) {
            character.classList.add('hit');
            setTimeout(() => {
                character.style.display = 'none';
                character.classList.remove('hit');
            }, 300);
        } else {
            character.classList.add('disappearing');
            setTimeout(() => {
                character.style.display = 'none';
                character.classList.remove('disappearing');
            }, 200);
        }
    }
    
    hitCharacter(index, event) {
        event.stopPropagation();
        
        if (!this.isGameRunning || !this.activeCharacters.has(index)) {
            return;
        }
        
        const character = this.characters[index];
        const isEnemy = character.classList.contains('enemy');
        
        if (isEnemy) {
            // 敵を叩いた場合
            this.addScore(10);
            this.stats.enemyHits++;
        } else {
            // 味方を叩いた場合
            this.addScore(-20);
            this.stats.allyHits++;
        }
        
        this.hideCharacter(index, true);
    }
    
    addScore(points) {
        this.score += points;
        this.updateScore();
        
        // スコア変更アニメーション
        this.scoreElement.classList.add('score-change');
        setTimeout(() => {
            this.scoreElement.classList.remove('score-change');
        }, 500);
    }
    
    updateScore() {
        this.scoreElement.textContent = `${this.score}点`;
    }
    
    updateTimer() {
        this.timerElement.textContent = this.timeLeft;
        
        // 残り5秒以下で警告表示
        if (this.timeLeft <= 5) {
            this.timerElement.parentElement.classList.add('warning');
        }
    }
    
    endGame() {
        this.isGameRunning = false;
        
        // タイマーを停止
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        
        if (this.spawnTimer) {
            clearTimeout(this.spawnTimer);
            this.spawnTimer = null;
        }
        
        // アクティブなキャラクターを全て隠す
        this.activeCharacters.forEach(index => {
            this.hideCharacter(index, false);
        });
        
        // 結果を表示
        this.showGameOver();
    }
    
    showGameOver() {
        this.finalScoreElement.textContent = `${this.score}点`;
        
        // 統計を更新
        document.getElementById('enemyHits').textContent = this.stats.enemyHits;
        document.getElementById('allyHits').textContent = this.stats.allyHits;
        document.getElementById('allyMisses').textContent = this.stats.allyMisses;
        
        this.gameOverScreen.style.display = 'flex';
    }
    
    retryGame() {
        this.gameOverScreen.style.display = 'none';
        this.resetGame();
    }
    
    resetGame() {
        this.score = 0;
        this.timeLeft = 30;
        this.isGameRunning = false;
        this.activeCharacters.clear();
        this.stats = {
            enemyHits: 0,
            allyHits: 0,
            allyMisses: 0
        };
        
        // タイマーをクリア
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        
        if (this.spawnTimer) {
            clearTimeout(this.spawnTimer);
            this.spawnTimer = null;
        }
        
        // UI要素をリセット
        this.updateScore();
        this.timerElement.textContent = '30';
        this.timerElement.parentElement.classList.remove('warning');
        this.startButton.disabled = false;
        
        // 全てのキャラクターを隠す
        this.characters.forEach(character => {
            character.style.display = 'none';
            character.classList.remove('appearing', 'disappearing', 'hit', 'enemy', 'ally');
        });
    }
}

// ページ読み込み完了後にゲームを初期化
document.addEventListener('DOMContentLoaded', () => {
    window.game = new WhackAMoleGame();
});