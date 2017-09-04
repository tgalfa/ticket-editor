//
// # SimpleServer
//
// A simple server using Express
//
var http = require('http');
var path = require('path');
var async = require('async');
var express = require('express');

//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);
router.use(express.static(path.resolve(__dirname, 'client')));

//
// Parse incoming request bodies
//
var bodyParser = require('body-parser')
router.use(bodyParser.json({
    limit: '10mb'
})); // to support JSON-encoded bodies
router.use(bodyParser.urlencoded({
    limit: '10mb',
    extended: true
}));

//
// Server listening at 0.0.0.0:3000
//
server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function () {
    var addr = server.address();
    console.log("Server listening at", addr.address + ":" + addr.port);
});

//
// File I/O module
//
var fs = require('fs');

//
// Fabric js module
//
var fabric = require('fabric').fabric;

//
// resize base64 image module & dependencies
//
var should = require('should'),
    base64resize = require('base64resize'),
    validator = require('validator');

// directory path
const WORK_PATH = __dirname + '/tmp/';

//
// global variables
//
global.PNG = require('png-js').PNG;
global.atob = require("atob");


/**
 * Middleware  
 * Add headers
 */
router.use(function (req, res, next) {

    // Website you wish to allow to connect
    var allowedOrigins = ['http://localhost:8080'];
    var origin = req.headers.origin;
    if(allowedOrigins.indexOf(origin) > -1){
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});



/**
 * Generate image from canvas
 */
router.post('/canvas-img', function (req, res) {
    var imgFileName = WORK_PATH + 'temp_' + makeid() + '.png';
    var logoUrl, // temp variable for logo urls
        json_temp, // temp variable for canvas json
        images = 0, // counter for images
        count_images = 0, // counter for placed images
        has_barcode = false; // has a barcode

    // parse json data
    var json_data = JSON.parse(req.body.json);
    var attributes = JSON.parse(req.body.attributes);

    // fabric canvas
    var canvasFabric = fabric.createCanvasForNode(parseInt(json_data.width), parseInt(json_data.height));

    // parse attributes.json & set temp variable
    if (attributes !== undefined) {
        json_temp = JSON.parse(attributes);
    }

    // use templateEngine for text objects
    if (json_data.objects !== undefined) {
        json_data.objects.forEach(function (obj, idx) {
            // text objects
            if (obj.type === "i-text") {
                // replace placeholder with logo url
                var text_temp = templateEngine(obj.text, json_temp);
                // replace object text attribute if it is not an image url
                if (text_temp && (!validImgFile(text_temp) || !validURL(logoUrl))) {
                    obj.text = templateEngine(text_temp, json_temp);
                }
            }
        });
    }

    if(json_data.width !== undefined){
        json_data.width = parseInt(json_data.width);
    }

    if(json_data.height !== undefined){
        json_data.height = parseInt(json_data.height);
    }

    // async.series: Run multiple tasks one after another and once they are finish execute something else
    async.series(
        [
            // load fabric canvas from json
            function loadCanvasFromJSON(callback){
                canvasFabric.loadFromDatalessJSON(json_data, function() {
                    callback();
                });
            },
            // if background image is set to full screen in front-end use canvas size for the background image
            function setResizedBackground(callback) {
                if (json_data.backgroundImage != undefined && json_data.backgroundImage.width == canvasFabric.width && json_data.backgroundImage.height == canvasFabric.height) {
                    // resize background image to canvas size   
                    base64resize({
                        src: json_data.backgroundImage.src,
                        width: canvasFabric.width,
                        height: canvasFabric.height,
                        withPrefix: true
                    }, function (err, resized) {
                        should.not.exist(err);
                        validator.isBase64(resized).should.be.true;

                        // condition for compering original img & resized img
                        //json_data.backgroundImage.src.length.should.be.above(resized.length);

                        // set background
                        canvasFabric.setBackgroundImage(resized);

                        callback();
                    });
                } else {
                    callback();
                }
            },
            // insert pre-placed images
            function insertPrePlacedImages(callback) {
                // iterate through the json object
                if (json_data.objects !== undefined) {
                    json_data.objects.forEach(function (obj, idx) {
                        // text objects
                        if (obj.type === "i-text" && json_temp !== undefined && json_temp.logos !== undefined) {
                            // replace placeholder with logo url
                            logoUrl = templateEngine(obj.text, json_temp.logos);
                            // insert image if the string is a valid image & valid url (or the file exist in the filesystem)
                            if (validImgFile(logoUrl) && (fs.existsSync(logoUrl) || validURL(logoUrl))) {
                                // increase images counter
                                images++;
                                // add image to canvas
                                fabric.Image.fromURL(logoUrl, function (myImg) {
                                    canvasFabric.add(myImg.set({
                                        left: obj.left,
                                        top: obj.top
                                    }).scale(0.4));
                                    
                                    // remove text object
                                    var textObj =  getItemByAttr(canvasFabric, 'text', obj.text);
                                    if(textObj != null) textObj.remove();

                                    // image added to canvas
                                    count_images++;
                                    
                                    // callback if all the images have been added to the canvas
                                    if (count_images === images) {
                                        callback();
                                    }
                                });
                            }
                        }
                    });
                }

                if (json_data.objects === undefined || images === 0) {
                    callback();
                }
            },
            // insert barcode
            function insertBarcode(callback) {
                // iterate through the json object
                if (json_data.objects !== undefined) {
                    for (var obj of JSON.parse(req.body.json).objects) {
                        // group object is a barcode
                        if (obj.type === "group" && obj.objects !== undefined && 1 in obj.objects && obj.objects[1].type === "i-text" && obj.objects[1].text === "Barcode") {
                            // has a barcode
                            has_barcode = true;
                            // barcode position
                            var barcodeLeft = obj.objects[0].left * obj.scaleX + obj.left + (obj.width / 2) * obj.scaleX;
                            var barcodeTop = obj.objects[0].top * obj.scaleY + obj.top + (obj.height / 2) * obj.scaleY;
                            // barcode size & angle
                            var barcodeWidth = obj.objects[0].width + 4 * obj.objects[0].strokeWidth;
                            var barcodeHeight = obj.objects[0].height + 4 * obj.objects[0].strokeWidth;
                            var barcodeAngle = obj.angle + obj.objects[0].angle;

                            break;

                        }
                    };
                }

                //load the image first
                if (json_temp !== undefined && has_barcode) {
                    fabric.Image.fromURL(json_temp.barcode, function (myImg) {
                        // set image attributes
                        myImg.set({
                            left: barcodeLeft,
                            top: barcodeTop,
                            angle: barcodeAngle,
                        });
                        // scale image
                        if (barcodeAngle === 0) {
                            // horizontal
                            myImg.scaleToWidth(barcodeWidth);
                        } else {
                            // vertical
                            myImg.scaleToHeight(barcodeWidth);
                        }
                        // remove barcode group object
                        var barcodeObj = getItemByAttr(canvasFabric, 'id', 'barcode');
                        if(barcodeObj != null){ 
                            barcodeObj._objects.forEach(function (object, key) {
                                canvasFabric.remove(object);
                                barcodeObj.removeWithUpdate(object);
                            });
                        }
                        // add image to canvas
                        canvasFabric.add(myImg);

                        if(req.body.imgBackEnd == 'true'){
                            var out = fs.createWriteStream(imgFileName);
                            var stream = canvasFabric.createPNGStream();
    
                            stream.on('data', function (chunk) {
                                console.log("Write chunk for", imgFileName);
                                out.write(chunk);
                            });
    
                            stream.on('end', function () {
                                console.log("End stream for", imgFileName);
                            });
                        }

                        callback();
                    });
                } else {
                    if(req.body.imgBackEnd == 'true'){
                        var out = fs.createWriteStream(imgFileName);
                        var stream = canvasFabric.createPNGStream();
    
                        stream.on('data', function (chunk) {
                            console.log("Write chunk for", imgFileName);
                            out.write(chunk);
                        });
    
                        stream.on('end', function () {
                            console.log("End stream for", imgFileName);
                        });
                    }

                    callback();
                }
            }
        ],
        function (err) {
            // send response
            //console.log(canvasFabric.toDataURL('image/jpeg', 1.0));
            if (!err) {
                // create json object
                res.end(
                    '{' +
                    '"image" : "' + canvasFabric.toDataURL('image/jpeg', 1.0) + '"' +
                    '}'
                );
            } else {
                res.end('An error occurred!');
            }
        }
    );
});



/**
 * Find an object of a canvas based on a given attribute name
 * @param  Object canvas
 * @param  string attr
 * @param  string name
 * @return Object
 */
function getItemByAttr(canvas, attr, name) {
    var object = null,
    objects = canvas.getObjects();
    for (var i = 0, len = canvas.size(); i < len; i++) {
        if (objects[i][attr] && objects[i][attr] === name) {
            object = objects[i];
            break;
        }
    }
    return object;
};




/**
 * Generate random string
 */
function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}



/**
 * Check if the given string is a valid image
 * @param string file
 */
function validImgFile(file) {
    return (file.match(/\.(jpeg|jpg|gif|png)$/) != null);
}



/**
 * Check if the given string is a valid url
 * @param string s
 */
function validURL(s) {
    var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
    return regexp.test(s);
}



/**
 * JavaScript template engine 
 * http://krasimirtsonev.com/blog/article/Javascript-template-engine-in-just-20-line
 * @param string html
 * @param json options
 */
var templateEngine = function (html, options) {
    html = html.replace(/[\n]/g, '\\n');
    var re = /<%([^%>]+)?%>/g,
        reExp = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g,
        code = 'var r=[];\n',
        cursor = 0,
        match;
    var add = function (line, js) {
        js ? (code += line.match(reExp) ? line + '\\n' : 'r.push(' + line + ');\n') :
            (code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
        return add;
    }
    while (match = re.exec(html)) {
        add(html.slice(cursor, match.index))(match[1], true);
        cursor = match.index + match[0].length;
    }
    add(html.substr(cursor, html.length - cursor));
    code += 'return r.join("");';
    return new Function(code.replace(/[\r\t\n]/g, '')).apply(options);
}