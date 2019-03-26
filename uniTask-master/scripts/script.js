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
  INTRODUCTION: "INTRODUCTION",
  SURVEY: "SURVEY",
  INSTRUCTIONS: "INSTRUCTIONS",
  TRIAL: "TRIAL",
  ITI:  "ITI",
  RESULTS: "RESULTS",
  DEBRIEF: "DEBRIEF",
}

var uniqueCode = null;

/* ITI Configuration */
var CONFIGS = []
/* Duration in MS, Goal, dot coherence, Show Timer, Show Opponent, practice, show goal */
addConfig(5000, 1, 1, true, false, true, true);
addConfig(4000, 5, 0.3, true, true, false, false);
addConfig(5000, 5, 0.3, true, false, false, true);
addConfig(6000, 5, 0.3, false, true, false, true);
addConfig(6000, 5, 0.3, false, false, false, false);
var totalTrials = CONFIGS.length;
var CONFIG_RANDOM = Math.floor((Math.random() * CONFIGS.length));
var FIRST_ITI = true;

/* Aperture control variables, set COHRAT and DIRECT, then UPDATE to true */
UPDATE = false;
COHRAT = null; /* coherence ratio */
DIRECT = null; /* direction */

/* Configuration / Global State */
var CLOCK_INTERVAL_MS = 50;
var ITI_DURATION_MS = 1000;
var LEFT_KEY = 65;
var RIGHT_KEY = 76;
var CSV_HEADER = ["unique code", "trial number", "direction", "input", "correct", "reaction_time", "score", "goal", "distance", "time limit", "coherence", "show timer", "show opponent", "competition type", "practice"];
var CSV_FILENAME = "testSave.csv"
var TRIAL_COUNT = 1;
//var DOT_COHERENCE = 1;
var OPPONENT_SCORE = 0;

/* Resources */
var FAIL_SOUND = new sound("./Sounds/trial-fail.mp3");
var SUCCESS_SOUND = new sound("./Sounds/trial-success.mp3");

/* HTML IDs */
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
var INTRODUCTION_ID = "instructions";
var DEBRIEF_ID = "instructions";
var SURVEY_ID = "survey";
var TIMING_PROGRESS_DIV_ID = "myTimingProgress";
var OPPONENT_SCORE_BAR_DIV_ID = "opponentScoreBar";
var RESULTS_DIV_ID = "resultsDiv";
var RESULTS_IMG_ID = "resultsImg";
var RESULTS_TXT_ID = "resultsTxt";
var LABEL = "label";

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
 * Class to represent one of the score bar sections
 * Configurable to represent padding, player or opponent score
 */
function scoreBarSection(bgColor, fgColor, firstColumn, firstRow) {
  this.mainDiv = document.createElement("div");
  this.mainDiv.setAttribute("class", "scoreBarSection")

  // Configure the borders, by default drawing top and left
  // Draw other sections based on arguments
  this.mainDiv.style.padding = 
    (firstRow ? "4" : "0") + "px 0.6% 4px " + (firstColumn ? "0.6%" : "0px")

 
  // Background div, always displayed
  this.bgBar = document.createElement("div");
  this.bgBar.setAttribute("class", "scoreBarBackground")
  this.bgBar.style.backgroundColor = bgColor

  // Divider div, varies with score
  this.divider = document.createElement("div");
  this.divider.setAttribute("class", "scoreBarDivider")
  this.divider.style.backgroundColor = "black"

  // Foreground div, varies with score
  this.fgBar = document.createElement("div");
  this.fgBar.setAttribute("class", "scoreBarForeground")
  this.fgBar.style.backgroundColor = fgColor


  // Attach the background and foreground divs based on the direction
  if (firstColumn) {
    this.mainDiv.appendChild(this.bgBar);
    this.mainDiv.appendChild(this.divider);
    this.mainDiv.appendChild(this.fgBar);
  } else {
    this.mainDiv.appendChild(this.fgBar);
    this.mainDiv.appendChild(this.divider);
    this.mainDiv.appendChild(this.bgBar);
  }

  this.updateScore = function(per, skip) {
    var bgBar  = this.bgBar
    var fgBar = this.fgBar
    var divider = this.divider
    var dividerWidth = 3;

    if (per > 100) {
      skip = true;
      per = 100;
    }
    if (per < 0) {
      skip = true;
      per = 0;
    }

    if (skip) {
      if (per == 0) {
        bgBar.style.width = "100%";
        fgBar.style.width = "0%";
        divider.style.width = "0%";
      } else if (per == 100) {
        bgBar.style.width = "0%";
        fgBar.style.width = "100%";
        divider.style.width = "0%";
      } else {
        bgBar.style.width = (100 - dividerWidth - per) + "%";
        fgBar.style.width = per + "%";
        divider.style.width = dividerWidth + "%";
      }
    } else {
      setTimeout(function(){
        if (per == 0) {
          bgBar.style.width = "100%";
          fgBar.style.width = "0%";
          divider.style.width = "0%";
        } else if (per == 100) {
          bgBar.style.width = "0%";
          fgBar.style.width = "100%";
          divider.style.width = "0%";
        } else {
          bgBar.style.width = (100 - dividerWidth - per) + "%";
          fgBar.style.width = per + "%";
          divider.style.width = dividerWidth + "%";
        }
      }, 0);
    }
  }
}

/*
 * Class to represent one of the rows in the score bar
 */
function scoreBarRow(bgColor, fgColor, firstRow, label) {
  this.mainDiv = document.createElement("div");
  this.sects = document.createElement("div");
  this.sections = [];

  // Label
  this.mainDiv.style.width = "120%";
  this.mainDiv.style.marginLeft = "-20%";

  this.sects.style.display = "inline-block";
  this.sects.style.width = "83%";

  this.label = document.createElement("div");
  this.label.setAttribute("class", "goalText");
  this.label.innerHTML = '<span>' + label + '</span>';
  this.label.style.width = "17%";
  this.label.style.height = "30px";
  this.label.style.position = "relative";
  this.label.style.bottom = "5px";
  this.mainDiv.append(this.label);

  var i;
  for (i = 0; i < 5; i++) { 
    var section = new scoreBarSection(bgColor, fgColor, i == 0, firstRow);
    this.sects.appendChild(section.mainDiv);
    this.sections.push(section);
  }
  this.mainDiv.append(this.sects);

  this.updateScore = function(score, skip) {
    this.sections[0].updateScore(-score * 10, skip);
    var i;
    for (i = 1; i < 5; i++) { 
      this.sections[i].updateScore(score * 10, skip);
      score -= 10;
    }
  }
}

/*
 * Generate row of numbers along the score bar
 */
function scoreBarNums() {
  this.mainDiv = document.createElement("div");
  this.mainDiv.style.width = "120%"
  this.mainDiv.style.marginLeft = "-10%"

  var i;
  var s = -10;
  for (i = 0; i < 6; i++) {
    var text = document.createElement("div");
    text.setAttribute("class", "scoreBarText");
    text.innerHTML = '' + s;
    this.mainDiv.append(text);
    s += 10;
  }
}

function flags() {
  this.mainDiv = document.createElement("div");
  this.mainDiv.style.width = "129px";

  // Goal Flag
  this.flagImg = document.createElement("IMG");
  this.flagImg.id = "flagimage";
  this.flagImg.setAttribute("src", "./Images/flags.png");
  this.flagImg.setAttribute("width", "129");
  this.flagImg.setAttribute("height", "110");
  this.flagImg.setAttribute("alt", "flags");
  this.mainDiv.append(this.flagImg);

  // Goal Text
  this.text = document.createElement("div");
  this.text.setAttribute("class", "goalText");
  this.text.innerHTML = "GOAL: ";
  this.mainDiv.append(this.text);
 
  this.updateGoal = function (goal) {
    this.text.innerHTML = "GOAL: " + goal
  }
}

function finishLine() {
  this.mainDiv = document.createElement("div");
  this.mainDiv.setAttribute("class", "finishLine");
} 

function scoreBar() {
  this.mainDiv = document.createElement("div");

  // Goal Flags
  this.goalFlags = new flags();
  this.mainDiv.append(this.goalFlags.mainDiv);

  // Row of numbers
  this.text = new scoreBarNums();
  this.mainDiv.append(this.text.mainDiv);

  // Finish line
  this.finishLine = new finishLine();
  this.mainDiv.append(this.finishLine.mainDiv);

  // Rows of boxes
  var darkGrey = "rgb(153, 153, 153)";
  var lightGrey = "rgb(213, 213, 213)";
  var green = "#4CAF50";
  var red = "red";

  this.scoreBox = document.createElement("div");
  this.scoreBox.setAttribute("class", "scoreBox");
  this.mainDiv.append(this.scoreBox);

  this.padding1 = new scoreBarRow(darkGrey, darkGrey, true, "");
  this.scoreBar = new scoreBarRow(lightGrey, green, false, "YOU");
  this.padding2 = new scoreBarRow(darkGrey, darkGrey, false, "");
  this.opponentScoreBar = new scoreBarRow(lightGrey, red, false, "OPPONENT");
  this.padding3 = new scoreBarRow(darkGrey, darkGrey, false, "");

  this.scoreBox.append(this.padding1.mainDiv);
  this.scoreBox.append(this.scoreBar.mainDiv);
  this.scoreBox.append(this.padding2.mainDiv);
  this.scoreBox.append(this.opponentScoreBar.mainDiv);
  this.scoreBox.append(this.padding3.mainDiv);

  this.showOpponent = function (visible) {
    this.opponentScoreBar.mainDiv.style.visibility = visible ? "visible" : "hidden";
    this.padding3.mainDiv.style.visibility = visible ? "visible" : "hidden";

    this.finishLine.mainDiv.style.height = visible ? "174px" : "106px";
  }

  this.showFlags = function (visible) {
    this.goalFlags.mainDiv.style.visibility = visible ? "visible" : "hidden";
    this.finishLine.mainDiv.style.visibility = visible ? "visible" : "hidden";
  }

  this.updateScore = function (score, opponent, skip) {
    this.scoreBar.updateScore(score, skip);
    this.opponentScoreBar.updateScore(opponent, skip);
  }

  this.updateGoal = function (goal) {
    this.goalFlags.updateGoal(goal);

    var pw = this.mainDiv.offsetWidth - 2;
    var w = this.goalFlags.mainDiv.offsetWidth;
    this.goalFlags.mainDiv.style.marginLeft =
      (pw / 5.0 * (1 + 4.0 * goal / 40.0) - w / 2) + "px"; 

    var i = goal + 10;
    var pw = (158 - 4)/10;//this.scoreBar.sections[1].width;
    var w = this.finishLine.mainDiv.offsetWidth;
    this.finishLine.mainDiv.style.marginLeft = 
      (pw + 4) * Math.ceil(i/10) + pw * (i - Math.ceil(i/10)) + 5 + "px"
  }
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

/**
    Export data to UQ psych server
     - Paul Jackson 20/2/2019
     - assumes global 'CSV_HEADER' array variable contains all column names
     - assumes data in 'values' columns match 'CSV_HEADER'
     - will warn if there is a problem saving the data (and data will be lost)
 */
function uqpsychExportData(values) {
    // Server receiver
    var url = 'https://exp.psy.uq.edu.au/s4322866/bin/record.htm';    // Change this if not on the www2.psy.uq.edu.au domain

    // Prepare data as json
    var jsonValues = JSON.stringify(values);
    var jsonKeys = JSON.stringify(CSV_HEADER);

    // Create chr for request
    var xhr = new XMLHttpRequest();

    // Handle xhr events
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if ( xhr.status == 200 ) {
                if (xhr.responseText==="OK") {
                    console.log('Data saved');
                } else {
                    alert('Problem saving data - ' + xhr.responseText);
                }
            } else {
                alert('Problem saving data - Response Status' + xhr.status);
            }
        }
    };
    xhr.onerror = function () {
        alert('Problem saving data - Response Status' + xhr.status);
    };

    // Prepare and send
    xhr.open('POST', url, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.send('values=' + encodeURI(jsonValues) + '&' + 'keys=' + encodeURI(jsonKeys));
}


/*** DRAW *********************************************************************/

function drawIntroduction() {
  var introText = document.createElement("p");
  introText.innerHTML = `
  This is a random dot task. Your screen will show a group of dots that are moving in many directions.<br /><br />
On each trial, 30% of the dots will be moving in a coherent direction (left or right) and the other 70% will move randomly.<br /><br />
You need to determine if the dots are moving left or right.<br /><br />
If the dots are moving left, press the 'A' key. If the dots are moving right, press the 'L' key.<br /><br />
You will have a separate objective for each block of trials. In some trials, you will have an opponent, while in others, you will not.<br /><br />
In some trials, you will have to reach a certain score before your opponent, while in others you will need to have more points than them by the end of the time limit. <br /><br />
For each correct response, you will gain a point. For each incorrect response, you will lose a point. Points can go into the negatives.<br /><br />
PLEASE MAKE SURE YOU ARE USING GOOGLE CHROME | THE EXPERIMENT MAY NOT WORK ON MICROSOFT EDGE<br /><br />
Press any key to continue.
  `
  return introText;
}

function drawSurvey() {

}

function drawDebrief() {
  var debriefText = document.createElement("p");
  debriefText.innerHTML = `
  DEBRIEF TEXT | Thank you for completing the experiment. <br /><br />
  Please follow this link and answer a few more questions <br /><br />
  <a href="http://qualtrics.com">www.qualtrics.com</a>
  `
  return debriefText;
}

function drawInstructions() {
  return updateInstructions(document.createElement("p"));
}

function drawTrial() {
  var canvas = document.createElement("canvas");
  canvas.id = CANVAS_ID;
  canvas.style.top = 0;
  canvas.style.left = 0;
  canvas.style.position = "absolute";

  CANVAS = new runTest(canvas);

  return canvas;
}

function drawITI() {
  /* Build the timing bar and counter */
  var timingBar = document.createElement("div");
  timingBar.id = TIMER_BAR_ID;
  var timingBarText = document.createElement("div");
  timingBarText.id = TIMER_BAR_TEXT_ID;

  var timingBarProgress = document.createElement("div");
  timingBarProgress.id = TIMING_PROGRESS_DIV_ID;
  timingBarProgress.appendChild(timingBar);
  timingBarProgress.appendChild(timingBarText);

  /* Build the score bars */
  mainScoreBar = new scoreBar();

  /* Build the result elements - hidden by default */
  var resultsTxt = document.createElement("div");
  resultsTxt.id = RESULTS_TXT_ID;
  var resultsImg = document.createElement("img");
  resultsImg.id = RESULTS_IMG_ID;
  resultsImg.setAttribute("width", "110");
  resultsImg.setAttribute("height", "110");
  resultsImg.setAttribute("alt", "face");
  var resultsDiv = document.createElement("div");
  resultsDiv.id = RESULTS_DIV_ID;
  resultsDiv.appendChild(resultsTxt);
  resultsDiv.appendChild(resultsImg);

  /* Attach divs to itiScreen in display order */
  var itiScreen = document.createElement("div");
  itiScreen.style.paddingTop = '75px';
  itiScreen.appendChild(timingBarProgress);
  itiScreen.appendChild(resultsDiv);
  itiScreen.appendChild(mainScoreBar.mainDiv);

  return itiScreen;
}

/*** UPDATE *******************************************************************/

function updateInstructions(instructions) {
  var config = getCurrentConfig();
  var COMPTYPE = getCompType();

  if (config.practice == true){
    instructions.innerHTML = `
    PRACTICE (TEXT TO BE UPDATED) <br /> <br />
    <img src='\Images/COMPTYPE4.png'>
    `
  } else {
  if (COMPTYPE == 1) {
    instructions.innerHTML = `
In this block, you will have an opponent. <br /> <br />
You will have ${config.duration/1000} seconds to achieve a higher score than your opponent.<br /><br />
If the dots are moving left, press the 'A' key. If the dots are moving right, press the 'L' key.<br /><br />
Each time you press 'A' or 'L' you will see the score. An example of this is shown below.<br /><br />
Press any key to continue. <br /> <br />
<img src='\Images/COMPTYPE1.png'>
`;
  } else if (COMPTYPE == 2) {
    instructions.innerHTML = `
In this block, you will NOT have an opponent. <br /> <br />
You will have ${config.duration/1000} seconds to acheive a score of ${config.goal}.<br /><br />
If the dots are moving left, press the 'A' key. If the dots are moving right, press the 'L' key.<br /><br />
Each time you press 'A' or 'L' you will see the score. An example of this is shown below.<br /><br />
Press any key to continue. <br /> <br />
<img src='\Images/COMPTYPE2.png'>
`;
  } else if (COMPTYPE == 3) { 
    instructions.innerHTML = `
In this block, you will have an opponent. <br /> <br />    
You have to acheive a score of ${config.goal} before your opponent does.<br /><br />
If the dots are moving left, press the 'A' key. If the dots are moving right, press the 'L' key.<br /><br />
Each time you press 'A' or 'L' you will see the score. An example of this is shown below.<br /><br />
Press any key to continue. <br /> <br />
<img src='\Images/COMPTYPE3.png'>
`;
  } else if (COMPTYPE == 4)  {
  instructions.innerHTML = `
In this block, you will NOT have an opponent. <br /> <br />
You will have ${config.duration/1000} seconds to score as many points as possible.<br /><br />
If the dots are moving left, press the 'A' key. If the dots are moving right, press the 'L' key.<br /><br />
Each time you press 'A' or 'L' you will see the score. An example of this is shown below.<br /><br />
Press any key to continue. <br /> <br />
<img src='\Images/COMPTYPE4.png'>
`;
  };
}
  return instructions;
}

function updateITI(itiScreen) {
  var config = getCurrentConfig();
  mainScoreBar.showOpponent(config.showOpponent);
  mainScoreBar.showFlags(getCurrentConfig().showGoal == true);
  var timingBar = itiScreen.querySelector(`#${TIMER_BAR_ID}`);
  var timingBarText = itiScreen.querySelector(`#${TIMER_BAR_TEXT_ID}`);

  /* UI for remaining time */
  remaining = timer.remaining < 0 ? 0 : timer.remaining;
  width = 100 - (100 * (remaining / config.duration));
  timingBar.style.width = width + '%';
  timingBarText.innerHTML = Math.round(remaining / 1000) + 's remaining';

  /* UI for score bars */
  if (FIRST_ITI) {
    mainScoreBar.updateScore(0, 0, true);
    FIRST_ITI = false;
  }
  mainScoreBar.updateScore(score, getOpponentScore(), false);
  mainScoreBar.updateGoal(config.goal);

  /* Determine which elements to display */
  itiScreen.querySelector(`#${RESULTS_DIV_ID}`).style.visibility = "hidden";
  var timingDiv = itiScreen.querySelector(`#${TIMING_PROGRESS_DIV_ID}`);
  if (getCompType() !== 4) {
  timingDiv.style.visibility = config.showTiming ? "visible" : "hidden";
  } else if (getCompType() == 4) {
    timingDiv.style.visibility = "visible"
  };
}

function updateResults(itiScreen) {
  updateITI(itiScreen);
  FIRST_ITI = true;
  var img = itiScreen.querySelector(`#${RESULTS_IMG_ID}`);
  var txt = itiScreen.querySelector(`#${RESULTS_TXT_ID}`);

  /* Customize based on score */
  if (score >= getCurrentConfig().goal) {
    img.setAttribute("src", "./Images/face0.png");
    var message = 'You achieved your goal!';
  } else {
    img.setAttribute("src", "./Images/face1.png");
    var message = 'You did not achieve your goal.';
  }
  txt.innerHTML = message + '</br> </br> Please press R to continue';

  /* Show the results elements */
  itiScreen.querySelector(`#${RESULTS_DIV_ID}`).style.visibility = "visible";
}

/*** SHOW *********************************************************************/

function showIntroduction() {
  removeBody();
  uiState = uiStates.INTRODUCTION;
  document.body.style.backgroundColor = "white";
  document.body.appendChild(introduction);
}

function showSurvey() {
  removeBody();
  uiState = uiStates.SURVEY;
  document.body.style.backgroundColor = "white";
  document.body.appendChild(survey);
}

function showDebrief() {
  removeBody();
  uiState = uiStates.DEBRIEF;
  document.body.style.backgroundColor = "white";
  document.body.appendChild(debrief);
}

function showInstructions() {
  /* Reset start */
  removeBody();
  uiState = uiStates.INSTRUCTIONS;
  document.body.style.backgroundColor = "white";
  document.body.appendChild(updateInstructions(instructions));
}

function showTrial() {
  /* Reset state */
  removeBody();
  uiState = uiStates.TRIAL;
  document.body.style.backgroundColor = "gray";
  document.body.appendChild(trial);

  /* Launch the test */
  ran = Math.random() >= 0.5;

  DIRECT = ran ? direction.LEFT : direction.RIGHT;
  COHRAT = getCurrentConfig().dotCoherence;
  UPDATE = true;

  correctKey = ran ? LEFT_KEY : RIGHT_KEY;
  timer.resume();
  trialStart = new Date().getTime();
}

function showITI() {
  /* Reset state */
  removeBody();
  //activeAperture = [false, false];
  uiState = uiStates.ITI;
  document.body.style.backgroundColor = "gray";
  document.body.appendChild(iti);
  updateITI(iti);

  /* Launch the next trial when needed */
  setTimeout(showTrial, ITI_DURATION_MS);
}

function showResults() {
  
    csvLogs.push(logTimeout());

    /* Reset state, stop drawing */
    removeBody();
    //activeAperture = [false, false];
    uiState = uiStates.RESULTS;
    document.body.style.backgroundColor = "gray";
    document.body.appendChild(iti);
    updateResults(iti);
   //else {
    //if (score >= getCurrentConfig().goal) {
        /* Reset state, stop drawing */
       // removeBody();
       // activeAperture = [false, false];
       // uiState = uiStates.RESULTS;
       // document.body.style.backgroundColor = "gray";
       // document.body.appendChild(iti);
       // updateResults(iti);
    //};
  

  /* Generate and export the CSV */
  if (csvLogs.length == 0) {
    console.log('TEST');
    csvLogs.unshift(CSV_HEADER);
  };
}

/*** MISC *********************************************************************/

function addConfig(duration, goal, dotCoherence, showTiming, showOpponent, practice, showGoal) {
  var newConfig = {
    "duration": duration,
    "goal": goal,
    "dotCoherence": dotCoherence,
    "showTiming": showTiming,
    "showOpponent": showOpponent,
    "practice": practice,
    "showGoal": showGoal
  }
  CONFIGS.push(newConfig)
}

function getCurrentConfig() {
  if (CONFIGS.length == totalTrials) {
    CONFIGS[CONFIG_RANDOM = 0];
    return CONFIGS[CONFIG_RANDOM];
      } else {
        return CONFIGS[CONFIG_RANDOM];
      };
}

function getCompType() {
  var config = getCurrentConfig();
  if (config.showTiming == true) {
    if (config.showOpponent == true) {
      return 1;
    } else {
      return 2;
    }
  } else {
    if (config.showOpponent == true) {
      return 3;
    }
    else {
      return 4;
    }
  }
}

function nextConfig() {
  CONFIGS.splice(CONFIG_RANDOM, 1);
  CONFIG_RANDOM = Math.floor(Math.random() * CONFIGS.length);
}

function getOpponentScore() {
  var config = getCurrentConfig();
  return Math.floor((1 - (timer.remaining/config.duration)) * config.goal);
}

function logGuess(correct) {
  /* Determine the trial time */
  var trialEnd = new Date().getTime();
  var reaction = trialEnd - trialStart;
  trialStart = trialEnd;

  /* Generate a record for the guess */
  var guess = [];
  var config = getCurrentConfig();
  guess.push(uniqueCode)
  guess.push(TRIAL_COUNT);
  guess.push(correctKey == LEFT_KEY ? "left" : "right");
  guess.push(event.keyCode);
  guess.push(correct);
  guess.push(reaction);
  guess.push(score);
  guess.push(config.goal);
  guess.push(config.goal - (score));
  guess.push(config.duration);
  guess.push(config.dotCoherence);
  guess.push(config.showOpponent);
  guess.push(config.showTiming);
  guess.push(getCompType());
  guess.push(config.practice);
  return guess;
}

function logTimeout() {
  /* Determine the trial time */
  var trialEnd = new Date().getTime();
  var reaction = trialEnd - trialStart;
  trialStart = trialEnd;

  /* Generate a record for the guess */
  var guess = [];
  var config = getCurrentConfig();
  guess.push(uniqueCode)
  guess.push(TRIAL_COUNT);
  guess.push(correctKey == LEFT_KEY ? "left" : "right");
  guess.push("NA");
  guess.push("NA");
  guess.push(reaction);
  guess.push(score);
  guess.push(config.goal);
  guess.push(config.goal - (score));
  guess.push(config.duration);
  guess.push(config.dotCoherence);
  guess.push(config.showOpponent);
  guess.push(config.showTiming);
  guess.push(getCompType());
  guess.push(config.practice);
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
  if (uiState == uiStates.INTRODUCTION) {

    showInstructions();
  }
  else if (uiState == uiStates.INSTRUCTIONS) {
    showTrial();
  } else if (uiState == uiStates.TRIAL) {
    if (event.keyCode == LEFT_KEY || event.keyCode == RIGHT_KEY) {
      timer.pause();

      /* Update score state and play sound */
      var correct = event.keyCode == correctKey;

      if (correct) {
        score++;
        SUCCESS_SOUND.play();
      } else {
        score--;
        FAIL_SOUND.play();
      }
      csvLogs.push(logGuess(correct));

      if (getCompType() == 3 && score >= getCurrentConfig().goal) {
        showResults();
      } else {
        showITI();
      };
    };

  } else if (uiState == uiStates.RESULTS) {
    /* Restart the trials */
    if (event.keyCode == 82) {
      if (CONFIGS.length > 1) {
        console.log(CONFIGS.length);
        TRIAL_COUNT++;
        nextConfig();


        main();
      } else {
        // Removed in favour of server side saves via uqpsychExportData()
        // console.log(CONFIGS.length);
        // csvLogs.unshift(CSV_HEADER);
        // exportCSV(csvLogs, CSV_FILENAME);
        uqpsychExportData(csvLogs);
        showDebrief();
      }
    }
  }
}

function code() {
  do{
    uniqueCode = prompt("Please enter your unique code", "");
  } while (uniqueCode == null || uniqueCode == "" || uniqueCode.length != 8)
};

/*
 * Main body of the script
 * Sets up initial state and registers events
 */
function main() {
  console.log(getCurrentConfig().goal);
  score = 0;
  
  correctKey = null;
  timer = new clock(getCurrentConfig().duration, showResults);

  //csv should be saved to the experiment webspace https://staff.psy.uq.edu.au/tools/webfiles/manage/?v=files/5c5fcb4c6e78e
  if (csvLogs.length == 0) {
    code();
    showIntroduction();
    //trialStart = 0;
    //score = getCurrentConfig().goal;
    //showResults();
  } else {
    showInstructions();
  }
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
introduction = drawIntroduction();
survey = drawSurvey();
instructions = drawInstructions();
trial = drawTrial();
iti = drawITI();
debrief = drawDebrief();

/* Start the trials */
document.addEventListener('keydown', keyPress);
document.addEventListener('keyup', keyUp);
csvLogs = []
main();

/*** EXTERNAL CODE ************************************************************/

function runTest(canvas) {
  var nApertures = 1; //The number of apertures
  var nDots = 200; //Number of dots per set (equivalent to number of dots per frame)
  var nSets = 1; //Number of sets to cycle through per frame
  var coherentDirection = [direction.LEFT]; //The direction of the coherentDots in degrees. Starts at 3 o'clock and goes counterclockwise (0 == rightwards, 90 == upwards, 180 == leftwards, 270 == downwards), range 0 - 360
  var coherence = getCurrentConfig().dotCoherence; //Proportion of dots to move together, range from 0 to 1
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
  //activeAperture = [false, false];
  //var drawnAperture = [false, false];

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

  function updateDirection () {
    if (!UPDATE) {
      return; 
    }
    UPDATE = false;
    coherence = COHRAT;
    coherentDirection = DIRECT;

    //Calculate the number of coherent, opposite coherent, and incoherent dots
    nCoherentDots = nDots * coherence;
    nOppositeCoherentDots = nDots * oppositeCoherence;
    nIncoherentDots = nDots - (nCoherentDots + nOppositeCoherentDots);

    coherentJumpSizeX = calculateCoherentJumpSizeX(coherentDirection);
    coherentJumpSizeY = calculateCoherentJumpSizeY(coherentDirection);

    dotArray = dotArray2d[currentSetArray[currentApertureNumber]]; //Global variable, so the updateDots and draw functions also uses this array

    for (var i = 0; i < nDots; i++) {
      dot = dotArray[i];

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
    }
  }

  //Function to update all the dots all the apertures and then draw them
  function updateAndDraw(){
    // Go through the array, update the dots, and draw them on the canvas
    //for(currentApertureNumber = 0; currentApertureNumber < nApertures; currentApertureNumber++){
    //  if (!activeAperture[currentApertureNumber] && drawnAperture[currentApertureNumber]) {
    //    initializeCurrentApertureParameters(currentApertureNumber);
    //    clearDots();
    //    drawnAperture[currentApertureNumber] = false;
    //  }
    //}

    for(currentApertureNumber = 0; currentApertureNumber < nApertures; currentApertureNumber++){
      //if (activeAperture[currentApertureNumber]) {
        //Initialize the variables for each parameter
        initializeCurrentApertureParameters(currentApertureNumber);

        //Clear the canvas by drawing over the current dots
        clearDots();

        updateDirection();

        //Update the dots
        updateDots();

        //Draw on the canvas
        draw();

        //drawnAperture[currentApertureNumber] = true;
      //}
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

