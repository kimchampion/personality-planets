// ---------- IMAGES / FONT ----------
let bgImg;
let bgDrawW = 0;
let bgDrawH = 0;

let planetImgs = [];
let customFont;

// background warp shader
let stickyShader;
let warpAmount = 0.0;      // current strength
let targetWarp = 0.0;      // target strength based on mouse press
let lastMouse = { x: 0.5, y: 0.5 }; // mouse in UV space (0–1)

// ---------- DRAG STATE FOR PLANETS ----------
let dragPlanet = null;
let dragStart = null;
const DRAG_THRESHOLD = 15; // pixels

// ----- SHADER SOURCE (p5 + WebGL ONLY) -----
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

const fragSrc = `
precision mediump float;

uniform sampler2D uTex;
uniform vec2 uMouse;     // mouse in UV (0–1)
uniform float uStrength; // warp strength

varying vec2 vTexCoord;

void main() {
  vec2 uv = vTexCoord;

  // direction from pixel to mouse
  vec2 dir = uMouse - uv;
  float dist = length(dir);

  // how far the "sticky" region extends
  float radius = 0.5;
  float influence = smoothstep(radius, 0.0, dist);

  // warp UVs toward the mouse
  vec2 warpedUV = uv + dir * influence * uStrength;

  // clamp so we don't sample outside the texture
  warpedUV = clamp(warpedUV, 0.0, 1.0);

  gl_FragColor = texture2D(uTex, warpedUV);
}
`;


// ---------- STARS ----------
let stars = [];
let starCount = 80;

// ---------- PLANETS ----------
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
  "kims-planet.html",             // gold
  "https://www.csueastbay.edu/",  // orange
  "https://www.sampyle.com/"      // teal
];

let planets = [];
let hoveredPlanet = null;

// anchors (fractions of screen)
const PLANET_ANCHORS = [
  { fx: -0.35, fy: -0.28, size: 0.18, alpha: 220 },
  { fx:  0.00, fy: -0.22, size: 0.20, alpha: 220 },
  { fx:  0.35, fy: -0.30, size: 0.16, alpha: 220 }
];

// ---------- PRELOAD ----------
function preload() {
  bgImg = loadImage("SpaceBG-03.png");
  for (let p of PLANET_PATHS) {
    planetImgs.push(loadImage(p));
  }

  customFont = loadFont("SPACE.ttf");
}

// ---------- SETUP ----------
function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  smooth();

  textFont(customFont);

  // create the sticky warp shader
  stickyShader = createShader(vertSrc, fragSrc);

  generateStars();
  setupFixedPlanets();
  updateBackgroundSize();
}

function updateBackgroundSize() {
  if (!bgImg) return;

  const canvasAspect = width / height;
  const texAspect = bgImg.width / bgImg.height;

  if (canvasAspect > texAspect) {
    // canvas is wider: match width, expand height
    bgDrawW = width;
    bgDrawH = width / texAspect;
  } else {
    // canvas is taller: match height, expand width
    bgDrawH = height;
    bgDrawW = height * texAspect;
  }
}

// ---------- DRAW LOOP ----------
function draw() {
  background(0);

  // // update warp target based on mouse press
  // if (mouseIsPressed) {
  //   // mouse in UV (0–1). flip Y for texture coords.
  //   lastMouse.x = constrain(mouseX / width, 0.0, 1.0);
  //   lastMouse.y = constrain(1.0 - mouseY / height, 0.0, 1.0);
  //   targetWarp = 0.35; // how strong the warp feels when pressed
  // } else {
  //   targetWarp = 0.0;
  // }
if (mouseIsPressed) {
  // convert mouse from screen coords to UV on the drawn background rect
  if (bgImg && bgDrawW > 0 && bgDrawH > 0) {
    let sx = mouseX - width / 2;  // center-based
    let sy = mouseY - height / 2;

    let u = (sx + bgDrawW / 2) / bgDrawW;
    let v = (sy + bgDrawH / 2) / bgDrawH;

    lastMouse.x = constrain(u, 0.0, 1.0);
    lastMouse.y = constrain(v, 0.0, 1.0);
  }

  targetWarp = 0.35;
} else {
  targetWarp = 0.0;
}

  // smooth interpolation of warpAmount for a soft animation
  warpAmount = lerp(warpAmount, targetWarp, 0.12);

  // BACKGROUND LAYERS
  drawStars();            // behind everything
  drawWarpedBackground(); // astronaut / ground image with sticky warp

  // return to normal p5 rendering for the rest
  resetShader();

  // MIDDLE + FOREGROUND
  drawPlanets();

  // hover & cursor logic
  hoveredPlanet = getHoveredPlanet();
  if (hoveredPlanet && hoveredPlanet.link) {
    cursor('pointer');
  } else {
    cursor('default');
  }

  if (hoveredPlanet) {
    drawTooltip(hoveredPlanet);
  }

  drawTitle();
  drawHelpText();
}

// ---------- WINDOW RESIZE ----------
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  resizeFixedPlanets();
  updateBackgroundSize();
}

// ---------- STARS ----------
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
  translate(-width / 2, -height / 2, 0);
  noStroke();

  for (let s of stars) {
    if (s.delay > 0) {
      s.delay -= 1;
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

function drawWarpedBackground() {
  if (!bgImg) return;

  push();
  shader(stickyShader);

  stickyShader.setUniform("uTex", bgImg);
  stickyShader.setUniform("uMouse", [lastMouse.x, lastMouse.y]);
  stickyShader.setUniform("uStrength", warpAmount);

  noStroke();
  rectMode(CENTER);

  // draw using aspect-correct size (covers canvas, may crop a bit)
  rect(0, 0, bgDrawW, bgDrawH);

  pop();
}



// ---------- PLANETS (fixed positions + links + names) ----------
function setupFixedPlanets() {
  planets = [];
  const minDim = min(width, height);

  for (let i = 0; i < planetImgs.length; i++) {
    const a = PLANET_ANCHORS[i % PLANET_ANCHORS.length];
    const sizePx = minDim * a.size;

    const baseX = a.fx * width;
    const baseY = a.fy * height;

    planets.push({
      img: planetImgs[i],
      name: PLANET_NAMES[i] || "Planet",
      link: PLANET_LINKS[i] || null,
      fx: a.fx,
      fy: a.fy,
      baseCx: baseX,   // original anchor position
      baseCy: baseY,
      cx: baseX,       // current (possibly warped) position
      cy: baseY,
      w: sizePx,
      h: sizePx,
      alpha: a.alpha
    });
  }
}

function drawPlanets() {
  push();
  resetMatrix();
  imageMode(CENTER);

  const mx = mouseX - width / 2;
  const my = mouseY - height / 2;
  const radius = min(width, height) * 0.7; // influence radius

  for (let p of planets) {
    // sticky offset toward the mouse, reusing warpAmount
    let baseX = p.baseCx;
    let baseY = p.baseCy;

    let dx = mx - baseX;
    let dy = my - baseY;
    let distToMouse = sqrt(dx * dx + dy * dy);

    let influence = 0.0;
    if (mouseIsPressed) {
      influence = constrain(1.0 - distToMouse / radius, 0.0, 1.0);
    }

    let strength = warpAmount * 1.3;
    let offsetX = dx * influence * strength;
    let offsetY = dy * influence * strength;

    // if this is the one being dragged, exaggerate a bit
    if (dragPlanet === p && mouseIsPressed) {
      offsetX *= 1.4;
      offsetY *= 1.4;
    }

    const drawX = baseX + offsetX;
    const drawY = baseY + offsetY;

    // store the live position for hover/tooltip detection
    p.cx = drawX;
    p.cy = drawY;

    tint(255, p.alpha);
    image(p.img, drawX, drawY, p.w, p.h);
  }

  noTint();
  pop();
}

function resizeFixedPlanets() {
  const minDim = min(width, height);
  for (let i = 0; i < planets.length; i++) {
    const p = planets[i];
    const anchor = PLANET_ANCHORS[i % PLANET_ANCHORS.length];
    p.w = minDim * anchor.size;
    p.h = p.w;

    const baseX = anchor.fx * width;
    const baseY = anchor.fy * height;
    p.baseCx = baseX;
    p.baseCy = baseY;
    p.cx = baseX;
    p.cy = baseY;
  }
}

// ---------- INTERACTION ----------
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

// start of a potential drag
function mousePressed() {
  dragPlanet = getHoveredPlanet();
  dragStart = { x: mouseX, y: mouseY };
}

// open link only if click+dragged far enough
function mouseReleased() {
  if (dragPlanet && dragPlanet.link && dragStart) {
    const d = dist(mouseX, mouseY, dragStart.x, dragStart.y);
    if (d >= DRAG_THRESHOLD) {
      window.open(dragPlanet.link, "_self", "noopener,noreferrer");
    }
  }
  dragPlanet = null;
  dragStart = null;
}

// ---------- TOOLTIP ----------
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

// ---------- TITLE ----------
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

// helptext
function drawHelpText() {
  push();
  resetMatrix();
  textFont(customFont);
  textAlign(CENTER, BOTTOM);

  const size = max(12, min(width, height) * 0.018);
  textSize(size);

  const msg = "Tip: click and drag a planet to open its link";

  let x = 0;
  let y = height / 2 - 20;

  // ---- OUTLINE (fake stroke) ----
  fill(0, 180); // black glow
  noStroke();

  const o = 2; // outline offset
  text(msg, x - o, y);
  text(msg, x + o, y);
  text(msg, x, y - o);
  text(msg, x, y + o);

  // corners (so it's smoother)
  text(msg, x - o, y - o);
  text(msg, x + o, y - o);
  text(msg, x - o, y + o);
  text(msg, x + o, y + o);

  // ---- MAIN TEXT ----
  fill(255);
  text(msg, x, y);

  pop();
}
