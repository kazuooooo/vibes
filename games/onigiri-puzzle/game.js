// おにぎりパズル - メインゲームロジック

class OnigiriPuzzle {
    constructor() {
        // ゲーム設定
        this.GRID_SIZE = 8;
        this.GAME_TIME = 60;
        this.INGREDIENTS = {
            RICE: '🍚',      // 米
            NORI: '⚫',      // 海苔
            UME: '🔴',       // 梅干し
            SALMON: '🟠',    // 鮭
            KONBU: '🟤',     // 昆布
            TUNA: '🟡',      // ツナマヨ
            MENTAIKO: '🔶'   // 明太子
        };

        // ゲーム状態
        this.grid = [];
        this.score = 0;
        this.timeLeft = this.GAME_TIME;
        this.onigiriCount = 0;
        this.comboCount = 0;
        this.maxCombo = 0;
        this.isGameRunning = false;
        this.isPaused = false;
        this.selectedCell = null;
        this.specialEffectActive = null;
        this.specialEffectTurns = 0;

        // おにぎり進度トラッキング
        this.riceMatched = 0;
        this.fillingMatched = 0;
        this.noriMatched = 0;

        // DOM要素
        this.gameGrid = null;
        this.scoreDisplay = null;
        this.timerDisplay = null;
        this.onigiriCountDisplay = null;
        this.gameTimer = null;

        this.init();
    }

    init() {
        this.setupDOM();
        this.setupEventListeners();
        this.generateGrid();
        this.renderGrid();
        this.startGame();

        // テスト用のグローバル関数を設定
        window.testSetup = {
            create3Match: () => this.testSetup3Match(),
            create4Match: () => this.testSetup4Match(),
            createOnigiri: () => this.testSetupOnigiri(),
            createUmeMatch: () => this.testSetupSpecialEffect('UME'),
            createSalmonMatch: () => this.testSetupSpecialEffect('SALMON')
        };

        window.gameTimer = {
            setTime: (time) => {
                this.timeLeft = time;
                this.updateDisplay();
            }
        };
    }

    setupDOM() {
        this.gameGrid = document.getElementById('game-grid');
        this.scoreDisplay = document.getElementById('score');
        this.timerDisplay = document.getElementById('timer');
        this.onigiriCountDisplay = document.getElementById('onigiri-count');

        // モバイル用の表示要素
        this.mobileScoreDisplay = document.getElementById('mobile-score');
        this.mobileTimerDisplay = document.getElementById('mobile-timer');
        this.mobileOnigiriDisplay = document.getElementById('mobile-onigiri');
    }

    setupEventListeners() {
        // ゲームコントロール
        document.getElementById('pause-btn').addEventListener('click', () => this.pauseGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('help-btn').addEventListener('click', () => this.showHelp());
        
        // モーダルコントロール
        document.getElementById('play-again-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restart-from-pause-btn').addEventListener('click', () => this.restartGame());

        // モーダル閉じるボタン
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.getAttribute('data-modal');
                if (modal) {
                    document.getElementById(modal).classList.remove('active');
                }
            });
        });

        // モーダルの外側クリックで閉じる
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // キーボード操作
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    generateGrid() {
        this.grid = [];
        const ingredients = Object.values(this.INGREDIENTS);

        for (let row = 0; row < this.GRID_SIZE; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.GRID_SIZE; col++) {
                let ingredient;
                do {
                    ingredient = ingredients[Math.floor(Math.random() * ingredients.length)];
                } while (this.wouldCreateMatch(row, col, ingredient));
                
                this.grid[row][col] = ingredient;
            }
        }
    }

    wouldCreateMatch(row, col, ingredient) {
        // 横方向のチェック
        let horizontalCount = 1;
        // 左をチェック
        for (let c = col - 1; c >= 0 && this.grid[row][c] === ingredient; c--) {
            horizontalCount++;
        }
        // 右をチェック
        for (let c = col + 1; c < this.GRID_SIZE && this.grid[row] && this.grid[row][c] === ingredient; c++) {
            horizontalCount++;
        }
        if (horizontalCount >= 3) return true;

        // 縦方向のチェック
        let verticalCount = 1;
        // 上をチェック
        for (let r = row - 1; r >= 0 && this.grid[r][col] === ingredient; r--) {
            verticalCount++;
        }
        // 下をチェック
        for (let r = row + 1; r < this.GRID_SIZE && this.grid[r] && this.grid[r][col] === ingredient; r++) {
            verticalCount++;
        }
        if (verticalCount >= 3) return true;

        return false;
    }

    renderGrid() {
        this.gameGrid.innerHTML = '';
        
        for (let row = 0; row < this.GRID_SIZE; row++) {
            for (let col = 0; col < this.GRID_SIZE; col++) {
                const cell = document.createElement('div');
                cell.className = 'game-cell';
                cell.setAttribute('data-testid', 'game-cell');
                cell.setAttribute('data-row', row);
                cell.setAttribute('data-col', col);
                cell.setAttribute('aria-label', `${this.getIngredientName(this.grid[row][col])} (${row + 1}行${col + 1}列)`);
                cell.setAttribute('tabindex', '0');
                cell.textContent = this.grid[row][col];
                
                cell.addEventListener('click', () => this.handleCellClick(row, col));
                cell.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.handleCellClick(row, col);
                    }
                });

                this.gameGrid.appendChild(cell);
            }
        }
    }

    getIngredientName(ingredient) {
        const names = {
            [this.INGREDIENTS.RICE]: '米',
            [this.INGREDIENTS.NORI]: '海苔',
            [this.INGREDIENTS.UME]: '梅干し',
            [this.INGREDIENTS.SALMON]: '鮭',
            [this.INGREDIENTS.KONBU]: '昆布',
            [this.INGREDIENTS.TUNA]: 'ツナマヨ',
            [this.INGREDIENTS.MENTAIKO]: '明太子'
        };
        return names[ingredient] || '不明';
    }

    handleCellClick(row, col) {
        if (!this.isGameRunning || this.isPaused) return;

        const cell = this.getCellElement(row, col);
        
        if (this.selectedCell) {
            if (this.selectedCell.row === row && this.selectedCell.col === col) {
                // 同じセルをクリック - 選択解除
                this.clearSelection();
                return;
            }

            // 隣接チェック
            if (this.isAdjacent(this.selectedCell.row, this.selectedCell.col, row, col)) {
                // 交換実行
                this.swapCells(this.selectedCell.row, this.selectedCell.col, row, col);
                this.clearSelection();
            } else {
                // 新しいセルを選択
                this.clearSelection();
                this.selectCell(row, col);
            }
        } else {
            // セルを選択
            this.selectCell(row, col);
        }
    }

    selectCell(row, col) {
        this.selectedCell = { row, col };
        const cell = this.getCellElement(row, col);
        cell.classList.add('selected');
        
        // アクセシビリティ更新
        this.updateGameStatus(`${this.getIngredientName(this.grid[row][col])}を選択しました`);
    }

    clearSelection() {
        if (this.selectedCell) {
            const cell = this.getCellElement(this.selectedCell.row, this.selectedCell.col);
            cell.classList.remove('selected');
            this.selectedCell = null;
        }
    }

    isAdjacent(row1, col1, row2, col2) {
        const rowDiff = Math.abs(row1 - row2);
        const colDiff = Math.abs(col1 - col2);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    swapCells(row1, col1, row2, col2) {
        // セルの内容を交換
        const temp = this.grid[row1][col1];
        this.grid[row1][col1] = this.grid[row2][col2];
        this.grid[row2][col2] = temp;

        // DOM要素を更新
        const cell1 = this.getCellElement(row1, col1);
        const cell2 = this.getCellElement(row2, col2);
        
        // 交換アニメーション
        this.animateSwap(cell1, cell2);

        // マッチチェック
        setTimeout(() => {
            this.checkMatches();
        }, 300);
    }

    animateSwap(cell1, cell2) {
        const temp = cell1.textContent;
        cell1.textContent = cell2.textContent;
        cell2.textContent = temp;

        // 交換アニメーション
        cell1.style.transform = 'scale(1.1)';
        cell2.style.transform = 'scale(1.1)';
        
        setTimeout(() => {
            cell1.style.transform = '';
            cell2.style.transform = '';
        }, 200);
    }

    getCellElement(row, col) {
        return document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    checkMatches() {
        const matches = this.findMatches();
        if (matches.length > 0) {
            this.comboCount++;
            this.processMatches(matches);
        } else {
            this.comboCount = 0;
            this.updateComboDisplay();
        }
    }

    findMatches() {
        const matches = [];
        const visited = Array(this.GRID_SIZE).fill().map(() => Array(this.GRID_SIZE).fill(false));

        // 横方向のマッチを検出
        for (let row = 0; row < this.GRID_SIZE; row++) {
            let count = 1;
            let currentIngredient = this.grid[row][0];
            
            for (let col = 1; col < this.GRID_SIZE; col++) {
                if (this.grid[row][col] === currentIngredient) {
                    count++;
                } else {
                    if (count >= 3) {
                        for (let c = col - count; c < col; c++) {
                            if (!visited[row][c]) {
                                matches.push({ row, col: c, ingredient: currentIngredient });
                                visited[row][c] = true;
                            }
                        }
                    }
                    currentIngredient = this.grid[row][col];
                    count = 1;
                }
            }
            
            // 行の最後をチェック
            if (count >= 3) {
                for (let c = this.GRID_SIZE - count; c < this.GRID_SIZE; c++) {
                    if (!visited[row][c]) {
                        matches.push({ row, col: c, ingredient: currentIngredient });
                        visited[row][c] = true;
                    }
                }
            }
        }

        // 縦方向のマッチを検出
        for (let col = 0; col < this.GRID_SIZE; col++) {
            let count = 1;
            let currentIngredient = this.grid[0][col];
            
            for (let row = 1; row < this.GRID_SIZE; row++) {
                if (this.grid[row][col] === currentIngredient) {
                    count++;
                } else {
                    if (count >= 3) {
                        for (let r = row - count; r < row; r++) {
                            if (!visited[r][col]) {
                                matches.push({ row: r, col, ingredient: currentIngredient });
                                visited[r][col] = true;
                            }
                        }
                    }
                    currentIngredient = this.grid[row][col];
                    count = 1;
                }
            }
            
            // 列の最後をチェック
            if (count >= 3) {
                for (let r = this.GRID_SIZE - count; r < this.GRID_SIZE; r++) {
                    if (!visited[r][col]) {
                        matches.push({ row: r, col, ingredient: currentIngredient });
                        visited[r][col] = true;
                    }
                }
            }
        }

        return matches;
    }

    processMatches(matches) {
        // マッチアニメーション
        matches.forEach(match => {
            const cell = this.getCellElement(match.row, match.col);
            cell.classList.add('matching');
        });

        // スコア計算
        const baseScore = this.calculateMatchScore(matches);
        const comboMultiplier = this.getComboMultiplier();
        const specialMultiplier = this.specialEffectActive === 'MENTAIKO' ? 2 : 1;
        
        let totalScore = baseScore * comboMultiplier * specialMultiplier;

        // 特殊効果をチェック
        this.processSpecialEffects(matches);

        // おにぎり完成をチェック
        this.checkOnigiriCompletion(matches);

        // 特殊効果ボーナス
        if (this.hasSpecialEffect(matches)) {
            totalScore += 500;
            this.showSpecialEffect(matches[0]);
        }

        this.score += totalScore;
        this.updateDisplay();
        this.updateComboDisplay();

        // アニメーション後にマッチしたセルを削除
        setTimeout(() => {
            this.removeMatchedCells(matches);
        }, 500);
    }

    calculateMatchScore(matches) {
        const count = matches.length;
        if (count >= 5) return 500;
        if (count >= 4) return 200;
        return 100;
    }

    getComboMultiplier() {
        if (this.comboCount >= 4) return 3;
        if (this.comboCount >= 3) return 2;
        if (this.comboCount >= 2) return 1.5;
        return 1;
    }

    hasSpecialEffect(matches) {
        return matches.some(match => 
            [this.INGREDIENTS.UME, this.INGREDIENTS.SALMON, this.INGREDIENTS.KONBU, 
             this.INGREDIENTS.TUNA, this.INGREDIENTS.MENTAIKO].includes(match.ingredient)
        );
    }

    processSpecialEffects(matches) {
        matches.forEach(match => {
            switch (match.ingredient) {
                case this.INGREDIENTS.UME:
                    this.activateExplosionEffect(match.row, match.col);
                    break;
                case this.INGREDIENTS.SALMON:
                    this.activateLineEffect(match.row, match.col);
                    break;
                case this.INGREDIENTS.KONBU:
                    this.activateSameTypeEffect(match.ingredient);
                    break;
                case this.INGREDIENTS.TUNA:
                    this.activateConversionEffect(match.row, match.col);
                    break;
                case this.INGREDIENTS.MENTAIKO:
                    this.activateDoubleScoreEffect();
                    break;
            }
        });
    }

    activateExplosionEffect(centerRow, centerCol) {
        const explosionEffect = document.getElementById('explosion-effect');
        const cell = this.getCellElement(centerRow, centerCol);
        const rect = cell.getBoundingClientRect();
        const containerRect = this.gameGrid.getBoundingClientRect();
        
        explosionEffect.style.left = (rect.left - containerRect.left - 60) + 'px';
        explosionEffect.style.top = (rect.top - containerRect.top - 60) + 'px';
        explosionEffect.style.display = 'block';
        
        setTimeout(() => {
            explosionEffect.style.display = 'none';
        }, 600);

        // 3×3範囲の具材を消去
        for (let r = Math.max(0, centerRow - 1); r <= Math.min(this.GRID_SIZE - 1, centerRow + 1); r++) {
            for (let c = Math.max(0, centerCol - 1); c <= Math.min(this.GRID_SIZE - 1, centerCol + 1); c++) {
                this.grid[r][c] = null;
            }
        }
    }

    activateLineEffect(row, col) {
        const lineEffect = document.getElementById('line-effect');
        lineEffect.style.display = 'block';
        
        setTimeout(() => {
            lineEffect.style.display = 'none';
        }, 500);

        // ランダムで縦または横のラインを消去
        if (Math.random() < 0.5) {
            // 横ライン消去
            for (let c = 0; c < this.GRID_SIZE; c++) {
                this.grid[row][c] = null;
            }
        } else {
            // 縦ライン消去
            for (let r = 0; r < this.GRID_SIZE; r++) {
                this.grid[r][col] = null;
            }
        }
    }

    activateSameTypeEffect(ingredient) {
        // 同じ種類の具材をすべて消去
        for (let row = 0; row < this.GRID_SIZE; row++) {
            for (let col = 0; col < this.GRID_SIZE; col++) {
                if (this.grid[row][col] === ingredient) {
                    this.grid[row][col] = null;
                }
            }
        }
    }

    activateConversionEffect(centerRow, centerCol) {
        // 隣接する具材を別の種類に変換
        const newIngredient = Object.values(this.INGREDIENTS)[Math.floor(Math.random() * Object.values(this.INGREDIENTS).length)];
        
        for (let r = Math.max(0, centerRow - 1); r <= Math.min(this.GRID_SIZE - 1, centerRow + 1); r++) {
            for (let c = Math.max(0, centerCol - 1); c <= Math.min(this.GRID_SIZE - 1, centerCol + 1); c++) {
                if (this.grid[r][c] && (r !== centerRow || c !== centerCol)) {
                    this.grid[r][c] = newIngredient;
                }
            }
        }
    }

    activateDoubleScoreEffect() {
        this.specialEffectActive = 'MENTAIKO';
        this.specialEffectTurns = 2;
        
        // UI表示更新
        this.updateGameStatus('明太子効果発動！2ターンの間得点2倍！');
    }

    showSpecialEffect(match) {
        // 特殊効果のビジュアルを表示
        const effectContainer = document.getElementById('effects-container');
        const effect = document.createElement('div');
        effect.className = 'special-effect-popup';
        effect.textContent = this.getEffectName(match.ingredient) + '発動！';
        effect.style.position = 'absolute';
        effect.style.left = '50%';
        effect.style.top = '50%';
        effect.style.transform = 'translate(-50%, -50%)';
        effect.style.color = '#FFB347';
        effect.style.fontSize = '2rem';
        effect.style.fontWeight = 'bold';
        effect.style.animation = 'fadeInOut 2s ease-out';
        
        effectContainer.appendChild(effect);
        
        setTimeout(() => {
            effectContainer.removeChild(effect);
        }, 2000);
    }

    getEffectName(ingredient) {
        const names = {
            [this.INGREDIENTS.UME]: '梅爆破',
            [this.INGREDIENTS.SALMON]: '鮭ライン',
            [this.INGREDIENTS.KONBU]: '昆布消去',
            [this.INGREDIENTS.TUNA]: 'ツナ変換',
            [this.INGREDIENTS.MENTAIKO]: '明太子倍速'
        };
        return names[ingredient] || '特殊効果';
    }

    checkOnigiriCompletion(matches) {
        // おにぎり完成条件をチェック
        matches.forEach(match => {
            if (match.ingredient === this.INGREDIENTS.RICE) {
                this.riceMatched += matches.filter(m => m.ingredient === this.INGREDIENTS.RICE).length;
            } else if (match.ingredient === this.INGREDIENTS.NORI) {
                this.noriMatched += matches.filter(m => m.ingredient === this.INGREDIENTS.NORI).length;
            } else if ([this.INGREDIENTS.UME, this.INGREDIENTS.SALMON, this.INGREDIENTS.KONBU, 
                       this.INGREDIENTS.TUNA, this.INGREDIENTS.MENTAIKO].includes(match.ingredient)) {
                this.fillingMatched += matches.filter(m => 
                    [this.INGREDIENTS.UME, this.INGREDIENTS.SALMON, this.INGREDIENTS.KONBU, 
                     this.INGREDIENTS.TUNA, this.INGREDIENTS.MENTAIKO].includes(m.ingredient)
                ).length;
            }
        });

        // おにぎり完成チェック（米3個+具材1個+海苔1個）
        while (this.riceMatched >= 3 && this.fillingMatched >= 1 && this.noriMatched >= 1) {
            this.riceMatched -= 3;
            this.fillingMatched -= 1;
            this.noriMatched -= 1;
            
            this.onigiriCount++;
            this.score += 1000; // おにぎり完成ボーナス
            
            this.showOnigiriCompleteEffect();
            this.updateGameStatus('おにぎり完成！ +1000点');
        }

        this.updateOnigiriProgress();
    }

    showOnigiriCompleteEffect() {
        const effect = document.getElementById('onigiri-complete-effect');
        effect.textContent = '🍙 おにぎり完成！';
        effect.style.display = 'block';
        effect.style.left = '50%';
        effect.style.top = '50%';
        effect.style.transform = 'translate(-50%, -50%)';
        
        setTimeout(() => {
            effect.style.display = 'none';
        }, 1000);
    }

    updateOnigiriProgress() {
        document.getElementById('rice-count').textContent = this.riceMatched;
        document.getElementById('filling-count').textContent = this.fillingMatched;
        document.getElementById('nori-count').textContent = this.noriMatched;
    }

    removeMatchedCells(matches) {
        matches.forEach(match => {
            this.grid[match.row][match.col] = null;
            const cell = this.getCellElement(match.row, match.col);
            cell.classList.remove('matching');
        });

        this.dropCells();
    }

    dropCells() {
        let moved = false;
        
        // 具材を落下させる
        for (let col = 0; col < this.GRID_SIZE; col++) {
            let writeIndex = this.GRID_SIZE - 1;
            
            for (let row = this.GRID_SIZE - 1; row >= 0; row--) {
                if (this.grid[row][col] !== null) {
                    if (row !== writeIndex) {
                        this.grid[writeIndex][col] = this.grid[row][col];
                        this.grid[row][col] = null;
                        moved = true;
                    }
                    writeIndex--;
                }
            }
        }

        // 新しい具材を上部から補充
        this.fillEmptyCells();

        // DOM を更新
        this.renderGrid();

        // 落下アニメーション
        if (moved) {
            this.animateFalling();
        }

        // 新しいマッチをチェック
        setTimeout(() => {
            this.checkMatches();
        }, 300);

        // 特殊効果のターン数を減らす
        if (this.specialEffectTurns > 0) {
            this.specialEffectTurns--;
            if (this.specialEffectTurns === 0) {
                this.specialEffectActive = null;
            }
        }
    }

    fillEmptyCells() {
        const ingredients = Object.values(this.INGREDIENTS);
        
        for (let col = 0; col < this.GRID_SIZE; col++) {
            for (let row = 0; row < this.GRID_SIZE; row++) {
                if (this.grid[row][col] === null) {
                    this.grid[row][col] = ingredients[Math.floor(Math.random() * ingredients.length)];
                }
            }
        }
    }

    animateFalling() {
        const cells = document.querySelectorAll('.game-cell');
        cells.forEach(cell => {
            cell.classList.add('falling');
        });

        setTimeout(() => {
            cells.forEach(cell => {
                cell.classList.remove('falling');
            });
        }, 300);
    }

    startGame() {
        this.isGameRunning = true;
        this.updateDisplay();
        this.updateComboDisplay();
        this.updateOnigiriProgress();
        
        this.gameTimer = setInterval(() => {
            if (!this.isPaused && this.isGameRunning) {
                this.timeLeft--;
                this.updateDisplay();
                
                if (this.timeLeft <= 0) {
                    this.endGame();
                }
            }
        }, 1000);
    }

    updateDisplay() {
        this.scoreDisplay.textContent = this.score.toLocaleString();
        this.timerDisplay.textContent = this.timeLeft;
        this.onigiriCountDisplay.textContent = this.onigiriCount;

        // モバイル用表示も更新
        if (this.mobileScoreDisplay) this.mobileScoreDisplay.textContent = this.score.toLocaleString();
        if (this.mobileTimerDisplay) this.mobileTimerDisplay.textContent = this.timeLeft;
        if (this.mobileOnigiriDisplay) this.mobileOnigiriDisplay.textContent = this.onigiriCount;
    }

    updateComboDisplay() {
        const comboNumber = document.querySelector('.combo-number');
        const comboCounter = document.querySelector('.combo-counter');
        
        if (comboNumber) {
            comboNumber.textContent = this.comboCount;
        }

        if (this.comboCount > this.maxCombo) {
            this.maxCombo = this.comboCount;
        }

        if (comboCounter) {
            if (this.comboCount > 1) {
                comboCounter.style.animation = 'pulse 0.5s ease-out';
                setTimeout(() => {
                    comboCounter.style.animation = '';
                }, 500);
            }
        }
    }

    pauseGame() {
        if (!this.isGameRunning) return;
        
        this.isPaused = true;
        this.showModal('pause-modal');
        this.updateGameStatus('ゲームを一時停止しました');
    }

    resumeGame() {
        this.isPaused = false;
        this.hideModals();
        this.updateGameStatus('ゲームを再開しました');
    }

    restartGame() {
        // ゲーム状態をリセット
        this.score = 0;
        this.timeLeft = this.GAME_TIME;
        this.onigiriCount = 0;
        this.comboCount = 0;
        this.maxCombo = 0;
        this.riceMatched = 0;
        this.fillingMatched = 0;
        this.noriMatched = 0;
        this.specialEffectActive = null;
        this.specialEffectTurns = 0;
        this.selectedCell = null;
        
        // タイマーをクリア
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
        }
        
        // モーダルを閉じる
        this.hideModals();
        
        // 新しいグリッドを生成
        this.generateGrid();
        this.renderGrid();
        
        // ゲーム開始
        this.startGame();
        
        this.updateGameStatus('新しいゲームを開始しました');
    }

    endGame() {
        this.isGameRunning = false;
        
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
        }
        
        // 最終結果を表示
        this.showGameOverScreen();
    }

    showGameOverScreen() {
        // 最終スコアとランクを計算
        const rank = this.calculateRank();
        
        document.getElementById('final-score').textContent = this.score.toLocaleString();
        document.getElementById('final-onigiri-count').textContent = this.onigiriCount;
        document.getElementById('max-combo').textContent = this.maxCombo;
        document.getElementById('rank').textContent = rank;
        
        this.showModal('game-over');
        this.updateGameStatus(`ゲーム終了！最終スコア: ${this.score.toLocaleString()}点、ランク: ${rank}`);
    }

    calculateRank() {
        if (this.score >= 10000) return 'S';
        if (this.score >= 7000) return 'A';
        if (this.score >= 4000) return 'B';
        if (this.score >= 2000) return 'C';
        return 'D';
    }

    showHelp() {
        this.showModal('help-modal');
    }

    showModal(modalId) {
        this.hideModals();
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }

    hideModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    updateGameStatus(message) {
        const gameStatus = document.getElementById('game-status');
        if (gameStatus) {
            gameStatus.textContent = message;
        }
    }

    handleKeyboard(e) {
        if (!this.isGameRunning || this.isPaused) return;

        const focusedElement = document.activeElement;
        if (!focusedElement || !focusedElement.hasAttribute('data-row')) return;

        const currentRow = parseInt(focusedElement.getAttribute('data-row'));
        const currentCol = parseInt(focusedElement.getAttribute('data-col'));
        let newRow = currentRow;
        let newCol = currentCol;

        switch (e.key) {
            case 'ArrowUp':
                newRow = Math.max(0, currentRow - 1);
                e.preventDefault();
                break;
            case 'ArrowDown':
                newRow = Math.min(this.GRID_SIZE - 1, currentRow + 1);
                e.preventDefault();
                break;
            case 'ArrowLeft':
                newCol = Math.max(0, currentCol - 1);
                e.preventDefault();
                break;
            case 'ArrowRight':
                newCol = Math.min(this.GRID_SIZE - 1, currentCol + 1);
                e.preventDefault();
                break;
        }

        if (newRow !== currentRow || newCol !== currentCol) {
            const newCell = this.getCellElement(newRow, newCol);
            if (newCell) {
                newCell.focus();
            }
        }
    }

    // テスト用のヘルパー関数
    testSetup3Match() {
        // テスト用の3マッチ配置を作成
        this.grid[0][0] = this.INGREDIENTS.RICE;
        this.grid[0][1] = this.INGREDIENTS.RICE;
        this.grid[0][2] = this.INGREDIENTS.RICE;
        this.renderGrid();
        setTimeout(() => this.checkMatches(), 100);
    }

    testSetup4Match() {
        // テスト用の4マッチ配置を作成
        this.grid[1][0] = this.INGREDIENTS.UME;
        this.grid[1][1] = this.INGREDIENTS.UME;
        this.grid[1][2] = this.INGREDIENTS.UME;
        this.grid[1][3] = this.INGREDIENTS.UME;
        this.renderGrid();
        setTimeout(() => this.checkMatches(), 100);
    }

    testSetupOnigiri() {
        // おにぎり完成のテスト配置
        this.riceMatched = 2;
        this.fillingMatched = 0;
        this.noriMatched = 0;
        
        // 米の3マッチ
        this.grid[2][0] = this.INGREDIENTS.RICE;
        this.grid[2][1] = this.INGREDIENTS.RICE;
        this.grid[2][2] = this.INGREDIENTS.RICE;
        
        // 具材のマッチ
        this.grid[3][0] = this.INGREDIENTS.UME;
        this.grid[3][1] = this.INGREDIENTS.UME;
        this.grid[3][2] = this.INGREDIENTS.UME;
        
        // 海苔のマッチ
        this.grid[4][0] = this.INGREDIENTS.NORI;
        this.grid[4][1] = this.INGREDIENTS.NORI;
        this.grid[4][2] = this.INGREDIENTS.NORI;
        
        this.renderGrid();
        setTimeout(() => this.checkMatches(), 100);
    }

    testSetupSpecialEffect(effect) {
        const ingredient = this.INGREDIENTS[effect];
        this.grid[5][0] = ingredient;
        this.grid[5][1] = ingredient;
        this.grid[5][2] = ingredient;
        this.renderGrid();
        setTimeout(() => this.checkMatches(), 100);
    }
}

// ゲーム開始
document.addEventListener('DOMContentLoaded', () => {
    new OnigiriPuzzle();
});

// CSSアニメーション追加
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
    
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
        20% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
        80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    }
`;
document.head.appendChild(style);