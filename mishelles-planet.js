function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);

  //back button
  let base = min(width, height);
  let pad   = base * 0.05;   
  let butW  = width * .9;    
  let bx = width - butW - pad;

  let bttn = createButton("Back");
  bttn.position(bx,pad);

  bttn.position(20, 20);                  
  bttn.style("padding", "10px 22px");
  bttn.style("font-size", "20px");
  bttn.style("background", "#222");
  bttn.style("color", "white");
  bttn.style("border", "2px solid #555");
  bttn.style("border-radius", "8px");
  bttn.style("cursor", "pointer");
  bttn.style("z-index", "9999");
  bttn.style("transition", "all 0.2s ease");
  bttn.style("font-family", "spaceFont"); // CSS family name, optional

  // Hover effect for Back button
  bttn.mouseOver(() => {
    bttn.style("background", "#444");
    bttn.style("transform", "scale(1.1)");
    bttn.style("border", "2px solid white");
  });

  bttn.mouseOut(() => {
    bttn.style("background", "#222");
    bttn.style("transform", "scale(1.0)");
    bttn.style("border", "2px solid #555");
  });


   bttn.mousePressed(redirect);
}

function draw() {
  background(0);
}

function redirect(){
  window.location.href = "./"; // go back to the landing page
}