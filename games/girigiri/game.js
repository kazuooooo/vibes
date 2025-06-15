class GirigiriGame {
    constructor() {
        this.gauge = 0;
        this.isRunning = false;
        this.gameSpeed = 1;
        this.direction = 1;
        this.animationId = null;
        this.isStopped = false;
        
        this.elements = {
            gaugeFill: document.getElementById('gauge-fill'),
            gaugeValue: document.getElementById('gauge-value'),
            stopButton: document.getElementById('stop-button'),
            scoreDisplay: document.getElementById('score'),
            retryButton: document.getElementById('retry-button')
        };
        
        this.init();
    }
    
    init() {
        this.elements.stopButton.addEventListener('click', () => this.stopGame());
        this.elements.retryButton.addEventListener('click', () => this.resetGame());
        this.startGame();
    }
    
    startGame() {
        this.gauge = 0;
        this.isRunning = true;
        this.isStopped = false;
        this.direction = 1;
        this.gameSpeed = 1;
        
        this.elements.stopButton.disabled = false;
        this.elements.scoreDisplay.style.display = 'none';
        this.elements.retryButton.style.display = 'none';
        this.elements.scoreDisplay.className = 'score-display';
        
        this.updateDisplay();
        this.animate();
    }
    
    animate() {
        if (!this.isRunning || this.isStopped) return;
        
        this.gauge += this.direction * this.gameSpeed;
        
        if (this.gauge >= 110) {
            this.direction = -1;
        } else if (this.gauge <= 0) {
            this.direction = 1;
        }
        
        this.gauge = Math.max(0, Math.min(110, this.gauge));
        
        this.gameSpeed += 0.002;
        
        this.updateDisplay();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    updateDisplay() {
        const displayValue = Math.round(this.gauge);
        this.elements.gaugeValue.textContent = displayValue;
        this.elements.gaugeFill.style.width = `${Math.min(100, this.gauge)}%`;
    }
    
    stopGame() {
        if (!this.isRunning || this.isStopped) return;
        
        this.isStopped = true;
        this.isRunning = false;
        this.elements.stopButton.disabled = true;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.calculateScore();
    }
    
    calculateScore() {
        const finalGauge = Math.round(this.gauge);
        let score = 0;
        let message = '';
        let className = 'score-display';
        
        if (finalGauge >= 100) {
            score = 0;
            message = `バースト！\n${score}点`;
            className += ' burst';
        } else if (finalGauge >= 95) {
            score = 100;
            message = `ギリギリ成功！\n${score}点`;
            className += ' success';
        } else if (finalGauge >= 90) {
            score = 80;
            message = `成功！\n${score}点`;
            className += ' good';
        } else if (finalGauge >= 80) {
            score = 50;
            message = `まあまあ\n${score}点`;
            className += ' ok';
        } else if (finalGauge >= 70) {
            score = 20;
            message = `微妙\n${score}点`;
            className += ' poor';
        } else {
            score = 0;
            message = `失敗\n${score}点`;
            className += ' poor';
        }
        
        this.elements.scoreDisplay.textContent = message;
        this.elements.scoreDisplay.className = className;
        this.elements.scoreDisplay.style.display = 'block';
        this.elements.retryButton.style.display = 'inline-block';
    }
    
    resetGame() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.startGame();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GirigiriGame();
});