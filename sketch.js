/*
 * 👋 Dibujo con la mano usando ml5.handPose y p5.js
 * Fondo negro, se dibuja la figura de la mano (temporal)
 * Cada dedo levantado activa una herramienta distinta sobre una capa de dibujo
 */

let handPose;
let video;
let hands = [];

const fingers = {
  thumb: [1, 2, 3, 4],
  index: [5, 6, 7, 8],
  middle: [9, 10, 11, 12],
  ring: [13, 14, 15, 16],
  pinky: [17, 18, 19, 20]
};

let currentColor = [255, 255, 255];
let drawLayer; // capa de dibujo
let prevFingerPos = {}; // posiciones previas de cada dedo

function preload() {
  handPose = ml5.handPose();
}

function setup() {
  createCanvas(1000, 900); // medidas del canvas
  background(255);

  // capa de dibujo independiente
  drawLayer = createGraphics(640, 480);
  drawLayer.background(255);

  // Video para detección (oculto)
  video = createCapture(VIDEO);
  video.size(640, 480);
  //video.hide();

  handPose.detectStart(video, gotHands);
}

function draw() {
  // mostrar el dibujo acumulado
  image(drawLayer, 0, 0, width, height);

  // mostrar la mano detectada (pero no se graba en drawLayer)
  for (let hand of hands) {
    drawHand(hand);

    let raised = detectRaisedFingers(hand);

    if (raised.length > 0) {
      // usar el dedo más arriba (menor valor en Y)
      let chosen = raised.reduce((best, f) => {
        let tip = hand.keypoints[fingers[f][3]];
        let bestTip = hand.keypoints[fingers[best][3]];
        return tip.y < bestTip.y ? f : best;
      }, raised[0]);

      let tip = hand.keypoints[fingers[chosen][3]]; // punta del dedo elegido

      if (chosen === "thumb") {
        // Pulgar → trazo verde claro
        drawLine(chosen, tip, color(171, 194, 186));
        currentColor = [171, 194, 186];
      } else if (chosen === "index") {
        // Anular → aerosol con color previo
        for (let i = 0; i < 30; i++) {
          let angle = random(TWO_PI);
          let radius = random(15);
          let x = tip.x + cos(angle) * radius;
          let y = tip.y + sin(angle) * radius;
          drawLayer.noStroke();
          drawLayer.fill(67, 229, 177, 100);
          drawLayer.circle(x, y, 2);
        }
        currentColor = [0, 255, 0];
      } else if (chosen === "middle") {
        // Corazón → trazo azul
        drawLine(chosen, tip, color(0, 0, 0));
        currentColor = [0, 0, 255];
      } else if (chosen === "ring") {
        // Anular → aerosol con color previo
        for (let i = 0; i < 30; i++) {
          let angle = random(TWO_PI);
          let radius = random(15);
          let x = tip.x + cos(angle) * radius;
          let y = tip.y + sin(angle) * radius;
          drawLayer.noStroke();
          drawLayer.fill(currentColor[0], currentColor[1], currentColor[2], 100);
          drawLayer.circle(x, y, 2);
        }
      } else if (chosen === "pinky") {
        // Meñique → borrador (círculo negro)
        drawLayer.noStroke();
        drawLayer.fill(255, 255, 255);
        drawLayer.circle(tip.x, tip.y, 40);
      }
    }
  }
}

// Función para trazar línea siguiendo el dedo
function drawLine(finger, tip, col) {
  drawLayer.stroke(col);
  drawLayer.strokeWeight(4);
  if (prevFingerPos[finger]) {
    drawLayer.line(prevFingerPos[finger].x, prevFingerPos[finger].y, tip.x, tip.y);
  }
  prevFingerPos[finger] = { x: tip.x, y: tip.y };
}

// Dibujar la mano (temporal, no se guarda en drawLayer)
function drawHand(hand) {
  stroke(100, 255, 100);
  strokeWeight(2);

  for (let finger in fingers) {
    beginShape();
    for (let idx of fingers[finger]) {
      let kp = hand.keypoints[idx];
      vertex(kp.x, kp.y);
      fill(100, 255, 100);
      noStroke();
      circle(kp.x, kp.y, 6);
      noFill();
      stroke(100, 255, 100);
    }
    endShape();
  }

  // conectar muñeca con base de cada dedo
  let wrist = hand.keypoints[0];
  for (let f in fingers) {
    let base = hand.keypoints[fingers[f][0]];
    line(wrist.x, wrist.y, base.x, base.y);
  }
}

// Detectar dedos levantados (más flexible)
function detectRaisedFingers(hand) {
  let raised = [];
  for (let finger in fingers) {
    let tip = hand.keypoints[fingers[finger][3]];
    let base = hand.keypoints[fingers[finger][0]];

    if (finger === "thumb") {
      if (tip.x < base.x - 10) raised.push(finger); // margen
    } else {
      if (tip.y < base.y - 20) raised.push(finger); // margen
    }
  }
  return raised;
}

function gotHands(results) {
  hands = results;
}
