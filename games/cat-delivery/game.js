class CatDeliveryGame {
    constructor() {
        this.gameState = 'ready';
        this.score = 0;
        this.health = 3;
        this.packagesDelivered = 0;
        this.gameTimer = 120;
        this.catPosition = 50; // percentage from left
        this.obstacles = [];
        this.packages = [];
        this.deliveryTargets = [];
        this.gameLoop = null;
        this.timerInterval = null;
        this.spawnInterval = null;
        this.hasPackage = false;
        this.currentPackage = null;
        
        // Game constants
        this.obstacleTypes = [
            { type: 'car', emoji: '🚗', className: 'obstacle-car', width: 60, height: 100 },
            { type: 'construction', emoji: '🚧', className: 'obstacle-construction', width: 80, height: 80 },
            { type: 'hole', emoji: '🕳️', className: 'obstacle-hole', width: 40, height: 40 },
            { type: 'tree', emoji: '🌳', className: 'obstacle-tree', width: 50, height: 120 },
            { type: 'signal', emoji: '🚦', className: 'obstacle-signal', width: 30, height: 150 }
        ];
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateDisplay();
        this.setupTestHooks();
    }
    
    bindEvents() {
        // Start button
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        
        // Retry button
        document.getElementById('retry-btn').addEventListener('click', () => this.retryGame());
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Mobile controls
        document.getElementById('left-btn').addEventListener('click', () => this.moveCat('left'));
        document.getElementById('right-btn').addEventListener('click', () => this.moveCat('right'));
        
        // Touch controls for mobile
        document.getElementById('left-btn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.moveCat('left');
        });
        document.getElementById('right-btn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.moveCat('right');
        });
    }
    
    setupTestHooks() {
        // テスト用のグローバル関数を設定
        window.gameTimer = this.gameTimer;
        window.setGameTimer = (time) => {
            this.gameTimer = time;
            window.gameTimer = time;
            this.updateDisplay();
        };
    }
    
    startGame() {
        this.gameState = 'playing';
        this.gameTimer = 120;
        this.updateDisplay();
        
        document.getElementById('start-btn').style.display = 'none';
        document.getElementById('final-score').style.display = 'none';
        document.querySelector('[data-testid="game-status"]').setAttribute('data-status', 'playing');
        
        this.startTimer();
        this.startGameLoop();
        this.startSpawning();
    }
    
    retryGame() {
        this.resetGame();
        this.startGame();
    }
    
    resetGame() {
        this.gameState = 'ready';
        this.score = 0;
        this.health = 3;
        this.packagesDelivered = 0;
        this.gameTimer = 120;
        this.catPosition = 50;
        this.hasPackage = false;
        this.currentPackage = null;
        
        // Clear all objects
        this.obstacles = [];
        this.packages = [];
        this.deliveryTargets = [];
        
        // Clear intervals
        if (this.gameLoop) clearInterval(this.gameLoop);
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.spawnInterval) clearInterval(this.spawnInterval);
        
        // Clear DOM
        document.querySelectorAll('.obstacle, .package, .delivery-target').forEach(el => el.remove());
        
        // Reset UI
        document.getElementById('start-btn').style.display = 'inline-block';
        document.getElementById('retry-btn').style.display = 'none';
        document.getElementById('final-score').style.display = 'none';
        document.querySelector('[data-testid="game-status"]').setAttribute('data-status', 'ready');
        
        this.updateDisplay();
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.gameTimer--;
            window.gameTimer = this.gameTimer;
            this.updateDisplay();
            
            if (this.gameTimer <= 0) {
                this.endGame();
            }
        }, 1000);
    }
    
    startGameLoop() {
        this.gameLoop = setInterval(() => {
            this.updateObstacles();
            this.updatePackages();
            this.updateDeliveryTargets();
            this.checkCollisions();
            this.updateDisplay();
        }, 50);
    }
    
    startSpawning() {
        this.spawnInterval = setInterval(() => {
            if (Math.random() < 0.7) {
                this.spawnObstacle();
            }
            
            if (!this.hasPackage && this.packages.length === 0 && Math.random() < 0.3) {
                this.spawnPackage();
            }
        }, 1500);
    }
    
    spawnObstacle() {
        const obstacleType = this.obstacleTypes[Math.floor(Math.random() * this.obstacleTypes.length)];
        const roadArea = document.getElementById('road-area');
        const roadWidth = roadArea.offsetWidth;
        
        const obstacle = {
            id: Date.now() + Math.random(),
            type: obstacleType.type,
            x: Math.random() * (roadWidth - obstacleType.width),
            y: -obstacleType.height,
            width: obstacleType.width,
            height: obstacleType.height,
            element: null
        };
        
        const element = document.createElement('div');
        element.className = `obstacle ${obstacleType.className}`;
        element.setAttribute('data-testid', 'obstacle');
        element.style.left = obstacle.x + 'px';
        element.style.top = obstacle.y + 'px';
        element.style.width = obstacleType.width + 'px';
        element.style.height = obstacleType.height + 'px';
        element.textContent = obstacleType.emoji;
        
        obstacle.element = element;
        roadArea.appendChild(element);
        this.obstacles.push(obstacle);
    }
    
    spawnPackage() {
        const roadArea = document.getElementById('road-area');
        const roadWidth = roadArea.offsetWidth;
        
        const package = {
            id: Date.now() + Math.random(),
            x: Math.random() * (roadWidth - 30),
            y: -30,
            width: 30,
            height: 30,
            element: null
        };
        
        const element = document.createElement('div');
        element.className = 'package';
        element.setAttribute('data-testid', 'package');
        element.style.left = package.x + 'px';
        element.style.top = package.y + 'px';
        element.style.width = '30px';
        element.style.height = '30px';
        element.textContent = '📦';
        
        package.element = element;
        roadArea.appendChild(element);
        this.packages.push(package);
    }
    
    spawnDeliveryTarget() {
        const roadArea = document.getElementById('road-area');
        const roadWidth = roadArea.offsetWidth;
        
        const target = {
            id: Date.now() + Math.random(),
            x: Math.random() * (roadWidth - 50),
            y: -50,
            width: 50,
            height: 50,
            element: null
        };
        
        const element = document.createElement('div');
        element.className = 'delivery-target';
        element.setAttribute('data-testid', 'delivery-target');
        element.style.left = target.x + 'px';
        element.style.top = target.y + 'px';
        element.style.width = '50px';
        element.style.height = '50px';
        element.textContent = '🏠';
        
        target.element = element;
        roadArea.appendChild(element);
        this.deliveryTargets.push(target);
    }
    
    updateObstacles() {
        this.obstacles = this.obstacles.filter(obstacle => {
            obstacle.y += 3; // Move down
            obstacle.element.style.top = obstacle.y + 'px';
            
            if (obstacle.y > document.getElementById('road-area').offsetHeight) {
                obstacle.element.remove();
                return false;
            }
            return true;
        });
    }
    
    updatePackages() {
        this.packages = this.packages.filter(package => {
            package.y += 2; // Move down slower than obstacles
            package.element.style.top = package.y + 'px';
            
            if (package.y > document.getElementById('road-area').offsetHeight) {
                package.element.remove();
                return false;
            }
            return true;
        });
    }
    
    updateDeliveryTargets() {
        this.deliveryTargets = this.deliveryTargets.filter(target => {
            target.y += 2; // Move down slower than obstacles
            target.element.style.top = target.y + 'px';
            
            if (target.y > document.getElementById('road-area').offsetHeight) {
                target.element.remove();
                return false;
            }
            return true;
        });
    }
    
    checkCollisions() {
        const catElement = document.getElementById('cat-player');
        const catRect = catElement.getBoundingBox ? catElement.getBoundingBox() : catElement.getBoundingClientRect();
        const roadArea = document.getElementById('road-area');
        const roadRect = roadArea.getBoundingClientRect();
        
        // Convert cat position to relative coordinates
        const catX = (this.catPosition / 100) * roadArea.offsetWidth - 25; // Adjust for cat width
        const catY = roadArea.offsetHeight - 80; // Cat position from bottom
        const catWidth = 50;
        const catHeight = 60;
        
        // Check obstacle collisions
        this.obstacles.forEach(obstacle => {
            if (this.isColliding(catX, catY, catWidth, catHeight, obstacle.x, obstacle.y, obstacle.width, obstacle.height)) {
                this.handleObstacleCollision(obstacle);
            }
        });
        
        // Check package pickup
        this.packages.forEach((package, index) => {
            if (this.isColliding(catX, catY, catWidth, catHeight, package.x, package.y, package.width, package.height)) {
                this.handlePackagePickup(package, index);
            }
        });
        
        // Check delivery
        this.deliveryTargets.forEach((target, index) => {
            if (this.hasPackage && this.isColliding(catX, catY, catWidth, catHeight, target.x, target.y, target.width, target.height)) {
                this.handleDelivery(target, index);
            }
        });
    }
    
    isColliding(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    }
    
    handleObstacleCollision(obstacle) {
        if (obstacle.hit) return; // Prevent multiple hits on same obstacle
        obstacle.hit = true;
        
        this.health--;
        this.score = Math.max(0, this.score - 20);
        
        // Visual feedback
        const catElement = document.getElementById('cat-player');
        catElement.classList.add('collision-effect');
        setTimeout(() => catElement.classList.remove('collision-effect'), 500);
        
        this.showScorePopup(-20, obstacle.element);
        
        if (this.health <= 0) {
            this.endGame();
        }
    }
    
    handlePackagePickup(package, index) {
        this.hasPackage = true;
        this.currentPackage = package;
        
        // Remove package
        package.element.classList.add('pickup-effect');
        setTimeout(() => {
            package.element.remove();
        }, 500);
        this.packages.splice(index, 1);
        
        // Spawn delivery target
        this.spawnDeliveryTarget();
        
        // Visual feedback
        this.showScorePopup('荷物GET!', package.element);
    }
    
    handleDelivery(target, index) {
        if (!this.hasPackage) return;
        
        this.hasPackage = false;
        this.currentPackage = null;
        this.packagesDelivered++;
        
        // Calculate score
        let deliveryScore = 200;
        
        // Time bonus (if delivered in 30 seconds or less)
        const elapsedTime = 120 - this.gameTimer;
        if (elapsedTime <= 30) {
            deliveryScore += 100;
        }
        
        // Perfect delivery bonus (no damage taken)
        if (this.health === 3) {
            deliveryScore += 50;
        }
        
        // Distance bonus (simplified)
        deliveryScore += Math.floor(Math.random() * 50) + 10;
        
        this.score += deliveryScore;
        
        // Health bonus for delivery
        if (this.health < 5) {
            this.health++;
        }
        
        // Remove delivery target
        target.element.classList.add('pickup-effect');
        setTimeout(() => {
            target.element.remove();
        }, 500);
        this.deliveryTargets.splice(index, 1);
        
        // Visual feedback
        this.showScorePopup('+' + deliveryScore, target.element);
    }
    
    showScorePopup(text, element) {
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        popup.textContent = text;
        
        if (typeof text === 'number' || text.startsWith('+')) {
            popup.classList.add('positive');
        } else if (typeof text === 'number' && text < 0) {
            popup.classList.add('negative');
        }
        
        const rect = element.getBoundingClientRect();
        popup.style.left = rect.left + 'px';
        popup.style.top = rect.top + 'px';
        popup.style.position = 'fixed';
        
        document.body.appendChild(popup);
        
        setTimeout(() => {
            popup.remove();
        }, 1000);
    }
    
    handleKeyboard(e) {
        if (this.gameState !== 'playing') return;
        
        switch (e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                e.preventDefault();
                this.moveCat('left');
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                e.preventDefault();
                this.moveCat('right');
                break;
        }
    }
    
    moveCat(direction) {
        if (this.gameState !== 'playing') return;
        
        const moveAmount = 8;
        
        if (direction === 'left') {
            this.catPosition = Math.max(10, this.catPosition - moveAmount);
        } else if (direction === 'right') {
            this.catPosition = Math.min(90, this.catPosition + moveAmount);
        }
        
        const catElement = document.getElementById('cat-player');
        catElement.style.left = this.catPosition + '%';
    }
    
    updateDisplay() {
        document.getElementById('timer').textContent = this.gameTimer;
        document.getElementById('score').textContent = this.score;
        document.getElementById('health').textContent = this.health;
        document.getElementById('packages').textContent = this.packagesDelivered;
    }
    
    endGame() {
        this.gameState = 'finished';
        
        // Clear intervals
        if (this.gameLoop) clearInterval(this.gameLoop);
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.spawnInterval) clearInterval(this.spawnInterval);
        
        // Update UI
        document.querySelector('[data-testid="game-status"]').setAttribute('data-status', 'finished');
        document.getElementById('final-score-value').textContent = this.score;
        document.getElementById('final-packages-value').textContent = this.packagesDelivered;
        document.getElementById('final-score').style.display = 'flex';
        document.getElementById('retry-btn').style.display = 'inline-block';
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new CatDeliveryGame();
});