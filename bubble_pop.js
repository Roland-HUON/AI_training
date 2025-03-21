let handPose, video;
let hands = [];
function preload() {
    handPose = ml5.handPose({
        maxHands: 1,
        flipped: true,
    });
}
function setup() {
    createCanvas(480, 480);
    video = createCapture(VIDEO);
    video.size(480, 480);
    video.hide();
    handPose.detectStart(video, gotHands);
}
function gotHands(results) {
    hands = results;
}
function draw() {
    background(255);
    for (let i = 0; i < hands.length; i++) {
        let hand = hands[i];
        for (let j = 0; j < hand.keypoints.length; j++) {
            let keypoint = hand.keypoints[j];
            fill(0, 255, 0);
            noStroke();
            circle(keypoint.x, keypoint.y, 10);
        }
    }
}