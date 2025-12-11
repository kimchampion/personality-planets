// ================ ASSETS AND GLOBALS ================
let bgImg;
let bgDrawW = 0;
let bgDrawH = 0;

let stars = [];
let starCount = 80;

let planetImgs = [];
let planets = [];
let customFont;

let stickyShader;
let lastMouse = { x: 0.5, y: 0.5 }; // mouse or touch in uv 0..1

let hoveredPlanet = null;

// ================ PLANET DATA ================
const PLANET_PATHS = [
  "SpaceBG-04.png",
  "SpaceBG-05.png",
  "SpaceBG-06.png"
];

const PLANET_NAMES = [
  "Kim's Planet",
  "Mishelle's Planet",
  "Sam's Planet"
];

const PLANET_LINKS = [
  "kims-planet.html",             // gold
  "mishelles-planet.html",  // orange
  "sams-planet.html"      // teal
];

// per planet glow style
const PLANET_GLOW = [
  { color: [255, 220, 150], size: 180 }, // Kim's planet — medium-big glow
  { color: [255, 140, 255], size: 190 }, // Your planet — largest glow
  { color: [140, 220, 255], size: 160 }  // Sam's planet — smaller glow
];


const PLANET_ANCHORS = [
  { fx: -0.35, fy: -0.28, size: 0.18, alpha: 220 },
  { fx:  0.00, fy: -0.22, size: 0.20, alpha: 220 },
  { fx:  0.35, fy: -0.30, size: 0.16, alpha: 220 }
];

// ================ INLINE SHADERS ================
const vertSrc = `
precision mediump float;

attribute vec3 aPosition;
attribute vec2 aTexCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec2 vTexCoord;

void main() {
  vTexCoord = aTexCoord;
  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
}
`;

// smooth local warp without a hard ring or center blob
const fragSrc = `
precision mediump float;

uniform sampler2D tex0;
uniform vec2 u_mouse;
uniform float u_strength;

varying vec2 vTexCoord;

void main() {
  vec2 uv = vTexCoord;

  // vector from pixel to mouse in uv space
  vec2 delta = uv - u_mouse;
  float dist = length(delta);

  vec2 dir = vec2(0.0);
  if (dist > 0.0) {
    dir = delta / dist;
  }

  // influence curve:
  // zero at center, rises slightly around the cursor, then decays smoothly
  float falloff = dist * exp(-dist * 6.0);

  float warpAmount = u_strength * falloff;

  vec2 offset = -dir * warpAmount;

  vec2 warpedUV = uv + offset;

  warpedUV = clamp(warpedUV, 0.0, 1.0);

  gl_FragColor = texture2D(tex0, warpedUV);
}
`;

// ================ PRELOAD ================
function preload() {
  bgImg = loadImage("SpaceBG-03.png");
  for (let p of PLANET_PATHS) {
    planetImgs.push(loadImage(p));
  }
  customFont = loadFont("SPACE.ttf");
}

// ================ SETUP ================
function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  textFont(customFont);

  stickyShader = createShader(vertSrc, fragSrc);

  generateStars();
  setupFixedPlanets();
  updateBackgroundSize();
}

function updateBackgroundSize() {
  if (!bgImg) return;

  const canvasAspect = width / height;
  const imgAspect = bgImg.width / bgImg.height;

  if (canvasAspect > imgAspect) {
    bgDrawW = width;
    bgDrawH = width / imgAspect;
  } else {
    bgDrawH = height;
    bgDrawW = height * imgAspect;
  }
}

// ================ DRAW LOOP ================
function draw() {
  background(0);

  // convert mouse or touch into uv relative to the drawn background rect
  if (bgDrawW > 0 && bgDrawH > 0) {
    const sx = mouseX - width / 2;
    const sy = mouseY - height / 2;

    let u = (sx + bgDrawW / 2) / bgDrawW;
    let v = (sy + bgDrawH / 2) / bgDrawH;

    lastMouse.x = constrain(u, 0.0, 1.0);
    lastMouse.y = constrain(v, 0.0, 1.0);
  }

  drawStars();
  drawWarpedBackground();
  resetShader();

  // find hovered planet before drawing so glow is correct
  hoveredPlanet = getHoveredPlanet();

  drawPlanets();

  cursor(hoveredPlanet ? "pointer" : "default");

  if (hoveredPlanet) drawTooltip(hoveredPlanet);

  drawTitle();
}

// ================ WARPED BACKGROUND ================
function drawWarpedBackground() {
  if (!bgImg || !stickyShader) return;

  push();
  shader(stickyShader);
  rectMode(CENTER);
  noStroke();

  const strength = 0.8; // adjust between 0.4 and 1.2 to taste

  stickyShader.setUniform("tex0", bgImg);
  stickyShader.setUniform("u_mouse", [lastMouse.x, lastMouse.y]);
  stickyShader.setUniform("u_strength", strength);

  rect(0, 0, bgDrawW, bgDrawH);

  pop();
}

// ================ STARS ================
function generateStars() {
  stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push(makeStar());
  }
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
  translate(-width / 2, -height / 2);
  noStroke();

  for (let s of stars) {
    if (s.delay > 0) {
      s.delay--;
      continue;
    }
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

// ================ PLANETS ================
function setupFixedPlanets() {
  planets = [];
  const minDim = min(width, height);

  for (let i = 0; i < planetImgs.length; i++) {
    const a = PLANET_ANCHORS[i];
    const sizePx = minDim * a.size;

    const glow = PLANET_GLOW[i] || { color: [255,255,255], size: 150 };

    planets.push({
      img: planetImgs[i],
      name: PLANET_NAMES[i],
      link: PLANET_LINKS[i],

      fx: a.fx,
      fy: a.fy,

      w: sizePx,
      h: sizePx,
      cx: a.fx * width,
      cy: a.fy * height,
      alpha: a.alpha,

      glowColor: glow.color,
      glowSize: glow.size   // <— added
    });
  }
}


function drawPlanets() {
  push();
  resetMatrix();
  imageMode(CENTER);

  for (let p of planets) {

// glow on hover
if (hoveredPlanet === p) {
  const rgb = p.glowColor || [255, 255, 255];
  const GLOW = p.glowSize || 150;

  noStroke();

  // outer soft halo
  fill(rgb[0], rgb[1], rgb[2], 40);
  ellipse(p.cx, p.cy, GLOW * 1.3);

  // mid halo
  fill(rgb[0], rgb[1], rgb[2], 80);
  ellipse(p.cx, p.cy, GLOW);

  // inner bright core
  fill(rgb[0], rgb[1], rgb[2], 120);
  ellipse(p.cx, p.cy, GLOW * 0.6);
}



    // planet itself
    tint(255, p.alpha);
    image(p.img, p.cx, p.cy, p.w, p.h);
  }

  noTint();
  pop();
}

function resizeFixedPlanets() {
  const minDim = min(width, height);
  for (let i = 0; i < planets.length; i++) {
    const p = planets[i];
    const a = PLANET_ANCHORS[i % PLANET_ANCHORS.length];

    p.w = minDim * a.size;
    p.h = p.w;
    p.cx = a.fx * width;
    p.cy = a.fy * height;
  }
}

// ================ INTERACTION (DESKTOP + MOBILE) ================
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

// click on desktop
function mousePressed() {
  openPlanetIfHovered();
}

// tap on mobile
function touchEnded() {
  openPlanetIfHovered();
  return false; // prevent default scrolling
}

function openPlanetIfHovered() {
  const p = getHoveredPlanet();
  if (p && p.link) {
    window.open(p.link, "_self", "noopener,noreferrer");
  }
}

// ================ UI TEXT ================
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
  text(label, 0, -height / 2 + margin + 4);

  pop();
}

// ================ RESIZE HANDLING ================
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  resizeFixedPlanets();
  updateBackgroundSize();
  generateStars();
}