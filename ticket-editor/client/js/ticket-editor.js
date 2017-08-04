$(document).ready(function () {
    // Bootstrap tooltip
    $('[data-toggle="tooltip"]').tooltip();
});


/**
 * Ticket editor object
 * 
 * @param Object canvas, canvas DOM id
 * @param string url, node API url (default: http://localhost:3000)
 * @param int height, canvas' height (default: 300)
 * @param int width, canvas' width (default: 500)
 * @param json ticketJSON, json string of the canvas object (default: generated from canvas object)
 * @param json attributes, json string with attribute placeholders (default: {})
 * @param string googleFontApiKey, API key to load google fonts (default: fonts array)
 * @param Object previewCanvas, canvas DOM id for preview the image
 * @param boolean isBarcode, barcode placeholder option (default: true)
 * @param boolean imgBackEnd, automatic image generation in node.js back-end (default: false)
 */
var TicketEditor = function (canvas, url, height, width, ticketJSON, attributes, googleFontApiKey, previewCanvas, isBarcode, imgBackEnd) {
    this.canvas = canvas;
    this.url = typeof url !== 'undefined' ? url : 'http://localhost:3000';
    this.height = typeof height !== 'undefined' && typeof parseInt(height) === 'number' ? height : 300;
    this.width = typeof width !== 'undefined' && typeof parseInt(width) === 'number' ? width : 500;
    this.attributes = typeof attributes !== 'undefined' ? attributes : {};
    this.googleFontApiKey = typeof googleFontApiKey !== 'undefined' ? googleFontApiKey : null;
    this.isBarcode = typeof isBarcode === 'undefined' || (typeof isBarcode !== 'undefined' && isBarcode === true) ? true : false;
    this.previewCanvas = previewCanvas;
    this.imgBackEnd = typeof imgBackEnd !== 'undefined' && imgBackEnd === true ? true : false;

    // ticketedtior instance
    var TE = this;

    // set fabric default attributes
    fabric.Object.prototype.transparentCorners = false;
    fabric.Object.prototype.padding = 5;

    // create canvas object
    var canvas = this.__canvas = new fabric.Canvas(this.canvas);
    canvas.setHeight(this.height);
    canvas.setWidth(this.width);


    /**
     * Change canvas size
     */
    document.getElementById('set_canvas_size').onclick = function () {
        canvas.setHeight(document.getElementById('canvas_height').value);
        canvas.setWidth(document.getElementById('canvas_width').value);
        canvas.renderAll();
    }


    // set default state for inputs/buttons based on selected object attributes
    canvas.on("object:selected", function (options) {
        // text decorations
        textDecorationButtons()

        // font-family / text-align
        if (activeObjectIsText()) {
            document.getElementById('text-align').value = canvas._activeObject.textAlign;
            document.getElementById('font-family').value = canvas._activeObject.fontFamily;
        }

        // font size
        getObjectAttribute('fontSize', 'font-size');
        // line height
        getObjectAttribute('lineHeight', 'line-height');
        // Stroke
        getObjectAttribute('strokeWidth', 'stroke-width');
        // colors
        getObjectAttribute('fill', 'color');
        getObjectAttribute('stroke', 'stroke-color');
        getObjectAttribute('backgroundColor', 'bg-color');
    });

    // remove selections for text decoration buttons if no object is selected
    canvas.on("selection:cleared", function (options) {
        textDecorationButtons()
    });



    /**
     * Insert google webfonts
     */
    if (this.googleFontApiKey !== null) {
        // load all google fonts
        $.getJSON('https://www.googleapis.com/webfonts/v1/webfonts?key=' + this.googleFontApiKey, function (response) {
            var fonts = [];

            response.items.forEach(function (font) {
                fonts.push(font.family)
            });

            addGoogleFonts(fonts);
        });
    } else {
        // default fonts array
        var fonts = [
            'Courgetten',
            'Croissant+One',
            'Emblema+One',
            'Graduate',
            'Hammersmith+One',
            'Indie+Flower',
            'Krona+Onen',
            'Lora',
            'Oswald',
            'Oxygen',
            'Ribeye',
            'Ranchers'
        ];
        addGoogleFonts(fonts);
    }

    /**
     * Include google fonts trough webfont.js
     * @param array fonts
     */
    function addGoogleFonts(fonts) {
        // add options to font-family select
        var select = document.getElementById("font-family");
        for (var i = 0; i < fonts.length; i++) {
            var opt = fonts[i];
            var el = document.createElement("option");
            el.textContent = opt.replace('+', ' ');
            el.value = opt;
            select.appendChild(el);
        }

        // webfont.js config
        WebFontConfig = {
            google: {
                families: fonts,
            },
            active: function () {
                canvas.renderAll();
            }
        };

        (function () {
            var src = ('https:' === document.location.protocol ? 'https' : 'http') +
                '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';

            $.getScript(src, function (data) {
                canvas.renderAll();
            });
        })();
    }


    /**
     * Text decoration buttons state
     */
    function textDecorationButtons() {
        setTextDecorationButton('fontWeight', 'bold');
        setTextDecorationButton('fontStyle', 'italic');
        setTextDecorationButton('textDecoration', 'underline');
        setTextDecorationButton('textDecoration', 'overline');
        setTextDecorationButton('textDecoration', 'line-through');
    }



    /**
     * Determine if the type of the active object is text
     * @returns boolean
     */
    function activeObjectIsText() {
        return (canvas.getActiveObject() !== null && canvas._activeObject.type === "i-text");
    }



    /**
     * Set state for text decoration buttons when object is selected
     */
    function setTextDecorationButton(attribute, buttonName) {
        if (activeObjectIsText() && canvas._activeObject[attribute] === buttonName) {
            document.getElementById('text-cmd-' + buttonName).classList.add("active");
        } else {
            document.getElementById('text-cmd-' + buttonName).classList.remove("active");
        }
    }



    /**
     * Stroke/font size/line height & color (text/stroke) values based on selected object attributes
     */
    function getObjectAttribute(attribute, buttonName) {
        if (activeObjectIsText() && canvas._activeObject[attribute] !== null) {
            document.getElementById('text-' + buttonName).value = canvas._activeObject[attribute];
        }
    }



    /**
     * 'Add text' function
     */
    document.getElementById('addText').onclick = function () {
        canvas.add(new fabric.IText('Tap and Type', {
            fill: '#000000',
            stroke: '#000000',
            strokeWidth: 0,
            backgroundColor: null,
            fontSize: 17,
            fontFamily: 'arial',
            lineHeight: 1.2,
            left: 50,
            top: 100
        }));
    }



    /**
     * 'Add placeholder' function
     */
    document.getElementById('addPlaceholder').onclick = function () {
        if (activeObjectIsText()) {
            canvas._activeObject.setText(canvas._activeObject.getText() + document.getElementById('placeholder').value);
            canvas.renderAll();
        }
    }



    /**
     * Set the value of the input to null on each onclick event. 
     * This will reset the input's value and trigger the onchange event even if the same path is selected.
     */
    document.getElementById('file').onclick = function () {
        this.value = null;
    };
    document.getElementById('background').onclick = function () {
        this.value = null;
    };




    /**
     * Upload image file
     */
    document.getElementById('file').addEventListener("change", function (e) {
        var file = e.target.files[0];
        var reader = new FileReader();
        reader.onload = function (f) {
            var data = f.target.result;
            fabric.Image.fromURL(data, function (img) {
                var oImg = img.set({
                    left: 0,
                    top: 0,
                    angle: 00,
                }).scale(0.9);

                canvas.add(oImg).renderAll();
                var a = canvas.setActiveObject(oImg);
                var dataURL = canvas.toDataURL({
                    format: 'png',
                    quality: 0.8
                });
            });
        };
        reader.readAsDataURL(file);
    });



    /**
     * Delete objects function
     */
    document.getElementById('deleteObjects').onclick = function () {
        var activeObject = canvas.getActiveObject(),
            activeGroup = canvas.getActiveGroup();
        if (activeObject) {
            if (confirm('Are you sure?')) {
                canvas.remove(activeObject);
            }
        } else if (activeGroup) {
            if (confirm('Are you sure?')) {
                var objectsInGroup = activeGroup.getObjects();
                canvas.discardActiveGroup();
                objectsInGroup.forEach(function (object) {
                    canvas.remove(object);
                });
            }
        }
    }



    /**
     * Upload background image
     */
    document.getElementById('background').addEventListener("change", function (e) {
        var file = e.target.files[0];
        var reader = new FileReader();
        reader.onload = function (f) {
            var data = f.target.result;

            fabric.Image.fromURL(data, function (img) {
                var bgImg = canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
                    backgroundImageOpacity: 0.5,
                    backgroundImageStretch: false
                });
            });
        };
        reader.readAsDataURL(file);
    });



    /**
     * Stretch background image
     */
    fabric.util.addListener(document.getElementById('toggle-stretch'), 'click', function () {
        if (!canvas.backgroundImage) return;
        canvas.backgroundImage.width = canvas.getWidth();
        canvas.backgroundImage.height = canvas.getHeight();
        canvas.renderAll();
    });



    /**
     * Delete background
     */
    document.getElementById('deleteBackground').onclick = function () {
        if (confirm('Are you sure?')) {
            canvas.setBackgroundImage(0, canvas.renderAll.bind(canvas));
        }
    }



    /**
     * Change background opacity
     */
    document.getElementById('background-opacity').onchange = function () {
        if (canvas.backgroundImage !== null) {
            canvas.backgroundImage.opacity = this.value;
            canvas.renderAll();
        }
    };



    /**
     * Text editor functions 
     */
    document.getElementById('font-family').onchange = function () {
        if (activeObjectIsText()) {
            canvas.getActiveObject().setFontFamily(this.value);
            canvas.renderAll();
        }
    };
    document.getElementById('text-align').onchange = function () {
        if (activeObjectIsText()) {
            canvas.getActiveObject().setTextAlign(this.value);
            canvas.renderAll();
        }
    };
    document.getElementById('text-font-size').onchange = function () {
        if (activeObjectIsText()) {
            canvas.getActiveObject().setFontSize(this.value);
            canvas.renderAll();
        }
    };
    document.getElementById('text-color').onchange = function () {
        if (activeObjectIsText()) {
            canvas.getActiveObject().setFill(this.value);
            canvas.renderAll();
        }
    };
    document.getElementById('text-bg-color').onchange = function () {
        if (activeObjectIsText()) {
            canvas.getActiveObject().setBackgroundColor(this.value);
            canvas.renderAll();
        }
    };
    document.getElementById('text-line-height').onchange = function () {
        if (activeObjectIsText()) {
            canvas.getActiveObject().setLineHeight(this.value);
            canvas.renderAll();
        }
    };
    document.getElementById('text-stroke-width').onchange = function () {
        if (activeObjectIsText()) {
            canvas.getActiveObject().setStrokeWidth(this.value);
            canvas.renderAll();
        }
    };
    document.getElementById('text-stroke-color').onchange = function () {
        if (activeObjectIsText()) {
            canvas.getActiveObject().setStroke(this.value);
            canvas.renderAll();
        }
    };



    /**
     * Set text style based on font decoration button 
     */
    setFontDecoration('fontWeight', 'bold');
    setFontDecoration('fontStyle', 'italic');
    setFontDecoration('textDecoration', 'underline');
    setFontDecoration('textDecoration', 'overline');
    setFontDecoration('textDecoration', 'line-through');

    /**
     * Change font decoration functions
     * Remove or add class 'active' to buttons
     */
    function setFontDecoration(attribute, buttonName) {
        document.getElementById('text-cmd-' + buttonName).onclick = function () {
            if (activeObjectIsText()) {
                var className = 'active';
                var selectedObject = canvas.getActiveObject();
                canvas.getActiveObject().set(attribute, "");
                if (this.classList) {
                    this.classList.toggle(className);
                    if (this.classList) {
                        if (this.classList.contains(className)) {
                            canvas.getActiveObject().set(attribute, buttonName);
                            if (buttonName == "underline") {
                                setFontDecorationState("line-through");
                                setFontDecorationState("overline");
                            } else if (buttonName == "line-through") {
                                setFontDecorationState("underline");
                                setFontDecorationState("overline");
                            } else if (buttonName == "overline") {
                                setFontDecorationState("underline");
                                setFontDecorationState("line-through");
                            }
                        }
                    } else {
                        new RegExp('(^| )' + className + '( |$)', 'gi').test(this.className);
                    }
                    this.blur();
                    canvas.deactivateAll().renderAll();
                    canvas.setActiveObject(selectedObject);
                } else {
                    var classes = this.className.split(' ');
                    var existingIndex = classes.indexOf(className);

                    if (existingIndex >= 0) {
                        classes.splice(existingIndex, 1);
                    } else {
                        classes.push(className);
                    }

                    this.className = classes.join(' ');
                }
            }
        };
    }



    /**
     * Remove 'active' class from button
     */
    function setFontDecorationState(buttonName) {
        var className = 'active';
        if (document.getElementById("text-cmd-" + buttonName).classList.contains(className)) {
            document.getElementById("text-cmd-" + buttonName).classList.remove(className);
        }
    }



    /**
     * Bring to front selected object
     */
    document.getElementById('bringToFront').onclick = function () {
        if (canvas.getActiveObject()) {
            canvas._activeObject.bringToFront();
        }
    }

    /**
     * Send backwards selected object
     */
    document.getElementById('sendToBack').onclick = function () {
        if (canvas.getActiveObject()) {
            canvas._activeObject.sendToBack();
        }
    }



    /**
     * Using a button click, rotate the active object
     */
    document.getElementById('rotate').onclick = function () {
        rotateObject(15);
    };
    document.getElementById('rotateBack').onclick = function () {
        rotateObject(-15);
    };

    /**
     * Rotate object function
     */
    function rotateObject(angle) {
        if (canvas._activeObject) {
            // rotate only if the object is not the barcode element
            if (!(canvas._activeObject.id !== undefined && canvas._activeObject.id === "barcode")) {
                var curAngle = canvas._activeObject.angle;
                canvas._activeObject.setAngle(curAngle + angle);
                canvas.renderAll();
            }
        }
    }



    /**
     * Generate barcode placeholders
     */
    if (this.isBarcode) {
        document.getElementById('barcodeVertical').onclick = function () {
            barcodeVertical();
        }

        document.getElementById('barcodeHorizontal').onclick = function () {
            barcode(0, 197, 117, 240, 0);
        }

        // barcode vertical function (default)
        function barcodeVertical() {
            barcode(397, 300, 435, 185, 270);
        }


        /**
         * Add object as a barcode placeholder
         */
        function barcode(rectLeftPos, rectTopPos, textLeftPos, textTopPos, angle) {
            // remove barcode object if it exists
            canvas.getObjects().forEach(function (o) {
                if (o.id === 'barcode') {
                    canvas.remove(o);
                }
            });
            // create a rectangle with a fill and a different color stroke
            var rect = new fabric.Rect({
                left: rectLeftPos,
                top: rectTopPos,
                width: 297,
                height: 100,
                angle: angle,
                fill: 'rgba(255,255,255,1)',
                stroke: 'rgba(0,0,0,1)',
                strokeWidth: 3,
                transformMatrix: [1, 0, 0, 1, 0, 0]
            });
            // add text for rectangle
            var text = new fabric.IText("Barcode", {
                fontFamily: 'Courier New',
                left: textLeftPos,
                top: textTopPos,
                angle: angle,
                fontSize: 16,
                fill: '#000000'
            });
            // group rectangle & text
            var group = new fabric.Group([rect, text]);
            // no controls
            group.hasControls = false;
            // set id 
            group.id = 'barcode';
            // add to canvas
            canvas.add(group);
            canvas.setActiveObject(group);
            canvas.renderAll();
        }

        // place default barcode placeholder
        barcodeVertical();
    }


    /**
     * Generate base64 image from canvas (procces is in node.js back-end)
     */
    var saveJSON = function (isPdf) {
        // create json from canvas
        TE.ticketJSON = typeof ticketJSON !== 'undefined' && ticketJSON !== '' ? ticketJSON : canvas.toDatalessJSON(['width', 'height']);

        // ajax POST request
        var data = 'json=' + JSON.stringify(TE.ticketJSON) + '&attributes=' + JSON.stringify(TE.attributes) + '&imgBackEnd=' + TE.imgBackEnd;
        var request = new XMLHttpRequest();
        request.open('POST', TE.url + '/canvas-img', true);
        request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
        request.withCredentials = false;

        request.onload = function () {
            if (request.status >= 200 && request.status < 400) {
                // Success!
                var data = JSON.parse(request.responseText).image;

                // generate & download pdf
                if (isPdf !== undefined && isPdf === true) {
                    var pdf = new jsPDF();
                    pdf.addImage(data, 'JPEG', 0, 0);
                    var download = document.getElementById('download_pdf');
                    pdf.save("download.pdf");
                } else {
                    // generate & download image
                    data = base64ToArrayBuffer(data.replace(/^data:image\/[a-z]+;base64,/, ""));
                    saveByteArray([data], 'canvas.jpg');
                }


            } else {
                console.log('We reached our target server, but it returned an error');
            }
        };

        request.onerror = function () {
            console.log('There was a connection error of some sort');
        };

        request.send(data);
    };

    /**
     * Download pdf
     */
    document.getElementById('download_pdf').onclick = function () {
        saveJSON(true);
    };


    /**
     * Download image
     */
    document.getElementById('btn_get_canvas_json').onclick = function () {
        saveJSON();
    };

    /**
     * Convert base64 string to buffer
     * @param string base64
     */
    function base64ToArrayBuffer(base64) {
        var binaryString = window.atob(base64);
        var binaryLen = binaryString.length;
        var bytes = new Uint8Array(binaryLen);
        for (var i = 0; i < binaryLen; i++) {
            var ascii = binaryString.charCodeAt(i);
            bytes[i] = ascii;
        }
        return bytes;
    }

    /**
     * Save byteArray
     */
    var saveByteArray = (function () {
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        return function (data, name) {
            var blob = new Blob(data, {
                    type: "octet/stream"
                }),
                url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = name;
            a.click();
            window.URL.revokeObjectURL(url);
        };
    }());



    /**
     * Preview generated canvas image 
     * Load canvas js in front-end
     */
    if (this.previewCanvas !== undefined) {
        // canvas to show json data
        var canvas_ = new fabric.Canvas(this.previewCanvas);
        canvas_.setHeight(canvas.getHeight());
        canvas_.setWidth(canvas.getWidth());

        // function for preview
        var previewImage = function () {
            var json_data = canvas.toDatalessJSON(['width', 'height']);
            var logoUrl, // temp variable for logo urls
                json_temp; // temp variable for canvas json

            // parse attributes.json & set temp variable
            if (TE.attributes !== undefined) {
                json_temp = JSON.parse(TE.attributes);
            }

            // use templateEngine for text objects
            if (json_data.objects !== undefined) {
                json_data.objects.forEach(function (obj, idx) {
                    // text objects
                    if (obj.type === "i-text" && obj.text !== "Barcode") {
                        // replace placeholder with logo url
                        var text_temp = templateEngine(obj.text, json_temp);
                        // replace object text attribute if it is not an image url
                        if (text_temp && (!validImgFile(text_temp) || !validURL(logoUrl))) {
                            obj.text = templateEngine(text_temp, json_temp);
                        }
                    }
                });
            }

            // change object data, use TemplateEngine
            if (json_data.objects !== undefined) {
                json_data.objects.forEach(function (obj) {
                    // text objects
                    if (obj.type === "i-text") {
                        // replace placeholder with logo url
                        if (json_temp !== undefined && json_temp.logos !== undefined) {
                            logoUrl = templateEngine(obj.text, json_temp.logos);

                            // image
                            // insert image if the string is a valid url
                            if (validURL(logoUrl)) {

                                fabric.Image.fromURL(logoUrl, function (img) {
                                    canvas_.add(img.set({
                                        left: obj.left,
                                        top: obj.top
                                    }).scale(0.4));

                                });
                            }
                        }
                    }

                    // insert barcode
                    if (obj.type === "group") {
                        if (1 in obj.objects && obj.objects[1].type === "i-text" && obj.objects[1].text === "Barcode") {
                            // barcode position
                            var barcodeLeft = obj.objects[0].left * obj.scaleX + obj.left + (obj.width / 2) * obj.scaleX;
                            var barcodeTop = obj.objects[0].top * obj.scaleY + obj.top + (obj.height / 2) * obj.scaleY;
                            // barcode size & angle
                            var barcodeWidth = obj.objects[0].width + obj.objects[0].strokeWidth;
                            var barcodeHeight = obj.objects[0].height + obj.objects[0].strokeWidth;
                            var barcodeAngle = obj.angle + obj.objects[0].angle;

                            // insert barcode image
                            fabric.Image.fromURL(json_temp.barcode, function (myImg) {
                                canvas_.add(myImg.set({
                                    left: barcodeLeft,
                                    top: barcodeTop,
                                    width: barcodeWidth,
                                    height: barcodeHeight,
                                    angle: barcodeAngle,
                                }));
                            });
                        }
                    }
                });

                // load fabric canvas from json
                canvas_.loadFromJSON(json_data, canvas_.renderAll.bind(canvas_));
            };
        };

        // onclick event
        document.getElementById('btn_preview').onclick = function () {
            previewImage();
        };
    } else {
        document.getElementById('btn_preview').style.display = 'none';
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



    /**
     * Function to check if a string is a valid url
     */
    function validURL(s) {
        var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
        return regexp.test(s);
    }



    /**
     * Check if the given string is a valid image
     * @param string file
     */
    function validImgFile(file) {
        return (file.match(/\.(jpeg|jpg|gif|png)$/) != null);
    }

}