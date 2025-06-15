class NekoNadeHoudai {
    constructor() {
        this.gameState = 'ready'; // ready, playing, ended
        this.score = 0;
        this.timeLeft = 60;
        this.combo = 0;
        this.cats = [];
        this.catIdCounter = 0;
        this.gameTimer = null;
        this.catSpawner = null;
        
        // テスト用パラメータの処理
        const urlParams = new URLSearchParams(window.location.search);
        this.isTestMode = urlParams.get('test') === 'true';
        if (this.isTestMode) {
            const testTime = urlParams.get('time');
            if (testTime) {
                this.timeLeft = parseInt(testTime);
            }
        }
        
        // ネコの絵文字配列
        this.catEmojis = ['🐱', '🐈', '😸', '😺', '😻'];
        
        this.initializeElements();
        this.bindEvents();
        this.updateDisplay();
    }
    
    initializeElements() {
        this.elements = {
            startButton: document.getElementById('start-button'),
            retryButton: document.getElementById('retry-button'),
            gameArea: document.getElementById('game-area'),
            scoreDisplay: document.getElementById('score-display'),
            timeDisplay: document.getElementById('time-display'),
            comboDisplay: document.getElementById('combo-display'),
            statusMessage: document.getElementById('status-message'),
            finalScore: document.getElementById('final-score'),
            finalScoreValue: document.getElementById('final-score-value')
        };
    }
    
    bindEvents() {
        this.elements.startButton.addEventListener('click', () => this.startGame());
        this.elements.retryButton.addEventListener('click', () => this.resetGame());
        this.elements.gameArea.addEventListener('click', (e) => this.handleGameAreaClick(e));
    }
    
    startGame() {
        this.gameState = 'playing';
        this.elements.startButton.disabled = true;
        this.elements.statusMessage.textContent = 'プレイ中';
        
        // タイマー開始
        this.gameTimer = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
        
        // ネコの出現開始
        this.startCatSpawning();
    }
    
    startCatSpawning() {
        this.spawnCat(); // 最初のネコをすぐに出現
        
        const scheduleNextCat = () => {
            if (this.gameState !== 'playing') return;
            
            const interval = this.getCatSpawnInterval();
            this.catSpawner = setTimeout(() => {
                this.spawnCat();
                scheduleNextCat();
            }, interval);
        };
        
        scheduleNextCat();
    }
    
    getCatSpawnInterval() {
        // 時間経過による出現間隔の調整
        if (this.timeLeft > 40) {
            return 1500; // 0-20秒: 1.5秒間隔
        } else if (this.timeLeft > 20) {
            return 1000; // 20-40秒: 1.0秒間隔
        } else {
            return 700;  // 40-60秒: 0.7秒間隔
        }
    }
    
    spawnCat() {
        if (this.gameState !== 'playing') return;
        if (this.cats.length >= 3) return; // 最大3匹まで
        
        const cat = this.createCatElement();
        this.elements.gameArea.appendChild(cat);
        this.cats.push({
            id: this.catIdCounter++,
            element: cat,
            timer: setTimeout(() => {
                this.removeCat(cat, false);
            }, 3000) // 3秒で自動消失
        });
    }
    
    createCatElement() {
        const cat = document.createElement('div');
        cat.className = 'cat';
        cat.setAttribute('data-testid', 'cat');
        cat.setAttribute('data-cat-id', this.catIdCounter);
        
        // ランダムなネコ絵文字を選択
        const emoji = this.catEmojis[Math.floor(Math.random() * this.catEmojis.length)];
        cat.textContent = emoji;
        
        // ランダムな位置に配置（重複を避ける）
        const position = this.getRandomPosition();
        cat.style.left = position.x + 'px';
        cat.style.top = position.y + 'px';
        
        cat.addEventListener('click', (e) => {
            e.stopPropagation();
            this.petCat(cat);
        });
        
        return cat;
    }
    
    getRandomPosition() {
        const gameAreaRect = this.elements.gameArea.getBoundingClientRect();
        const catSize = 80;
        const margin = 10;
        
        let attempts = 0;
        let position;
        
        do {
            position = {
                x: Math.random() * (gameAreaRect.width - catSize - margin * 2) + margin,
                y: Math.random() * (gameAreaRect.height - catSize - margin * 2) + margin
            };
            attempts++;
        } while (this.isPositionOverlapping(position, catSize) && attempts < 10);
        
        return position;
    }
    
    isPositionOverlapping(newPos, size) {
        return this.cats.some(cat => {
            const catRect = cat.element.getBoundingClientRect();
            const gameAreaRect = this.elements.gameArea.getBoundingClientRect();
            
            const catPos = {
                x: catRect.left - gameAreaRect.left,
                y: catRect.top - gameAreaRect.top
            };
            
            const distance = Math.sqrt(
                Math.pow(newPos.x - catPos.x, 2) + 
                Math.pow(newPos.y - catPos.y, 2)
            );
            
            return distance < size + 20; // 適度な間隔を保つ
        });
    }
    
    petCat(catElement) {
        if (catElement.classList.contains('clicked')) return; // 重複クリック防止
        
        catElement.classList.add('clicked');
        
        // スコア計算
        let points = 10; // 基本得点
        this.combo++;
        
        // 連続ボーナス
        if (this.combo >= 15) {
            points += 15;
        } else if (this.combo >= 10) {
            points += 10;
        } else if (this.combo >= 5) {
            points += 5;
        }
        
        this.score += points;
        
        // ハートエフェクト
        this.showHeartEffect(catElement);
        
        // ネコを削除
        this.removeCat(catElement, true);
        
        this.updateDisplay();
    }
    
    showHeartEffect(catElement) {
        const heart = document.createElement('div');
        heart.className = 'heart-effect';
        heart.textContent = '💖';
        
        const catRect = catElement.getBoundingClientRect();
        const gameAreaRect = this.elements.gameArea.getBoundingClientRect();
        
        heart.style.left = (catRect.left - gameAreaRect.left + 30) + 'px';
        heart.style.top = (catRect.top - gameAreaRect.top + 10) + 'px';
        
        this.elements.gameArea.appendChild(heart);
        
        setTimeout(() => {
            if (heart.parentNode) {
                heart.parentNode.removeChild(heart);
            }
        }, 1000);
    }
    
    removeCat(catElement, wasPetted) {
        const catIndex = this.cats.findIndex(cat => cat.element === catElement);
        if (catIndex === -1) return;
        
        const cat = this.cats[catIndex];
        
        // タイマーをクリア
        if (cat.timer) {
            clearTimeout(cat.timer);
        }
        
        // 配列から削除
        this.cats.splice(catIndex, 1);
        
        // DOM から削除（アニメーション後）
        if (!wasPetted) {
            catElement.classList.add('disappearing');
        }
        
        setTimeout(() => {
            if (catElement.parentNode) {
                catElement.parentNode.removeChild(catElement);
            }
        }, wasPetted ? 500 : 300);
    }
    
    handleGameAreaClick(e) {
        if (this.gameState !== 'playing') return;
        if (e.target.classList.contains('cat')) return; // ネコのクリックは別処理
        
        // 空クリック - コンボリセット
        this.combo = 0;
        this.updateDisplay();
    }
    
    endGame() {
        this.gameState = 'ended';
        
        // タイマー停止
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        
        if (this.catSpawner) {
            clearTimeout(this.catSpawner);
            this.catSpawner = null;
        }
        
        // 残りのネコを削除
        this.cats.forEach(cat => {
            if (cat.timer) {
                clearTimeout(cat.timer);
            }
            if (cat.element.parentNode) {
                cat.element.parentNode.removeChild(cat.element);
            }
        });
        this.cats = [];
        
        // UI更新
        this.timeLeft = 0;
        this.elements.statusMessage.textContent = '終了';
        this.elements.finalScoreValue.textContent = this.score;
        this.elements.finalScore.classList.remove('hidden');
        this.elements.retryButton.classList.remove('hidden');
        
        this.updateDisplay();
    }
    
    resetGame() {
        // 状態リセット
        this.gameState = 'ready';
        this.score = 0;
        this.timeLeft = this.isTestMode ? (new URLSearchParams(window.location.search).get('time') || 60) : 60;
        this.combo = 0;
        this.cats = [];
        this.catIdCounter = 0;
        
        // タイマークリア
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        
        if (this.catSpawner) {
            clearTimeout(this.catSpawner);
            this.catSpawner = null;
        }
        
        // UI リセット
        this.elements.startButton.disabled = false;
        this.elements.statusMessage.textContent = '準備中';
        this.elements.finalScore.classList.add('hidden');
        this.elements.retryButton.classList.add('hidden');
        
        // ゲームエリアをクリア
        const hearts = this.elements.gameArea.querySelectorAll('.heart-effect');
        hearts.forEach(heart => heart.remove());
        
        const cats = this.elements.gameArea.querySelectorAll('.cat');
        cats.forEach(cat => cat.remove());
        
        this.updateDisplay();
    }
    
    updateDisplay() {
        this.elements.scoreDisplay.textContent = this.score;
        this.elements.timeDisplay.textContent = this.timeLeft;
        this.elements.comboDisplay.textContent = this.combo;
    }
}

// ゲーム開始
document.addEventListener('DOMContentLoaded', () => {
    new NekoNadeHoudai();
});