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
		console.log(file.name, file.size, file);
		var reader, data;
		reader = new global.FileReader();

		reader.onload = function (eventObj) {
			var result = {
				file: file,
				times: [ Date.now() ],
				data: null
			};
			window.result = result;
			
			result.data = eventObj.target.result;
			result.times[1] = Date.now();
			result.times[0] = result.times[1] - result.times[0];
			console.log("times reader", result.times);
			console.log("data.length", result.data.length);
			
			processJson(result);
			
			console.log(result.times);
			console.log(result.file);
			//console.log(result);
			dom.status.innerHTML = "Ready file " + file.name + " (" + file.size + " bytes)";
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
		result.times[2] = Date.now();
		try {
			result.json = JSON.parse(result.data);
			result.times[1] = result.times[2] - result.times[1];
			console.log("times json", result.times);
			console.log("json.length", result.json.length);
			processLocations(result);
		} catch (e) {
			dom.status.innerHTML = "ERROR " + e;
			return;
		}
	}
	
	function processLocations(result) {
		result.times[3] = Date.now();
		result.loc = { };
		
		var arr = result.json.locations || result.json;
		arr.forEach(function(loc, ix){
			var millis = loc.timestampMs;
			if (result.loc[millis]) {
				console.log("DUPLICATE " + millis, result.loc[millis], loc);
			} else {
				result.loc[millis] = loc;
			}
		});
		
		result.times[2] = result.times[3] - result.times[2];
		console.log("times loc", result.times);
		console.log("result.loc.length", Object.keys(result.loc).length);
		
		showLoc();
	}
	
	function showLoc(millis) {
		var result = window.result;
		millis = millis || 1440763516780;
		result.times[4] = Date.now();	
		
		var res = result.loc[millis];
		result.times[3] = result.times[4] - result.times[3];		
		console.log("times show", result.times);
		console.log("loc[" + millis + "]", res);
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
