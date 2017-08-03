# RESTful ticket editor with fabric.js

The API creates a Base64 image string from the given canvas.json (from fabric.js canvas) and attributes.json strings.  
It is listening at port 3000.  
POST your 'canvas.json' and 'attributes.json' to '/canvas-img'  
  
## Installation  
Package includes a pre-configured vagrant file with a nodejs server.  
The main steps for installing nodejs on ubuntu see file:  
vagrant-node/scripts/provision.sh  
  
To use vagrant see file:  
vagrant-node/README.md  
  
## Run the application
npm run start  
  
## Front-end:  
The main functianilites for front-end part can be found in the ticket-editor.js.  
The following libraries are required:  
- fabric.js (this is the base library for the ticket-editor)  
- bootstrap (js and css library)  
- jquery.js  
- jsPdf (save canvas as pdf)  
- fileinput.css  
  
The editor html part can be found in the index.html. Example is included.  
  
## Example for back-end part:  
// canvas.json  
var json_data = canvas.toDatalessJSON(['width', 'height']);  
// attributes.json  
var attributes = '{'  
    + '"name": "John Doe",'  
    + '"age": 29,'  
    + '"logos": {"logo": "http://example.com/logo-white.png"},'  
    + '"barcode": "http://example.com/barcode.jpg"'
    + '}';  
  
// ajax POST request  
var data = 'json=' + JSON.stringify(json_data) + '&attributes=' + JSON.stringify(attributes)  + '&imgBackEnd=' + false;  
var request = new XMLHttpRequest();  
request.open('POST', 'http://localhost:3000/canvas-img', true);  
request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');  
request.withCredentials = false;  
  
request.onload = function() {  
    if (request.status >= 200 && request.status < 400) {  
        // Success!  
        var data = JSON.parse(request.responseText);  
    } else {  
        console.log('We reached our target server, but it returned an error');  
    }  
};  
  
request.onerror = function() {  
    console.log('There was a connection error of some sort');  
};  
  
request.send(data);