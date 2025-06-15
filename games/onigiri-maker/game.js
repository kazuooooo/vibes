// おにぎりメーカー ゲームロジック

class OnigiriMaker {
    constructor() {
        this.currentSelection = {
            ingredient: null,
            shape: null,
            nori: null
        };
        
        this.creationCount = 0;
        
        // 具材データ
        this.ingredients = {
            'ume': { name: '梅干し', icon: '🔴', baseScore: 20 },
            'salmon': { name: '鮭', icon: '🐟', baseScore: 18 },
            'konbu': { name: '昆布', icon: '⚫', baseScore: 16 },
            'tuna-mayo': { name: 'ツナマヨ', icon: '🟡', baseScore: 15 },
            'mentaiko': { name: '明太子', icon: '🔶', baseScore: 17 }
        };
        
        // 形データ
        this.shapes = {
            'triangle': { name: '三角', icon: '🔺', baseScore: 20 },
            'barrel': { name: '俵型', icon: '🍙', baseScore: 18 },
            'round': { name: '丸型', icon: '⭕', baseScore: 16 },
            'square': { name: '四角', icon: '🔲', baseScore: 14 }
        };
        
        // のりデータ
        this.noris = {
            'full': { name: '全巻き', icon: '⬛', baseScore: 20 },
            'half': { name: '半巻き', icon: '⬜', baseScore: 18 },
            'hand-roll': { name: '手巻き風', icon: '📜', baseScore: 16 },
            'none': { name: 'のりなし', icon: '🤍', baseScore: 12 }
        };
        
        // 特別な組み合わせ
        this.specialCombos = {
            'ume-triangle-full': { bonus: 30, comment: '完璧な王道コンボ！伝統の美味しさです！' },
            'tuna-mayo-square-hand-roll': { bonus: 25, comment: 'モダンでおしゃれな組み合わせ！' },
            'salmon-barrel-half': { bonus: 20, comment: 'バランスの取れた美しいおにぎり！' },
            'konbu-triangle-full': { bonus: 18, comment: '上品で落ち着いた味わい！' },
            'mentaiko-round-none': { bonus: 15, comment: 'シンプルながら個性的！' }
        };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updatePreview();
        this.updateMakeButtonState();
    }
    
    bindEvents() {
        // 具材選択ボタン
        document.querySelectorAll('.ingredient-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const ingredient = e.currentTarget.dataset.ingredient;
                this.selectIngredient(ingredient);
            });
        });
        
        // 形選択ボタン
        document.querySelectorAll('.shape-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const shape = e.currentTarget.dataset.shape;
                this.selectShape(shape);
            });
        });
        
        // のり選択ボタン
        document.querySelectorAll('.nori-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const nori = e.currentTarget.dataset.nori;
                this.selectNori(nori);
            });
        });
        
        // アクションボタン
        document.getElementById('make-button').addEventListener('click', () => {
            this.makeOnigiri();
        });
        
        document.getElementById('reset-button').addEventListener('click', () => {
            this.reset();
        });
        
        document.getElementById('retry-button').addEventListener('click', () => {
            this.retry();
        });
    }
    
    selectIngredient(ingredient) {
        // 前の選択を解除
        document.querySelectorAll('.ingredient-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // 新しい選択を設定
        this.currentSelection.ingredient = ingredient;
        document.querySelector(`[data-ingredient="${ingredient}"]`).classList.add('selected');
        
        this.updatePreview();
        this.updateMakeButtonState();
    }
    
    selectShape(shape) {
        // 前の選択を解除
        document.querySelectorAll('.shape-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // 新しい選択を設定
        this.currentSelection.shape = shape;
        document.querySelector(`[data-shape="${shape}"]`).classList.add('selected');
        
        this.updatePreview();
        this.updateMakeButtonState();
    }
    
    selectNori(nori) {
        // 前の選択を解除
        document.querySelectorAll('.nori-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // 新しい選択を設定
        this.currentSelection.nori = nori;
        document.querySelector(`[data-nori="${nori}"]`).classList.add('selected');
        
        this.updatePreview();
        this.updateMakeButtonState();
    }
    
    updatePreview() {
        const ingredientDisplay = document.querySelector('.ingredient-display');
        const shapeDisplay = document.querySelector('.shape-display');
        const noriDisplay = document.querySelector('.nori-display');
        
        const selectedIngredient = document.getElementById('selected-ingredient');
        const selectedShape = document.getElementById('selected-shape');
        const selectedNori = document.getElementById('selected-nori');
        
        // プレビューアイコンの更新
        if (this.currentSelection.ingredient) {
            ingredientDisplay.textContent = this.ingredients[this.currentSelection.ingredient].icon;
            selectedIngredient.textContent = this.ingredients[this.currentSelection.ingredient].name;
        } else {
            ingredientDisplay.textContent = '?';
            selectedIngredient.textContent = '未選択';
        }
        
        if (this.currentSelection.shape) {
            shapeDisplay.textContent = this.shapes[this.currentSelection.shape].icon;
            selectedShape.textContent = this.shapes[this.currentSelection.shape].name;
        } else {
            shapeDisplay.textContent = '?';
            selectedShape.textContent = '未選択';
        }
        
        if (this.currentSelection.nori) {
            noriDisplay.textContent = this.noris[this.currentSelection.nori].icon;
            selectedNori.textContent = this.noris[this.currentSelection.nori].name;
        } else {
            noriDisplay.textContent = '?';
            selectedNori.textContent = '未選択';
        }
    }
    
    updateMakeButtonState() {
        const makeButton = document.getElementById('make-button');
        const allSelected = this.currentSelection.ingredient && 
                           this.currentSelection.shape && 
                           this.currentSelection.nori;
        
        makeButton.disabled = !allSelected;
    }
    
    makeOnigiri() {
        if (!this.isAllSelected()) return;
        
        const evaluation = this.evaluateOnigiri();
        this.showResult(evaluation);
        this.creationCount++;
        this.updateCreationCount();
    }
    
    isAllSelected() {
        return this.currentSelection.ingredient && 
               this.currentSelection.shape && 
               this.currentSelection.nori;
    }
    
    evaluateOnigiri() {
        const { ingredient, shape, nori } = this.currentSelection;
        
        // 基本スコア計算
        let baseScore = this.ingredients[ingredient].baseScore + 
                       this.shapes[shape].baseScore + 
                       this.noris[nori].baseScore;
        
        // 特別なコンボのチェック
        const comboKey = `${ingredient}-${shape}-${nori}`;
        let bonus = 0;
        let comment = this.generateComment(baseScore);
        
        if (this.specialCombos[comboKey]) {
            bonus = this.specialCombos[comboKey].bonus;
            comment = this.specialCombos[comboKey].comment;
        }
        
        const finalScore = Math.min(100, baseScore + bonus);
        const rank = this.calculateRank(finalScore);
        
        return {
            score: finalScore,
            rank: rank,
            comment: comment
        };
    }
    
    calculateRank(score) {
        if (score >= 90) return 'S';
        if (score >= 80) return 'A';
        if (score >= 70) return 'B';
        if (score >= 60) return 'C';
        return 'D';
    }
    
    generateComment(score) {
        if (score >= 90) {
            return '完璧なおにぎりですね！素晴らしい組み合わせです！';
        } else if (score >= 80) {
            return 'とても美味しそう！バランスの良いおにぎりです！';
        } else if (score >= 70) {
            return 'なかなか良い組み合わせですね！';
        } else if (score >= 60) {
            return '普通のおにぎりですね。悪くありません。';
        } else {
            return 'ちょっと変わった組み合わせ...でも個性的で面白いです！';
        }
    }
    
    showResult(evaluation) {
        const resultArea = document.getElementById('result-area');
        const scoreDisplay = document.getElementById('score-display');
        const rankDisplay = document.getElementById('rank-display');
        const commentDisplay = document.getElementById('comment-display');
        
        scoreDisplay.textContent = evaluation.score;
        rankDisplay.textContent = evaluation.rank;
        rankDisplay.className = `rank-value rank-${evaluation.rank.toLowerCase()}`;
        commentDisplay.textContent = evaluation.comment;
        
        resultArea.style.display = 'block';
        
        // 結果エリアまでスクロール
        resultArea.scrollIntoView({ behavior: 'smooth' });
    }
    
    reset() {
        // 選択状態をクリア
        this.currentSelection = {
            ingredient: null,
            shape: null,
            nori: null
        };
        
        // すべての選択ボタンの選択状態を解除
        document.querySelectorAll('.selection-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // プレビューを更新
        this.updatePreview();
        this.updateMakeButtonState();
        
        // 結果エリアを非表示
        document.getElementById('result-area').style.display = 'none';
    }
    
    retry() {
        this.reset();
    }
    
    updateCreationCount() {
        document.getElementById('creation-count').textContent = this.creationCount;
    }
}

// ゲーム初期化
document.addEventListener('DOMContentLoaded', () => {
    new OnigiriMaker();
});