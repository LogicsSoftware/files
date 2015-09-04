/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

	//
	// main
	//

	var dom = { };		// keeps all dom references
	var result = { };	// collects stepwise results
	
	initDom();
	addEventListeners();
	next();	// reset
	
	//
	// GUI
	//
	
	/**
	 * make references to all required dom elements.
	 */
	function initDom() {
		[	"dropbox", "upload", "status",
			"select",
				"startDate", "startTime",
				"endDate", "endTime",
				"setPrev", "setInitial", "setNext",
			"extract", "extractMsg",
			"display", "displayMsg",
			"taDiv", "taMsg", "text"
		]
		.forEach(function(id) {
			dom[id] = window.document.getElementById(id);
		});
		dom.select.classList.add("hide");
	}
	
	/**
	 * add listeners to all required dom elements.
	 */
	function addEventListeners() {		
		// helper
		function handleFiles(files) {
			if (files && files.length > 0) {
				var file = files[0];
				readFile(file);
			}
		}
		
		// upload file
		dom.upload.addEventListener('change', function handleFileUpload(evt) {
			handleFiles(evt.target.files);
		}, false);
		dom.dropbox.onclick = function () {
			dom.upload.click();
		};

		// dropbox
		dom.dropbox.addEventListener("dragover", function handleDragOver(evt) {
			evt.stopPropagation();
			evt.preventDefault();
			evt.dataTransfer.dropEffect = "copy";
			dom.dropbox.classList.add("dragging");
			//console.log(evt);
		}, false);
		dom.dropbox.addEventListener("dragleave", function () {
			dom.dropbox.classList.remove("dragging");
		}, false);

		dom.dropbox.addEventListener("drop", function handleFileSelect(evt) {
			evt.stopPropagation();
			evt.preventDefault();
			handleFiles(evt.dataTransfer.files);
			dom.dropbox.classList.remove("dragging");
		}, false);
		dom.dropbox.addEventListener("dragend", function (evt) {
			dom.dropbox.classList.remove("dragging");
			console.log(evt);
		}, false);
		
		// control GUI
		dom.setPrev.addEventListener("click", function() {
			updateSelected(-1);
		}, false);
		dom.setInitial.addEventListener("click", function() {
			updateSelected(0);
		}, false);
		dom.setNext.addEventListener("click", function() {
			updateSelected(+1);
		}, false);
		dom.extract.addEventListener("click", sliceTimes, false);
		dom.display.addEventListener("click", showLines, false);
	}

	/**
	 * Logs text to HTML status.
	 * @param {string} html	the text to append.
	 *						if empty: clears HTML status.
	 * @returns {undefined}
	 */
	function showStatus(html) {
		if (html) {
			dom.status.innerHTML += formatTime(Date.now()) + " " + html + "<br>";
		} else {
			dom.status.innerHTML = "";			
		}
		dom.status.scrollTop = dom.status.scrollHeight;
	}
	
	/**
	 * Set date and time to HTML input elements.
	 * Uses values from result.dates, fields start/endMillis.
	 * Updates string values of startDate/Time and endDate/Time.
	 */
	function setSelected() {
		var dates = result.dates;
		var date;
		
		date = new Date(dates.startMillis);
		dates.startDate = formatDate(date);
		dates.startTime = formatTime(date, true);
		dom.startDate.value = dates.startDate;
		dom.startTime.value = dates.startTime;
		
		date = new Date(dates.endMillis);
		dates.endDate = formatDate(date);
		dates.endTime = formatTime(date, true);
		dom.endDate.value = dates.endDate;
		dom.endTime.value = dates.endTime;
	}
	
	/**
	 * Update date (and time) from HTML input elements.
	 * Uses values from result.dates.
	 * @param {int} val 0: reset to min/max dates, 1: increment day, -1:decrement day
	 */
	function updateSelected(val) {
		var dates = result.dates;
		var day = 24*60*60*1000;
		if (val > 0) {
			dates.startMillis += day;
			dates.endMillis += day;
		} else if (val < 0) {
			dates.startMillis -= day;
			dates.endMillis -= day;
		} else {
			dates.startMillis = dates.minMillis;
			dates.endMillis = dates.maxMillis;
		}
		setSelected();
	}
	
	/**
	 * Get date and time from HTML input elements.
	 * Stores values in result.dates.
	 */
	function readSelected() {
		result.dates.startMillis = new Date(dom.startDate.value + "T" + dom.startTime.value + "Z");	// MS Edge and Firefox require T and Z
		result.dates.endMillis = new Date(dom.endDate.value + "T" + dom.endTime.value + "Z");		// MS Edge and Firefox require T and Z
	}

	//
	// simple async control, and GUI
	//
	
	/**
	 * factored out common parts for async control.
	 * @param {function} fnc
	 */
	function next(fnc) {
		if (fnc) {
			// run fnc after "be nice"
			window.setTimeout(function() {
				dom.dropbox.classList.add("active");
				dom.select.classList.add("hide");
				dom.taDiv.classList.add("hide");
				try {
					fnc();
				} catch (e) {
					// error stop
					showStatus("--- " + e);
					next();
				}
			}, 0);
		} else {
			// reset
			dom.dropbox.innerHTML = "Click, or drag JSON file into the box!";
			dom.dropbox.classList.remove("active");
			dom.select.classList[
				result.json && result.json.locations && result.json.locations.length ? "remove" : "add"
			]("hide");
			dom.taDiv.classList[
				result.slice && result.slice.length ? "remove" : "add"
			]("hide");
		}
	}
	
	//
	// processing functions for each step
	//

	/**
	 * Step 1: Read file specified in HTML input.
	 * Next, calls parseJson().
	 * @param {file} file
	 */
	function readFile(file) {
		console.log("file=" + file.name + " (" + file.size + "bytes)", file);
		
		// init FileReader
		var reader = new window.FileReader();
		reader.onload = function (evt) {
			// read
			result.data = evt.target.result;

			// update
			result.times[1] = Date.now();
			result.times[0] = result.times[1] - result.times[0];
			showStatus("reader: " + result.times[0] + "ms, data.length=" + result.data.length + "bytes");

			// next step
			next(parseJson);
			//showStatus("Ready file " + file.name + " (" + file.size + " bytes)");
		};
		
		// reset
		result = {
			file: file,
			times: [ Date.now() ],
			data: null
		};

		// GUI
		showStatus();
		showStatus("reading file: " + file.name + " (" + file.size + "bytes)");
		dom.extractMsg.innerHTML = "";
		dom.display.innerHTML = "Show Locations";
		dom.dropbox.innerHTML = "Processing " + file.name + "...";
		
		// chain to next step: read file
		next(function() {
			reader.readAsText(file);	// keep reference to reader
		});
	}

	/**
	 * Step 2: Parse file contents as JSON.
	 * Checks Google location.json format.
	 */
	function parseJson() {
		var json;
		try {
			json = JSON.parse(result.data);
		} catch (excp) {
			throw "No json format: " + excp;
		}
		result.json = json.locations ? json : { locations: json };

		result.times[2] = Date.now();
		result.times[1] = result.times[2] - result.times[1];
		showStatus("json: " + result.times[1] + "ms, json.locations.length=" + result.json.locations.length);
		
		// check for google location.json layout
		var loc = result.json.locations;
		if (loc && loc.length && "timestampMs" in loc[0] && "latitudeE7" in loc[0]) {
			// init dates obj
			result.dates = {
				// google is reverse order; avoid sec with fraction
				minMillis: Math.floor(+loc[loc.length - 1].timestampMs / 1000) * 1000,
				maxMillis: Math.ceil(+loc[0].timestampMs / 1000) * 1000
			};
			result.dates.startMillis = result.dates.minMillis;
			result.dates.endMillis = result.dates.maxMillis;

			setSelected();
			showStatus("location data" +
				" from " + result.dates.startDate + " " + result.dates.startTime +
				" to " + result.dates.endDate + " " + result.dates.endTime);
		} else {
			showStatus("no location data found");
			return;
		}

		// chain to next step
		//next(sliceTimes);
		next();	// done
	}
	
	/**
	 * From GUI: Extract location records as specified in GUI.
	 * Google location.json format only.
	 */
	function sliceTimes() {
		var loc = result.json.locations;
		result.times[2] = Date.now();
		
		// from GUI
		readSelected();
		
		// find slice; note: location data are time reversed!
		var i, iMax = loc.length;
		for (i = 0; i < iMax && loc[i].timestampMs > result.dates.endMillis; i++) { }
		var startIx = i;
		for ( ; i < iMax && loc[i].timestampMs >= result.dates.startMillis; i++) { }
		var stopIx = i;
		result.slice = loc.slice(startIx, stopIx);
		result.slice.reverse();	// now ascending location timestamps
		
		result.times[3] = Date.now();
		result.times[2] = result.times[3] - result.times[2];
		showStatus("extract: " + result.times[2] + "ms, locations=" + result.slice.length);
		
		// GUI
		dom.taDiv.classList.remove("hide");		
		dom.display.innerHTML = "Show " + result.slice.length + " Locations";
		dom.taMsg.innerHTML = 
			result.dates.startDate + " " + result.dates.startTime +
			"  -  " + result.dates.endDate + " " + result.dates.endTime;
		dom.text.value = "\nClick \"Show Locations\" button to view the data!";
		if (result.slice.length > 10000) {
			dom.text.value = "\n" + result.slice.length + " locations seems too much -- might crash your browser!";
		} else if (result.slice.length > 1000) {
			dom.text.value = "\n" + result.slice.length + " locations seem a bit much!";
			dom.text.value += "\nClick \"Show Locations\" button to view the data anyway";
		} else {
			dom.text.value = "\nClick \"Show Locations\" button to view the data!";
		}
		
		//next(showLines);
		next();	// done
	}
	
	/**
	 * From GUI: Show selected locations as lines.
	 * Google location.json format only.
	 */
	function showLines() {
		var millis;
		result.lines = [];
		var count;
		result.times[3] = Date.now();
		
		// check
		if (!result.slice) {
			showStatus("lines: Extract locations first!");
			return;
		}
		if (result.slice.length > 1000) {
			if (!window.confirm(result.slice.length + " locations may take a while.\nShow anyway?")) {
				return;
			}
		}
		if (result.slice.length > 10000) {
			if (!window.confirm(result.slice.length + " locations might crash your browser.\nShow anyway?")) {
				return;
			}
		}
		
		// extract
		result.slice.forEach(function(loc, ix) {
			millis = +loc.timestampMs;
			result.lines.push(formatDate(millis) + " " + formatTime(millis) +
				" lat=" + (loc.latitudeE7 / 10000000).toFixed(7) +
				" len=" + (loc.longitudeE7 / 10000000).toFixed(7) +
				" acc=" + loc.accuracy);
			
			if (loc.activitys) {
				loc.activitys.forEach(function(activity) {
					millis = +activity.timestampMs;
					var line = "           " + formatTime(millis, true) + " ";
					if (activity.activities) {
						activity.activities.forEach(function(act){
							line += act.type + ":" + act.confidence + " ";
						});
					}
					result.lines.push(line);
				});
			}
		});
		count = result.lines.length;
		result.lines = result.lines.join("\n");
		
		// GUI
		dom.taMsg.innerHTML =
			result.dates.startDate + " " + result.dates.startTime +
			"  -  " + result.dates.endDate + " " + result.dates.endTime +
			" (" + count + " lines)";
		dom.text.value = result.lines;

		result.times[4] = Date.now();
		result.times[3] = result.times[4] - result.times[3];
		showStatus("lines: " + result.times[3] + "ms, locations=" + result.slice.length +
				", lines=" + count + " (" + result.lines.length + "bytes)");
		
		next();	// done
	}
	
	//
	// tools
	//

	/**
	 * helper: return print formatted date string.
	 * @example "2014-03-28"
	 * @param {Number} [date] the date to be formatted (millis); default is current Date
	 * @return {String} formatted date
	 */
	function formatDate(date) {
		date = date ? new Date(date) : new Date();
		var tpart;
		var prefix = [];
		// format date
		prefix.push(date.getFullYear());
		tpart = date.getMonth() + 1;
		prefix.push(tpart < 10 ? "0" + tpart : tpart);
		tpart = date.getDate();
		prefix.push(tpart < 10 ? "0" + tpart : tpart);
		return prefix.join("-");
	}
	/**
	 * helper: return print formatted time string.
	 * @example "16:09:46.052" 
	 * @param {Number} [date] the date to be formatted (millis); default is current Date
	 * @param {Boolean} [noMillis] if true: exclude milli seconds
	 * @return {String} formatted time
	 */
	function formatTime(date, noMillis) {
		date = date ? new Date(date) : new Date();
		var tpart;
		var prefix = [];
		// format time
		tpart = date.getHours();
		prefix.push("" + (tpart < 10 ? "0" + tpart : tpart));
		tpart = date.getMinutes();
		prefix.push(":" + (tpart < 10 ? "0" + tpart : tpart));
		tpart = date.getSeconds();
		prefix.push(":" + (tpart < 10 ? "0" + tpart : tpart));
		if (!noMillis) {
			tpart = date.getMilliseconds();
			prefix.push("." + (tpart < 10 ? "00" + tpart : (tpart < 100 ? "0" + tpart : tpart)));
		}
		return prefix.join("");
	}
