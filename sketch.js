let bgImg;
let stars = [];
let starCount = 80;
let planetImgs = [];
let planets = [];
let customFont; 

// --- planets info ---
const PLANET_PATHS = [
  "SpaceBG-04.png", // gold
  "SpaceBG-05.png", // orange
  "SpaceBG-06.png"  // teal
];

const PLANET_NAMES = [
  "Kim's Planet",
  "Mishelle's Planet",
  "Sam's Planet"
];

const PLANET_LINKS = [
  "https://www.csueastbay.edu/", // gold
  "https://www.csueastbay.edu/", // orange
  "https://www.sampyle.com/" // blue
];

let hoveredPlanet = null; // hover tracking

// ANCHORS
const PLANET_ANCHORS = [
  { fx: -0.35, fy: -0.28, size: 0.18, alpha: 220 },
  { fx:  0.00, fy: -0.22, size: 0.20, alpha: 220 },
  { fx:  0.35, fy: -0.30, size: 0.16, alpha: 220 }
];

function preload() {
  bgImg = loadImage("SpaceBG-03.png");
  for (let p of PLANET_PATHS) planetImgs.push(loadImage(p));

  customFont = loadFont("SPACE.ttf"); // NEW (font) — make sure Arial.ttf is in the same folder
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  smooth();
  textFont(customFont); // NEW (font)
  generateStars();
  setupFixedPlanets();
}

// DRAW LOOP
function draw() {
  background(0);

  drawStars();    // background layer
  drawPlanets();  // middle layer (fixed)
  drawForegroundImage(); // front layer

  // Hover detection + tooltip
  hoveredPlanet = getHoveredPlanet();

  if (hoveredPlanet && hoveredPlanet.link) {
    cursor('pointer');
  } else {
    cursor('default');
  }

  if (hoveredPlanet) drawTooltip(hoveredPlanet);

   drawTitle(); 
}


// BG IMAGE

function drawForegroundImage() {
  if (bgImg) {
    push();
    resetMatrix();
    imageMode(CENTER);

    const imgAspect = bgImg.width / bgImg.height;
    const winAspect = width / height;
    let scaledW, scaledH;
    if (winAspect > imgAspect) {
      scaledW = width;
      scaledH = width / imgAspect;
    } else {
      scaledH = height;
      scaledW = height * imgAspect;
    }
    image(bgImg, 0, 0, scaledW, scaledH);
    pop();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  resizeFixedPlanets();
}

// STARS (slow drift)
function generateStars() {
  stars = [];
  for (let i = 0; i < starCount; i++) stars.push(makeStar());
}

function makeStar() {
  return {
    x: random(-width, width),
    y: random(-height / 2, height / 2),
    speed: random(0.2, 1.5),
    size: random(1, 3),
    delay: random(0, 60),
    alpha: random(150, 255)
  };
}

function drawStars() {
  push();
  resetMatrix();
  translate(-width / 2, -height / 2, 0);
  noStroke();

  for (let s of stars) {
    if (s.delay > 0) { s.delay -= 1; continue; }
    fill(255, 255, 255, s.alpha);
    ellipse(s.x, s.y + height / 2, s.size * 2, s.size * 2);
    s.x += s.speed;

    if (s.x > width + 10) {
      s.x = -random(100, 400);
      s.y = random(-height / 2, height / 2);
      s.speed = random(0.2, 1.5);
      s.size = random(1, 3);
      s.delay = random(0, 100);
      s.alpha = random(150, 255);
    }
  }
  pop();
}


// PLANETS (fixed positions + links + names)
function setupFixedPlanets() {
  planets = [];
  const minDim = min(width, height);

  for (let i = 0; i < planetImgs.length; i++) {
    const a = PLANET_ANCHORS[i % PLANET_ANCHORS.length];
    const sizePx = minDim * a.size;

    planets.push({
      img: planetImgs[i],
      name: PLANET_NAMES[i] || "Planet",
      link: PLANET_LINKS[i] || null,
      fx: a.fx,
      fy: a.fy,
      w: sizePx,
      h: sizePx,
      cx: a.fx * width,
      cy: a.fy * height,
      alpha: a.alpha
    });
  }
}

function drawPlanets() {
  push();
  resetMatrix();
  imageMode(CENTER);
  for (let p of planets) {
    tint(255, p.alpha);
    image(p.img, p.cx, p.cy, p.w, p.h);
  }
  noTint();
  pop();
}

function resizeFixedPlanets() {
  const minDim = min(width, height);
  for (let p of planets) {
    const idx = planets.indexOf(p) % PLANET_ANCHORS.length;
    p.w = minDim * PLANET_ANCHORS[idx].size;
    p.h = p.w;
    p.cx = p.fx * width;
    p.cy = p.fy * height;
  }
}

// INTERACTION
function getHoveredPlanet() {
  const mx = mouseX - width / 2;
  const my = mouseY - height / 2;

  for (let p of planets) {
    const dx = mx - p.cx;
    const dy = my - p.cy;
    const r = p.w * 0.5;
    if (dx * dx + dy * dy <= r * r) return p;
  }
  return null;
}

function mousePressed() {
  const p = getHoveredPlanet();
  if (p && p.link) window.open(p.link, '_blank', 'noopener,noreferrer');
}


// TOOLTIP
function drawTooltip(p) {
  push();
  resetMatrix();
  textFont(customFont);  
  textSize(14);
  const padding = 8;
  const offsetY = -(p.h * 0.55) - 10;
  const label = p.name;
  const tw = textWidth(label);
  const boxW = tw + padding * 2;
  const boxH = 24;
  let tx = p.cx;
  let ty = p.cy + offsetY;

  const halfW = width / 2;
  const halfH = height / 2;
  tx = constrain(tx, -halfW + boxW / 2 + 6, halfW - boxW / 2 - 6);
  ty = constrain(ty, -halfH + boxH / 2 + 6, halfH - boxH / 2 - 6);

  rectMode(CENTER);
  noStroke();
  fill(0, 180);
  rect(tx, ty, boxW, boxH, 6);

  fill(255);
  textAlign(CENTER, CENTER);
  text(label, tx, ty + 1);
  pop();
}
// PP title
function drawTitle() { 
  push();
  resetMatrix();           
  textFont(customFont);     
  textAlign(CENTER, TOP);
  
  const size = max(20, min(width, height) * 0.04); 
  textSize(size);         
  const margin = 10;       
  const label = "Welcome Traveler";

  fill(255);               
  text(label, 0, -height/2 + margin + 4); 
  pop();
}

