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
let eagle_speed = 500;
let lastFrameTime = 0;
let isRunning = false;
let canvas;
let isEagleAttacking = false;
let eagleElement;
let eagles = [];  // Tableau pour stocker tous les aigles actifs
let targetElement;
let lastAttackTime = 0;
let attackCooldown = 1000; // Délai de 1 seconde en millisecondes

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
            
            // Position Y centrée dans la fenêtre
            eagle.element.position(eagle.x, window.innerHeight/2 - 50);
            
            eagle.x += (eagle_speed * deltaTime) / 1000;
            
            // Vérifier si l'aigle atteint la cible (par rapport à la fenêtre)
            if (eagle.x > window.innerWidth - 150) {
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
    }
}


