let bgMusic;  // background music
let obj0, obj1, obj2, obj3, obj4, obj5, obj6;
let sndObj0, sndObj1, sndObj2, sndObj3, sndObj5, sndObj4, sndObj6, sndObj7;

let cubes = [];
let selectedImg = null; 
let selectedSound = null;
let angle = 0;
let uiFont;
let spaceFont;

// starfield data
let stars = [];
// 1.0 = current distance, 0.6 = closer
let cubeDistanceScale = 0.7; 
let planetRadius = 150;
let cubeSize = 75;

let planetTexture, planetTexture1, planetTexture2, planetTexture3; 

function preload() {

  uiFont        = loadFont("assets/Arial.ttf");
  spaceFont     = loadFont("SPACE.ttf"); 

  planetTexture = loadImage("assets/planet-kim1.jpg"); 
  planetTexture1 = loadImage("assets/planet-kim2.jpg"); 
  planetTexture2 = loadImage("assets/planet-kim3.jpg"); 
  planetTexture3 = loadImage("assets/planet-kim4.jpg");   

  obj0 = loadImage('assets/obj0.jpg');
  obj1 = loadImage('assets/obj1.jpg'); 
  obj2 = loadImage('assets/obj2.jpg');
  obj3 = loadImage('assets/obj3.jpg'); 
  obj4 = loadImage('assets/obj4.jpg');
  obj5 = loadImage('assets/obj5.jpg');
  obj6 = loadImage('assets/obj3.jpg');
  obj7 = loadImage('assets/obj7.jpg');

  sndObj0 = loadSound('assets/sound0.m4a');
  sndObj1 = loadSound('assets/sound1.m4a'); 
  sndObj2 = loadSound('assets/sound2.m4a');
  sndObj3 = loadSound('assets/sound3.m4a'); 
  sndObj4 = loadSound('assets/sound4.m4a');
  sndObj5 = loadSound('assets/sound5.m4a');
  sndObj6 = loadSound('assets/sound6.m4a');
  sndObj7 = loadSound('assets/sound7.m4a');

  bgMusic = loadSound('assets/background.m4a');
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  smooth();
  // make sizes depend on window
  updateSizesForWindow(); 
  buildCubes();
  textFont(uiFont);

    // generate stars in random positions
  for (let i = 0; i < 400; i++) {
    stars.push({
      x: random(-2000, 2000),
      y: random(-2000, 2000),
      z: random(-4000, -500)
    });
  }

  //x, y, buttonText, redirect home page
  let bttn = new Button(20,20,"Back","./");
  bttn.show();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateSizesForWindow();
  buildCubes();
}

function draw() {
  background(0);

  /* starfield */ 
  push();
  noStroke();
  noLights();
  fill(255);

  for (let s of stars) {
    s.z += 0.5;
    if (s.z > 200) {
      s.x = random(-2000, 2000);
      s.y = random(-2000, 2000);
      s.z = random(-4000, -500);
    }

    push();
    translate(s.x, s.y, s.z);
    sphere(2, 6, 6);
    pop();
  }

  pop();

  //i want to spin the cubes a little each frame.
  angle += 0.01;

  for (let i = 0; i < cubes.length; i++) {
    let c = cubes[i];

    push();
    translate(c.pos.x, c.pos.y, c.pos.z);
    rotateX(angle);
    noStroke();
    texture(c.img);
    box(cubeSize);
    pop();
  }

    //planet1
     push();
     rotateY(angle * 1.3);
     noStroke();
     texture(planetTexture);
     sphere(planetRadius);
     pop();

    //planet2
     push();
     rotateY(angle * 1.3);
     noStroke();
     texture(planetTexture1);
     translate(300, 200);
     sphere(25);
     pop();   

    //planet3
     push();
     rotateX(angle * 1.3);
     rotateZ(angle * 1.5);
     noStroke();
     texture(planetTexture2);
     translate(300, -200);
     sphere(5);
     pop();   

    //planet4
     push();
     rotateY(angle * 1.6);
     //rotateZ(angle * 1.5);
     noStroke();
     texture(planetTexture3);
     translate(250, -100);
     sphere(50);
     pop();   

    //planet3
     push();
     rotateY(angle * 1.3);
     rotateZ(angle * 1.0);
     noStroke();
     texture(planetTexture2);
     translate(300, -200);
     sphere(3);
     pop();  


// clear depth, the z values in buffer
drawingContext.clear(drawingContext.DEPTH_BUFFER_BIT); 

// open popup 
if (selectedImg) {
  drawImagePopup(selectedImg);
}

// info box (always on top-right)
drawInfoBox();
}

//code to for click positing on cubes from chatgpt
function mousePressed() {
  let mx = mouseX - width / 2;
  let my = mouseY - height / 2;
  let halfX = cubeSize * 0.5;
  let halfY = cubeSize * 0.8; // a little taller to make clicking easier when tilted
  let hitIndex = -1;

  for (let i = 0; i < cubes.length; i++) {
    let c = cubes[i];

    // Simple axis-aligned box hit test around each cube's center
    if (Math.abs(mx - c.pos.x) <= halfX &&
        Math.abs(my - c.pos.y) <= halfY) {
      hitIndex = i;
      break;
    }
  }

  if (hitIndex >= 0) {
    openPopupFor(hitIndex);
  } else {
    closePopup();
  }
}

function openPopupFor(idx) {
  if (idx < 0 || idx >= cubes.length) 
    return;

  stopAllObjectSounds();
  
  let cube = cubes[idx];

  selectedImg = cube.img;
  selectedSound = cube.snd;

  if (selectedSound) {
    let thisSound = selectedSound;
    let thisImg = selectedImg;

    thisSound.stop();
    thisSound.onended(function() {
      if (selectedSound === thisSound && selectedImg === thisImg) {
        closePopupFromSound();
      }
    });
    thisSound.play();
  }
}

function closePopup() {
  stopAllObjectSounds();
  selectedSound = null;
  selectedImg = null;
}

function closePopupFromSound() {
  selectedImg = null;
  selectedSound = null;
}

function drawImagePopup(img) {
  
  push();
  resetMatrix();
  translate(-width / 2, -height / 2);

  let pad = 12;
  let winW = width * 0.7;
  let winH = height * 0.6;
  let xPos = width * 0.03;
  let yPos = height * 0.03;

  noStroke();
  fill(0,200);
  rect(xPos, yPos, winW, winH, 10);

  let xCube = xPos + pad;
  let yCube = yPos + 26 + pad;
  let wCube = winW - pad * 2;
  let hCube = winH - 26 - pad * 2;

  let imgRatio = img.width / img.height;
  let boxRatio = wCube / hCube;

  let dw = wCube;
  let dh = hCube;
  if (imgRatio > boxRatio) {
    dh = dw / imgRatio;
  } else {
    dw = dh * imgRatio;
  }

  let ix = xCube + (wCube - dw) / 2;
  let iy = yCube + (hCube - dh) / 2;

  image(img, ix, iy, dw, dh);
  pop();
}

function updateSizesForWindow() {
  const base = min(windowWidth, windowHeight);
  //set planet radius to 15% of base
  planetRadius = base * 0.15;  
  cubeSize = base * 0.09;
}

function buildCubes() {

  let w = width;
  let h = height;
  let s = cubeDistanceScale;

    cubes = [
    //{ img: obj0,    snd: sndObj0, pos: createVector(-200, 150, 0) }, //tomas
    { img: obj0,    snd: sndObj0, pos: createVector(-0.25 * w * s,  0.25 * h * s, 0) }, //tomas

    //{ img: obj1,    snd: sndObj1, pos: createVector(-200, -200, 0) }, //chase
    { img: obj1,    snd: sndObj1, pos: createVector(-0.25 * w * s, -0.33 * h * s, 0) }, //chase

    //{ img: obj2,    snd: sndObj2, pos: createVector( 0, 225, 0) }, //cisco
    { img: obj2,    snd: sndObj2, pos: createVector( 0.0 * w * s, 0.375 * h * s, 0) }, //cisco

    //{ img: obj3,    snd: sndObj3, pos: createVector( 100, -250, 0) }, //jessie
    { img: obj3,    snd: sndObj3, pos: createVector( 0.125 * w * s, -0.42 * h * s, 0) }, //jessie

    //{ img: obj4,    snd: sndObj4, pos: createVector( 200, 125, 0) }, //kim
    { img: obj4,    snd: sndObj4, pos: createVector( 0.25 * w * s, 0.21 * h * s, 0) }, //kim

    //{ img: obj5,    snd: sndObj5, pos: createVector(-320, -65, 0) }, //jessie
    { img: obj5,    snd: sndObj5, pos: createVector(-0.4 * w * s, -0.11 * h * s, 0) }, //jessie
 
   //{ img: obj6,    snd: sndObj6, pos: createVector( 320, -65, 0) } //tommy
    { img: obj7,    snd: sndObj7, pos: createVector( 0.4 * w * s, -0.11 * h * s, 0) } //tommy
  ];
}

function keyPressed() {
 
 if (key === 'M' || key === 'm') {
    if (bgMusic && !bgMusic.isPlaying()) {
      bgMusic.loop();
      bgMusic.setVolume(0.4);
    }
  }

  if (keyCode === ESCAPE) {
    closePopup();
    return;
  }

  if (keyCode === LEFT_ARROW)     { openPopupFor(0); return; }
  if (keyCode === UP_ARROW)       { openPopupFor(1); return; }
  if (keyCode === RIGHT_ARROW)    { openPopupFor(2); return; }
  if (keyCode === DOWN_ARROW)     { openPopupFor(5); return; }
  if (key === ' ')                { openPopupFor(3); return; }
  if (key === 'W' || key === 'w') { openPopupFor(4); return; }
  if (key === 'A' || key === 'a') { openPopupFor(6); return; }
}

function drawInfoBox() {

  let infoLines = [
    "A Galaxy of memories orbiting around",
    "like planets and stars. Each memory ",
    "has its own place in my personal universe",
    "\n",
    "Click a cube to open a memory",
    "Arrow keys, W, A, and SPACE open them also",
    "Click empty space to close popup", 
  ];

  push();
  //change to two dimensional coords
  resetMatrix(); 
  translate(-width / 2, -height / 2);

  // Responsive sizes based on window
  let base = min(width, height);
  let pad   = base * 0.025;       
  let winW  = width  * 0.3; 
  let lineCount = infoLines.length;
  let lineH = base * 0.025;
  let winH =  pad + (lineCount * lineH) + pad;                
  let x = width  - winW  - pad;
  let y = pad;

  //console.log("winW: ",winW," x: ",mouseX," y: ",mouseY);

  // Background box
  noStroke();
  //fill(255, 0, 0, 110);  
  fill(0, 0, 0, 80);                       
  rect(x, y, winW, winH, 12);

  fill(255);
  textAlign(LEFT, TOP);
  
  let textX = x + pad;
  let textY = y+ pad;

  textSize(base * 0.03);
  textFont(spaceFont);
  text("Family Planet", textX, textY);

  textSize(base * 0.02);
  textFont(uiFont);
  textY = textY + 30;

  for (let i = 0; i < infoLines.length; i++) {
    text(infoLines[i], textX, textY + i * lineH);
  }
  pop();
}

function stopAllObjectSounds() {
  let all = [sndObj0, sndObj1, sndObj2, sndObj3, sndObj4, sndObj5, sndObj6, sndObj7];
  for (let s of all) {
    if (s && s.isPlaying()) {
      s.stop();
    }
  }
}
