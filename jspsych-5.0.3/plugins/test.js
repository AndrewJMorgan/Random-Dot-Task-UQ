
function Progress() {
		//--------Set up Canvas begin-------
		//Create/or find a canvas element and append it to the DOM
		
			timerBar = document.createElement("myBar");
			
			display_element = null;

			display_element.append(timerBar); //'append' is the jQuery equivalent of 'appendChild' in the DOM method
		

		//The document body IS 'display_element' (i.e. <body class="jspsych-display-element"> .... </body> )
		var body = document.getElementsByClassName("jspsych-display-element")[0];
		//Remove the margins and paddings of the display_element
		body.style.margin = 0;
		body.style.padding = 0;
		body.style.backgroundColor = backgroundColor; //Match the background of the display element to the background color of the canvas so that the removal of the canvas at the end of the trial is not noticed


		//Remove the margins and padding of the canvas
		canvas.style.margin = 0;
		canvas.style.padding = 0;
		body.style.overflowY = "hidden"; //disables scroll bar
		body.style.overflowX = "hidden"; //disables scroll bar

		//Get the context of the canvas so that it can be painted on.
		var ctx = canvas.getContext("2d");

		//Declare variables for width and height, and also set the canvas width and height to the window width and height
		var width = canvas.width = window.innerWidth;
		var height = canvas.height = window.innerHeight;
	

		//Set the canvas background color
		canvas.style.backgroundColor = backgroundColor;
}