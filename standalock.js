( function() {"use strict";
        // this function is strict...
    }()
);

img = null;
canvas = null;
ctx = null;
slider = null;

// Graphics-dependant constants
iHEIGHT = 68; // half-height, one bar only 
iWIDTH = 469;
cursor_radius = 13;
x1 = 114 + (cursor_radius-1); // X position where the progress segment starts
x2 = 445 - (cursor_radius-1); // X position where the progress segment ends
w = x2 - x1;  // slider width
y = 33;  // Y position of center of the slider
x_text = x1 - 70;  // X position where to write text
y_text = y + 7;

// Global state
slider_value = 0.0; // represents percentage
cursor_catched = false;
passed = false; // prevents from running secured actions multiple times

vault = {}; // Personal Information encrypted vault
userDecryptFunc = null; // Decryption function
outputDiv = 'contact'; // Default output <div>


function drawBase(ctx) {

    ctx.drawImage(img, 0, 0, iWIDTH, iHEIGHT, 0, 0, iWIDTH, iHEIGHT);
}

function drawProgress(ctx) {
   
    // Calculated x position where the overalyed image should end
    x_end = x1 + (w * slider_value) / 100; // relative to slidebar

    ctx.drawImage(img, 0, iHEIGHT, x_end, iHEIGHT, 0, 0, x_end, iHEIGHT);

    // Text to screen
    ctx.fillStyle = "grey";
    ctx.font = "14pt Arial";
    ctx.fillText(Math.round(slider_value) + " %", x_text, y_text);

    /* Draw cursor */
    ctx.beginPath();
    ctx.arc(x_end, y, cursor_radius, 0, 2 * Math.PI, false);
    var radgrad = ctx.createRadialGradient(x_end, y, 0, x_end, y, cursor_radius);
    radgrad.addColorStop(0, 'hsl(0,0%,85%)');
    radgrad.addColorStop(0.7, 'hsl(0,0%,80%)');
    radgrad.addColorStop(0.9, 'hsl(0,0%,80%)');
    radgrad.addColorStop(1, 'hsl(0,0%,65%)');
    ctx.fillStyle = radgrad;
    ctx.fill();
}

function drawImage() {

    // Draw the base image - no progress
    drawBase(ctx);

    // Draw the progress segment level
    drawProgress(ctx);
}

// Returns mouse position relatively to slidebar
function getMousePos(canvas, evt) {

    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left - x1,
        y: evt.clientY - rect.top - y
    };
}

function insertStandaLock(standaDiv) {

    insertion  = '<p>Slide to unlock contact info</p>';
    insertion += '<canvas id="progress" width="' + iWIDTH + '" height="' + iHEIGHT + '" style="cursor: pointer;"></canvas>';
    // default global div for text and canvas is called 'standalock':
    if(typeof(standaDiv)==='undefined') standaDiv = 'standalock'; 
    document.getElementById(standaDiv).innerHTML = insertion;

    canvas = document.getElementById('progress');

    // Create the image resource
    img = new Image();

    // Canvas supported?
    if (canvas.getContext) {

        ctx = canvas.getContext('2d');
        img.onload = drawImage;
        img.src = 'progress-tiles.jpg';

        var sx = w * slider_value / 100; 

        canvas.addEventListener('mousedown', function(evt) {
            var mousePos = getMousePos(canvas, evt);
            //console.debug("mouse DOWN: ", 0, '<=', mousePos.x, '<=', w, '&&', -cursor_radius, '<=', mousePos.y, '<=', cursor_radius);

            // Click is not on the bar
            if (!((mousePos.y >= -cursor_radius) && (mousePos.y <= cursor_radius))) {
                return;
            }
            else if (passed === true) {
                return;
            }

            // Slidelock behavior: need to catch the cursor itself to make it move.
            if ((mousePos.x >= sx-20) && (mousePos.x <= sx+20)) {
                cursor_catched = true;
            }
            
            // In standard cursors, the mouse used to catch the cursor anywhere
            // it is as soon as you click on the bar.
            // If you want to get the same behavior as these standard cursors, 
            // just replace the conditional block above by the one following.
            // if  ((mousePos.x >= 0) && (mousePos.x <= w)){
            //     cursor_catched = true;
            //     slider_value = Math.round(mousePos.x / w * 100 * 100) / 100;
            //     // force redraw so that the cursor is 'catched' by the click
            //     drawImage(ctx);
            // }
            }, false);

        canvas.addEventListener('mousemove', function(evt) {
            if ((cursor_catched == false) || (passed === true)) {
                return;
            }
            var mousePos = getMousePos(canvas, evt);
            var s = slider_value; // slider value is in percent
            s = Math.round(mousePos.x / w * 100 * 100) / 100; // rounded to two decimals
            if (s < 0.0) {
                s = 0.0;
            }
            if (s > 100.0) { // Access granted!
                s = 100.0;
                cursor_catched = false;
                passed = true;
                ///////////////////////////////////////
                ///// Launch secure commands here /////
                securedAction();
                ///////////////////////////////////////
            } 
            // Update slider value
            slider_value = s;
            // force redraw so that the progress bar follows the moving cursor
            drawImage(ctx);
            }, false);

        canvas.addEventListener('mouseup', function(evt) {
            cursor_catched = false;
            if (passed === true) {
                return;
            }

            if (slider_value !== 100.0) {
                // In a slidelock, the cursor used to go back to original position
                // on mouse up.
                slider_value = 0;
                // force redraw so that the cursor is back to origin
                drawImage(ctx);
            }
            }, false);

        canvas.addEventListener('mouseout', function(evt) {
            cursor_catched = false;
            if (passed === true) {
                return;
            }
            slider_value = 0;
            // force redraw so that the cursor is back to origin
            drawImage(ctx);
            }, false);
    } else {
        alert("Canvas not supported!");
    }
}

function registerPI(key, value) {
    
    vault[key] = value; 
}

function registerDecryptFunc(func) {

    userDecryptFunc = func;
}

function decrypt(key) {
    if (!(key in vault)) throw "StandaLock: Personal information '" + key + "' not found";
    if (userDecryptFunc === null) throw "StandaLock: Missing decrypt function.";

    encrypted_msg = vault[key];
    decrypted_msg = userDecryptFunc(encrypted_msg);
    return decrypted_msg;
}

function bindOutputDiv(divName) {

    if (divName) {
        outputDiv = divName;
    }
}

function printPI() {

    out = document.getElementById(outputDiv);
    if (!out) throw "StandaLock: Output div '" + outputDiv + "' not found.";

    insertion  = '<p>';
    insertion += '<a href="mailto:' + decrypt('mail') + '">' + decrypt('mail') + '</a>';
    insertion += '&nbsp;&nbsp;|&nbsp;&nbsp;';
    insertion += '<a href="tel:' + decrypt('phone') + '">' + decrypt('phone') + '</a>';
    insertion += '</p>';
    out.innerHTML = insertion;
}

function securedAction() {

    // 3- Safely insert sensitive information in your HTML document
    printPI();
}

function init() {

    // 1- Store encrypted info, e.g. here just the Base64 encoding
    // of an email address [obtainded with window.btoa()]
    registerPI('mail', "cHJpdmF0ZUBleGFtcGxlLmNvbQ==");
    registerPI('phone', "MSg1NTUpNTU1LTU1NTU=");

    // 2- Register your own 'decrypt' function here
    myDecryptFunc = function (encrypted_msg) {
        decrypted_msg = window.atob(encrypted_msg);
        return decrypted_msg;
    }
    registerDecryptFunc(myDecryptFunc);

    // 3- Bind to your own output div
    bindOutputDiv('contact'); // optional since default is already 'contact'

    insertStandaLock();
}

//////////////////////////////////
//// Auto-init on script load ////
document.addEventListener('DOMContentLoaded', init, false);
//////////////////////////////////
