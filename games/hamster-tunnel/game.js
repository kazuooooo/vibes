class HamsterTunnelGame {
    constructor() {
        this.level = 1;
        this.score = 0;
        this.timeLimit = 30;
        this.currentTime = 30;
        this.gameState = 'idle'; // idle, digging, moving, gameover, cleared
        this.fieldSize = 5;
        this.timer = null;
        this.hamsterPosition = { x: 0, y: 0 };
        this.goalPosition = { x: 4, y: 4 };
        this.field = [];
        this.hamsterElement = null;
        this.isMoving = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeGame();
    }

    initializeElements() {
        this.levelDisplay = document.getElementById('level-display');
        this.scoreDisplay = document.getElementById('score-display');
        this.timerDisplay = document.getElementById('timer-display');
        this.statusMessage = document.getElementById('status-message');
        this.gameField = document.getElementById('game-field');
        this.startButton = document.getElementById('start-button');
        this.retryButton = document.getElementById('retry-button');
        this.moveButton = document.getElementById('move-button');
    }

    setupEventListeners() {
        this.startButton.addEventListener('click', () => this.startGame());
        this.retryButton.addEventListener('click', () => this.retryGame());
        this.moveButton.addEventListener('click', () => this.startHamsterMovement());
    }

    initializeGame() {
        this.updateDisplay();
        this.generateField();
        this.renderField();
        this.createHamster();
    }

    generateField() {
        this.field = [];
        for (let y = 0; y < this.fieldSize; y++) {
            this.field[y] = [];
            for (let x = 0; x < this.fieldSize; x++) {
                if (x === 0 && y === 0) {
                    this.field[y][x] = 'start';
                } else if (x === this.fieldSize - 1 && y === this.fieldSize - 1) {
                    this.field[y][x] = 'goal';
                } else {
                    this.field[y][x] = 'soil';
                }
            }
        }
    }

    renderField() {
        this.gameField.innerHTML = '';
        this.gameField.style.gridTemplateColumns = `repeat(${this.fieldSize}, 1fr)`;
        
        for (let y = 0; y < this.fieldSize; y++) {
            for (let x = 0; x < this.fieldSize; x++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.setAttribute('data-testid', 'grid-cell');
                cell.setAttribute('data-x', x);
                cell.setAttribute('data-y', y);
                cell.setAttribute('data-state', this.field[y][x]);
                
                if (this.field[y][x] === 'start') {
                    cell.setAttribute('data-testid', 'start-point');
                    cell.textContent = 'S';
                } else if (this.field[y][x] === 'goal') {
                    cell.setAttribute('data-testid', 'goal-point');
                    cell.textContent = 'G';
                }
                
                cell.addEventListener('click', () => this.onCellClick(x, y, cell));
                this.gameField.appendChild(cell);
            }
        }
    }

    createHamster() {
        if (this.hamsterElement) {
            this.hamsterElement.remove();
        }
        
        this.hamsterElement = document.createElement('div');
        this.hamsterElement.className = 'hamster';
        this.hamsterElement.setAttribute('data-testid', 'hamster');
        
        this.gameField.appendChild(this.hamsterElement);
        this.updateHamsterPosition();
    }

    updateHamsterPosition() {
        if (this.hamsterElement) {
            const cellSize = 52; // 50px cell + 2px gap
            const fieldPadding = 10;
            
            const x = this.hamsterPosition.x * cellSize + fieldPadding + 5;
            const y = this.hamsterPosition.y * cellSize + fieldPadding + 5;
            
            this.hamsterElement.style.left = `${x}px`;
            this.hamsterElement.style.top = `${y}px`;
        }
    }

    onCellClick(x, y, cell) {
        if (this.gameState !== 'digging' || this.isMoving) return;
        
        if (this.field[y][x] === 'soil') {
            this.field[y][x] = 'tunnel';
            cell.setAttribute('data-state', 'tunnel');
        }
    }

    startGame() {
        this.gameState = 'digging';
        this.statusMessage.textContent = 'トンネルを掘ってください';
        this.startButton.style.display = 'none';
        this.moveButton.style.display = 'inline-block';
        this.retryButton.style.display = 'none';
        
        this.startTimer();
    }

    startTimer() {
        this.currentTime = this.timeLimit;
        this.updateDisplay();
        
        this.timer = setInterval(() => {
            this.currentTime--;
            this.updateDisplay();
            
            if (this.currentTime <= 0) {
                this.gameOver('時間切れ');
            }
        }, 1000);
    }

    startHamsterMovement() {
        if (this.gameState !== 'digging') return;
        
        this.gameState = 'moving';
        this.statusMessage.textContent = 'ハムスター移動中';
        this.moveButton.style.display = 'none';
        this.isMoving = true;
        
        // グリッドセルを無効化
        const cells = this.gameField.querySelectorAll('.grid-cell');
        cells.forEach(cell => cell.classList.add('disabled'));
        
        // 経路探索してハムスター移動
        this.moveHamster();
    }

    async moveHamster() {
        const path = this.findPath();
        
        if (!path || path.length <= 1) {
            this.gameOver('経路が見つかりません');
            return;
        }
        
        // パスに沿って移動
        for (let i = 1; i < path.length; i++) {
            await this.moveHamsterToPosition(path[i].x, path[i].y);
            
            // ゴールに到達したかチェック
            if (path[i].x === this.goalPosition.x && path[i].y === this.goalPosition.y) {
                this.levelClear();
                return;
            }
        }
    }

    moveHamsterToPosition(x, y) {
        return new Promise((resolve) => {
            this.hamsterPosition.x = x;
            this.hamsterPosition.y = y;
            this.updateHamsterPosition();
            
            setTimeout(resolve, 500); // 移動時間
        });
    }

    findPath() {
        // 簡単なBFS経路探索
        const queue = [{ x: 0, y: 0, path: [{ x: 0, y: 0 }] }];
        const visited = new Set();
        visited.add('0,0');
        
        const directions = [
            { dx: 0, dy: 1 },  // 下
            { dx: 1, dy: 0 },  // 右
            { dx: 0, dy: -1 }, // 上
            { dx: -1, dy: 0 }  // 左
        ];
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            if (current.x === this.goalPosition.x && current.y === this.goalPosition.y) {
                return current.path;
            }
            
            for (const dir of directions) {
                const newX = current.x + dir.dx;
                const newY = current.y + dir.dy;
                const key = `${newX},${newY}`;
                
                if (newX >= 0 && newX < this.fieldSize && 
                    newY >= 0 && newY < this.fieldSize && 
                    !visited.has(key) && 
                    (this.field[newY][newX] === 'tunnel' || 
                     this.field[newY][newX] === 'goal' || 
                     this.field[newY][newX] === 'start')) {
                    
                    visited.add(key);
                    queue.push({
                        x: newX,
                        y: newY,
                        path: [...current.path, { x: newX, y: newY }]
                    });
                }
            }
        }
        
        return null; // 経路が見つからない
    }

    levelClear() {
        this.gameState = 'cleared';
        this.statusMessage.textContent = 'クリア！';
        this.isMoving = false;
        
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        // スコア計算
        const baseScore = this.level * 100;
        const timeBonus = this.currentTime * 10;
        
        // 最短経路ボーナスの確認
        const shortestPath = this.calculateShortestPath();
        const actualTunnels = this.countTunnels();
        const shortestPathBonus = (actualTunnels <= shortestPath) ? 500 : 0;
        
        const levelScore = baseScore + timeBonus + shortestPathBonus;
        this.score += levelScore;
        
        setTimeout(() => {
            this.nextLevel();
        }, 2000);
    }

    calculateShortestPath() {
        // 理論的最短経路（マンハッタン距離）
        return (this.fieldSize - 1) * 2 - 1;
    }

    countTunnels() {
        let count = 0;
        for (let y = 0; y < this.fieldSize; y++) {
            for (let x = 0; x < this.fieldSize; x++) {
                if (this.field[y][x] === 'tunnel') {
                    count++;
                }
            }
        }
        return count;
    }

    nextLevel() {
        this.level++;
        this.fieldSize = Math.min(4 + this.level, 9); // 最大9×9
        this.timeLimit = 25 + this.level * 5; // レベルごとに5秒追加
        this.goalPosition = { x: this.fieldSize - 1, y: this.fieldSize - 1 };
        this.hamsterPosition = { x: 0, y: 0 };
        
        this.generateField();
        this.renderField();
        this.createHamster();
        this.updateDisplay();
        
        this.gameState = 'digging';
        this.statusMessage.textContent = 'トンネルを掘ってください';
        this.moveButton.style.display = 'inline-block';
        
        this.startTimer();
    }

    gameOver(reason) {
        this.gameState = 'gameover';
        this.statusMessage.textContent = `ゲームオーバー - ${reason}`;
        this.isMoving = false;
        
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        this.startButton.style.display = 'none';
        this.moveButton.style.display = 'none';
        this.retryButton.style.display = 'inline-block';
        
        // グリッドセルを無効化
        const cells = this.gameField.querySelectorAll('.grid-cell');
        cells.forEach(cell => cell.classList.add('disabled'));
    }

    retryGame() {
        this.level = 1;
        this.score = 0;
        this.fieldSize = 5;
        this.timeLimit = 30;
        this.currentTime = 30;
        this.gameState = 'idle';
        this.hamsterPosition = { x: 0, y: 0 };
        this.goalPosition = { x: 4, y: 4 };
        this.isMoving = false;
        
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        this.generateField();
        this.renderField();
        this.createHamster();
        this.updateDisplay();
        
        this.statusMessage.textContent = 'スタートボタンを押してください';
        this.startButton.style.display = 'inline-block';
        this.moveButton.style.display = 'none';
        this.retryButton.style.display = 'none';
        
        // グリッドセルの無効化を解除
        const cells = this.gameField.querySelectorAll('.grid-cell');
        cells.forEach(cell => cell.classList.remove('disabled'));
    }

    updateDisplay() {
        this.levelDisplay.textContent = this.level;
        this.scoreDisplay.textContent = this.score;
        this.timerDisplay.textContent = this.currentTime;
    }
}

// ゲーム開始
document.addEventListener('DOMContentLoaded', () => {
    new HamsterTunnelGame();
});