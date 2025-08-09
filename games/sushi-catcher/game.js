// ゲーム状態管理
class SushiCatcher {
    constructor() {
        this.gameState = 'ready'; // ready, playing, finished
        this.score = 0;
        this.combo = 0;
        this.timeLeft = 60;
        this.currentOrder = null;
        this.sushiCounter = 0;
        this.gameTimer = null;
        this.sushiSpawnTimer = null;
        
        // 寿司の種類定義
        this.sushiTypes = [
            { id: 'maguro', name: 'まぐろ', class: 'sushi-maguro' },
            { id: 'salmon', name: 'サーモン', class: 'sushi-salmon' },
            { id: 'ebi', name: 'えび', class: 'sushi-ebi' },
            { id: 'tamago', name: 'たまご', class: 'sushi-tamago' },
            { id: 'ikura', name: 'いくら', class: 'sushi-ikura' },
            { id: 'uni', name: 'うに', class: 'sushi-uni' }
        ];
        
        this.initializeElements();
        this.attachEventListeners();
        this.generateNewOrder();
    }
    
    initializeElements() {
        this.elements = {
            startBtn: document.getElementById('start-btn'),
            retryBtn: document.getElementById('retry-btn'),
            timer: document.getElementById('timer'),
            score: document.getElementById('score'),
            combo: document.getElementById('combo'),
            order: document.getElementById('order'),
            laneArea: document.getElementById('lane'),
            sushiContainer: document.getElementById('sushi-container'),
            gameStatus: document.getElementById('game-status'),
            finalScore: document.getElementById('final-score')
        };
    }
    
    attachEventListeners() {
        this.elements.startBtn.addEventListener('click', () => this.startGame());
        this.elements.retryBtn.addEventListener('click', () => this.resetGame());
        
        // 寿司皿のクリックイベントは動的に追加
    }
    
    startGame() {
        this.gameState = 'playing';
        this.elements.gameStatus.setAttribute('data-status', 'playing');
        this.elements.startBtn.disabled = true;
        this.elements.retryBtn.style.display = 'none';
        this.elements.finalScore.style.display = 'none';
        
        this.startTimer();
        this.startSushiSpawn();
    }
    
    startTimer() {
        this.gameTimer = setInterval(() => {
            this.timeLeft--;
            this.elements.timer.textContent = this.timeLeft;
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }
    
    startSushiSpawn() {
        this.spawnSushi();
        this.sushiSpawnTimer = setInterval(() => {
            this.spawnSushi();
        }, 1500); // 1.5秒間隔で寿司生成
    }
    
    spawnSushi() {
        if (this.gameState !== 'playing') return;
        
        const sushi = document.createElement('div');
        sushi.className = 'sushi-plate';
        
        // ランダムに寿司の種類を選択（注文の寿司が出る確率を高める）
        let sushiType;
        if (Math.random() < 0.3 && this.currentOrder) {
            // 30%の確率で注文の寿司
            sushiType = this.currentOrder;
        } else {
            // ランダムに選択
            sushiType = this.sushiTypes[Math.floor(Math.random() * this.sushiTypes.length)];
        }
        
        sushi.classList.add(sushiType.class);
        sushi.textContent = sushiType.name;
        sushi.dataset.sushiType = sushiType.id;
        sushi.dataset.sushiId = `sushi-${++this.sushiCounter}`;
        
        // 初期位置（右端の外側）
        sushi.style.right = '-100px';
        sushi.style.top = '50%';
        sushi.style.transform = 'translateY(-50%)';
        
        // クリックイベント追加
        sushi.addEventListener('click', (e) => this.catchSushi(e.target));
        
        this.elements.sushiContainer.appendChild(sushi);
        
        // アニメーション開始
        this.animateSushi(sushi);
    }
    
    animateSushi(sushi) {
        let position = -100; // 右端の外側から開始
        const speed = 2; // ピクセル/フレーム
        
        const animate = () => {
            if (this.gameState !== 'playing') {
                sushi.remove();
                return;
            }
            
            position += speed;
            sushi.style.right = -position + 'px';
            
            // 画面左端に到達したら削除（見逃し判定）
            if (position > window.innerWidth + 100) {
                if (this.currentOrder && sushi.dataset.sushiType === this.currentOrder.id) {
                    this.missedSushi();
                }
                sushi.remove();
                return;
            }
            
            requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
    }
    
    catchSushi(sushi) {
        if (this.gameState !== 'playing' || sushi.classList.contains('caught')) return;
        
        const sushiType = sushi.dataset.sushiType;
        const isCorrect = this.currentOrder && sushiType === this.currentOrder.id;
        
        // 寿司を「キャッチ済み」にマーク
        sushi.classList.add('caught');
        
        if (isCorrect) {
            this.correctCatch(sushi);
        } else {
            this.incorrectCatch(sushi);
        }
        
        // アニメーション後に削除
        setTimeout(() => {
            if (sushi.parentNode) {
                sushi.remove();
            }
        }, 500);
    }
    
    correctCatch(sushi) {
        // スコア計算
        const baseScore = 100;
        const comboBonus = this.combo * 20;
        const totalScore = baseScore + comboBonus;
        
        this.score += totalScore;
        this.combo++;
        
        this.updateDisplay();
        this.showScorePopup(sushi, `+${totalScore}`, 'positive');
        this.generateNewOrder();
    }
    
    incorrectCatch(sushi) {
        const penalty = 50;
        this.score = Math.max(0, this.score - penalty);
        this.combo = 0;
        
        this.updateDisplay();
        this.showScorePopup(sushi, `-${penalty}`, 'negative');
    }
    
    missedSushi() {
        const penalty = 30;
        this.score = Math.max(0, this.score - penalty);
        this.combo = 0;
        
        this.updateDisplay();
    }
    
    showScorePopup(sushi, text, type) {
        const popup = document.createElement('div');
        popup.className = `score-popup ${type}`;
        popup.textContent = text;
        
        const rect = sushi.getBoundingClientRect();
        const containerRect = this.elements.laneArea.getBoundingClientRect();
        
        popup.style.position = 'absolute';
        popup.style.left = (rect.left - containerRect.left + rect.width / 2) + 'px';
        popup.style.top = (rect.top - containerRect.top) + 'px';
        popup.style.zIndex = '1000';
        
        this.elements.laneArea.appendChild(popup);
        
        setTimeout(() => {
            if (popup.parentNode) {
                popup.remove();
            }
        }, 1000);
    }
    
    generateNewOrder() {
        this.currentOrder = this.sushiTypes[Math.floor(Math.random() * this.sushiTypes.length)];
        this.elements.order.textContent = `注文: ${this.currentOrder.name}`;
    }
    
    updateDisplay() {
        this.elements.score.textContent = this.score;
        this.elements.combo.textContent = this.combo;
    }
    
    endGame() {
        this.gameState = 'finished';
        this.elements.gameStatus.setAttribute('data-status', 'finished');
        
        // タイマー停止
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        
        // 寿司生成停止
        if (this.sushiSpawnTimer) {
            clearInterval(this.sushiSpawnTimer);
            this.sushiSpawnTimer = null;
        }
        
        // 時間ボーナス計算
        const timeBonus = this.timeLeft * 5;
        this.score += timeBonus;
        
        // 最終スコア表示
        this.elements.finalScore.textContent = `最終スコア: ${this.score}点`;
        this.elements.finalScore.style.display = 'block';
        this.elements.retryBtn.style.display = 'inline-block';
        
        this.updateDisplay();
        
        // 既存の寿司を全て削除
        this.elements.sushiContainer.innerHTML = '';
    }
    
    resetGame() {
        // ゲーム状態リセット
        this.gameState = 'ready';
        this.elements.gameStatus.setAttribute('data-status', 'ready');
        this.score = 0;
        this.combo = 0;
        this.timeLeft = 60;
        this.sushiCounter = 0;
        
        // タイマー停止
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        
        if (this.sushiSpawnTimer) {
            clearInterval(this.sushiSpawnTimer);
            this.sushiSpawnTimer = null;
        }
        
        // UI更新
        this.updateDisplay();
        this.elements.timer.textContent = '60';
        this.elements.startBtn.disabled = false;
        this.elements.retryBtn.style.display = 'none';
        this.elements.finalScore.style.display = 'none';
        this.elements.sushiContainer.innerHTML = '';
        
        // 新しい注文生成
        this.generateNewOrder();
    }
}

// テスト用の関数をグローバルに公開
window.endGame = function() {
    if (window.game) {
        window.game.endGame();
    }
};

// ゲーム初期化
document.addEventListener('DOMContentLoaded', () => {
    window.game = new SushiCatcher();
});