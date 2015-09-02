/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

	var global = window;
	var doc = global.document;
	var dom = {
		"dropbox": doc.getElementById("dropbox"),
		"upload": doc.getElementById("upload"),
		"status": doc.getElementById("status")
	};
	
	function showStatus(html) {
		//console.log(html);
		if (html) {
			dom.status.innerHTML += html + "<br>";
		} else {
			dom.status.innerHTML = "";			
		}
	}
	
	/**
	 * Helper: factored out common parts.
	 * @param {function} fnc
	 * @param {any} par
	 */
	function next(fnc, par) {
		window.setTimeout(function() {
			try {
				fnc(par);
			} catch (e) {
				showStatus("ERROR " + e);
			}
		}, 0);
	}
	
	function handleFiles(files) {
		if (files && files.length > 0) {
			var file = files[0];
			handleFile(file);
		}
	}

	function handleFile(file) {
		console.log("file=" + file.name + " (" + file.size + "bytes)", file);
		var reader, data;
		reader = new global.FileReader();

		reader.onload = function (eventObj) {
			var result = {
				file: file,
				times: [ Date.now() ],
				data: null
			};
			window.result = result;

			try {
				result.data = eventObj.target.result;

				result.times[1] = Date.now();
				result.times[0] = result.times[1] - result.times[0];
				showStatus("reader: " + result.times[0] + "ms, data.length=" + result.data.length + "bytes");

				next(parseJson, result);
				//showStatus("Ready file " + file.name + " (" + file.size + " bytes)");
			} catch (e) {
				showStatus("ERROR " + e);
			}			
		};

		showStatus();
		showStatus("reading file: " + file.name + " (" + file.size + "bytes)");
		next(function() {
			reader.readAsText(file);
		});
	}
	
	//
	// event handlers
	//
	
	dom.upload.addEventListener('change', function handleFileUpload(eventObj) {
		handleFiles(eventObj.target.files);
	}, false);
	dom.dropbox.onclick = function () {
		dom.upload.click();
	};

//	dom.dropbox.addEventListener("dragenter", function () {
//		dom.dropbox.className = "dragging";
//	}, false);
	dom.dropbox.addEventListener("dragover", function handleDragOver(eventObj) {
		eventObj.stopPropagation();
		eventObj.preventDefault();
		eventObj.dataTransfer.dropEffect = "copy";
		dom.dropbox.className = "dragging";
	}, false);
	dom.dropbox.addEventListener("dragleave", function () {
		dom.dropbox.className = "";
	}, false);
	
	dom.dropbox.addEventListener("drop", function handleFileSelect(eventObj) {
		eventObj.stopPropagation();
		eventObj.preventDefault();
		handleFiles(eventObj.dataTransfer.files);
		dom.dropbox.className = "";
	}, false);
	dom.dropbox.addEventListener("dragend", function () {
		dom.dropbox.className = "";
	}, false);


	//
	// processing functions
	//
	
	function parseJson(result) {
		var json = JSON.parse(result.data);
		result.json = json.locations ? json : { locations: json };

		result.times[2] = Date.now();
		result.times[1] = result.times[2] - result.times[1];
		showStatus("json: " + result.times[1] + "ms, json.locations.length=" + result.json.locations.length);

		next(sliceTimes);
	}
	
	function sliceTimes(start, stop) {
		var result = window.result;
		var loc = result.json.locations;
		
		start = start || "2015-09-01";
		var startMillis = (new Date(start)).getTime();
		stop = stop || "2015-09-02";
		var stopMillis = (new Date(stop)).getTime();
		var startIx = -1;
		var stopIx = -1;

		// find slice; note: location data are time reversed!
		var i, iMax = loc.length;
		for (i = 0; i < iMax && loc[i].timestampMs > stopMillis; i++) { }
		startIx = i;
		for ( ; i < iMax && loc[i].timestampMs >= startMillis; i++) { }
		stopIx = i;
		result.slice = loc.slice(startIx, stopIx);
		result.slice.reverse();	// now ascending location timestamps
		
		result.times[3] = Date.now();
		result.times[2] = result.times[3] - result.times[2];
		showStatus("slice: " + result.times[2] + "ms, locations=" + result.slice.length);
		
		next(showLines);
	}
	
	function showLines() {
		var result = window.result;
		var loc = result.slice;
		var millis;
		result.lines = [];
		var count;
		
		result.slice.forEach(function(loc, ix) {
			millis = +loc.timestampMs;
			//loc.timestamp = formatDate(millis) + " " + formatTime(millis);
			result.lines.push(formatTime(millis) + " " + loc.latitudeE7 + "/" + loc.longitudeE7 + " (" + loc.accuracy + ")");
			
			if (loc.activitys) {
				loc.activitys.forEach(function(activity) {
					millis = +activity.timestampMs;
					//activity.timestamp = formatDate(millis) + " " + formatTime(millis);
					var line = "             " + formatTime(millis) + " ";
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

		result.times[4] = Date.now();
		result.times[3] = result.times[4] - result.times[3];
		showStatus("lines: " + result.times[3] + "ms, locations=" + result.slice.length + ", lines=" + count + " (" + result.lines.length + "bytes)");
	}

	function makeObject(result) {
		result.loc = { };
		
		result.json.locations.forEach(function(loc, ix){
			var millis = loc.timestampMs;
			if (result.loc[millis]) {
				console.log("Location duplicate=" + millis, result.loc[millis], loc);
			} else {
				result.loc[millis] = loc;
			}
		});
		
		result.times[3] = Date.now();
		result.times[2] = result.times[3] - result.times[2];
		showStatus("object: " + result.times[2] + "ms, locations=" + Object.keys(result.loc).length);
		
		next(showLoc);
	}
	
	function showLoc(millis) {
		var result = window.result;
		millis = millis || 1440763516780;
		result.times[3] = Date.now();
		
		if (typeof millis === "string") {
			// assume correct format, such as "2015-09-02 13:55:09"
			console.log(millis);
			millis = (new Date(millis)).getTime();
			//millis /= 1000;
			console.log(millis);
		}
		
		var res = result.loc[millis];

		result.times[4] = Date.now();
		result.times[3] = result.times[4] - result.times[3];		
		console.log("show: " + result.times[3] + "ms, loc[" + millis + "]", res);
	}

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
