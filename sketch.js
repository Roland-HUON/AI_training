let handPose, video;
let hands = [];
let eagleActivation = false;
let sound = new Audio("song_effect/eagle_noise.mp3");
let eagle_attack = "media/eagle_attack_pattern.gif";
let cible = "media/cible.png";
let score = 0;
let addScore = 10;
let eagle_image;
let eagle_x = -200;
let eagle_speed = 2500;
let lastFrameTime = 0;
let isRunning = false;
let canvas;
let isEagleAttacking = false;
let eagleElement;
let eagles = [];
let targetElement;
let lastAttackTime = 0;
let attackCooldown = 300;
let targetPatternState = 0;  // État actuel dans le pattern
let targetVisible = true;    // État de visibilité de la cible
let patternStartTime = 0;    // Temps de début du pattern actuel
let speedMultiplier = 1;
let gameStartTime = 0;
let gameOverPopup;
let isGameOver = false;

function preload() {
    handPose = ml5.handPose({
        maxHands: 1,
    });
    eagle_image = loadImage(eagle_attack);
}

function setup() {
    canvas = createCanvas(640, 480);
    video = createCapture(VIDEO);
    video.size(640, 480);
    video.hide();
    
    // Centrer le canvas horizontalement
    let canvasX = (windowWidth - width) / 2;
    canvas.position(canvasX, 20);
    
    // Positionner la cible à droite de la page
    targetElement = createImg(cible, 'target');
    targetElement.style('position', 'absolute');
    targetElement.style('right', '20px');  // 20px de marge à droite
    targetElement.style('top', '50%');
    targetElement.style('transform', 'translateY(-50%)');
    targetElement.style('z-index', '999');
    targetElement.size(100, 100);
    
    // Créer un élément img pour l'aigle
    eagleElement = createImg(eagle_attack, 'eagle');
    eagleElement.style('position', 'absolute');
    eagleElement.style('display', 'none');
    eagleElement.style('z-index', '1000');
    
    // Par défaut, on commence en mode arrêté
    stopEverything();
    
    // Ajout des événements pour les boutons
    document.getElementById('startButton').addEventListener('click', startEverything);
    document.getElementById('stopButton').addEventListener('click', stopEverything);
    
    // Créer le popup de Game Over (caché par défaut)
    gameOverPopup = createDiv('');
    gameOverPopup.class('game-over-popup');
    gameOverPopup.html(`
        <h2>Game Over</h2>
        <p>Score final: <span id="finalScore">0</span></p>
        <button id="restartButton">Recommencer</button>
    `);
    gameOverPopup.hide();
    
    // Ajouter l'événement pour le bouton recommencer
    document.getElementById('restartButton').addEventListener('click', restartGame);
}

function gotHands(results) {
    hands = results;
    if (results.length > 0) {
        detectGesture(results[0]);
    }
}

function detectGesture(hand) {
    if (!hand.keypoints) return;
    
    const thumbTip = hand.keypoints[4];
    const indexTip = hand.keypoints[8];
    const middleTip = hand.keypoints[12];
    const ringTip = hand.keypoints[16];
    const pinkyTip = hand.keypoints[20];
    
    if (thumbTip && indexTip && middleTip && ringTip && pinkyTip) {
        const thumbIndexDistance = dist(thumbTip.x, thumbTip.y, indexTip.x, indexTip.y);
        const fingerDistance = dist(indexTip.x, indexTip.y, pinkyTip.x, pinkyTip.y);
        console.log(eagleActivation);
        if (fingerDistance < 50 && eagleActivation) {
            console.log("Eagle attack");
            EagleAttack();
        } else if (thumbIndexDistance < 35) {
            console.log("Eagle activation");
            EagleActivation();
        } else if (fingerDistance < 100) {
            console.log("Pause");
            Pause();
        }
    }
}

function EagleActivation(){
    setTimeout(() => {
        eagleActivation = true;
    }, 5000);
    if(eagleActivation){
        console.log("Eagle activation");
        sound.play();
    }
    eagleActivation = false;
}

function EagleAttack(){
    let currentTime = millis();
    
    // Vérifier si assez de temps s'est écoulé depuis la dernière attaque
    if(eagleActivation == true && currentTime - lastAttackTime >= attackCooldown){
        console.log("Eagle attack");
        sound.play();
        let newEagle = createEagle();
        eagles.push(newEagle);
        
        // Mettre à jour le temps de la dernière attaque
        lastAttackTime = currentTime;
    }   
}

function Pause(){
    sound.pause();
    eagleActivation = false;
}

function createEagle() {
    let eagleElement = createImg(eagle_attack, 'eagle');
    eagleElement.style('position', 'absolute');
    eagleElement.style('z-index', '1000');
    eagleElement.size(200, 100);
    
    return {
        element: eagleElement,
        x: -200,  // Commencer hors de l'écran
        isActive: true
    };
}

function draw() {
    image(video, 0, 0, width, height);
    
    // Mettre à jour le pattern de la cible
    updateTargetPattern();
    
    // Afficher le score
    fill(255);
    textSize(32);
    textAlign(LEFT, TOP);
    text('Score: ' + score, 10, 10);
    
    for (let hand of hands) {
        if (hand.keypoints) {
            for (let keypoint of hand.keypoints) {
                fill(0, 255, 0);
                noStroke();
                circle(keypoint.x, keypoint.y, 10);
            }
        }
    }
    
    let now = millis();
    let deltaTime = now - lastFrameTime;
    lastFrameTime = now;
    
    // Mettre à jour la position de tous les aigles
    eagles = eagles.filter(eagle => {
        if (eagle.isActive) {
            eagle.element.style('display', 'block');
            eagle.element.position(eagle.x, window.innerHeight/2 - 50);
            eagle.x += (eagle_speed * deltaTime) / 1000;
            
            // Vérifier si l'aigle atteint la cible
            if (eagle.x > window.innerWidth - 150) {
                if (!targetVisible) {
                    // Game Over si la cible est invisible
                    gameOver();
                    eagle.isActive = false;
                    eagle.element.remove();
                    return false;
                }
                // Si la cible est visible, marquer des points
                score += addScore;
                eagle.isActive = false;
                eagle.element.remove();
                
                targetElement.style('transform', 'translateY(-50%) scale(1.2)');
                setTimeout(() => {
                    targetElement.style('transform', 'translateY(-50%) scale(1)');
                }, 200);
                
                return false;
            }
            return true;
        }
        return false;
    });
}

function startEverything() {
    if (!isRunning) {
        canvas.show();
        video.play();
        handPose.detectStart(video, gotHands);
        isRunning = true;
        gameStartTime = millis();  // Enregistrer le temps de début
        patternStartTime = millis();
        targetVisible = true;
        targetElement.style('display', 'block');
    }
}

function stopEverything() {
    if (isRunning || !isRunning) {
        canvas.hide();
        handPose.detectStop();
        video.stop();
        sound.pause();
        sound.currentTime = 0;
        eagleActivation = false;
        isRunning = false;
        score = 0;  // Réinitialiser le score
        
        // Nettoyer tous les aigles
        eagles.forEach(eagle => {
            eagle.element.remove();
        });
        eagles = [];
        
        clear();
        targetPatternState = 0;
        targetVisible = true;
        speedMultiplier = 1;
        targetElement.style('display', 'none');
    }
}

function updateTargetPattern() {
    if (!isRunning) return;
    
    let currentTime = millis();
    let elapsedGameTime = (currentTime - gameStartTime) / 1000; // Temps en secondes
    speedMultiplier = 1 - (elapsedGameTime * 0.01); // Réduire le temps de 1% par seconde
    speedMultiplier = constrain(speedMultiplier, 0.3, 1); // Limiter entre 0.3 et 1
    
    let patternTime = currentTime - patternStartTime;
    
    switch(targetPatternState) {
        case 0:
            if (patternTime > 10000 * speedMultiplier) {
                targetVisible = false
                targetPatternState = 1;
                patternStartTime = currentTime;
            }
            break;
        case 1:
            if (patternTime > 5000 * speedMultiplier) {
                targetVisible = true;
                targetPatternState = 2;
                patternStartTime = currentTime;
            }
            break;
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
            if (patternTime > 7500 * speedMultiplier) {
                targetVisible = !targetVisible;
                targetPatternState++;
                patternStartTime = currentTime;
            }
            break;
        case 8:
            if (patternTime > 10000 * speedMultiplier) {
                targetVisible = false;
                targetPatternState = 9;
                patternStartTime = currentTime;
            }
            break;
        case 9:
            if (patternTime > 5000 * speedMultiplier) {
                targetVisible = true;
                targetPatternState = 0;
                patternStartTime = currentTime;
            }
            break;
    }
    
    targetElement.style('display', targetVisible ? 'block' : 'none');
}

function gameOver() {
    isGameOver = true;
    canvas.hide();
    handPose.detectStop();
    video.stop();
    sound.pause();
    
    // Nettoyer tous les aigles
    eagles.forEach(eagle => {
        eagle.element.remove();
    });
    eagles = [];
    
    // Mettre à jour et afficher le popup
    document.getElementById('finalScore').textContent = score;
    gameOverPopup.show();
}

function restartGame() {
    isGameOver = false;
    gameOverPopup.hide();
    score = 0;
    startEverything();
}


