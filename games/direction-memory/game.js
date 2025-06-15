class DirectionMemoryGame {
    constructor() {
        this.level = 1;
        this.score = 0;
        this.currentSequence = [];
        this.playerInput = [];
        this.gameState = 'initial'; // initial, displaying, inputting, correct, wrong, gameover
        this.isPlaying = false;
        
        this.directions = ['up', 'down', 'left', 'right'];
        this.directionSymbols = {
            'up': '↑',
            'down': '↓',
            'left': '←',
            'right': '→'
        };
        
        this.initializeElements();
        this.bindEvents();
        this.updateDisplay();
    }
    
    initializeElements() {
        this.elements = {
            startButton: document.getElementById('start-button'),
            retryButton: document.getElementById('retry-button'),
            arrowDisplay: document.getElementById('arrow-display'),
            statusMessage: document.getElementById('status-message'),
            levelDisplay: document.getElementById('level-display'),
            scoreDisplay: document.getElementById('score-display'),
            directionButtons: {
                up: document.getElementById('direction-up'),
                down: document.getElementById('direction-down'),
                left: document.getElementById('direction-left'),
                right: document.getElementById('direction-right')
            }
        };
    }
    
    bindEvents() {
        this.elements.startButton.addEventListener('click', () => this.startGame());
        this.elements.retryButton.addEventListener('click', () => this.restartGame());
        
        // 方向ボタンのイベント
        Object.keys(this.elements.directionButtons).forEach(direction => {
            this.elements.directionButtons[direction].addEventListener('click', () => {
                if (this.gameState === 'inputting') {
                    this.handlePlayerInput(direction);
                }
            });
        });
    }
    
    startGame() {
        this.gameState = 'displaying';
        this.isPlaying = true;
        this.elements.startButton.style.display = 'none';
        this.elements.retryButton.style.display = 'none';
        this.disableDirectionButtons();
        this.generateSequence();
        this.displaySequence();
    }
    
    restartGame() {
        this.level = 1;
        this.score = 0;
        this.currentSequence = [];
        this.playerInput = [];
        this.gameState = 'initial';
        this.isPlaying = false;
        
        this.elements.retryButton.style.display = 'none';
        this.elements.startButton.style.display = 'inline-block';
        this.elements.statusMessage.textContent = 'スタートボタンを押してゲームを開始してください';
        this.elements.statusMessage.className = 'status-message';
        this.elements.arrowDisplay.textContent = '';
        this.elements.arrowDisplay.className = 'arrow-display';
        this.elements.arrowDisplay.setAttribute('data-sequence', '');
        
        this.disableDirectionButtons();
        this.updateDisplay();
    }
    
    generateSequence() {
        this.currentSequence = [];
        const sequenceLength = Math.min(2 + this.level, 10); // レベル1は3個、最大10個
        
        for (let i = 0; i < sequenceLength; i++) {
            const randomDirection = this.directions[Math.floor(Math.random() * this.directions.length)];
            this.currentSequence.push(randomDirection);
        }
        
        // テスト用のdata属性を設定
        this.elements.arrowDisplay.setAttribute('data-sequence', this.currentSequence.join(','));
    }
    
    async displaySequence() {
        this.elements.statusMessage.textContent = '観察してください';
        this.elements.statusMessage.className = 'status-message';
        
        for (let i = 0; i < this.currentSequence.length; i++) {
            const direction = this.currentSequence[i];
            
            // 矢印を表示
            this.elements.arrowDisplay.textContent = this.directionSymbols[direction];
            this.elements.arrowDisplay.className = 'arrow-display active pulse';
            
            await this.sleep(800); // 800ms表示
            
            // 矢印を非表示（薄く）
            this.elements.arrowDisplay.className = 'arrow-display inactive';
            
            if (i < this.currentSequence.length - 1) {
                await this.sleep(200); // 200ms間隔
            }
        }
        
        // すべての表示が完了したら入力フェーズに移行
        await this.sleep(500);
        this.startInputPhase();
    }
    
    startInputPhase() {
        this.gameState = 'inputting';
        this.playerInput = [];
        this.elements.statusMessage.textContent = '入力してください';
        this.elements.statusMessage.className = 'status-message';
        this.elements.arrowDisplay.textContent = '';
        this.elements.arrowDisplay.className = 'arrow-display';
        this.enableDirectionButtons();
    }
    
    handlePlayerInput(direction) {
        if (this.gameState !== 'inputting') return;
        
        this.playerInput.push(direction);
        
        // 入力した分だけ表示を更新
        this.elements.arrowDisplay.textContent = this.playerInput.map(d => this.directionSymbols[d]).join(' ');
        
        // 現在の入力が正しいかチェック
        const currentIndex = this.playerInput.length - 1;
        if (this.playerInput[currentIndex] !== this.currentSequence[currentIndex]) {
            // 間違った入力
            this.handleWrongInput();
            return;
        }
        
        // すべて入力完了した場合
        if (this.playerInput.length === this.currentSequence.length) {
            this.handleCorrectSequence();
        }
    }
    
    handleCorrectSequence() {
        this.gameState = 'correct';
        this.elements.statusMessage.textContent = '正解！';
        this.elements.statusMessage.className = 'status-message correct';
        
        // スコア計算
        const levelScore = this.level * 100;
        this.score += levelScore;
        
        // レベルアップ
        this.level++;
        
        this.disableDirectionButtons();
        this.updateDisplay();
        
        // 次のレベルへ進む
        setTimeout(() => {
            if (this.level <= 10) { // 最大レベル10
                this.startGame();
            } else {
                // ゲームクリア
                this.elements.statusMessage.textContent = 'ゲームクリア！お疲れさまでした！';
                this.elements.statusMessage.className = 'status-message correct';
                this.elements.retryButton.style.display = 'inline-block';
                this.gameState = 'gameover';
            }
        }, 2000);
    }
    
    handleWrongInput() {
        this.gameState = 'wrong';
        this.elements.statusMessage.textContent = 'ゲームオーバー';
        this.elements.statusMessage.className = 'status-message wrong';
        this.disableDirectionButtons();
        
        // リトライボタンを表示
        setTimeout(() => {
            this.elements.retryButton.style.display = 'inline-block';
            this.gameState = 'gameover';
        }, 1500);
    }
    
    enableDirectionButtons() {
        Object.values(this.elements.directionButtons).forEach(button => {
            button.disabled = false;
        });
    }
    
    disableDirectionButtons() {
        Object.values(this.elements.directionButtons).forEach(button => {
            button.disabled = true;
        });
    }
    
    updateDisplay() {
        this.elements.levelDisplay.textContent = this.level.toString();
        this.elements.scoreDisplay.textContent = this.score.toString();
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ゲーム初期化
document.addEventListener('DOMContentLoaded', () => {
    new DirectionMemoryGame();
});