let handPose, video;
let hands = [];
let isGameStarted = false;
let timeToShoot = 0;
let maxTimeToShoot = 5000;
let isShooting = false;
let isGameOver = false;
let score = 0;
let bubbles = [];
let bubbleRadius = 20;
let bubbleSpeed = 25;
let colorBubbleAvailable = [
    {r: 255, g: 0, b: 0},
    {r: 0, g: 255, b: 0},
    {r: 0, g: 0, b: 255},
    {r: 255, g: 255, b: 255},
    {r: 0, g: 0, b: 0},
];
let isDetecting = false;
let gridRows = 8;
let gridCols = 8;
let gridBubbles = [];
let bubbleGrid = {
    x: 40,
    y: 40,
    cellSize: 50
};
let gameOverLine = {
    y: 400, // Position Y de la ligne de fin
    color: '#FF0000'
};
let currentBubble = null;
let aimStartTime = 0;
let aimDuration = 3000; // 3 secondes en millisecondes
let aimingBubble = false;

function preload() {
    handPose = ml5.handPose({
        flipped: true,
    });
}
function setup() {
    createCanvas(480, 480);
    video = createCapture(VIDEO);
    video.size(480, 480);
    video.hide();
    handPose.detectStart(video, gotHands);
    isDetecting = true;
}
function gotHands(results) {
    hands = results;
}
function draw() {
    background(205);
    stroke(gameOverLine.color);
    strokeWeight(3);
    line(0, gameOverLine.y, width, gameOverLine.y);
    noStroke();
    
    // Dessiner la grille de bulles et vérifier game over
    for (let row = 0; row < gridBubbles.length; row++) {
        for (let col = 0; col < gridBubbles[row].length; col++) {
            let bubble = gridBubbles[row][col];
            if (bubble) {
                fill(bubble.color.r, bubble.color.g, bubble.color.b);
                noStroke();
                circle(bubble.x, bubble.y, bubble.radius * 2);
                
                // Vérifier si une bulle traverse la ligne
                if (bubble.y + bubble.radius > gameOverLine.y) {
                    gameOver();
                    return;
                }
            }
        }
    }
    
    // Dessiner la bulle actuelle sur la ligne rouge
    if (currentBubble === null && isGameStarted && !isShooting) {
        currentBubble = createBubble();
    }
    
    if (currentBubble) {
        fill(currentBubble.color.r, currentBubble.color.g, currentBubble.color.b);
        noStroke();
        circle(width/2, gameOverLine.y, bubbleRadius * 2);
        
        // Si on est en train de viser
        if (aimingBubble && hands.length > 0) {
            let hand = hands[0];
            let indexTip = hand.keypoints[8];
            let indexBase = hand.keypoints[5];
            
            if (indexTip && indexBase) {
                // Dessiner la ligne de visée
                stroke(255, 255, 255);
                strokeWeight(2);
                let angle = Math.atan2(indexTip.y - indexBase.y, indexTip.x - indexBase.x);
                let lineLength = 50;
                line(width/2, gameOverLine.y,
                     width/2 + Math.cos(angle) * lineLength,
                     gameOverLine.y + Math.sin(angle) * lineLength);
                noStroke();
                
                // Vérifier si le temps de visée est écoulé
                if (millis() - aimStartTime >= aimDuration) {
                    shootBubbleFromBottom(angle);
                    currentBubble = null;
                    aimingBubble = false;
                    isShooting = true;
                    setTimeout(() => { isShooting = false; }, 500);
                } else {
                    // Afficher le temps restant
                    let timeLeft = Math.ceil((aimDuration - (millis() - aimStartTime)) / 1000);
                    fill(255);
                    textSize(24);
                    textAlign(CENTER);
                    text(timeLeft, width/2, gameOverLine.y - 30);
                }
            }
        }
    }
    
    // Dessiner et mettre à jour les bulles en mouvement
    for (let i = bubbles.length - 1; i >= 0; i--) {
        let bubble = bubbles[i];
        fill(bubble.color.r, bubble.color.g, bubble.color.b);
        noStroke();
        circle(bubble.x, bubble.y, bubble.radius * 2);
        bubble.x += bubble.velocityX;
        bubble.y += bubble.velocityY;
        checkCollisions(bubble, i);
        if (bubble.y < 0 || bubble.y > height || bubble.x < 0 || bubble.x > width) {
            bubbles.splice(i, 1);
        }
    }

    // Dessiner les points de la main
    if (hands.length > 0) {
        let hand = hands[0];
        for (let j = 0; j < hand.keypoints.length; j++) {
            let keypoint = hand.keypoints[j];
            fill(0, 255, 0);
            noStroke();
            circle(keypoint.x, keypoint.y, 10);
        }
        
        if (isGameStarted && !isShooting && currentBubble && !aimingBubble) {
            let indexTip = hand.keypoints[8];
            let indexBase = hand.keypoints[5];
            
            if (indexTip && indexBase) {
                aimingBubble = true;
                aimStartTime = millis();
            }
        }
    }
}

document.getElementById('startGame').addEventListener('click', startGame);
document.getElementById('pauseGame').addEventListener('click', pauseGame);

function startGame() {
    isGameStarted = true;
    isDetecting = true;
    timeToShoot = 0;
    bubbles = [];
    score = 0;
    isShooting = false;
    currentBubble = null;
    aimingBubble = false;
    initializeGrid();
}

function pauseGame() {
    if(isDetecting){
        handPose.detectStop();
        isDetecting = false;
        isGameStarted = false;
        isShooting = false;
    }else{
        handPose.detectStart(video, gotHands);
        isDetecting = true;
        isGameStarted = true;
        isShooting = true;
    }
}

function shootBubble(x, y, angle) {
    let speed = 5;
    let bubble = {
        x: x,
        y: y,
        radius: bubbleRadius,
        color: colorBubbleAvailable[Math.floor(Math.random() * colorBubbleAvailable.length)],
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed
    };
    bubbles.push(bubble);
}

function createBubble() {
    let bubble = {
        x: (width - bubbleRadius) / 2,
        y: height - bubbleRadius,
        radius: bubbleRadius,
        color: colorBubbleAvailable[Math.floor(Math.random() * colorBubbleAvailable.length)],
        velocityX: 0,
        velocityY: 0
    };
    return bubble;
}

function initializeGrid() {
    gridBubbles = [];
    // Créer la première ligne
    addNewRow();
}

function addNewRow() {
    let newRow = [];
    for (let col = 0; col < gridCols; col++) {
        let bubble = {
            x: bubbleGrid.x + col * bubbleGrid.cellSize,
            y: bubbleGrid.y,
            radius: bubbleRadius,
            color: colorBubbleAvailable[Math.floor(Math.random() * colorBubbleAvailable.length)],
            gridX: col,
            gridY: 0
        };
        newRow.push(bubble);
    }
    
    // Déplacer toutes les bulles existantes vers le bas avant d'ajouter la nouvelle ligne
    for (let row = 0; row < gridBubbles.length; row++) {
        for (let col = 0; col < gridBubbles[row].length; col++) {
            if (gridBubbles[row][col]) {
                gridBubbles[row][col].y += bubbleGrid.cellSize;
                gridBubbles[row][col].gridY++;
            }
        }
    }
    
    gridBubbles.unshift(newRow); // Ajouter la nouvelle ligne au début
}

function checkCollisions(bubble, bubbleIndex) {
    // Vérifier d'abord si la bulle touche le haut
    if (bubble.y < bubbleGrid.y + bubbleRadius) {
        let col = Math.floor((bubble.x - bubbleGrid.x) / bubbleGrid.cellSize);
        col = Math.max(0, Math.min(col, gridCols - 1));
        
        placeBubble(0, col, bubble, bubbleIndex);
        return true;
    }
    
    // Vérifier les collisions avec les autres bulles
    for (let row = 0; row < gridBubbles.length; row++) {
        for (let col = 0; col < gridBubbles[row].length; col++) {
            let gridBubble = gridBubbles[row][col];
            if (!gridBubble) continue;
            
            let d = dist(bubble.x, bubble.y, gridBubble.x, gridBubble.y);
            if (d < (bubble.radius + gridBubble.radius) * 1.2) { // Distance de collision réduite
                // Calculer la position de la nouvelle bulle
                let angle = Math.atan2(bubble.y - gridBubble.y, bubble.x - gridBubble.x);
                let newRow = row;
                let newCol = col;
                
                // Déterminer la position en fonction de l'angle de collision
                if (angle < -2.356) newRow--; // Haut
                else if (angle < -0.785) { newRow--; newCol++; } // Haut-droite
                else if (angle < 0.785) newCol++; // Droite
                else if (angle < 2.356) { newRow++; newCol++; } // Bas-droite
                else if (angle < 3.927) newRow++; // Bas
                else if (angle < 5.498) { newRow++; newCol--; } // Bas-gauche
                else if (angle < 6.269) newCol--; // Gauche
                else { newRow--; newCol--; } // Haut-gauche
                
                // Vérifier si la position est valide
                if (newRow >= 0 && newRow < gridBubbles.length && 
                    newCol >= 0 && newCol < gridCols) {
                    if (!gridBubbles[newRow] || !gridBubbles[newRow][newCol]) {
                        placeBubble(newRow, newCol, bubble, bubbleIndex);
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

function placeBubble(row, col, bubble, bubbleIndex) {
    // Créer une nouvelle ligne si nécessaire
    if (!gridBubbles[row]) {
        gridBubbles[row] = new Array(gridCols).fill(null);
    }
    
    // Placer la bulle
    let newBubble = {
        x: bubbleGrid.x + col * bubbleGrid.cellSize,
        y: bubbleGrid.y + row * bubbleGrid.cellSize,
        radius: bubbleRadius,
        color: bubble.color,
        gridX: col,
        gridY: row
    };
    
    gridBubbles[row][col] = newBubble;
    
    // Vérifier les correspondances
    let matches = findMatchingBubbles(row, col, bubble.color);
    if (matches.length >= 3) {
        for (let match of matches) {
            gridBubbles[match.row][match.col] = null;
            score += 10;
        }
        cleanupGrid();
    } else {
        addNewRow();
    }
    
    bubbles.splice(bubbleIndex, 1);
}

function findMatchingBubbles(row, col, color) {
    let matches = [];
    let checked = new Set();
    let toCheck = [{row, col}];
    
    while (toCheck.length > 0) {
        let current = toCheck.pop();
        let key = `${current.row},${current.col}`;
        
        if (checked.has(key)) continue;
        checked.add(key);
        
        let bubble = gridBubbles[current.row][current.col];
        if (!bubble) continue;
        
        if (bubble.color.r === color.r && bubble.color.g === color.g && bubble.color.b === color.b) {
            matches.push(current);
            
            // Ajouter toutes les positions adjacentes à vérifier
            let neighbors = [
                {row: current.row-1, col: current.col},   // haut
                {row: current.row+1, col: current.col},   // bas
                {row: current.row, col: current.col-1},   // gauche
                {row: current.row, col: current.col+1},   // droite
            ];
            
            for (let neighbor of neighbors) {
                if (neighbor.row >= 0 && neighbor.row < gridBubbles.length &&
                    neighbor.col >= 0 && neighbor.col < gridCols) {
                    toCheck.push(neighbor);
                }
            }
        }
    }
    
    return matches;
}

function cleanupGrid() {
    for (let row = gridBubbles.length - 1; row >= 0; row--) {
        if (gridBubbles[row].every(bubble => bubble === null)) {
            gridBubbles.splice(row, 1);
        }
    }
}

function gameOver() {
    isGameStarted = false;
    isGameOver = true;
    handPose.detectStop();
    isDetecting = false;
    const popup = document.createElement('div');
    popup.className = 'game-over-popup';
    popup.innerHTML = `
        <h2>Game Over!</h2>
        <p>Score: ${score}</p>
        <button onclick="window.restartGame()">Rejouer</button>
    `;
    document.body.appendChild(popup);
}

window.restartGame = function() {
    const popup = document.querySelector('.game-over-popup');
    if (popup) {
        popup.remove();
    }
    isGameOver = false;
    handPose.detectStart(video, gotHands); // Redémarrer la détection
    startGame();
}

function shootBubbleFromBottom(angle) {
    let speed = 5;
    let bubble = {
        x: width/2,
        y: gameOverLine.y,
        radius: bubbleRadius,
        color: currentBubble.color,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed
    };
    bubbles.push(bubble);
}
