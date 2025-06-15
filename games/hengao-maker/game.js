class HengaoMaker {
    constructor() {
        this.draggedElement = null;
        this.offset = { x: 0, y: 0 };
        this.initialPositions = {};
        this.faceBase = null;
        this.faceParts = [];
        
        this.elements = {
            completeButton: document.getElementById('complete-button'),
            resetButton: document.getElementById('reset-button'),
            newFaceButton: document.getElementById('new-face-button'),
            gameArea: document.querySelector('.game-area'),
            resultArea: document.getElementById('result-area'),
            faceBase: document.querySelector('[data-testid="face-base"]')
        };
        
        this.init();
    }
    
    init() {
        this.faceBase = this.elements.faceBase;
        this.faceParts = document.querySelectorAll('.face-part');
        
        this.saveInitialPositions();
        this.setupEventListeners();
        this.setupDragAndDrop();
    }
    
    saveInitialPositions() {
        this.faceParts.forEach(part => {
            const rect = part.getBoundingClientRect();
            const faceRect = this.faceBase.getBoundingClientRect();
            
            this.initialPositions[part.dataset.testid] = {
                left: parseInt(part.style.left) || 0,
                top: parseInt(part.style.top) || 0
            };
        });
    }
    
    setupEventListeners() {
        this.elements.completeButton.addEventListener('click', () => this.completeFace());
        this.elements.resetButton.addEventListener('click', () => this.resetFace());
        this.elements.newFaceButton.addEventListener('click', () => this.newFace());
    }
    
    setupDragAndDrop() {
        this.faceParts.forEach(part => {
            // マウスイベント
            part.addEventListener('mousedown', (e) => this.startDrag(e, part));
            
            // タッチイベント
            part.addEventListener('touchstart', (e) => this.startDrag(e, part), { passive: false });
        });
        
        // グローバルイベント
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.endDrag());
        document.addEventListener('touchmove', (e) => this.drag(e), { passive: false });
        document.addEventListener('touchend', () => this.endDrag());
    }
    
    startDrag(e, element) {
        e.preventDefault();
        
        this.draggedElement = element;
        element.classList.add('dragging');
        
        const rect = element.getBoundingClientRect();
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        
        this.offset = {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }
    
    drag(e) {
        if (!this.draggedElement) return;
        
        e.preventDefault();
        
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        
        const faceRect = this.faceBase.getBoundingClientRect();
        
        // マウス/タッチ位置から要素の新しい位置を計算
        let newX = clientX - faceRect.left - this.offset.x;
        let newY = clientY - faceRect.top - this.offset.y;
        
        // 境界チェック（顔の範囲内に制限）
        const elementRect = this.draggedElement.getBoundingClientRect();
        const maxX = this.faceBase.offsetWidth - this.draggedElement.offsetWidth;
        const maxY = this.faceBase.offsetHeight - this.draggedElement.offsetHeight;
        
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));
        
        // 位置を更新
        this.draggedElement.style.left = newX + 'px';
        this.draggedElement.style.top = newY + 'px';
    }
    
    endDrag() {
        if (this.draggedElement) {
            this.draggedElement.classList.remove('dragging');
            this.draggedElement = null;
        }
    }
    
    completeFace() {
        this.elements.gameArea.style.display = 'none';
        this.elements.resultArea.style.display = 'block';
        
        // 完成アニメーション効果
        this.elements.resultArea.style.opacity = '0';
        this.elements.resultArea.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
            this.elements.resultArea.style.transition = 'all 0.5s ease';
            this.elements.resultArea.style.opacity = '1';
            this.elements.resultArea.style.transform = 'scale(1)';
        }, 100);
    }
    
    resetFace() {
        this.faceParts.forEach(part => {
            const testId = part.dataset.testid;
            const initialPos = this.initialPositions[testId];
            
            if (initialPos) {
                part.style.left = initialPos.left + 'px';
                part.style.top = initialPos.top + 'px';
            }
        });
        
        // リセットアニメーション効果
        this.faceParts.forEach((part, index) => {
            part.style.transition = 'all 0.3s ease';
            setTimeout(() => {
                part.style.transition = 'transform 0.1s ease';
            }, 300);
        });
    }
    
    newFace() {
        this.elements.resultArea.style.display = 'none';
        this.elements.gameArea.style.display = 'block';
        this.resetFace();
        
        // 新しいゲーム開始のアニメーション
        this.elements.gameArea.style.opacity = '0';
        setTimeout(() => {
            this.elements.gameArea.style.transition = 'opacity 0.3s ease';
            this.elements.gameArea.style.opacity = '1';
        }, 100);
    }
    
    // テスト用: パーツの現在位置を取得
    getPartPosition(testId) {
        const part = document.querySelector(`[data-testid="${testId}"]`);
        if (!part) return null;
        
        return {
            left: parseInt(part.style.left) || 0,
            top: parseInt(part.style.top) || 0
        };
    }
    
    // テスト用: パーツを指定位置に移動
    setPartPosition(testId, x, y) {
        const part = document.querySelector(`[data-testid="${testId}"]`);
        if (!part) return false;
        
        const maxX = this.faceBase.offsetWidth - part.offsetWidth;
        const maxY = this.faceBase.offsetHeight - part.offsetHeight;
        
        const boundedX = Math.max(0, Math.min(x, maxX));
        const boundedY = Math.max(0, Math.min(y, maxY));
        
        part.style.left = boundedX + 'px';
        part.style.top = boundedY + 'px';
        
        return true;
    }
}

// ゲーム開始
document.addEventListener('DOMContentLoaded', () => {
    window.hengaoGame = new HengaoMaker();
});

// デバッグ用（開発・テスト時）
if (typeof window !== 'undefined') {
    window.HengaoMaker = HengaoMaker;
}