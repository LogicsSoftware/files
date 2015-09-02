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
	
	function handleFiles(files) {
		if (files && files.length > 0) {
			var file = files[0];
			dom.status.innerHTML = "Preparing file " + file.name + " (" + file.size + " bytes)";
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
				console.log("reader: " + result.times[0] + "ms, data.length=" + result.data.length + "bytes");

				processJson(result);

				dom.status.innerHTML = "Ready file " + file.name + " (" + file.size + " bytes)";
			} catch (e) {
				dom.status.innerHTML = "ERROR " + e;
			}
			
			console.log("summary times", result.times);
		};

		dom.status.innerHTML = "Reading file " + file.name + " (" + file.size + " bytes)";

		reader.readAsText(file);
	}

	function handleDragOver(eventObj) {
		eventObj.stopPropagation();
		eventObj.preventDefault();
		eventObj.dataTransfer.dropEffect = "copy";
	}

	function handleFileUpload(eventObj) {
		handleFiles(eventObj.target.files);
	}

	function handleFileSelect(eventObj) {
		eventObj.stopPropagation();
		eventObj.preventDefault();
		handleFiles(eventObj.dataTransfer.files);
		dom.dropbox.className = "";
	}
	
	// event handlers

	dom.upload.addEventListener('change', handleFileUpload, false);

	dom.dropbox.onclick = function () {
		dom.upload.click();
	};


	dom.dropbox.addEventListener("dragover", handleDragOver, false);
	dom.dropbox.addEventListener("drop", handleFileSelect, false);
	dom.dropbox.addEventListener("dragenter", function () {
		dom.dropbox.className = "dragging";
	}, false);
	dom.dropbox.addEventListener("dragend", function () {
		dom.dropbox.className = "";
	}, false);
	dom.dropbox.addEventListener("dragleave", function () {
		dom.dropbox.className = "";
	}, false);


	function processJson(result) {
		
		var json = JSON.parse(result.data);
		result.json = json.locations ? json : { locations: json };
		
		result.times[2] = Date.now();
		result.times[1] = result.times[2] - result.times[1];
		console.log("json: " + result.times[1] + "ms, json.locations.length=" + result.json.locations.length);
		
		processLocations(result);
	}
	
	function processLocations(result) {
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
		console.log("locations: " + result.times[2] + "ms, locations=" + Object.keys(result.loc).length);
		
		showLoc();
	}
	
	function showLoc(millis) {
		var result = window.result;
		millis = millis || 1440763516780;
		result.times[3] = Date.now();
		
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
