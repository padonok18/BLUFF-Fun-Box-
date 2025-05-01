// Инициализация игры
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const backButton = document.getElementById('backButton');
const currentScoreElement = document.getElementById('currentScore');
const highScoreElement = document.getElementById('highScore');

// Загрузка текстур
const textures = {
    bird: new Image(),
    pipe: new Image(),
    background: new Image(),
    startScreen: new Image() // Новая текстура для заставки
};

textures.bird.src = 'https://i.ibb.co/PzV8FDcS/bird.png';
textures.pipe.src = 'https://i.ibb.co/hRfdDhHS/pipe.png';
textures.background.src = 'https://i.ibb.co/sdxkcsDL/background.png';
textures.startScreen.src = 'https://i.ibb.co/3m4WTGxf/flappy-start.jpg'; // Ваше изображение

// Настройки игры
const bird = {
    x: 50,
    y: 150,
    width: 40,
    height: 30,
    velocity: 0,
    gravity: 0.5,
    jumpForce: -8,
    rotation: 0,
    hitbox: {
        x: 6,
        y: 6,
        width: 28,
        height: 18
    }
};

const pipes = [];
let score = 0;
let highScore = 0;
let gameRunning = false;
let animationId;
let frames = 0;
let backgroundOffset = 0;
let totalGamesPlayed = 0;

// Загрузка данных
function loadGameData() {
    const savedData = localStorage.getItem('flappyGameData');
    if (savedData) {
        const data = JSON.parse(savedData);
        highScore = data.highScore || 0;
        totalGamesPlayed = data.totalGames || 0;
        highScoreElement.textContent = highScore;
        updateProfileStats();
        updateAchievementsProgress();
    }
}

// Сохранение данных
function saveGameData() {
    const data = {
        highScore,
        totalGames: totalGamesPlayed,
        achievements: {
            flappy: {
                newbie: totalGamesPlayed > 0,
                bird: highScore >= 10,
                king: highScore >= 50,
                ace: highScore >= 100,
                legend: highScore >= 500,
                god: highScore >= 1000
            },
            dino: {
                newbie: false,
                runner: false
            },
            snake: {
                newbie: false,
                boa: false
            }
        }
    };
    localStorage.setItem('flappyGameData', JSON.stringify(data));
}

// Обновление статистики профиля
function updateProfileStats() {
    document.getElementById('totalGames').textContent = totalGamesPlayed;
    document.getElementById('totalScore').textContent = highScore;
    document.getElementById('flappyStats').textContent = highScore;
    document.getElementById('favoriteGame').textContent = totalGamesPlayed > 0 ? 'FLAPPY BIRD' : '-';
    document.getElementById('achievementsCount').textContent = calculateAchievements();
}

// Расчет достижений
function calculateAchievements() {
    let count = 0;
    if (totalGamesPlayed > 0) count++;
    if (highScore >= 10) count++;
    if (highScore >= 50) count++;
    if (highScore >= 100) count++;
    if (highScore >= 500) count++;
    if (highScore >= 1000) count++;
    return count;
}

// Рисуем птицу
function drawBird() {
    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
    ctx.rotate(bird.rotation * Math.PI / 180);
    ctx.drawImage(
        textures.bird, 
        -bird.width / 2, 
        -bird.height / 2, 
        bird.width, 
        bird.height
    );
    ctx.restore();
    
    bird.rotation = Math.min(30, Math.max(-30, bird.velocity * 3));
}

// Рисуем трубы
function drawPipes() {
    pipes.forEach(pipe => {
        ctx.save();
        ctx.translate(pipe.x + 80 / 2, pipe.topHeight / 2);
        ctx.scale(1, -1);
        ctx.drawImage(textures.pipe, -80 / 2, -pipe.topHeight / 2, 80, pipe.topHeight);
        ctx.restore();
        ctx.drawImage(textures.pipe, pipe.x, canvas.height - pipe.bottomHeight, 80, pipe.bottomHeight);
    });
}

// Рисуем фон
function drawBackground() {
    if (!gameRunning && score === 0 && textures.startScreen.complete) {
        // Показываем заставку, когда игра не запущена
        ctx.drawImage(textures.startScreen, 0, 0, canvas.width, canvas.height);
    } else {
        // Обычный игровой фон
        ctx.drawImage(textures.background, backgroundOffset % canvas.width, 0, canvas.width, canvas.height);
        ctx.drawImage(textures.background, (backgroundOffset % canvas.width) - canvas.width, 0, canvas.width, canvas.height);
        
        if (gameRunning) backgroundOffset += 0.5;
    }
}

// Создаем трубу
function createPipe() {
    const gap = 120;
    const minHeight = 60;
    const maxHeight = canvas.height - gap - minHeight;
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
    
    pipes.push({
        x: canvas.width,
        topHeight,
        bottomHeight: canvas.height - gap - topHeight,
        passed: false
    });
}

// Проверка столкновений
function checkCollision() {
    if (bird.y + bird.hitbox.y < 0 || bird.y + bird.hitbox.y + bird.hitbox.height > canvas.height) {
        return true;
    }
    
    for (const pipe of pipes) {
        const birdLeft = bird.x + bird.hitbox.x;
        const birdRight = birdLeft + bird.hitbox.width;
        const birdTop = bird.y + bird.hitbox.y;
        const birdBottom = birdTop + bird.hitbox.height;
        
        const pipeLeft = pipe.x + 15;
        const pipeRight = pipeLeft + 50;
        
        if (birdRight > pipeLeft && birdLeft < pipeRight) {
            if (birdTop < pipe.topHeight - 10 || birdBottom > canvas.height - pipe.bottomHeight + 10) {
                return true;
            }
        }
    }
    
    return false;
}

// Игровой цикл
function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;
    
    if (checkCollision()) {
        endGame();
        return;
    }
    
    if (gameRunning) {
        if (frames % 100 === 0) createPipe();
        
        for (let i = pipes.length - 1; i >= 0; i--) {
            pipes[i].x -= 2;
            
            if (!pipes[i].passed && bird.x > pipes[i].x + 80) {
                pipes[i].passed = true;
                score++;
                currentScoreElement.textContent = score;
                updateAchievementsProgress();
            }
            
            if (pipes[i].x + 80 < 0) pipes.splice(i, 1);
        }
    }
    
    drawPipes();
    drawBird();
    frames++;
    animationId = requestAnimationFrame(update);
}

// Начало игры
function startGame() {
    if (gameRunning) return;
    
    bird.y = 150;
    bird.velocity = 0;
    bird.rotation = 0;
    pipes.length = 0;
    score = 0;
    currentScoreElement.textContent = score;
    gameRunning = true;
    frames = 0;
    backgroundOffset = 0;
    startButton.textContent = 'Пауза';
    backButton.style.display = 'none';
    
    if (!animationId) {
        update();
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBackground();
        drawBird();
    }
}

// Пауза игры
function pauseGame() {
    gameRunning = false;
    startButton.textContent = 'Продолжить';
    backButton.style.display = 'block';
    cancelAnimationFrame(animationId);
    animationId = null;
    
    // Отрисовываем текущее состояние игры при паузе
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawPipes();
    drawBird();
}

// Конец игры
function endGame() {
    gameRunning = false;
    startButton.textContent = 'Играть снова';
    backButton.style.display = 'block';
    cancelAnimationFrame(animationId);
    animationId = null;
    
    totalGamesPlayed++;
    
    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = highScore;
    }
    
    updateProfileStats();
    saveGameData();
    updateAchievementsProgress();
}

// Обновление прогресса достижений
function updateAchievementsProgress() {
    // Flappy Bird
    updateAchievement('flappy-newbie', totalGamesPlayed > 0, totalGamesPlayed > 0 ? 100 : 0);
    updateAchievement('flappy-bird', highScore >= 10, Math.min(100, highScore / 10 * 100));
    updateAchievement('flappy-king', highScore >= 50, Math.min(100, highScore / 50 * 100));
    updateAchievement('flappy-ace', highScore >= 100, Math.min(100, highScore / 100 * 100));
    updateAchievement('flappy-legend', highScore >= 500, Math.min(100, highScore / 500 * 100));
    updateAchievement('flappy-god', highScore >= 1000, Math.min(100, highScore / 1000 * 100));
    
    // Другие игры пока не реализованы
    updateAchievement('dino-newbie', false, 0);
    updateAchievement('dino-runner', false, 0);
    updateAchievement('snake-newbie', false, 0);
    updateAchievement('snake-boa', false, 0);
}

function updateAchievement(id, completed, progress) {
    const element = document.getElementById(id);
    if (!element) return;
    
    element.style.width = `${progress}%`;
    const icon = element.closest('.achievement-item').querySelector('.achievement-icon');
    if (completed) {
        icon.classList.add('completed');
    } else {
        icon.classList.remove('completed');
    }
}

// Обработка прыжка
function jump() {
    if (gameRunning) {
        bird.velocity = bird.jumpForce;
    }
}

// Инициализация
function init() {
    loadGameData();
    
    // Обработчики событий
    canvas.addEventListener('click', jump);
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            jump();
            e.preventDefault();
        }
    });
    
    startButton.addEventListener('click', () => {
        if (!gameRunning && startButton.textContent === 'Играть снова') {
            startGame();
        } else if (gameRunning) {
            pauseGame();
        } else {
            startGame();
        }
    });
    
    backButton.addEventListener('click', () => {
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.close();
        } else {
            pauseGame();
        }
    });
    
    // Проверка загрузки текстур
    let loaded = 0;
    const totalImages = Object.keys(textures).length;
    Object.values(textures).forEach(img => {
        img.onload = () => {
            loaded++;
            if (loaded === totalImages) {
                console.log('All textures loaded');
                // Принудительная отрисовка заставки после загрузки всех изображений
                if (!gameRunning) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    drawBackground();
                }
            }
        };
        img.onerror = () => {
            console.error('Error loading image:', img.src);
        };
    });
    
    // Первоначальная отрисовка
    if (!gameRunning) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Пробуем нарисовать заставку, даже если изображение еще не загрузилось
        if (textures.startScreen.complete) {
            drawBackground();
        }
    }
}

init();