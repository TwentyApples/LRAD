//LRAD AUDIO REACTIVE 2

let sound;
let fft;
let amp;

let started = false;

const W = 1400;
const H = 900;

const COLS = 110;
const ROWS = 62;

let cells = [];

let waveform;
let spectrum;

let audioEnergy = 0;
let bassEnergy = 0;
let midEnergy = 0;
let highEnergy = 0;

let smoothedEnergy = 0;
let smoothedBass = 0;
let smoothedMid = 0;
let smoothedHigh = 0;


//preload

function preload() {
  sound = loadSound("lradaudio.mp3");
}


//setup

function setup() {

  createCanvas(W, H);

  pixelDensity(2);

  fft = new p5.FFT(0.85, 1024);
  fft.setInput(sound);

  amp = new p5.Amplitude();
  amp.setInput(sound);

  rectMode(CENTER);

  createGrid();

  fitCanvas();

  noStroke();
}


//create grid

function createGrid() {

  cells = [];

  const left = 80;
  const right = 80;
  const top = 120;
  const bottom = 120;

  const spacingX =
    (W - left - right) /
    (COLS - 1);

  const spacingY =
    (H - top - bottom) /
    (ROWS - 1);


  for (let y = 0; y < ROWS; y++) {

    for (let x = 0; x < COLS; x++) {

      cells.push({

        baseX:
          left +
          x * spacingX,

        baseY:
          top +
          y * spacingY,

        col: x,
        row: y,

        w: random(3.5, 5),
        h: random(3.5, 5),

        seed: random(10000),

        phase: random(TWO_PI)
      });
    }
  }
}


//fit to screen

function fitCanvas() {

  const scale =
    min(
      windowWidth / W,
      windowHeight / H
    );

  const canvas =
    document.querySelector("canvas");

  const newW =
    W * scale;

  const newH =
    H * scale;

  canvas.style.width =
    newW + "px";

  canvas.style.height =
    newH + "px";

  canvas.style.position =
    "absolute";

  canvas.style.left =
    (windowWidth - newW) / 2 +
    "px";

  canvas.style.top =
    (windowHeight - newH) / 2 +
    "px";
}


function windowResized() {
  fitCanvas();
}


//draw

function draw() {

  background(
    248,
    247,
    243
  );


  if (!started) {

    drawStaticGrid();

    return;
  }


//get audio data

  waveform =
    fft.waveform();

  spectrum =
    fft.analyze();


  let rawBass =
    fft.getEnergy(
      "bass"
    ) / 255;

  let rawMid =
    fft.getEnergy(
      "mid"
    ) / 255;

  let rawHigh =
    fft.getEnergy(
      "treble"
    ) / 255;


  let rawEnergy =
    amp.getLevel();


//smooth audio

  smoothedBass =
    lerp(
      smoothedBass,
      rawBass,
      0.18
    );

  smoothedMid =
    lerp(
      smoothedMid,
      rawMid,
      0.18
    );

  smoothedHigh =
    lerp(
      smoothedHigh,
      rawHigh,
      0.2
    );

  smoothedEnergy =
    lerp(
      smoothedEnergy,
      rawEnergy,
      0.2
    );


//draw

  drawAudioGrid();

  drawAudioWave();

  drawFineGlitches();

  drawMinimalInformation();
}


//audio grid

function drawAudioGrid() {

  for (
    let i = 0;
    i < cells.length;
    i++
  ) {

    const c =
      cells[i];


//audio value for this column

    let waveformIndex =
      floor(
        map(
          c.col,
          0,
          COLS - 1,
          0,
          waveform.length - 1
        )
      );


    let wave =
      waveform[
        waveformIndex
      ];


    // Convert waveform to useful magnitude

    let waveMagnitude =
      abs(wave);


   //spectral value

    let spectrumIndex =
      floor(
        map(
          c.col,
          0,
          COLS - 1,
          0,
          spectrum.length * 0.35
        )
      );


    let spectralValue =
      spectrum[
        spectrumIndex
      ] / 255;


//audio impact

    // Waveform produces the fine movement

    let waveForce =
      waveMagnitude *
      80;


    // Bass produces large-scale movement

    let bassForce =
      smoothedBass *
      45;


    // Mids produce horizontal displacement

    let midForce =
      smoothedMid *
      28;


    // High frequencies produce instability

    let highForce =
      smoothedHigh *
      12;


//wave travels through grid

    // A wave position derived from the
    // current audio energy.

    let acousticPhase =
      frameCount *
      0.018 +
      c.col *
      0.12;


    let travellingWave =
      sin(
        acousticPhase
      );


//position

    let x =
      c.baseX;

    let y =
      c.baseY;


    // Waveform itself pushes blocks sideways

    x +=
      wave *
      (
        25 +
        bassForce
      );


    // Spectral energy bends the grid

    y +=
      travellingWave *
      spectralValue *
      (
        20 +
        bassForce
      );


    // Bass causes broad vertical breathing

    y +=
      sin(
        c.col * 0.07 +
        frameCount * 0.01
      ) *
      bassForce;


    // Mid frequencies shear rows

    x +=
      sin(
        c.row * 0.35 +
        frameCount * 0.02
      ) *
      midForce;


    // High-frequency jitter

    if (
      smoothedHigh >
      0.2
    ) {

      x +=
        random(
          -highForce,
          highForce
        );

      y +=
        random(
          -highForce * 0.5,
          highForce * 0.5
        );
    }


//distance from audio front

    // This front moves across the image,
    // but its strength comes from the audio.

    let frontPosition =
      map(
        smoothedEnergy,
        0,
        0.25,
        -200,
        W + 200
      );


    let distance =
      abs(
        c.baseX -
        frontPosition
      );


    let front =
      exp(
        -distance *
        0.025
      );


//block growth

    // Normal size

    let growth =
      1;


    // Waveform makes them pulse

    growth +=
      waveMagnitude *
      0.8;


    // Bass makes the acoustic front swell

    growth +=
      front *
      smoothedBass *
      1.8;


    // Overall audio level contributes slightly

    growth +=
      smoothedEnergy *
      4;


    let w =
      c.w *
      growth;

    let h =
      c.h *
      growth;


//horizontal sketch

    if (
      spectralValue >
      0.35
    ) {

      w *=
        1 +
        spectralValue *
        1.5;
    }


  //rotation

    let rotation =
      wave *
      0.18;

//disappearing blocks

    let visible =
      true;


    // High-frequency information
    // punches holes in the structure

    let disappearance =
      smoothedHigh *
      front *
      0.35;


    if (
      random() <
      disappearance
    ) {

      visible = false;
    }


    // Strong waveform peaks
    // occasionally remove blocks

    if (
      waveMagnitude >
      0.65 &&
      random() <
      0.08
    ) {

      visible = false;
    }


  //draw

    if (visible) {

      push();

      translate(
        x,
        y
      );

      rotate(
        rotation
      );

      fill(0);

      rect(
        0,
        0,
        w,
        h
      );

      pop();
    }
  }
}


//audio wave

function drawAudioWave() {

  //pulse line
  //currently OUT OF ACTION
  //change stroke weight to bring itback
 //previously 0.7

  push();

  noFill();

  stroke(0);

  strokeWeight(
    0.0
  );


  beginShape();


  for (
    let x = 80;
    x < W - 80;
    x += 8
  ) {

    let index =
      floor(
        map(
          x,
          80,
          W - 80,
          0,
          waveform.length - 1
        )
      );


    let value =
      waveform[index];


    let y =
      H * 0.5 +
      value *
      110;


    vertex(
      x,
      y
    );
  }


  endShape();

  pop();
}


//fine glitches

function drawFineGlitches() {

  if (
    smoothedHigh <
    0.08
  ) {

    return;
  }


  push();

  stroke(0);

  strokeWeight(
    0.5
  );


  let amount =
    floor(
      smoothedHigh *
      80
    );


  for (
    let i = 0;
    i < amount;
    i++
  ) {

    let index =
      floor(
        random(
          waveform.length
        )
      );


    let wave =
      waveform[index];


    let x =
      map(
        index,
        0,
        waveform.length - 1,
        80,
        W - 80
      );


    let y =
      H * 0.5 +
      wave *
      300;


    let length =
      random(
        5,
        40
      );


    line(
      x,
      y,
      x + length,
      y
    );
  }


  pop();
}


//minimal information

function drawMinimalInformation() {

  push();

  fill(0);

  noStroke();

  textFont(
    "monospace"
  );

  textSize(8);


  text(
    "LRAD",
    70,
    52
  );


  text(
    "DRAFT",
    70,
    67
  );


  text(
    "01",
    W - 90,
    52
  );


  // Very thin baseline

  stroke(0);

  strokeWeight(
    0.5
  );


  line(
    70,
    H - 55,
    W - 70,
    H - 55
  );


  // Tiny ticks

  for (
    let i = 0;
    i < 14;
    i++
  ) {

    let x =
      map(
        i,
        0,
        13,
        70,
        W - 70
      );


    line(
      x,
      H - 59,
      x,
      H - 51
    );
  }


  pop();
}

//static opening

function drawStaticGrid() {

  fill(0);

  noStroke();


  for (
    let i = 0;
    i < cells.length;
    i++
  ) {

    let c =
      cells[i];


    rect(
      c.baseX,
      c.baseY,
      c.w,
      c.h
    );
  }


  fill(0);

  textFont(
    "monospace"
  );

  textSize(8);


  text(
    "LRAD",
    70,
    52
  );


  text(
    "ACOUSTIC RECONSTRUCTION",
    70,
    67
  );


  text(
    "CLICK TO ACTIVATE",
    70,
    H - 55
  );
}


//start audio

function mousePressed() {

  if (!started) {

    userStartAudio();

    sound.loop();

    started = true;
  }
}

