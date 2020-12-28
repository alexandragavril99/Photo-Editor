const app = {
  invisibleCanvas: null,
  canvas: null,
};

app.draw = function () {
  console.log(app.canvas.clientHeight);
  console.log(app.canvas.clientWidth);
  console.log(app.canvas.height);
  console.log(app.canvas.width);
  const context = app.canvas.getContext("2d");
  context.drawImage(app.invisibleCanvas, 0, 0);
};

app.load = function () {
  app.canvas = document.getElementById("canvas");

  app.invisibleCanvas = document.createElement("canvas");

  const context = app.canvas.getContext("2d");

  let x = 0;
  let y = 0;
  let x1 = 0;
  let y1 = 0;
  let click = 0;

  app.canvas.addEventListener("mousedown", (ev) => {
    x = (ev.offsetX * app.canvas.width) / app.canvas.clientWidth;
    y = (ev.offsetY * app.canvas.height) / app.canvas.clientHeight;
    console.log(x + " " + y);
  });

  app.canvas.addEventListener("mouseup", (ev) => {
    x1 = (ev.offsetX * app.canvas.width) / app.canvas.clientWidth;
    y1 = (ev.offsetY * app.canvas.height) / app.canvas.clientHeight;
    console.log(x1 + " " + y1);
    context.beginPath();
    context.rect(x, y, x1 - x, y1 - y);
    context.stroke();
  });

  let deleteBtn = document.getElementById("delete");
  deleteBtn.addEventListener("click", (ev) => {
    context.clearRect(x, y, x1 - x, y1 - y);
  });

  let inputFile = document.getElementById("inputFile");
  inputFile.addEventListener("change", function (ev) {
    const files = ev.target.files;
    // console.log(files);

    const reader = new FileReader();

    reader.addEventListener("load", function (ev) {
      //ev de load declansat atunci cand citirea s-a incheiat cu succes
      const dataURL = ev.target.result; //preluam url-ul fisierului incarcat
      //console.log(ev.target);

      const img = document.createElement("img");
      img.addEventListener("load", function (ev) {
        //s-a incarcat imaginea
        app.canvas.width = app.invisibleCanvas.width = img.naturalWidth;

        app.canvas.height = app.invisibleCanvas.height = img.naturalHeight;

        const oContext = app.invisibleCanvas.getContext("2d");
        oContext.drawImage(ev.target, 0, 0);

        app.draw();
      });
      img.src = dataURL; //incepe incarcarea imaginii
      //este posibil ca imaginea sa nu se fi incarcat
    });

    if (files[0]) {
      //verificam daca userul a incarcat un fisier
      reader.readAsDataURL(files[0]);
    }
  });
};
