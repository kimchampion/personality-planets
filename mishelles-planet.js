function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);

  //x,y,buttonText, redirect
  let bttn = new Button(20, 20, "Back", "./"); //go back to the landing page
  bttn.show();
}

function draw() {
  background(0);
}

function redirect(){
  window.location.href = "./"; // go back to the landing page
}
