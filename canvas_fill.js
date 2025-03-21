let handPose, video;
let hands = [];
let drawnPoints = [];
let isDetecting = true;
let maxTime = 60000;
// let maxTime = 5000;
let startTime = 0;
let percent = 0;
let isGameStarted = false;
let gridSize = 20;
let grid;

function preload() {
  handPose = ml5.handPose({
    flipped: true,
  });
}
function setup() {
    createCanvas(640, 480);
    video = createCapture(VIDEO);
    video.size(640, 480);
    video.hide();
    
    let cols = Math.ceil(width / gridSize);
    let rows = Math.ceil(height / gridSize);
    grid = Array(cols).fill().map(() => Array(rows).fill(false));
}
function gotHands(results) {
    hands = results;
}
function draw() {
    background(255);
    
    if (!isGameStarted) {
        textSize(32);
        fill(0);
        textAlign(CENTER, CENTER);
        text('Appuyez sur Start pour commencer', width/2, height/2);
        return;
    }
    
    let timeElapsed = millis() - startTime;
    let timeLeft = maxTime - timeElapsed;
    
    if (timeLeft <= 0) {
        background(255);
        textSize(32);
        fill(0);
        textAlign(CENTER, CENTER);
        text(`Temps écoulé ! Score final: ${percent.toFixed(1)}%`, width/2, height/2);
        isGameStarted = false;
        handPose.detectStop();
        noLoop();
        return;
    }

    // Dessiner les points et mettre à jour la grille
    for (let point of drawnPoints) {
        fill(0, 255, 0);
        noStroke();
        circle(point.x, point.y, 10);
        
        // Marquer les cellules de la grille
        let gridX = Math.floor(point.x / gridSize);
        let gridY = Math.floor(point.y / gridSize);
        if (gridX >= 0 && gridX < grid.length && gridY >= 0 && gridY < grid[0].length) {
            grid[gridX][gridY] = true;
        }
    }
    
    // Dessiner les points en temps réel
    for (let i = 0; i < hands.length; i++) {
        let hand = hands[i];
        for (let j = 0; j < hand.keypoints.length; j++) {
            let keypoint = hand.keypoints[j];
            fill(0, 255, 0);
            noStroke();
            circle(keypoint.x, keypoint.y, 10);
            
            if (frameCount % 5 === 0) {
                drawnPoints.push({x: keypoint.x, y: keypoint.y});
            }
        }
    }
    
    // Calculer le pourcentage de couverture
    let totalCells = grid.length * grid[0].length;
    let filledCells = grid.flat().filter(cell => cell).length;
    percent = (filledCells / totalCells) * 100;
    
    // Afficher le temps et le pourcentage
    textSize(20);
    fill(0);
    noStroke();
    text(`Temps: ${Math.ceil(timeLeft/1000)}s`, 10, 30);
    text(`Couverture: ${percent.toFixed(1)}%`, 10, 60);
}
document.getElementById("clearTable").addEventListener("click", clearTable);
function clearTable() {
    drawnPoints = [];
    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[0].length; j++) {
            grid[i][j] = false;
        }
    }
    percent = 0;
}

document.getElementById("toggleDetection").addEventListener("click", toggleDetection);
function toggleDetection() {
    if(isDetecting){
        handPose.detectStop();
        isDetecting = false;
    }else{
        handPose.detectStart(video, gotHands);
        isDetecting = true;
    }
}
document.getElementById("startGame").addEventListener("click", startGame);
function startGame() {
    isGameStarted = true;
    startTime = millis();
    handPose.detectStart(video, gotHands);
    drawnPoints = [];
    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[0].length; j++) {
            grid[i][j] = false;
        }
    }
    percent = 0;
    loop();
}