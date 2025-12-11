class Button {

  constructor(x, y, bttnText,redirect) {
    this._x = x;
    this._y = y;
    this._bttnText = bttnText;
    this._redirect = redirect;
  }
  
  show() {
    let bttn = createButton(this._bttnText);

    bttn.position(this._x, this._y);                  
    bttn.style("padding", "10px 22px");
    bttn.style("font-size", "20px");
    bttn.style("background", "#222");
    bttn.style("color", "white");
    bttn.style("border", "2px solid #555");
    bttn.style("border-radius", "8px");
    bttn.style("cursor", "pointer");
    bttn.style("z-index", "9999");
    bttn.style("transition", "all 0.2s ease");
    bttn.style("font-family", "spaceFont");

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

    bttn.mousePressed(() => {
      window.location.href = this._redirect; // go back to the landing page
    });
  }
}