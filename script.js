const app = {
  offscreenCanvas: null,
  canvas: null,
  currentEffect: "normal",
};

app.draw = function () {
  switch (app.currentEffect) {
    case "normal":
      const context = app.canvas.getContext("2d");
      context.drawImage(app.offscreenCanvas, 0, 0);
      break;
  }
};

app.load = function () {
  app.canvas = document.getElementById("canvas");

  app.offscreenCanvas = document.createElement("canvas");

  let fileBrowser = document.getElementById("fileBrowser");
  fileBrowser.addEventListener("change", function (ev) {
    const files = ev.target.files;
    // console.log(files);

    const reader = new FileReader();

    reader.addEventListener("load", function (ev) {
      //ev de load declansat atunci cand citirea s-a incheiat cu succes
      const dataUrl = ev.target.result; //preluam url-ul fisierului incarcat
      console.log(ev.target);

      const img = document.createElement("img");
      img.addEventListener("load", function (ev) {
        //s-a incarcat imaginea
        app.canvas.width = app.offscreenCanvas.width = img.naturalWidth;

        app.canvas.height = app.offscreenCanvas.height = img.naturalHeight;

        const oContext = app.offscreenCanvas.getContext("2d");
        oContext.drawImage(ev.target, 0, 0);

        app.currentEffect = "normal";
        app.draw();
      });
      img.src = dataUrl; //incepe incarcarea imaginii
      //este posibil ca imaginea sa nu se fi incarcat
    });

    if (files[0]) {
      //verificam daca userul a incarcat un fisier
      reader.readAsDataURL(files[0]);
    }
  });
};
