# View Google locations.json file in Browser

This browser app shows the contents of a Google locations JSON file for your Android phone,
once you have downloaded the data from https://www.google.com/settings/takeout.

Select www/index.html in your browser, from file system or via httpd server.

Dir test contains test1.json, a Google locations compatible file with only 15 locations - very small, for first tests.

The app is plain HTML, CSS, and JavaScript.  I wrote it mainly for playing with the JavaScript FileReader object.

My Tests:
- OK with Google Chrome 44 and Firefox 39, 40 (MS Windows 8.1 and MS Windows 10).
- MS Edge currently does not (yet) support Drag+Drop as implemented: must Click to read a file.
- MS IE11 cannot read very large files; does not (yet) support Drag+Drop as implemented: must Click to read a file.
