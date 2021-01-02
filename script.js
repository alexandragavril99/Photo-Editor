const app = {
  invisibleCanvas: null,
  canvas: null,
  histogramCanvas: null,
  effectCanvas: null,
  currentEffect: "normal",
};

class BarChart {
  constructor(barChartCanvas) {
    this.barChartCanvas = barChartCanvas;
  }
  drawChart(values) {
    let context = this.barChartCanvas.getContext("2d");

    let maxValue = Math.max(...values);
    let f = this.barChartCanvas.height / maxValue;

    let barWidth = this.barChartCanvas.width / values.length;
    context.clearRect(
      0,
      0,
      this.barChartCanvas.width,
      this.barChartCanvas.height
    );

    context.save();

    context.rotate(Math.PI);
    context.translate(0, -this.barChartCanvas.height);
    context.scale(-1, f);

    for (let i = 0; i < values.length; i++) {
      context.fillRect(i * barWidth, 0, barWidth * 0.9, values[i]);
    }

    context.restore();
  }
}

//functie care furnizeaza valorile ce vor fi reprezentate in histograma
function drawHistogram(barChart, imageBarChart) {
  let v = [];
  for (let i = 0; i < 256; i++) {
    v[i] = 0;
  }
  let data = imageBarChart.data; // luam pixelii

  //console.log(data);
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    //let a = data[i+3];
    let average = Math.round((r + g + b) / 3);
    v[average]++;
  }
  barChart.drawChart(v); //apelam functia de desenare a histogramei pe vectorul cu valori v
}

//functie ce modifica efectul curent si il aplica in cadrul selectiei
app.changeEffect = function (effect, x, y, x1, y1) {
  if (app.currentEffect !== effect) {
    app.currentEffect = effect;
  }
  switch (app.currentEffect) {
    case "normal":
      const effectContext = app.effectCanvas.getContext("2d");
      const imageData = effectContext.getImageData(x, y, x1 - x, y1 - y);

      const iContext = app.invisibleCanvas.getContext("2d");
      const context = app.canvas.getContext("2d");
      app.compareCoordinates(context, iContext, x, y, x1, y1, imageData);
      break;
    case "BlackAndWhite":
      app.BlackAndWhite(x, y, x1, y1);
      break;
    case "darker":
      app.BrighterOrDarker(50, x, y, x1, y1);
      break;
    case "brighter":
      app.BrighterOrDarker(-50, x, y, x1, y1);
      break;
    case "neon":
      app.neon(x, y, x1, y1);
      break;
  }
};

//efect alb-negru
app.BlackAndWhite = function (x, y, x1, y1) {
  //gri -> r = g = b
  const effectContext = app.effectCanvas.getContext("2d");
  const imageData = effectContext.getImageData(x, y, x1 - x, y1 - y);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const average = Math.round((r + g + b) / 3);
    data[i] = data[i + 1] = data[i + 2] = average;
  }

  const invisibleContext = app.invisibleCanvas.getContext("2d");
  const context = app.canvas.getContext("2d");
  app.compareCoordinates(context, invisibleContext, x, y, x1, y1, imageData);
};

//efect pt o poza mai inchisa/mai deschia
app.BrighterOrDarker = function (v, x, y, x1, y1) {
  const effectContext = app.effectCanvas.getContext("2d");
  const imageData = effectContext.getImageData(x, y, x1 - x, y1 - y);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i] - v; //r
    data[i + 1] = data[i + 1] - v; //g
    data[i + 2] = data[i + 2] - v; //b
  }

  const context = app.canvas.getContext("2d");
  const invisibleContext = app.invisibleCanvas.getContext("2d");
  app.compareCoordinates(context, invisibleContext, x, y, x1, y1, imageData);
};

//efect neon
app.neon = function (x, y, x1, y1) {
  //Hint: r' = r - v; g' = g - v; b' = b - v;
  const effectContext = app.effectCanvas.getContext("2d");
  const imageData = effectContext.getImageData(x, y, x1 - x, y1 - y);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    data[i + 4] = 150;
  }

  const invisibleContext = app.invisibleCanvas.getContext("2d");
  const context = app.canvas.getContext("2d");
  app.compareCoordinates(context, invisibleContext, x, y, x1, y1, imageData);
};

//functie care selecteaza zona pentru aplicarea efectului indiferent de unde incepe selectia
app.compareCoordinates = function (context, iContext, x, y, x1, y1, imageData) {
  if (x < x1 && y < y1) {
    //stanga sus
    context.putImageData(imageData, x, y);
    iContext.putImageData(imageData, x, y);
  } else if (x > x1 && y1 > y) {
    //dreapta sus
    context.putImageData(imageData, x1, y);
    iContext.putImageData(imageData, x1, y);
  } else if (x1 < x && y1 < y) {
    //dreapta jos
    context.putImageData(imageData, x1, y1);
    iContext.putImageData(imageData, x1, y1);
  } else if (x < x1 && y > y1) {
    //stanga jos
    context.putImageData(imageData, x, y1);
    iContext.putImageData(imageData, x, y1);
  }
};

app.load = function () {
  app.canvas = document.getElementById("canvas");
  const context = app.canvas.getContext("2d");

  app.histogramCanvas = document.getElementById("histogramCanvas");
  let barChart = new BarChart(app.histogramCanvas);

  app.invisibleCanvas = document.createElement("canvas");
  app.effectCanvas = document.createElement("canvas");

  let clickSelectAllBtn = 0; //variabila cu care verificam daca am selectat intreaga imagine
  let image; //variabila ce va retine un obiect de tip ImageData

  let selectAllBtn = document.getElementById("selectAllBtn");

  //adaugam eveniment de click pe butonul de selectie completa a imaginii
  selectAllBtn.addEventListener("click", () => {
    image = context.getImageData(0, 0, canvas.width, canvas.height); //preluam imaginea inainte de a aplica selectia
    context.beginPath();
    context.rect(0, 0, app.canvas.width, app.canvas.height);
    context.stroke();
    clickSelectAllBtn = 1; //marcam ca imaginea a fost selectata complet
  });

  let x = 0;
  let y = 0; //x,y - coordonatele punctului de start a selectiei

  let x1 = 0;
  let y1 = 0; //x1, y1 - coordonatele finale (sau intermediare) ale selectiei

  let click = 0; // variabila cu care verificam daca am finalizat selectia
  let mouseMove = 0; //variabila care verifica daca selectia este in miscare
  let imageBarChart; //variabila care va prelua selectia curenta pentru realizarea histogramei de culoare

  let selectBtn = document.getElementById("selectBtn");

  //adaugam eveniment de click pe butonul de selectie a imaginii
  selectBtn.addEventListener("click", () => {
    click = 0; //reinitializam variabila click in caz ca selectia este reapelata

    if (clickSelectAllBtn == 1) {
      // in caz ca selectia completa a fost aplicata renuntam la ea
      context.putImageData(image, 0, 0); //aplicam imaginea originala
      clickSelectAllBtn = 0;
    }

    //functie pe evenimentul de mousedown asupra canvas-ului care preia coord. pct-ului de start
    app.canvas.addEventListener("mousedown", (ev) => {
      if (click == 0) {
        x = (ev.offsetX * app.canvas.width) / app.canvas.clientWidth;
        y = (ev.offsetY * app.canvas.height) / app.canvas.clientHeight;
        image = context.getImageData(0, 0, canvas.width, canvas.height); //retinem imaginea
        console.log(x + " " + y);
        mouseMove = 1; //retinem ca mouse-ul este in miscare
      }
    });

    //functie atasata evenimentului de mousemove pe canvas care redeseneaza dreptunghiul aferent selectiei
    app.canvas.addEventListener("mousemove", (ev) => {
      if (mouseMove == 1) {
        context.putImageData(image, 0, 0);
        x1 = (ev.offsetX * app.canvas.width) / app.canvas.clientWidth;
        y1 = (ev.offsetY * app.canvas.height) / app.canvas.clientHeight;
        if (x1 - x !== 0 && y1 - y !== 0) {
          imageBarChart = context.getImageData(x, y, x1 - x, y1 - y);
        }
        if (imageBarChart) {
          drawHistogram(barChart, imageBarChart);
        }
        context.beginPath();
        context.rect(x, y, x1 - x, y1 - y);
        context.stroke();
      }
    });

    //functie atasata ev de mouseup prin care finalizam desenarea dreptunghiului selectiei
    app.canvas.addEventListener("mouseup", (ev) => {
      mouseMove = 0; //marcam faptul ca mouse-ul s-a oprit
      if (click == 0) {
        context.putImageData(image, 0, 0);
        x1 = (ev.offsetX * app.canvas.width) / app.canvas.clientWidth;
        y1 = (ev.offsetY * app.canvas.height) / app.canvas.clientHeight;
        if (x1 - x !== 0 && y1 - y !== 0) {
          imageBarChart = context.getImageData(x, y, x1 - x, y1 - y);
        }
        if (imageBarChart) {
          drawHistogram(barChart, imageBarChart);
        }
        console.log(x1 + " " + y1);
        context.beginPath();
        context.rect(x, y, x1 - x, y1 - y);
        context.stroke();
        click = 1; // marcam ca selectia s-a terminat
      }
    });
  });

  let deleteBtn = document.getElementById("deleteBtn");

  //stergere selectie curenta
  deleteBtn.addEventListener("click", () => {
    if (x1 > x && y1 > y) {
      //stergere din coltul stanga sus
      context.clearRect(x - 1, y - 1, x1 + 2 - x, y1 + 2 - y);
    } else if (x > x1 && y1 > y) {
      //dreapta sus
      context.clearRect(x + 1, y - 1, x1 - x - 2, y1 - y + 2);
    } else if (x1 < x && y1 < y) {
      //dreapta jos
      context.clearRect(x + 1, y + 1, -(x - x1 + 2), -(y - y1 + 2));
    } else if (x < x1 && y > y1) {
      //stanga jos
      context.clearRect(x - 1, y + 1, -(x - x1 - 2), -(y - y1 + 2));
    }
  });

  let downloadBtn = document.getElementById("downloadBtn");

  //salvare poza
  downloadBtn.addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = app.canvas.toDataURL();
    a.download = "image";
    a.click();
  });

  let inputFile = document.getElementById("inputFile");
  let imageCanvas; //imaginea incarcata in canvas

  //incarcare poza
  inputFile.addEventListener("change", function (ev) {
    const files = ev.target.files;
    // console.log(files);

    const reader = new FileReader();

    reader.addEventListener("load", function (ev) {
      //ev de load declansat atunci cand citirea s-a incheiat cu succes
      const dataURL = ev.target.result; //preluam url-ul fisierului incarcat
      //console.log(ev.target);

      imageCanvas = document.createElement("img");
      imageCanvas.addEventListener("load", function (ev) {
        //s-a incarcat imaginea
        app.canvas.width = app.invisibleCanvas.width = app.effectCanvas.width =
          imageCanvas.naturalWidth;
        app.canvas.height = app.invisibleCanvas.height = app.effectCanvas.height =
          imageCanvas.naturalHeight;

        const invisibleContext = app.invisibleCanvas.getContext("2d");
        invisibleContext.drawImage(ev.target, 0, 0);

        console.log(app.canvas.clientHeight);
        console.log(app.canvas.clientWidth);
        console.log(app.canvas.height);
        console.log(app.canvas.width);
        const context = app.canvas.getContext("2d");
        context.drawImage(app.invisibleCanvas, 0, 0); //incarcam imaginea in cadrul canvasului
        app.effectCanvas.getContext("2d").drawImage(app.invisibleCanvas, 0, 0);
      });
      imageCanvas.src = dataURL; //incepe incarcarea imaginii
      //este posibil ca imaginea sa nu se fi incarcat
    });

    if (files[0]) {
      //verificam daca userul a incarcat un fisier
      reader.readAsDataURL(files[0]);
    }
  });

  let cropBtn = document.getElementById("cropBtn");

  //crop pentru selectia curenta
  cropBtn.addEventListener("click", () => {
    if (x && y) {
      let cropCanvas = app.invisibleCanvas;
      app.invisibleCanvas = null;
      app.invisibleCanvas = document.createElement("canvas");

      let clientWidth = app.canvas.clientWidth;
      let clientHeight = app.canvas.clientHeight; //dimensiunile canvasului

      let width = app.canvas.width;
      let height = app.canvas.height; //dimensiunea pozei

      //redimensionarea canvasului
      app.canvas.width = app.invisibleCanvas.width =
        (Math.abs(x1 - x) * clientWidth) / width;
      app.canvas.height = app.invisibleCanvas.height =
        (Math.abs(y1 - y) * clientHeight) / height;

      const invisibleContext = app.invisibleCanvas.getContext("2d");
      if (cropCanvas) {
        if (x < x1 && y < y1) {
          //stanga sus
          invisibleContext.drawImage(
            cropCanvas,
            x,
            y,
            x1 - x,
            y1 - y,
            0,
            0,
            app.invisibleCanvas.width,
            app.invisibleCanvas.height
          );
        } else if (x > x1 && y1 > y) {
          //dreapta sus
          invisibleContext.drawImage(
            cropCanvas,
            x1,
            y,
            Math.abs(x1 - x),
            Math.abs(y1 - y),
            0,
            0,
            app.invisibleCanvas.width,
            app.invisibleCanvas.height
          );
        } else if (x1 < x && y1 < y) {
          invisibleContext.drawImage(
            //dreapta jos
            cropCanvas,
            x1,
            y1,
            Math.abs(x1 - x),
            Math.abs(y1 - y),
            0,
            0,
            app.invisibleCanvas.width,
            app.invisibleCanvas.height
          );
        } else if (x < x1 && y > y1) {
          invisibleContext.drawImage(
            //stanga jos
            cropCanvas,
            x,
            y1,
            Math.abs(x1 - x),
            Math.abs(y1 - y),
            0,
            0,
            app.invisibleCanvas.width,
            app.invisibleCanvas.height
          );
        }
        context.drawImage(app.invisibleCanvas, 0, 0);
        app.effectCanvas.getContext("2d").drawImage(app.invisibleCanvas, 0, 0);
      }
    }
  });

  const buttons = document.querySelectorAll("button[data-effect]");

  for (let i = 0; i < buttons.length; i++) {
    //adaugam fiecarui butonul evenimentul de click in functie de efectul sau
    buttons[i].addEventListener("click", function (ev) {
      const button = ev.target;
      const effect = button.dataset.effect;
      if ((x, y, x1, y1)) {
        //apelam functia de schimbare a efectului in functie de butonul apasat
        app.changeEffect(effect, x, y, x1, y1);
      }
    });
  }
};
