class KushamiBattleGame {
    constructor() {
        this.chargeStartTime = null;
        this.isCharging = false;
        this.currentPower = 0;
        this.chargeLevel = 0;
        this.enemyDistance = 100; // meters
        this.isGameOver = false;
        this.chargingInterval = null;
        
        this.elements = {
            chargeGauge: document.getElementById('charge-gauge'),
            chargeButton: document.getElementById('charge-button'),
            powerDisplay: document.getElementById('power-display'),
            powerValue: document.getElementById('power-value'),
            distanceDisplay: document.getElementById('distance-display'),
            distanceValue: document.getElementById('distance-value'),
            enemyCharacter: document.getElementById('enemy-character'),
            resultMessage: document.getElementById('result-message'),
            retryButton: document.getElementById('retry-button'),
            windEffect: document.getElementById('wind-effect')
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateDisplay();
    }
    
    setupEventListeners() {
        // Mouse events
        this.elements.chargeButton.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.startCharge();
        });
        
        this.elements.chargeButton.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.stopCharge();
        });
        
        this.elements.chargeButton.addEventListener('mouseleave', (e) => {
            if (this.isCharging) {
                this.stopCharge();
            }
        });
        
        // Touch events for mobile
        this.elements.chargeButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startCharge();
        });
        
        this.elements.chargeButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopCharge();
        });
        
        this.elements.chargeButton.addEventListener('touchcancel', (e) => {
            if (this.isCharging) {
                this.stopCharge();
            }
        });
        
        // Retry button
        this.elements.retryButton.addEventListener('click', () => {
            this.resetGame();
        });
        
        // Prevent context menu on right click
        this.elements.chargeButton.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    startCharge() {
        if (this.isGameOver || this.isCharging) return;
        
        this.isCharging = true;
        this.chargeStartTime = Date.now();
        this.elements.chargeButton.classList.add('charging');
        
        // Start charging animation
        this.chargingInterval = setInterval(() => {
            this.updateChargeGauge();
        }, 50);
    }
    
    stopCharge() {
        if (!this.isCharging) return;
        
        this.isCharging = false;
        this.elements.chargeButton.classList.remove('charging');
        
        if (this.chargingInterval) {
            clearInterval(this.chargingInterval);
            this.chargingInterval = null;
        }
        
        const chargeTime = (Date.now() - this.chargeStartTime) / 1000;
        this.calculatePower(chargeTime);
        this.executeSneeze();
    }
    
    updateChargeGauge() {
        if (!this.isCharging) return;
        
        const chargeTime = (Date.now() - this.chargeStartTime) / 1000;
        let chargePercentage = Math.min((chargeTime / 3.5) * 100, 110); // Max 110% to show overflow
        
        this.elements.chargeGauge.style.width = `${Math.min(chargePercentage, 100)}%`;
        
        // Add visual feedback for charge levels
        if (chargeTime >= 3.0) {
            this.elements.chargeGauge.style.background = 'linear-gradient(90deg, #9b59b6 0%, #8e44ad 100%)';
        } else if (chargeTime >= 2.5) {
            this.elements.chargeGauge.style.background = 'linear-gradient(90deg, #e74c3c 0%, #c0392b 100%)';
        } else if (chargeTime >= 1.5) {
            this.elements.chargeGauge.style.background = 'linear-gradient(90deg, #f39c12 0%, #e67e22 100%)';
        } else {
            this.elements.chargeGauge.style.background = 'linear-gradient(90deg, #27ae60 0%, #2ecc71 100%)';
        }
    }
    
    calculatePower(chargeTime) {
        if (chargeTime < 0.5) {
            // 弱 (Weak)
            this.currentPower = 1;
            this.chargeLevel = 'weak';
        } else if (chargeTime < 1.5) {
            // 普通 (Normal)
            this.currentPower = Math.floor(2 + (chargeTime - 0.5) * 2); // 2-4
            this.chargeLevel = 'normal';
        } else if (chargeTime < 2.5) {
            // 強 (Strong)
            this.currentPower = Math.floor(5 + (chargeTime - 1.5) * 2); // 5-7
            this.chargeLevel = 'strong';
        } else if (chargeTime < 3.0) {
            // 最強 (Max)
            this.currentPower = Math.floor(8 + (chargeTime - 2.5) * 4); // 8-10
            this.chargeLevel = 'max';
        } else {
            // 暴発 (Burst)
            this.currentPower = 1;
            this.chargeLevel = 'burst';
        }
        
        this.elements.powerValue.textContent = this.currentPower;
    }
    
    executeSneeze() {
        // Add wind effect animation
        this.elements.windEffect.classList.add('active');
        this.elements.windEffect.innerHTML = '💨💨💨';
        
        // Calculate distance reduction based on power
        let distanceReduction = this.currentPower * 8; // Each power point moves enemy 8 meters
        
        // Add some randomness
        distanceReduction += Math.random() * 5 - 2.5;
        
        this.enemyDistance = Math.max(0, this.enemyDistance - distanceReduction);
        
        // Animate enemy movement
        this.animateEnemyMovement();
        
        // Show result message
        setTimeout(() => {
            this.showResult();
            this.elements.windEffect.classList.remove('active');
        }, 800);
        
        // Check victory condition
        if (this.enemyDistance <= 0) {
            setTimeout(() => {
                this.showVictory();
            }, 1000);
        }
    }
    
    animateEnemyMovement() {
        const maxDistance = 100;
        const currentPosition = (this.enemyDistance / maxDistance) * 100;
        const rightPosition = Math.max(5, Math.min(95, 95 - currentPosition));
        
        this.elements.enemyCharacter.style.right = `${rightPosition}%`;
        
        // Add shake effect for impact
        this.elements.enemyCharacter.style.animation = 'none';
        setTimeout(() => {
            this.elements.enemyCharacter.style.animation = 'bounce 2s infinite';
        }, 500);
    }
    
    showResult() {
        let message = '';
        let className = 'result-message';
        
        switch (this.chargeLevel) {
            case 'weak':
                message = `ふわっ... 威力: ${this.currentPower}\n相手は${Math.round(this.enemyDistance)}m先にいます`;
                className += ' weak';
                break;
            case 'normal':
                message = `はくしょん！ 威力: ${this.currentPower}\n相手は${Math.round(this.enemyDistance)}m先にいます`;
                className += ' normal';
                break;
            case 'strong':
                message = `ハーーークション！！ 威力: ${this.currentPower}\n相手は${Math.round(this.enemyDistance)}m先にいます`;
                className += ' strong';
                break;
            case 'max':
                message = `究極のくしゃみ！！！ 威力: ${this.currentPower}\n相手は${Math.round(this.enemyDistance)}m先にいます`;
                className += ' max';
                break;
            case 'burst':
                message = `くしゃみ暴発... 威力: ${this.currentPower}\n相手は${Math.round(this.enemyDistance)}m先にいます`;
                className += ' burst';
                break;
        }
        
        this.elements.resultMessage.textContent = message;
        this.elements.resultMessage.className = className;
        this.elements.resultMessage.style.display = 'block';
        this.elements.retryButton.style.display = 'inline-block';
        
        this.updateDisplay();
    }
    
    showVictory() {
        this.isGameOver = true;
        this.elements.resultMessage.textContent = '🎉 勝利！ 🎉\n相手を吹き飛ばしました！';
        this.elements.resultMessage.className = 'result-message victory';
        this.elements.enemyCharacter.style.right = '110%'; // Move completely off screen
    }
    
    updateDisplay() {
        this.elements.distanceValue.textContent = Math.round(this.enemyDistance);
    }
    
    resetGame() {
        // Reset game state
        this.chargeStartTime = null;
        this.isCharging = false;
        this.currentPower = 0;
        this.chargeLevel = 0;
        this.enemyDistance = 100;
        this.isGameOver = false;
        
        if (this.chargingInterval) {
            clearInterval(this.chargingInterval);
            this.chargingInterval = null;
        }
        
        // Reset UI elements
        this.elements.chargeGauge.style.width = '0%';
        this.elements.chargeGauge.style.background = 'linear-gradient(90deg, #27ae60 0%, #2ecc71 100%)';
        this.elements.powerValue.textContent = '0';
        this.elements.resultMessage.style.display = 'none';
        this.elements.retryButton.style.display = 'none';
        this.elements.chargeButton.classList.remove('charging');
        this.elements.windEffect.classList.remove('active');
        this.elements.windEffect.innerHTML = '';
        
        // Reset enemy position
        this.elements.enemyCharacter.style.right = '50px';
        this.elements.enemyCharacter.style.animation = 'bounce 2s infinite';
        
        this.updateDisplay();
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new KushamiBattleGame();
});