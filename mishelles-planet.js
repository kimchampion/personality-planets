let globeTexture;
let laptopScreenImg;
let worldMusic;
let uiFont;
let spaceFont;

let stars = [];
let panelTextures = [];
let dataPanelTextures = [];

let introMessages = [
  "welcome to mishelle's world!",
  "This is your planet sized workspace.",
  "Click on the screen to start exploring."
];

let introIndex = 0;
let showingIntro = false;

const groundSize = 8000;  // must match the plane size in scene 1

let camDist = 800;
const minCamDist = 300;
const maxCamDist = 2000;


let camDist1 = 900;        // starting zoom distance in scene 1
const minCamDist1 = 500;   // how close you can zoom in
const maxCamDist1 = 1800;  // how far you can zoom out
  // ✨ new safe zoom limit (40% of ground size)

let yawAngle = 0;   // camera rotation controlled by keys in scene 1

// 0 = space, 1 = on planet
let scene = 0;

// Player / camera state for scene 1
let playerX = 0;
let playerZ = 0;
const moveSpeed = 10;

function preload() {
  
  globeTexture = loadImage('assets/pastelplanet.jpg');

  soundFormats('mp3', 'ogg'); // optional but safe

  worldMusic = loadSound('assets/walle.mp3'); 

    // image for laptop screen (you can change this to any image you want)
  laptopScreenImg = loadImage('assets/laptopscreen.jpg');

  uiFont        = loadFont("assets/Arial.ttf");
  spaceFont     = loadFont("SPACE.ttf"); 

  // one image per panel, change these names to match your files
  panelTextures = [
    loadImage('assets/watercanvas.png'),
    loadImage('assets/designinginterruptions.png'),
    loadImage('assets/breath.png'),
    loadImage('assets/rhythm.png'),
    loadImage('assets/emotions.png'),
    loadImage('assets/lego.png')
  ];

    // data side images (left side enclosure)
  dataPanelTextures = [
    loadImage('assets/communitydata.png'),
    loadImage('assets/disneydata.png'),
    loadImage('assets/worldcup.png'),
    loadImage('assets/NewYork.png'),
    loadImage('assets/legodata.png'),
    loadImage('assets/medianagemarriage.png')
  ];
}


function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);

    userStartAudio().then(() => {
    if (worldMusic && !worldMusic.isPlaying()) {
      worldMusic.loop();
      worldMusic.setVolume(0.5);
    }
  });
  textureMode(NORMAL);
  textureWrap(REPEAT, REPEAT);

  // create 3D stars for the space scene
  const starCount = 500;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: random(-2000, 2000),
      y: random(-2000, 2000),
      z: random(-2000, 2000)
    });
  }

  //button: x,y,buttonText, redirect
  let bttn = new Button(20, 20, "Back", "./"); //go back to the landing page
  bttn.show();
}

function draw() {


  if (scene === 0) {
    drawSpaceScene();
 
  } else if (scene === 1) {
    drawOnPlanetScene();
   
  }
}

function drawSpaceScene() {
  background(0);

  // 3D controls and lights
  orbitControl(1, 1, 0);
  lights();

  // 3D content
  drawStars();
  drawSpacePlanet();

  // go to 2D screen space
  resetMatrix();
  translate(-width / 2, -height / 2);

  // HUD text
  noStroke();
  fill(255);
  textAlign(LEFT, TOP);
  textSize(20);
  textFont(spaceFont);
  text("SPACE VIEW", 200, 50);
  textSize(14);
    textFont(uiFont);
  text("Click the planet to go down to the surface", 200, 95);

  push();
resetMatrix();
translate(-width / 2, -height / 2);
noStroke();

// disable depth so the button always appears on top
drawingContext.disable(drawingContext.DEPTH_TEST);

// ---- BACK BUTTON (pink-purple) ----
push();
resetMatrix();
translate(-width / 2, -height / 2);
noStroke();

// make UI draw ON TOP of 3D scene
drawingContext.disable(drawingContext.DEPTH_TEST);

// ---- CIRCULAR BACK BUTTON ----
push();
resetMatrix();
translate(-width / 2, -height / 2);
noStroke();

// draw UI on top of 3D
drawingContext.disable(drawingContext.DEPTH_TEST);

// position + size
let backX = 60;   // center X of circle
let backY = 150;  // center Y of circle
let backR = 40;   // radius (circle size)

// button circle
fill(255, 200, 255);   // pink purple
ellipse(backX, backY, backR * 2, backR * 2);

// // label
// fill(0);               // black text
// textAlign(CENTER, CENTER);
// textSize(18);
// text("", backX, backY);

// re-enable depth
drawingContext.enable(drawingContext.DEPTH_TEST);

pop();
}

function drawSpacePlanet() {
  if (!globeTexture) return;

  const radius = min(width, height) * 0.25;

  // ---- PLANET ----
  push();
  noStroke();
  texture(globeTexture);

  // put planet near the center-bottom of the canvas
  translate(0, radius * 0.2, 0);
  sphere(radius, 50, 50);
  pop();

  // ---- MOON (white sphere near planet) ----
  push();
  noStroke();
  // simple white material (works fine in WEBGL)
  ambientMaterial(240, 240, 255);

  // position moon a bit up and to the right of the planet
  translate(radius * 4.1, -radius * 1.9, -radius * 10);

  // smaller than the planet
  sphere(radius * 0.4, 24, 24);
  pop();
}

function drawStars() {
  push();
  strokeWeight(2);

  for (let s of stars) {
    // In scene 1 (on planet), only draw stars that are "in the sky"
    // +Y is down in WEBGL, so sky is y < 0
    if (scene === 1 && s.y > 0) {
      continue; // skip stars below the horizon
    }

    const brightness = random(180, 255);
    stroke(brightness);
    point(s.x, s.y, s.z);
  }

  pop();
}

function drawOnPlanetScene() {
  background(10, 5, 25); // dark sky

  // simple lighting
  ambientLight(150);
  directionalLight(255, 255, 255, 0.3, -1, -0.2);

  // CAMERA YAW CONTROLLED BY Q / E KEYS

  // Q rotates camera left
  if (keyIsDown(81)) {   // 81 = 'Q'
    yawAngle -= 0.03;
  }

  // E rotates camera right
  if (keyIsDown(69)) {   // 69 = 'E'
    yawAngle += 0.03;
  }

  let yaw = yawAngle;

  // MOVEMENT: update player position
  // Forward and back (W S or UP DOWN)
  if (keyIsDown(87) || keyIsDown(UP_ARROW)) { // W or UP
    playerX += moveSpeed * sin(yaw);
    playerZ -= moveSpeed * cos(yaw);
  }
  if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) { // S or DOWN
    playerX -= moveSpeed * sin(yaw);
    playerZ += moveSpeed * cos(yaw);
  }

  // Strafe (A D or LEFT RIGHT)
  if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) { // A or LEFT
    playerX -= moveSpeed * cos(yaw);
    playerZ -= moveSpeed * sin(yaw);
  }
  if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) { // D or RIGHT
    playerX += moveSpeed * cos(yaw);
    playerZ += moveSpeed * sin(yaw);
  }

  // keep player on the plane
  const halfGround = groundSize / 2;
  const margin = 200;

  playerX = constrain(playerX, -halfGround + margin, halfGround - margin);
  playerZ = constrain(playerZ, -halfGround + margin, halfGround - margin);

  // REAL CAMERA: orbit around the player
  const pivotX = playerX;
  const pivotY = 0;
  const pivotZ = playerZ;

  const camX = pivotX - sin(yaw) * camDist1;
  const camY = pivotY;
  const camZ = pivotZ + cos(yaw) * camDist1;

  camera(
    camX, camY, camZ,        // camera position
    pivotX, pivotY, pivotZ,  // look at the player
    0, 1, 0                  // up direction
  );

  // DRAW WORLD IN WORLD SPACE
  push();

  // stars
  drawStars();

  // ground
  push();
  noStroke();
  texture(globeTexture);
  translate(0, 400, 0);
  rotateX(HALF_PI);
  plane(groundSize, groundSize);
  pop();

  // desk
  drawDesk();

  // art enclosure
  drawArtEnclosure();

  // data enclosure
  drawDataEnclosure();

  // moon in the sky
  push();
  translate(0, -600, -2000);
  noStroke();
  fill(240, 240, 255);
  sphere(120, 24, 24);
  pop();

  pop(); // end world

  // ---- HUD TEXT ----
  resetMatrix();
  translate(-width / 2, -height / 2);

  noStroke();
  fill(255);
  textSize(24);
  textFont(spaceFont);
  text("ON THE PLANET", 20, -130);
  textSize(16);
  textFont(uiFont);
  text("Move mouse left/right to look", 20, -95);
  text("W/S or ↑/↓ to walk, A/D or ←/→ to strafe", 20, -75);
  text("Press 'B' to go back to space", 20, -55);

}

function drawDesk() {
  push();
  noStroke();
  ambientMaterial(220); // light gray desk

  // Match the ground Y (same 400 you used for the plane)
  const baseY = 400;

  // Desk size
  const deskWidth = 700;
  const deskDepth = 400;
  const deskThickness = 40;
  const legHeight = 200;
  const legThickness = 40;

  // Where the desk sits in your world
  const deskX = 100;
  const deskZ = 500;

  // ---- DESK TOP ----
  // y-position of the center of the top box
  const topCenterY = baseY - legHeight - deskThickness / 2;

  push();
  translate(deskX, topCenterY, deskZ);
  box(deskWidth, deskThickness, deskDepth);
  pop();

  // ---- DESK LEGS ----
  const legY = baseY - legHeight / 2;
  const halfW = deskWidth / 2 - legThickness / 2;
  const halfD = deskDepth / 2 - legThickness / 2;

  function drawLeg(offsetX, offsetZ) {
    push();
    translate(deskX + offsetX, legY, deskZ + offsetZ);
    box(legThickness, legHeight, legThickness);
    pop();
  }

  // four legs
  drawLeg(-halfW, -halfD);
  drawLeg( halfW, -halfD);
  drawLeg(-halfW,  halfD);
  drawLeg( halfW,  halfD);

  // ---- SIMPLE LAPTOP ON DESK ----
  ambientMaterial(180, 200, 255); // soft blue laptop

  const laptopBaseWidth = 450;
  const laptopBaseDepth = 120;
  const laptopBaseThickness = 15;

  const laptopTopY = topCenterY - deskThickness / 2; // top surface
  const laptopX = deskX - deskWidth * 0.15;
  const laptopZ = deskZ - deskDepth * 0.1;

  // laptop base
  push();
  translate(laptopX, laptopTopY - laptopBaseThickness / 2, laptopZ);
  // rotate 180 degrees around Y
  rotateY(PI);
  box(laptopBaseWidth, laptopBaseThickness, laptopBaseDepth);
  pop();

// laptop screen
const screenHeight = 300;
const screenThickness = 12;
const screenWidth = 800;

push();
translate(
  laptopX,
  laptopTopY - screenHeight / 2 - 20,
  laptopZ + laptopBaseDepth / 2 - 10
);
// rotate 180 degrees around Y
rotateY(PI);
// tilt screen slightly back
rotateX(-PI / 20);

noStroke();

if (laptopScreenImg) {
  // no lighting on the screen, show the raw image
  noLights();
  texture(laptopScreenImg);
  box(laptopBaseWidth, screenHeight, screenThickness);

  // put the lights back exactly as they are in drawOnPlanetScene
  ambientLight(150);
  directionalLight(255, 255, 255, 0.3, -1, -0.2);
} else {
  box(laptopBaseWidth, screenHeight, screenThickness);
}

pop();




  pop(); // end desk
}

function drawArtEnclosure() {
  push();

  const baseY = 400;

  const deskX = 100;
  const deskZ = 80;

  // center of the enclosure
  const centerX = deskX + 1800;
  const centerZ = deskZ - 2600;

  const panelCount = 6;
  const radius = 1200;

  const panelWidth = 650;
  const panelHeight = 900;
  const panelThickness = 100;

  const totalAngle = PI * 1.5;
  const startAngle = -totalAngle / 2;
  const endAngle = totalAngle / 2;

  for (let i = 0; i < panelCount; i++) {
    const angle = map(i, 0, panelCount - 1, startAngle, endAngle);

    const x = centerX + cos(angle) * radius;
    const z = centerZ + sin(angle) * radius;

    push();
    translate(x, baseY - panelHeight / 2, z);

    const toCenterAngle = atan2(centerX - x, centerZ - z);
    rotateY(toCenterAngle);

       noStroke();

    // choose a different texture for each panel
    if (panelTextures.length > 0) {
      const texIndex = i % panelTextures.length;
      texture(panelTextures[texIndex]);
    } else if (globeTexture) {
      texture(globeTexture);
    }

    box(panelWidth, panelHeight, panelThickness);

    pop();
  }

  pop();
}

function drawDataEnclosure() {
  push();

  const baseY = 400;

  const deskX = 100;
  const deskZ = 80;

  // center of the data enclosure to the LEFT of the desk
  const centerX = deskX - 1800;
  const centerZ = deskZ - 2600;

  const panelCount = 6;
  const radius = 1200;

  const panelWidth = 650;
  const panelHeight = 900;
  const panelThickness = 100;

  const totalAngle = PI * 1.5;
  const startAngle = -totalAngle / 2;
  const endAngle = totalAngle / 2;

  for (let i = 0; i < panelCount; i++) {
    const angle = map(i, 0, panelCount - 1, startAngle, endAngle);

const x = centerX - cos(angle) * radius;
const z = centerZ + sin(angle) * radius;

    push();
    translate(x, baseY - panelHeight / 2, z);

    const toCenterAngle = atan2(centerX - x, centerZ - z);
    rotateY(toCenterAngle);

    noStroke();

    if (dataPanelTextures.length > 0) {
      const texIndex = i % dataPanelTextures.length;
      texture(dataPanelTextures[texIndex]);
    } else if (globeTexture) {
      texture(globeTexture);
    }

    box(panelWidth, panelHeight, panelThickness);
    pop();
  }

  pop();
}

function drawPlanetStructures() {
  push();
  noStroke();
  // soft pastel-ish material to match your planet vibe
  ambientMaterial(210, 180, 255);

  const ringRadius = 800;      // distance from center
  const pillarHeight = 300;
  const pillarSize = 80;
  const baseY = 400;           // same Y level as ground plane

  // make a ring of 6 pillars
  for (let i = 0; i < 6; i++) {
    let angle = (TWO_PI / 6) * i;
    let x = cos(angle) * ringRadius;
    let z = sin(angle) * ringRadius;

    push();
    // place base on the ground: baseY - half height
    translate(x, baseY - pillarHeight / 2, z);
    box(pillarSize, pillarHeight, pillarSize);
    pop();
  }

  pop();
}

/* ----------------------
   INPUT: SWITCHING SCENES
---------------------- */
function mousePressed() {
  if (scene === 0) {
    // same button bounds as in drawSpaceScene
    const backX = 20;
    const backY = 80;
    const backW = 100;
    const backH = 40;

    // did we click the Back button
    if (mouseX > backX && mouseX < backX + backW &&
        mouseY > backY && mouseY < backY + backH) {

      // ===== CHOOSE ONE OF THESE =====

      // Option A: go back to a scene inside your sketch
      // scene = 1;   // or 2 or whatever you like

      // Option B: go to another webpage
      window.location.href = "./";

      return;
    }

    // existing planet click logic can stay below here
    const radius = min(width, height) * 0.25;
    const planetX = width / 2;
    const planetY = height / 2 + radius * 0.2;

    const d = dist(mouseX, mouseY, planetX, planetY);

    if (d < radius) {
      scene = 1;
      return;
    }
  }

  // keep whatever scene 1 click logic you already have here
}






function keyPressed() {
  if (key === '1') {
    scene = 0; // SPACE VIEW
  } else if (key === '2') {
    scene = 1; // ON PLANET VIEW
  } else if (scene === 1 && (key === 'b' || key === 'B')) {
    scene = 0; // also allow 'B' to go back from planet
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function mouseWheel(event) {
  if (scene === 0) {
    camDist += event.delta * 5;
    camDist = constrain(camDist, minCamDist, maxCamDist);
  } 
  
  else if (scene === 1) {
    camDist1 += event.delta * 5;
    camDist1 = constrain(camDist1, minCamDist1, maxCamDist1);  // 👈 IMPORTANT
  }

  return false; // prevents page from scrolling
}
