/* Constants */ 
const apertureShape = {
  CIRCLE: 0,
  ELLIPSE: 1,
  SQUARE: 2,
  RECTANGLE: 3,
}

const direction = {
  RIGHT: 0,
  UP: 90,
  LEFT: 180,
  DOWN: 270,
}

const uiStates = {
  INSTRUCTIONS: "INSTRUCTIONS",
  TRIAL: "TRIAL",
  ITI:  "ITI",
  RESULTS: "RESULTS",
}

var CLOCK_INTERVAL_MS = 50;
var ITI_DURATION_MS = 1000;
var TIME_LIMIT_MS = [4000, 5000, 6000];
var TIME_LENGTH = TIME_LIMIT_MS.length;
var LEFT_KEY = 65;
var RIGHT_KEY = 76;
var GOAL = [30, 40, 50];
var GOAL_LENGTH = GOAL.length;
var CSV_HEADER = ["trial number", "direction", "correct", "reaction_time", "score", "goal", "distance", "time limit", "coherence"];
var CSV_FILENAME = "testSave.csv"
var TIME_RANDOM = Math.floor((Math.random() * TIME_LENGTH));
var GOAL_RANDOM = Math.floor((Math.random() * GOAL_LENGTH));
var TIME_INDEX = TIME_LIMIT_MS.indexOf(TIME_RANDOM);
var GOAL_INDEX = GOAL.indexOf(GOAL_RANDOM);
var TRIAL_COUNT = 0;
var DOT_COHERENCE = 0.3;


var FAIL_SOUND = new sound("./Sounds/trial-fail.mp3");
var SUCCESS_SOUND = new sound("./Sounds/trial-success.mp3");

var CANVAS_ID = "dotCanvas";
var INSTRUCTIONS_ID = "instructions";
var TIMER_BAR_ID =  "myTimingBar";
var TIMER_BAR_TEXT_ID =  "myTimingBarText";
var SCORE_BAR_1_ID = "myScoreBar1";
var SCORE_BAR_2_ID = "myScoreBar2";
var SCORE_BAR_3_ID = "myScoreBar3";
var SCORE_BAR_1_TEXT_ID   = "myScoreBar1Text";
var SCORE_BAR_1_2_TEXT_ID = "myScoreBar1Text2";
var SCORE_BAR_2_TEXT_ID   = "myScoreBar2Text";
var SCORE_BAR_3_TEXT_ID   = "myScoreBar3Text";
var SCORE_BAR_3_1_TEXT_ID = "myScoreBar3Text2";
var SCORE_BAR_3_2_TEXT_ID = "myScoreBar3Text3";
var FACE_IMG_ID = "faceImg";
var FACE_TEXT_ID = "faceText"

/*** UTILITIES ****************************************************************/

/*
 * Remove all nodes in the body
 */
function removeBody() {
  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild);
  }
}

/*
 * Generate a sound object
 */
function sound(src) {
  this.sound = document.createElement("audio");
  this.sound.src = src;
  this.sound.setAttribute("preload", "auto");
  this.sound.setAttribute("controls", "none");
  this.sound.style.display = "none";
  this.play = function(){
    this.sound.currentTime = 0;
    this.sound.play();
  }
  this.stop = function(){
    this.sound.pause();
  }
}

/*
 * Generate a timer object
 */
function clock(remaining, callback) {
  this.pauseTimer = true;
  this.remaining = remaining;
  this.oldTime =  Date.now();
  this.pause = function (){
    this.pauseTimer = true;
  }
  this.resume = function (){
    this.pauseTimer = false;
  }

  var self = this;
  this.loop = function(){
    if (!self.pauseTimer) {
      if (self.remaining > 0) {
        var newTime = Date.now();
        self.remaining += self.oldTime - newTime;
        self.oldTime = newTime;
      } else {
        callback();
        return;
      }
    } else {
      self.oldTime = Date.now();
    }
    setTimeout(self.loop, CLOCK_INTERVAL_MS);
  }
  setTimeout(this.loop, CLOCK_INTERVAL_MS);
}

/*
 * Generate a CSV from a 2D array
 * The CSV is immediately downloaded
 *
 * Based on:
 *   https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
 */
function exportCSV(values, filename) {
  csvContent = "data:text/csv;charset=utf-8,";
  values.forEach(function(rowArray){
    row = rowArray.join(",");
    csvContent += row + "\r\n";
  }); 
  var encodedUri = encodeURI(csvContent);

  var link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
}

/*** DRAW *********************************************************************/

function drawInstructions() {
  var text = document.createElement("p");
  text.innerHTML = `
This is a random dot task. Your screen will show a group of dots that are moving in many directions.<br /><br />
On each trial, 30% of the dots will be moving in a coherent direction (left or right) and the other 70% will move randomly.<br /><br />
You need to determine if the dots are moving left or right.<br /><br />
If the dots are moving left, press the 'A' key. If the dots are moving right, press the 'L' key.<br /><br />
You will have ${TIME_LIMIT_MS[TIME_RANDOM]/1000} seconds to acheive a score of ${GOAL[GOAL_RANDOM]}.<br /><br />
For each correct response, you will gain a point. For each incorrect response, you will lose a point. Points can go into the negatives.<br /><br />
Once the time runs out, the experiment will end and a copy will be saved locally in a .csv file.<br /><br />
Press any key to continue.
`
  return text;
}

function drawTrial() {
  var canvas = document.createElement("canvas");
  canvas.id = CANVAS_ID;
  canvas.style.top = 0;
  canvas.style.left = 0;
  canvas.style.position = "absolute";
  runTest(canvas);
  return canvas;
}

function drawITI() {
  var itiScreen = document.createElement("div");

  itiScreen.appendChild(document.createElement("br"));
  itiScreen.appendChild(document.createElement("br"));
  itiScreen.appendChild(document.createElement("br"));
  itiScreen.appendChild(document.createElement("br"));
  itiScreen.appendChild(document.createElement("br"));
  itiScreen.appendChild(document.createElement("br"));
  itiScreen.appendChild(document.createElement("br"));

  var timingBar = document.createElement("div");
  timingBar.id = TIMER_BAR_ID;
  var timingBarProgress = document.createElement("div");
  timingBarProgress.id = "myTimingProgress";
  timingBarProgress.appendChild(timingBar);
  itiScreen.appendChild(timingBarProgress);

  var timingBarText = document.createElement("div");
  timingBarText.id = TIMER_BAR_TEXT_ID;
  timingBarProgress.appendChild(timingBarText);

  itiScreen.appendChild(document.createElement("br"));
  itiScreen.appendChild(document.createElement("br"));
  itiScreen.appendChild(document.createElement("br"));
  itiScreen.appendChild(document.createElement("br"));
  itiScreen.appendChild(document.createElement("br"));

  var scoreBarMaster = document.createElement("div");
  scoreBarMaster.id = "myScoreMaster";

  var scoreBar1 = document.createElement("div");
  scoreBar1.id = "myScoreBar1";
  var scoreBar1Text = document.createElement("div");
  scoreBar1Text.id = "myScoreBar1Text";
  var scoreBar1Text2 = document.createElement("div");
  scoreBar1Text2.id = "myScoreBar1Text2";
  var scoreBar1Progress = document.createElement("div");
  scoreBar1Progress.id = "myScore1Progress";
  scoreBar1Progress.appendChild(scoreBar1);
  scoreBar1Progress.appendChild(scoreBar1Text);
  scoreBar1Progress.appendChild(scoreBar1Text2);

  var scoreBar2 = document.createElement("div");
  scoreBar2.id = "myScoreBar2";
  var scoreBar2Text = document.createElement("div");
  scoreBar2Text.id = "myScoreBar2Text";
  var scoreBar2Text2 = document.createElement("div");
  scoreBar2Text2.id = "myScoreBar2Text2";
  var scoreBar2Progress = document.createElement("div");
  scoreBar2Progress.id = "myScore2Progress";
  scoreBar2Progress.appendChild(scoreBar2);
  scoreBar2Progress.appendChild(scoreBar2Text);
  scoreBar2Progress.appendChild(scoreBar2Text2);

  var scoreBar3 = document.createElement("div");
  scoreBar3.id = "myScoreBar3";
  var scoreBar3Text = document.createElement("div");
  scoreBar3Text.id = "myScoreBar3Text";
  var scoreBar3Text2 = document.createElement("div");
  scoreBar3Text2.id = "myScoreBar3Text2";
  var scoreBar3Text3 = document.createElement("div");
  scoreBar3Text3.id = "myScoreBar3Text3";
  var scoreBar3Progress = document.createElement("div");
  scoreBar3Progress.id = "myScore3Progress";
  scoreBar3Progress.appendChild(scoreBar3);
  scoreBar3Progress.appendChild(scoreBar3Text);
  scoreBar3Progress.appendChild(scoreBar3Text2);
  scoreBar3Progress.appendChild(scoreBar3Text3);

  var myImage = new Image(100, 200);
  myImage.src = './Images/flags.png';

  var flagImg = document.createElement("IMG");
  flagImg.id = "flagimage";
  flagImg.setAttribute("src", "./Images/flags.png");
  flagImg.setAttribute("width", "129");
  flagImg.setAttribute("height", "110");
  flagImg.setAttribute("alt", "flags");
  itiScreen.appendChild(flagImg);

  scoreBarMaster.appendChild(scoreBar1Progress);
  scoreBarMaster.appendChild(scoreBar2Progress);
  scoreBarMaster.appendChild(scoreBar3Progress);

  itiScreen.appendChild(scoreBarMaster);

  return itiScreen;
}

function drawResults() {
  var results = drawITI();

  var faceImg = document.createElement("IMG");
  var faceText = document.createElement("div");
  var timerBar = results.querySelector(`#${TIMER_BAR_ID}`);

  faceImg.id = FACE_IMG_ID;
  faceText.id = FACE_TEXT_ID;
  faceImg.setAttribute("width", "110");
  faceImg.setAttribute("height", "110");
  faceImg.setAttribute("alt", "face");
  timerBar.appendChild(faceText);
  timerBar.appendChild(faceImg);

  return results;
}

/*** UPDATE *******************************************************************/

function updateITI(itiScreen) {
  var scoreBar1Progress = itiScreen.querySelector("#myScore1Progress");
  var scoreBar1 = itiScreen.querySelector(`#${SCORE_BAR_1_ID}`);
  var scoreBar2 = itiScreen.querySelector(`#${SCORE_BAR_2_ID}`);
  var scoreBar3 = itiScreen.querySelector(`#${SCORE_BAR_3_ID}`);

  var timingBar = itiScreen.querySelector(`#${TIMER_BAR_ID}`);
  var timingBarText = itiScreen.querySelector(`#${TIMER_BAR_TEXT_ID}`);
  var scoreBar1Text = itiScreen.querySelector(`#${SCORE_BAR_1_TEXT_ID}`);
  var scoreBar1Text2 = itiScreen.querySelector(`#${SCORE_BAR_1_2_TEXT_ID}`);
  var scoreBar2Text = itiScreen.querySelector(`#${SCORE_BAR_2_TEXT_ID}`);
  var scoreBar3Text = itiScreen.querySelector(`#${SCORE_BAR_3_TEXT_ID}`);
  var scoreBar3Text2 = itiScreen.querySelector(`#${SCORE_BAR_3_1_TEXT_ID}`);
  var scoreBar3Text3 = itiScreen.querySelector(`#${SCORE_BAR_3_2_TEXT_ID}`);

  // UI for remaining time
  remaining = timer.remaining < 0 ? 0 : timer.remaining;
  width = 100 - (100 * (remaining / TIME_LIMIT_MS[TIME_RANDOM])); 
  timingBar.style.width = width + '%'; 
  timingBarText.innerHTML = Math.round(remaining / 1000) + 's remaining';

  // UI for score
  scoreBar1Text.innerHTML = '<br/><br/>' + '0';
  scoreBar1Text2.innerHTML = '<br/><br/>' + '-' + GOAL[GOAL_RANDOM];
  scoreBar2Text.innerHTML = 'Score: ' + score;
  scoreBar3Text.innerHTML = '<br/><br/>' + 2 * GOAL[GOAL_RANDOM];
  scoreBar3Text2.innerHTML = '<br/><br/>' + GOAL[GOAL_RANDOM];
  scoreBar3Text3.innerHTML = 'GOAL';

  if (score < 0) {
    if (score <= (GOAL[GOAL_RANDOM]) * -1) {
      scoreBar1.style.width = '0%';
      scoreBar1.style.borderWidth = '0px 0px 0px 0px';
      scoreBar1Progress.style.borderWidth = '0px 2px 4px 0px';
    } else {
      scoreBar1.style.width = (100 - (100 * ((score * -1) / GOAL[GOAL_RANDOM]))) + '%'; 
      scoreBar1Progress.style.borderWidth = '0px 2px 4px 4px';
    }
    scoreBar2.style.width = '0%';
    scoreBar3.style.width = '0%';
    scoreBar1.style.border = '4px black solid';
    scoreBar1.style.borderWidth = '0px 4px 0px 0px';
    scoreBar2.style.border = '0px';
  } else if (score == 0) { 
    scoreBar1.style.width = '100%';
    scoreBar2.style.width = '0%'; 
    scoreBar3.style.width = '0%';
    scoreBar1.style.border = '0px';
    scoreBar2.style.border = '0px';
    scoreBar3.style.border = '0px';
  } else if (score > 0 && score <= GOAL[GOAL_RANDOM]) {
    scoreBar1.style.width = '100%';
    scoreBar2.style.width = (100 * ((score) / GOAL[GOAL_RANDOM])) + '%'; 
    scoreBar3.style.width = '0%';
    scoreBar3.style.border = '0';
    scoreBar1.style.border = '0';
    scoreBar2.style.border = '4px black solid';
    scoreBar2.style.borderWidth = '0px 4px 0px 0px';
  } else if (score > GOAL) {
    scoreBar1.style.width = '100%';
    scoreBar2.style.width = '100%';
    scoreBar1.style.border = '0';
    if (score > GOAL * 2) {
      scoreBar3.style.width = '100%';
    } else {
      scoreBar3.style.width = (100 * ((score - GOAL[GOAL_RANDOM]) / GOAL[GOAL_RANDOM])) + '%';
    }
    scoreBar3.style.border = '4px black solid';
    scoreBar3.style.borderWidth = '0px 4px 0px 0px';
  } else {
    console.log('SCORE ERROR: ' + score);
  }

  return itiScreen;
}

function updateResults(itiScreen) {
  var faceImg = itiScreen.querySelector(`#${FACE_IMG_ID}`);
  var faceText = itiScreen.querySelector(`#${FACE_TEXT_ID}`);

  /* Customize based on score */
  if (score >= GOAL[GOAL_RANDOM]) {
    faceImg.setAttribute("src", "./Images/face0.png");
    faceText.innerHTML = '</br> </br> You achieved your goal!';
  } else {
    faceImg.setAttribute("src", "./Images/face1.png");
    faceText.innerHTML = '</br> </br> You did not achieve your goal.';
  }

  return itiScreen;
}

/*** SHOW *********************************************************************/

function showInstructions() {
  /* Reset start */
  removeBody();
  uiState = uiStates.INSTRUCTIONS;
  document.body.style.backgroundColor = "white";
  document.body.appendChild(instructions);
}

function showTrial() {
  /* Reset state */
  removeBody();
  uiState = uiStates.TRIAL;
  document.body.style.backgroundColor = "gray";
  document.body.appendChild(trial);

  /* Launch the test */
  ran = Math.random() >= 0.5;
  activeAperture = [ran, !ran];
  correctKey = ran ? LEFT_KEY : RIGHT_KEY;
  timer.resume();
  trialStart = new Date().getTime();
}

function showITI() {
  /* Reset state */
  removeBody();
  activeAperture = [false, false];
  uiState = uiStates.ITI;
  document.body.style.backgroundColor = "gray";
  document.body.appendChild(updateITI(iti));

  /* Launch the next trial when needed */
  setTimeout(showTrial, ITI_DURATION_MS);
}

function showResults() {
  /* Reset state, stop drawing */
  removeBody();
  activeAperture = [false, false];
  uiState = uiStates.RESULTS;
  document.body.style.backgroundColor = "gray";
  document.body.appendChild(updateResults(updateITI(results)));

  /* Generate and export the CSV */
  csvLogs.unshift(CSV_HEADER);
  exportCSV(csvLogs, CSV_FILENAME);
}

/*** MISC *********************************************************************/

function logGuess(correct) {
  /* Determine the trial time */
  var trialEnd = new Date().getTime();
  var reaction = trialEnd - trialStart;
  trialStart = trialEnd;

  /* Generate a record for the guess */
  var guess = []
  guess.push(TRIAL_COUNT+1);
  guess.push(correctKey == LEFT_KEY ? "left" : "right");
  guess.push(correct);
  guess.push(reaction);
  guess.push(score);
  guess.push(GOAL[GOAL_RANDOM]);
  guess.push(GOAL[GOAL_RANDOM]-(score));
  guess.push(TIME_LIMIT_MS[TIME_RANDOM]);
  guess.push(DOT_COHERENCE);
  return guess;
}

/*
 * Key press listener
 * Capture key presses for the instructions and canvas UIs
 * Includes logic to avoid held down
 */
stopPress = false;
function keyUp(event) {
  stopPress = false;
}
function keyPress(event) {
  if (stopPress) {
    return;
  }
  stopPress = true;
  if (uiState == uiStates.INSTRUCTIONS) {
    showTrial(); 
  } else if (uiState == uiStates.TRIAL) {
    if (event.keyCode == LEFT_KEY || event.keyCode == RIGHT_KEY) {
      timer.pause();

      /* Update score state and play sound */
      var correct = event.keyCode == correctKey;
      csvLogs.push(logGuess(correct));
      if (correct) {
        score++;
        SUCCESS_SOUND.play();
      } else {
        score--;
        FAIL_SOUND.play();
      }

      showITI();
    }
  } else if (uiState == uiStates.RESULTS) {
    /* Restart the trials */
    if (event.keyCode == 82) {
      if (TRIAL_COUNT < TIME_LENGTH-1) {
            TRIAL_COUNT++;
            TIME_INDEX = TIME_LIMIT_MS.indexOf(TIME_LIMIT_MS[TIME_RANDOM]);
        if (TIME_INDEX > -1) {
              TIME_LIMIT_MS.splice(TIME_INDEX, 1);
          }
      GOAL_INDEX = GOAL.indexOf(GOAL[GOAL_RANDOM]);
      if (GOAL_INDEX > -1) {
        GOAL.splice(GOAL_INDEX, 1);
      }
      TIME_RANDOM = Math.floor((Math.random() * (TIME_LENGTH-TRIAL_COUNT)));
      GOAL_RANDOM = Math.floor((Math.random() * (GOAL_LENGTH-TRIAL_COUNT)));
      console.log(TIME_LIMIT_MS, GOAL);
      drawInstructions();
      main();
    }
    else {
      window.alert("You have now finished the experiment and can safely close the window.")
    }
  }
  }
}

/*
 * Main body of the script
 * Sets up initial state and registers events
 */
function main() {
  /* UI state */
  csvLogs = []
  score = 0;
  correctKey = null;
  timer = new clock(TIME_LIMIT_MS[TIME_RANDOM], showResults);

  /* Setup state for instructions */
  showInstructions();
}

/*
 * A short explination of the approach used here:
 *
 * To control the amount of GC overhead, the JS uses a constant number of
 * DOM nodes and simply changes what hangs under the body based on what
 * is to be show.
 *
 * drawSCREEN functions generate the initial DOM trees for each screen.
 *
 * showSCREEN clears the DOM tree under the body and then attaches the
 * corresponding screen.
 *
 * Rather than relaunching the runTest for every new configuration, all
 * configurations exist as different apertures to begin with. The runTest
 * function has been extended with an array, activeAperture, to control
 * which apertures are currently being displayed. As a result, the desired
 * direction can be selected by configuring this array and all drawing can
 * be disabled.
 *
 * Its necessary to disable all drawing if the canvas is not attached to
 * the document. A delay will be experienced when it is finally attached
 * if this is not done, as the draws are post-poned.
 *
 * As a result of these changes, GC is no longer an issue for long running
 * instances of the application. Additionally, the overhead of running n
 * iterations of the trial is avoided, replaced with a constant 2.
 */

/* Global variable for active aperture selection */
activeAperture = null;

/* UI trees */
instructions = drawInstructions();
trial = drawTrial();
iti = drawITI();
results = drawResults();

/* Start the trials */
document.addEventListener('keydown', keyPress);
document.addEventListener('keyup', keyUp);
main();

/*** EXTERNAL CODE ************************************************************/

function runTest(canvas) {
  var nApertures = 2; //The number of apertures
  var nDots = 200; //Number of dots per set (equivalent to number of dots per frame)
  var nSets = 1; //Number of sets to cycle through per frame
  var coherentDirection = [direction.LEFT, direction.RIGHT]; //The direction of the coherentDots in degrees. Starts at 3 o'clock and goes counterclockwise (0 == rightwards, 90 == upwards, 180 == leftwards, 270 == downwards), range 0 - 360
  var coherence = DOT_COHERENCE; //Proportion of dots to move together, range from 0 to 1
  var oppositeCoherence = 0; // The coherence for the dots going the opposite direction as the coherent dots
  var dotRadius = 2; //Radius of each dot in pixels
  var dotLife = 20;//How many frames a dot will keep following its trajectory before it is redrawn at a random location. -1 denotes infinite life (the dot will only be redrawn if it reaches the end of the aperture).
  var moveDistance = 3; //How many pixels the dots move per frame
  var apertureWidth = 1000; // How many pixels wide the aperture is. For square aperture this will be the both height and width. For circle, this will be the diameter.
  var apertureHeight = 500; //How many pixels high the aperture is. Only relevant for ellipse and rectangle apertures. For circle and square, this is ignored.
  var dotColor = "white"; //Color of the dots
  var backgroundColor = "gray"; //Color of the background
  var apertureCenterX = window.innerWidth/2; // The x-coordinate of center of the aperture on the screen, in pixels
  var apertureCenterY = window.innerHeight/2; // The y-coordinate of center of the aperture on the screen, in pixels

  /* Global flag to pick which apertures are active */
  activeAperture = [false, false];
  var drawnAperture = [false, false];

  /* RDK type parameter
   ** See Fig. 1 in Scase, Braddick, and Raymond (1996) for a visual depiction of these different signal selection rules and noise types

        -------------------
        SUMMARY:

        Signal Selection rule:
        -Same: Each dot is designated to be either a coherent dot (signal) or incoherent dot (noise) and will remain so throughout all frames in the display. Coherent dots will always move in the direction of coherent motion in all frames.
        -Different: Each dot can be either a coherent dot (signal) or incoherent dot (noise) and will be designated randomly (weighted based on the coherence level) at each frame. Only the dots that are designated to be coherent dots will move in the direction of coherent motion, but only in that frame. In the next frame, each dot will be designated randomly again on whether it is a coherent or incoherent dot.

        Noise Type:
        -Random position: The incoherent dots are in a random location in the aperture in each frame
        -Random walk: The incoherent dots will move in a random direction (designated randomly in each frame) in each frame.
        -Random direction: Each incoherent dot has its own alternative direction of motion (designated randomly at the beginning of the trial), and moves in that direction in each frame.

        -------------------

        1 - same && random position
        2 - same && random walk
        3 - same && random direction
        4 - different && random position
        5 - different && random walk
        6 - different && random direction         */
  var RDK = 3;

  var apertureType = apertureShape.ELLIPSE;

  /*
        Out of Bounds Decision
        How we reinsert a dot that has moved outside the edges of the aperture:
        1 - Randomly appear anywhere in the aperture
        2 - Randomly appear on the opposite edge of the aperture
        */
  var reinsertType = 2;

  //Fixation Cross Parameters
  var fixationCross = false; //To display or not to display the cross
  var fixationCrossWidth = 20; //The width of the fixation cross in pixels
  var fixationCrossHeight = 20; //The height of the fixation cross in pixels
  var fixationCrossColor = "black"; //The color of the fixation cross
  var fixationCrossThickness = 1; //The thickness of the fixation cross, must be positive number above 1


  //Border Parameters
  var border = false; //To display or not to display the border
  var borderWidth = 1; //The width of the border in pixels
  var borderColor = "black"; //The color of the border


  //--------------------------------------
  //----------SET PARAMETERS END----------
  //--------------------------------------

  //------Set up canvas begin---------

  //Initialize the canvas variable so that it can be used in code below.
  //var canvas = document.getElementById(CANVAS_ID);
  var ctx = canvas.getContext("2d");

  //Declare variables for width and height, and also set the canvas width and height to the window width and height
  var width = canvas.width = window.innerWidth;
  var height = canvas.height = window.innerHeight;

  //Set the canvas background color
  canvas.style.backgroundColor = backgroundColor;

  //------Set up canvas end---------

  //--------RDK variables and function calls begin--------

  // [This is the main part of RDK that makes everything run]

  //Global variable for the current aperture number
  var currentApertureNumber;

  //3D Array to hold the dots (1st D is Apertures, 2nd D is Sets, 3rd D is Dots)
  var dotArray3d = [];

  //Variables for different apertures (initialized in setUpMultipleApertures function below)
  var nDotsArray;
  var nSetsArray;
  var coherentDirectionArray;
  var coherenceArray;
  var oppositeCoherenceArray;
  var dotRadiusArray;
  var dotLifeArray;
  var moveDistanceArray;
  var apertureWidthArray;
  var apertureHeightArray;
  var dotColorArray;
  var apertureCenterXArray;
  var apertureCenterYArray;

  // Set up multiple apertures
  setUpMultipleApertures();

  //Declare aperture parameters for initialization based on shape (used in initializeApertureDimensions function below)
  var horizontalAxis;
  var verticalAxis;

  //Calculate the x and y jump sizes for coherent dots
  var coherentJumpSizeX;
  var coherentJumpSizeY;

  //Calculate the number of coherent, opposite coherent, and incoherent dots
  var nCoherentDots;
  var nOppositeCoherentDots;
  var nIncoherentDots;

  //Make the array of arrays containing dot objects
  var dotArray2d;

  var dotArray; //Declare a global variable to hold the current array
  var currentSetArray; //Declare and initialize a global variable to cycle through the dot arrays

  //Initialize stopping condition for animateDotMotion function that runs in a loop
  stopDotMotion = false;
  if (stopDotMotion) {
    window.cancelAnimationFrame(frameRequestID); //Cancels the frame request
  }

  //This runs the dot motion simulation, updating it according to the frame refresh rate of the screen.
  animateDotMotion();

  //--------RDK variables and function calls end--------


  //---------------------------------------
  //-----------FUNCTIONS BEGIN-------------
  //---------------------------------------

  //Set up the variables for the apertures
  function setUpMultipleApertures(){
    nDotsArray = setParameter(nDots);
    nSetsArray = setParameter(nSets);
    coherentDirectionArray = setParameter(coherentDirection);
    coherenceArray = setParameter(coherence);
    oppositeCoherenceArray = setParameter(oppositeCoherence);
    dotRadiusArray = setParameter(dotRadius);
    dotLifeArray = setParameter(dotLife);
    moveDistanceArray = setParameter(moveDistance);
    apertureWidthArray = setParameter(apertureWidth);
    apertureHeightArray = setParameter(apertureHeight);
    dotColorArray = setParameter(dotColor);
    apertureCenterXArray = setParameter(apertureCenterX);
    apertureCenterYArray = setParameter(apertureCenterY);
    RDKArray = setParameter(RDK);
    apertureTypeArray = setParameter(apertureType);
    reinsertTypeArray = setParameter(reinsertType);
    fixationCrossArray = setParameter(fixationCross);
    fixationCrossWidthArray = setParameter(fixationCrossWidth);
    fixationCrossHeightArray = setParameter(fixationCrossHeight);
    fixationCrossColorArray = setParameter(fixationCrossColor);
    fixationCrossThicknessArray = setParameter(fixationCrossThickness);
    borderArray = setParameter(border);
    borderWidthArray = setParameter(borderWidth);
    borderColorArray = setParameter(borderColor);

    currentSetArray = setParameter(0); //Always starts at zero


    //Loop through the number of apertures to make the dots
    for(currentApertureNumber = 0; currentApertureNumber < nApertures; currentApertureNumber++){

      //Initialize the parameters to make the 2d dot array (one for each aperture);
      initializeCurrentApertureParameters();

      //Make each 2d array and push it into the 3d array
      dotArray3d.push(makeDotArray2d());
    }
  }

  //Function to set the parameters of the array
  function setParameter(originalVariable){
    //Check if it is an array and its length matches the aperture then return the original array
    if(originalVariable.constructor === Array && originalVariable.length === nApertures){
      return originalVariable;
    }
    //Else if it is not an array, we make it an array with duplicate values
    else if(originalVariable.constructor !== Array){

      var tempArray = [];

      //Make a for loop and duplicate the values
      for(var i = 0; i < nApertures; i++){
        tempArray.push(originalVariable);
      }
      return tempArray;
    }
    //Else if the array is not long enough, then print out that error message
    else if(originalVariable.constructor === Array && originalVariable.length !== nApertures){
      console.error("If you have more than one aperture, please ensure that arrays that are passed in as parameters are the same length as the number of apertures. Else you can use a single value without the array.");
    }
    //Else print a generic error
    else{
      console.error("A parameter is incorrectly set. Please ensure that the nApertures parameter is set to the correct value (if using more than one aperture), and all others parameters are set correctly.");
    }
  }

  //Function to set the global variables to the current aperture so that the correct dots are updated and drawn
  function initializeCurrentApertureParameters(){

    //Set the global variables to that relevant to the current aperture
    nDots = nDotsArray[currentApertureNumber];
    nSets = nSetsArray[currentApertureNumber];
    coherentDirection = coherentDirectionArray[currentApertureNumber];
    coherence = coherenceArray[currentApertureNumber];
    oppositeCoherence = oppositeCoherenceArray[currentApertureNumber];
    dotRadius = dotRadiusArray[currentApertureNumber];
    dotLife = dotLifeArray[currentApertureNumber];
    moveDistance = moveDistanceArray[currentApertureNumber];
    apertureWidth = apertureWidthArray[currentApertureNumber];
    apertureHeight = apertureHeightArray[currentApertureNumber];
    dotColor = dotColorArray[currentApertureNumber];
    apertureCenterX = apertureCenterXArray[currentApertureNumber];
    apertureCenterY = apertureCenterYArray[currentApertureNumber];
    RDK = RDKArray[currentApertureNumber];
    apertureType = apertureTypeArray[currentApertureNumber];
    reinsertType = reinsertTypeArray[currentApertureNumber];
    fixationCross = fixationCrossArray[currentApertureNumber];
    fixationCrossWidth = fixationCrossWidthArray[currentApertureNumber];
    fixationCrossHeight = fixationCrossHeightArray[currentApertureNumber];
    fixationCrossColor = fixationCrossColorArray[currentApertureNumber];
    fixationCrossThickness = fixationCrossThicknessArray[currentApertureNumber];
    border = borderArray[currentApertureNumber];
    borderWidth = borderWidthArray[currentApertureNumber];
    borderColor = borderColorArray[currentApertureNumber];

    //Calculate the x and y jump sizes for coherent dots
    coherentJumpSizeX = calculateCoherentJumpSizeX(coherentDirection);
    coherentJumpSizeY = calculateCoherentJumpSizeY(coherentDirection);

    //Initialize the aperture parameters
    initializeApertureDimensions();

    //Calculate the number of coherent, opposite coherent, and incoherent dots
    nCoherentDots = nDots * coherence;
    nOppositeCoherentDots = nDots * oppositeCoherence;
    nIncoherentDots = nDots - (nCoherentDots + nOppositeCoherentDots);

    //If the 3d array has been made, then choose the 2d array and the current set
    dotArray2d = dotArray3d.length !==0 ? dotArray3d[currentApertureNumber] : undefined;


  }// End of initializeCurrentApertureParameters

  //Calculate coherent jump size in the x direction
  function calculateCoherentJumpSizeX(coherentDirection) {
    var angleInRadians = coherentDirection * Math.PI / 180;
    return moveDistance * Math.cos(angleInRadians);
  }

  //Calculate coherent jump size in the y direction
  function calculateCoherentJumpSizeY(coherentDirection) {
    var angleInRadians = -coherentDirection * Math.PI / 180; //Negative sign because the y-axis is flipped on screen
    return moveDistance * Math.sin(angleInRadians);
  }

  //Initialize the parameters for the aperture for further calculation
  function initializeApertureDimensions() {
    if (apertureType == apertureShape.CIRCLE || apertureType == apertureShape.SQUARE) {
      horizontalAxis = verticalAxis = apertureWidth / 2;
    } else if (apertureType == apertureShape.ELLIPSE || apertureType == apertureShape.RECTANGLE) {
      horizontalAxis = apertureWidth / 2;
      verticalAxis = apertureHeight / 2;
    }
  }

  //Make the 2d array, which is an array of array of dots
  function makeDotArray2d() {
    //Declare an array to hold the sets of dot arrays
    var tempArray = []
    //Loop for each set of dot array
    for (var i = 0; i < nSets; i++) {
      tempArray.push(makeDotArray()); //Make a dot array and push it into the 2d array
    }

    return tempArray;
  }

  //Make the dot array
  function makeDotArray() {
    var tempArray = []
    for (var i = 0; i < nDots; i++) {
      //Initialize a dot to be modified and inserted into the array
      var dot = {
        x: 0, //x coordinate
        y: 0, //y coordinate
        vx: 0, //coherent x jumpsize (if any)
        vy: 0, //coherent y jumpsize (if any)
        vx2: 0, //incoherent (random) x jumpsize (if any)
        vy2: 0, //incoherent (random) y jumpsize (if any)
        latestXMove: 0, //Stores the latest x move direction for the dot (to be used in reinsertOnOppositeEdge function below)
        latestYMove: 0, //Stores the latest y move direction for the dot (to be used in reinsertOnOppositeEdge function below)
        lifeCount: Math.floor(randomNumberBetween(0, dotLife)), //Counter for the dot's life. Updates every time it is shown in a frame
        updateType: "" //String to determine how this dot is updated
      }
      //randomly set the x and y coordinates
      dot = resetLocation(dot);

      //For the same && random position RDK type
      if (RDK == 1) {
        //For coherent dots
        if (i < nCoherentDots) {
          dot = setvxvy(dot); // Set dot.vx and dot.vy
          dot.updateType = "constant direction";
        }
        //For opposite coherent dots
        else if(i >= nCoherentDots && i < (nCoherentDots + nOppositeCoherentDots)){
          dot = setvxvy(dot); // Set dot.vx and dot.vy
          dot.updateType = "opposite direction";
        }
        //For incoherent dots
        else {
          dot.updateType = "random position";
        }
      } //End of RDK==1

      //For the same && random walk RDK type
      if (RDK == 2) {
        //For coherent dots
        if (i < nCoherentDots) {
          dot = setvxvy(dot); // Set dot.vx and dot.vy
          dot.updateType = "constant direction";
        }
        //For opposite coherent dots
        else if(i >= nCoherentDots && i < (nCoherentDots + nOppositeCoherentDots)){
          dot = setvxvy(dot); // Set dot.vx and dot.vy
          dot.updateType = "opposite direction";
        }
        //For incoherent dots
        else {
          dot.updateType = "random walk";
        }
      } //End of RDK==2

      //For the same && random direction RDK type
      if (RDK == 3) {
        //For coherent dots
        if (i < nCoherentDots) {
          dot = setvxvy(dot); // Set dot.vx and dot.vy
          dot.updateType = "constant direction";
        }
        //For opposite coherent dots
        else if(i >= nCoherentDots && i < (nCoherentDots + nOppositeCoherentDots)){
          dot = setvxvy(dot); // Set dot.vx and dot.vy
          dot.updateType = "opposite direction";
        }
        //For incoherent dots
        else {
          setvx2vy2(dot); // Set dot.vx2 and dot.vy2
          dot.updateType = "random direction";
        }
      } //End of RDK==3

      //For the different && random position RDK type
      if (RDK == 4) {
        //For all dots
        dot = setvxvy(dot); // Set dot.vx and dot.vy
        dot.updateType = "constant direction or opposite direction or random position";
      } //End of RDK==4

      //For the different && random walk RDK type
      if (RDK == 5) {
        //For all dots
        dot = setvxvy(dot); // Set dot.vx and dot.vy
        dot.updateType = "constant direction or opposite direction or random walk";
      } //End of RDK==5

      //For the different && random direction RDK type
      if (RDK == 6) {
        //For all dots
        dot = setvxvy(dot); // Set dot.vx and dot.vy
        //Each dot will have its own alternate direction of motion
        setvx2vy2(dot); // Set dot.vx2 and dot.vy2
        dot.updateType = "constant direction or opposite direction or random direction";
      } //End of RDK==6

      tempArray.push(dot);
    } //End of for loop
    return tempArray;
  }

  //Function to update all the dots all the apertures and then draw them
  function updateAndDraw(){
    // Go through the array, update the dots, and draw them on the canvas
    for(currentApertureNumber = 0; currentApertureNumber < nApertures; currentApertureNumber++){
      if (!activeAperture[currentApertureNumber] && drawnAperture[currentApertureNumber]) {
        initializeCurrentApertureParameters(currentApertureNumber);
        clearDots();
        drawnAperture[currentApertureNumber] = false;
      }
    }

    for(currentApertureNumber = 0; currentApertureNumber < nApertures; currentApertureNumber++){
      if (activeAperture[currentApertureNumber]) {
        //Initialize the variables for each parameter
        initializeCurrentApertureParameters(currentApertureNumber);

        //Clear the canvas by drawing over the current dots
        clearDots();

        //Update the dots
        updateDots();

        //Draw on the canvas
        draw();

        drawnAperture[currentApertureNumber] = true;
      }
    }
  }

  //Function that clears the dots on the canvas by drawing over it with the color of the baclground
  function clearDots(){

    //Load in the current set of dot array for easy handling
    dotArray = dotArray2d[currentSetArray[currentApertureNumber]]; //Global variable, so the updateDots and draw functions also uses this array

    //Loop through the dots one by one and draw them
    for (var i = 0; i < nDots; i++) {
      dot = dotArray[i];
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dotRadius+1, 0, Math.PI * 2);
      ctx.fillStyle = backgroundColor;
      ctx.fill();
    }
  }

  //Draw the dots on the canvas after they're updated
  function draw() {
    //Loop through the dots one by one and draw them
    for (var i = 0; i < nDots; i++) {
      dot = dotArray[i];
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = dotColor;
      ctx.fill();
    }

    //Draw the fixation cross if we want it
    if(fixationCross === true){

      //Horizontal line
      ctx.beginPath();
      ctx.lineWidth = fixationCrossThickness;
      ctx.strokeStyle = fixationCrossColor;
      ctx.moveTo(width/2 - fixationCrossWidth, height/2);
      ctx.lineTo(width/2 + fixationCrossWidth, height/2);
      ctx.stroke();

      //Vertical line
      ctx.beginPath();
      ctx.lineWidth = fixationCrossThickness;
      ctx.strokeStyle = fixationCrossColor;
      ctx.moveTo(width/2, height/2 - fixationCrossHeight);
      ctx.lineTo(width/2, height/2 + fixationCrossHeight);
      ctx.stroke();
    }

    //Draw the border if we want it
    if(border === true){

      //For circle and ellipse
      if(apertureType === apertureShape.CIRCLE || apertureType === 2){
        ctx.lineWidth = borderWidth;
        ctx.strokeStyle = borderColor;
        ctx.beginPath();
        ctx.ellipse(apertureCenterX, apertureCenterY, horizontalAxis+(borderWidth/2), verticalAxis+(borderWidth/2), 0, 0, Math.PI*2);
        ctx.stroke();
      }//End of if circle or ellipse

      //For square and rectangle
      if(apertureType === 3 || apertureType === 4){
        ctx.lineWidth = borderWidth;
        ctx.strokeStyle = borderColor;
        ctx.strokeRect(apertureCenterX-horizontalAxis-(borderWidth/2), apertureCenterY-verticalAxis-(borderWidth/2), (horizontalAxis*2)+borderWidth, (verticalAxis*2)+borderWidth);
      }//End of if square or rectangle

    }//End of if border === true

  }//End of draw

  //Update the dots with their new location
  function updateDots() {

    //Cycle through to the next set of dots
    if (currentSetArray[currentApertureNumber] == nSets - 1) {
      currentSetArray[currentApertureNumber] = 0;
    } else {
      currentSetArray[currentApertureNumber] = currentSetArray[currentApertureNumber] + 1;
    }

    //Loop through the dots one by one and update them accordingly
    for (var i = 0; i < nDots; i++) {
      var dot = dotArray[i]; //Load the current dot into the variable for easy handling

      //Generate a random value
      var randomValue = Math.random();

      //Update based on the dot's update type
      if (dot.updateType == "constant direction") {
        dot = constantDirectionUpdate(dot);
      } else if (dot.updateType == "opposite direction") {
        dot = oppositeDirectionUpdate(dot);
      } else if (dot.updateType == "random position") {
        dot = resetLocation(dot);
      } else if (dot.updateType == "random walk") {
        dot = randomWalkUpdate(dot);
      } else if (dot.updateType == "random direction") {
        dot = randomDirectionUpdate(dot);
      } else if (dot.updateType == "constant direction or opposite direction or random position") {
        //Randomly select if the dot goes in a constant direction or random position, weighted based on the coherence level
        if (randomValue < coherence) {
          dot = constantDirectionUpdate(dot);
        } else if(randomValue >= coherence && randomValue < (coherence + oppositeCoherence)){
          dot = oppositeDirectionUpdate(dot);
        } else {
          dot = resetLocation(dot);
        }
      } else if (dot.updateType == "constant direction or opposite direction or random walk") {
        //Randomly select if the dot goes in a constant direction or random walk, weighted based on the coherence level
        if (randomValue < coherence) {
          dot = constantDirectionUpdate(dot);
        } else if(randomValue >= coherence && randomValue < (coherence + oppositeCoherence)){
          dot = oppositeDirectionUpdate(dot);
        } else {
          dot = randomWalkUpdate(dot);
        }
      } else if (dot.updateType == "constant direction or opposite direction or random direction") {
        //Randomly select if the dot goes in a constant direction or random direction, weighted based on the coherence level
        if (randomValue < coherence) {
          dot = constantDirectionUpdate(dot);
        } else if(randomValue >= coherence && randomValue < (coherence + oppositeCoherence)){
          dot = oppositeDirectionUpdate(dot);
        } else {
          dot = randomDirectionUpdate(dot);
        }
      }//End of if dotUpdate == ...

      //Increment the life count
      dot.lifeCount++;

      //Check if out of bounds or if life ended
      if (lifeEnded(dot)) {
        dot = resetLocation(dot);
      }

      //If it goes out of bounds, do what is necessary (reinsert randomly or reinsert on the opposite edge) based on the parameter chosen
      if (outOfBounds(dot)) {
        switch (reinsertType) {
          case 1:
            dot = resetLocation(dot);
            break;
          case 2:
            dot = reinsertOnOppositeEdge(dot);
            break;
        } //End of switch statement
      } //End of if

    } //End of for loop
  } //End of updateDots function


  //Function to check if dot life has ended
  function lifeEnded(dot) {
    //If we want infinite dot life
    if (dotLife < 0) {
      dot.lifeCount = 0; //resetting to zero to save memory. Otherwise it might increment to huge numbers.
      return false;
    }
    //Else if the dot's life has reached its end
    else if (dot.lifeCount >= dotLife) {
      dot.lifeCount = 0;
      return true;
    }
    //Else the dot's life has not reached its end
    else {
      return false;
    }
  }

  //Function to check if dot is out of bounds
  function outOfBounds(dot) {
    //For circle and ellipse
    if (apertureType == apertureShape.CIRCLE || apertureType == apertureShape.ELLIPSE) {
      if (dot.x < xValueNegative(dot.y) || dot.x > xValuePositive(dot.y) || dot.y < yValueNegative(dot.x) || dot.y > yValuePositive(dot.x)) {
        return true;
      } else {
        return false;
      }
    }
    //For square and rectangle
    if (apertureType == apertureShape.SQUARE || apertureType == apertureShape.RECTANGLE) {
      if (dot.x < (apertureCenterX) - horizontalAxis || dot.x > (apertureCenterX) + horizontalAxis || dot.y < (apertureCenterY) - verticalAxis || dot.y > (apertureCenterY) + verticalAxis) {
        return true;
      } else {
        return false;
      }
    }

  }//End of outOfBounds

  //Set the vx and vy for the dot to the coherent jump sizes of the X and Y directions
  function setvxvy(dot) {
    dot.vx = coherentJumpSizeX;
    dot.vy = coherentJumpSizeY;
    return dot;
  }

  //Set the vx2 and vy2 based on a random angle
  function setvx2vy2(dot) {
    //Generate a random angle of movement
    var theta = randomNumberBetween(-Math.PI, Math.PI);
    //Update properties vx2 and vy2 with the alternate directions
    dot.vx2 = Math.cos(theta) * moveDistance;
    dot.vy2 = -Math.sin(theta) * moveDistance;
    return dot;
  }

  //Updates the x and y coordinates by moving it in the x and y coherent directions
  function constantDirectionUpdate(dot) {
    dot.x += dot.vx;
    dot.y += dot.vy;
    dot.latestXMove = dot.vx;
    dot.latestYMove = dot.vy;
    return dot;
  }

  //Updates the x and y coordinates by moving it in the opposite x and y coherent directions
  function oppositeDirectionUpdate(dot) {
    dot.x -= dot.vx;
    dot.y -= dot.vy;
    dot.latestXMove = -dot.vx;
    dot.latestYMove = -dot.vy;
    return dot;
  }

  //Creates a new angle to move towards and updates the x and y coordinates
  function randomWalkUpdate(dot) {
    //Generate a random angle of movement
    var theta = randomNumberBetween(-Math.PI, Math.PI);
    //Generate the movement from the angle
    dot.latestXMove = Math.cos(theta) * moveDistance;
    dot.latestYMove = -Math.sin(theta) * moveDistance;
    //Update x and y coordinates with the new location
    dot.x += dot.latestXMove;
    dot.y += dot.latestYMove;
    return dot;
  }

  //Updates the x and y coordinates with the alternative move direction
  function randomDirectionUpdate(dot) {
    dot.x += dot.vx2;
    dot.y += dot.vy2;
    dot.latestXMove = dot.vx2;
    dot.latestYMove = dot.vy2;
    return dot;
  }

  //Calculates a random position on the opposite edge to reinsert the dot
  function reinsertOnOppositeEdge(dot) {
    //If it is a circle or ellipse
    if (apertureType == apertureShape.CIRCLE || apertureType == apertureShape.ELLIPSE) {
      //Bring the dot back into the aperture by moving back one step
      dot.x -= dot.latestXMove;
      dot.y -= dot.latestYMove;

      //Move the dot to the position relative to the origin to be reflected about the origin
      dot.x -= apertureCenterX;
      dot.y -= apertureCenterY;

      //Reflect the dot about the origin
      dot.x = -dot.x;
      dot.y = -dot.y;

      //Move the dot back to the center of the screen
      dot.x += apertureCenterX;
      dot.y += apertureCenterY;

    } //End of if apertureType == 1 | == 2

    //If it is a square or rectangle, re-insert on one of the opposite edges
    if (apertureType == apertureShape.SQUARE || apertureType == apertureShape.RECTANGLE) {

      /* The formula for calculating whether a dot appears from the vertical edge (left or right edges) is dependent on the direction of the dot and the ratio of the vertical and horizontal edge lengths.
                                        E.g.
                                        Aperture is 100 px high and 200px wide
                                        Dot is moving 3 px in x direction and 4px in y direction
                                        Weight on vertical edge (sides)           = (100/(100+200)) * (|3| / (|3| + |4|)) = 1/7
                                        Weight on horizontal edge (top or bottom) = (200/(100+200)) * (|4| / (|3| + |4|)) = 8/21

                                        The weights above are the ratios to one another.
                                        E.g. (cont.)
                                        Ratio (vertical edge : horizontal edge) == (1/7 : 8/21)
                                        Total probability space = 1/7 + 8/21 = 11/21
                                        Probability that dot appears on vertical edge   = (1/7)/(11/21) = 3/11
                                        Probability that dot appears on horizontal edge = (8/21)/(11/21) = 8/11
                                        */

      //Get the absolute values of the latest X and Y moves and store them in variables for easy handling.
      var absX = Math.abs(dot.latestXMove);
      var absY = Math.abs(dot.latestYMove);
      //Calculate the direction weights based on direction the dot was moving
      var weightInXDirection = absX / (absX + absY);
      var weightInYDirection = absY / (absX + absY);
      //Calculate the weight of the edge the dot should appear from, based on direction of dot and ratio of the aperture edges
      var weightOnVerticalEdge = (verticalAxis / (verticalAxis + horizontalAxis)) * weightInXDirection;
      var weightOnHorizontalEdge = (horizontalAxis / (verticalAxis + horizontalAxis)) * weightInYDirection;


      //Generate a bounded random number to determine if the dot should appear on the vertical edge or the horizontal edge
      if (weightOnVerticalEdge > (weightOnHorizontalEdge + weightOnVerticalEdge) * Math.random()) { //If yes, appear on the left or right edge (vertical edge)
        if (dot.latestXMove < 0) { //If dots move left, appear on right edge
          dot.x = apertureCenterX + horizontalAxis;
          dot.y = randomNumberBetween((apertureCenterY) - verticalAxis, (apertureCenterY) + verticalAxis);
        } else { //Else dots move right, so they should appear on the left edge
          dot.x = apertureCenterX - horizontalAxis;
          dot.y = randomNumberBetween((apertureCenterY) - verticalAxis, (apertureCenterY) + verticalAxis);
        }
      } else { //Else appear on the top or bottom edge (horizontal edge)
        if (dot.latestYMove < 0) { //If dots move upwards, then appear on bottom edge
          dot.y = apertureCenterY + verticalAxis;
          dot.x = randomNumberBetween((apertureCenterX) - horizontalAxis, (apertureCenterX) + horizontalAxis)
        } else { //If dots move downwards, then appear on top edge
          dot.y = apertureCenterY - verticalAxis;
          dot.x = randomNumberBetween((apertureCenterX) - horizontalAxis, (apertureCenterX) + horizontalAxis)
        }
      }
    } //End of apertureType == apertureShape.SQUARE
    return dot;
  } //End of reinsertOnOppositeEdge

  //Calculate the POSITIVE y value of a point on the edge of the ellipse given an x-value
  function yValuePositive(x) {
    var x = x - (apertureCenterX); //Bring it back to the (0,0) center to calculate accurately (ignore the y-coordinate because it is not necessary for calculation)
    return verticalAxis * Math.sqrt(1 - (Math.pow(x, 2) / Math.pow(horizontalAxis, 2))) + apertureCenterY; //Calculated the positive y value and added height/2 to recenter it on the screen
  }

  //Calculate the NEGATIVE y value of a point on the edge of the ellipse given an x-value
  function yValueNegative(x) {
    var x = x - (apertureCenterX); //Bring it back to the (0,0) center to calculate accurately (ignore the y-coordinate because it is not necessary for calculation)
    return -verticalAxis * Math.sqrt(1 - (Math.pow(x, 2) / Math.pow(horizontalAxis, 2))) + apertureCenterY; //Calculated the negative y value and added height/2 to recenter it on the screen
  }

  //Calculate the POSITIVE x value of a point on the edge of the ellipse given a y-value
  function xValuePositive(y) {
    var y = y - (apertureCenterY); //Bring it back to the (0,0) center to calculate accurately (ignore the x-coordinate because it is not necessary for calculation)
    return horizontalAxis * Math.sqrt(1 - (Math.pow(y, 2) / Math.pow(verticalAxis, 2))) + apertureCenterX; //Calculated the positive x value and added width/2 to recenter it on the screen
  }

  //Calculate the NEGATIVE x value of a point on the edge of the ellipse given a y-value
  function xValueNegative(y) {
    var y = y - (apertureCenterY); //Bring it back to the (0,0) center to calculate accurately (ignore the x-coordinate because it is not necessary for calculation)
    return -horizontalAxis * Math.sqrt(1 - (Math.pow(y, 2) / Math.pow(verticalAxis, 2))) + apertureCenterX; //Calculated the negative x value and added width/2 to recenter it on the screen
  }

  //Calculate a random x and y coordinate in the ellipse
  function resetLocation(dot) {
    if (apertureType == apertureShape.CIRCLE || apertureType == apertureShape.ELLIPSE) {
      var phi = randomNumberBetween(-Math.PI, Math.PI);
      var rho = Math.random();

      x = Math.sqrt(rho) * Math.cos(phi);
      y = Math.sqrt(rho) * Math.sin(phi);

      x = x * horizontalAxis + apertureCenterX;
      y = y * verticalAxis + apertureCenterY;

      dot.x = x;
      dot.y = y;
    } else if (apertureType == apertureShape.SQUARE || apertureType == apertureShape.RECTANGLE) {
      dot.x = randomNumberBetween((apertureCenterX) - horizontalAxis, (apertureCenterX) + horizontalAxis); //Between the left and right edges of the square / rectangle
      dot.y = randomNumberBetween((apertureCenterY) - verticalAxis, (apertureCenterY) + verticalAxis); //Between the top and bottom edges of the square / rectangle
    }
    return dot;
  }

  //Generates a random number (with decimals) between 2 values
  function randomNumberBetween(lowerBound, upperBound) {
    return lowerBound + Math.random() * (upperBound - lowerBound);
  }

  //Function to make the dots move on the canvas
  function animateDotMotion() {
    //frameRequestID saves a long integer that is the ID of this frame request. The ID is then used to terminate the request below.
    frameRequestID = window.requestAnimationFrame(animate);
    function animate() {
      //If stopping condition has been reached, then stop the animation
      if (stopDotMotion) {
        window.cancelAnimationFrame(frameRequestID); //Cancels the frame request
        clearDots();
      }
      //Else continue with another frame request
      else {
        updateAndDraw(); //Update and draw each of the dots in their respective apertures
        frameRequestID = window.requestAnimationFrame(animate); //Calls for another frame request
      }
    }
  }
}

