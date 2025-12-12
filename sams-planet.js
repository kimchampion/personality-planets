
// GLOBALS
let angleX = 0;
let angleY = 0;

let isDragging = false;
let previousMouseX = 0;
let previousMouseY = 0;
// camera zoom 
let zoom = 0; 

// starfield data
let stars = [];          
let staticStars = [];      

// shooting stars data
let shootingStars = [];
let shootingStarChance = 0.01;
let maxShootingStars = 3;

// moon 
let moonAngle = 0;
let moonDistance = 300;
let moonSize = 50;
let moonSpeed = 0.01;

// planet size 
let planetRadius = 150;

// planet self-rotation
let planetRotation = 0;

// planet & moon textures
let planetTexture;
let moonTexture;

// astronaut float
let astronautImg;

// font
let spaceFont;

// Back btn
let backButton;

// hovering planet
let planetHovered = false;

function preload() {
  planetTexture = loadImage("assets/planet-samB3.jpg");
  moonTexture   = loadImage("assets/planet-samR.jpg");
  astronautImg  = loadImage("assets/astronaut.png");
  spaceFont     = loadFont("SPACE.ttf");
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  smooth();
  updateSizesForWindow();

  // Back btn
  backButton = createButton("Back");
  backButton.position(20, 20);                  
  backButton.style("padding", "10px 22px");
  backButton.style("font-size", "20px");
  backButton.style("background", "#222");
  backButton.style("color", "white");
  backButton.style("border", "2px solid #555");
  backButton.style("border-radius", "8px");
  backButton.style("cursor", "pointer");
  backButton.style("z-index", "9999");
  backButton.style("transition", "all 0.2s ease");
  backButton.style("font-family", "spaceFont"); 

  // Hover effect 
  backButton.mouseOver(() => {
    backButton.style("background", "#444");
    backButton.style("transform", "scale(1.1)");
    backButton.style("border", "2px solid white");
  });

  backButton.mouseOut(() => {
    backButton.style("background", "#222");
    backButton.style("transform", "scale(1.0)");
    backButton.style("border", "2px solid #555");
  });

  // Button link 
  backButton.mousePressed(() => {
    //window.location.href = "https://sampyle01.github.io/Personality-Planets-Landing-Page/";
    window.location.href = "./";
});

  // Moving stars
  for (let i = 0; i < 400; i++) {
    stars.push({
      x: random(-2000, 2000),
      y: random(-2000, 2000),
      z: random(-4000, -500)
    });
  }

  // Static stars
  for (let i = 0; i < 600; i++) {
    staticStars.push({
      x: random(-3000, 3000),
      y: random(-3000, 3000),
      z: random(-5000, -2000)
    });
  }
}

function draw() {
  background(5, 8, 20);

  // planet rotation update
  planetRotation += 0.005;

  push();
  translate(0, 0, zoom);
  rotateX(angleX);
  rotateY(angleY);

  // STATIC STARS
  push();
  noStroke();
  noLights();
  fill(120, 180, 255);

  for (let s of staticStars) {
    push();
    translate(s.x, s.y, s.z);
    sphere(2, 6, 6);
    pop();
  }
  pop();

  // MOVING STARS
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


  // SHOOTING STARS
  if (random() < shootingStarChance && shootingStars.length < maxShootingStars) {
    const startX = random(500, 2000);
    const startY = random(-1000, -200);
    const startZ = random(-1200, -300);

    const speed = random(35, 55);
    const dir = createVector(-1, 0.4, 1).normalize();

    shootingStars.push({
      x: startX,
      y: startY,
      z: startZ,
      vx: dir.x * speed,
      vy: dir.y * speed,
      vz: dir.z * speed,
      life: 1.0
    });
  }

  push();
  noFill();
  noLights();
  strokeWeight(7);

  for (let i = shootingStars.length - 1; i >= 0; i--) {
    let sh = shootingStars[i];

    sh.x += sh.vx;
    sh.y += sh.vy;
    sh.z += sh.vz;
    sh.life -= 0.02;

    if (sh.life <= 0 || sh.z > 600) {
      shootingStars.splice(i, 1);
      continue;
    }

    let alpha = sh.life * 255;
    stroke(255, 255, 200, alpha);

    push();
    translate(sh.x, sh.y, sh.z);
    line(0, 0, 0, -sh.vx * 2.0, -sh.vy * 2.0, -sh.vz * 2.0);
    pop();

    // glowing head star
    push();
    noStroke();
    fill(255, 255, 180, alpha * 1.4);
    translate(sh.x, sh.y, sh.z);
    sphere(14);
    pop();
  }
  pop();


  // LIGHTS
  ambientLight(60, 60, 80);
  directionalLight(255, 255, 255, -0.5, -1, -0.5);
  pointLight(150, 150, 255, 200, -200, 300);

  // PLANET (SPINNING)
  push();
  rotateY(planetRotation);
  noStroke();
  texture(planetTexture);
  sphere(planetRadius, 64, 64);
  pop();

  // HOVER DETECTION FOR PLANET (ZOOM-AWARE)
  let dx = mouseX - width / 2;
  let dy = mouseY - height / 2;
  let distToCenter = sqrt(dx * dx + dy * dy);

  // hit radius based on zoom
  let zoomScale = 1 / (1 - zoom / 1000);
  zoomScale = constrain(zoomScale, 0.3, 3.0);

  let hoverRadius = planetRadius * 1.2 * zoomScale;
  planetHovered = distToCenter < hoverRadius;


  // ASTRONAUT
  push();
  let bobOffset = sin(frameCount * 0.02) * 20;

  translate(
    0,
    -planetRadius * 2.5 + bobOffset,
    -planetRadius * 0.25
  );

  rotateY(-angleY);
  rotateX(-angleX);

  noStroke();
  texture(astronautImg);

  let astroSize = planetRadius * 1.2;
  plane(astroSize, astroSize);
  pop();


  // MOON 
  moonAngle += moonSpeed;

  push();
  rotateY(moonAngle);
  translate(moonDistance, 0, 0);
  noStroke();
  texture(moonTexture);
  sphere(moonSize, 32, 32);
  pop();


  pop(); 


  // 2D OVERLAY FOR TEXT
  resetMatrix(); 

  // TOOLTIP for planet hover
  if (planetHovered && !isDragging) {                
    // ensure tooltip draws in front of all 3D objects
    drawingContext.disable(drawingContext.DEPTH_TEST); 

    push();
    //tooltip near mouse
    let tooltipX = mouseX + 15;
    let tooltipY = mouseY - 40;

    // convert to WEBGL-centered coordinates
    translate(tooltipX - width / 2, tooltipY - height / 2, 0);

    // background box
    rectMode(CORNER);
    noStroke();
    fill(0, 0, 0, 180);
    let boxW = 260;
    let boxH = 120;
    rect(0, 0, boxW, boxH, 10);

    // tooltip text
    fill(255);
    textFont(spaceFont);
    textSize(14);
    text("Planet: S", 12, 24);
    text("Type: Water ", 12, 44);
    text("Eco: Friendly ", 12, 64);
    text("Moon: Heat Map ", 12, 84);
    text("Atmosphere: Adaptive", 12, 104);

    pop();

    drawingContext.enable(drawingContext.DEPTH_TEST); 
  }

  // Existing UI text
  translate(width/2 -500, -height / 2 + 30, 0);
  fill(255);
  noStroke();
  textFont(spaceFont);
  textSize(18);
  text("Scroll to zoom, Drag to rotate", 0, 0);
}


// INTERACTION MOVEMENTS
function mousePressed() {
  isDragging = true;
  previousMouseX = mouseX;
  previousMouseY = mouseY;
}

function mouseDragged() {
  if (isDragging) {
    angleY += (mouseX - previousMouseX) * 0.01;
    angleX -= (mouseY - previousMouseY) * 0.01;

    previousMouseX = mouseX;
    previousMouseY = mouseY;
  }
}

function mouseReleased() {
  isDragging = false;
}

function mouseWheel(event) {
  zoom += event.delta * 2;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateSizesForWindow();
}

function updateSizesForWindow() {
  const base = min(windowWidth, windowHeight);

  planetRadius = base * 0.15;
  moonDistance = base * 0.3;
  moonSize     = base * 0.05;
}
