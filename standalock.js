"use strict";

;(function(win, doc){

  function StandaLockClass(config){

    this.checkCanvasSupport();

    this.anchorSelector = config.anchor || 'script[src$="standalock.js"]';
    this.anchor = document.body.querySelector(this.anchorSelector);
    
    // Mandatory inputs
    if (!config.format) throw 'Missing format for "' + this.anchorSelector + '".';
    this.format = config.format;    


    // Optional inputs
    this.message = config.message;
    this.outputContainerSelector = config.outputanchor;
    this.data = config.data;
    this.decryptFn = config.decrypt || function(v){return v;};
    this.decryptUrl = config.decryptUrl;

    // Global state
    this._slider_value = 0.0; // represents percentage
    this._cursor_catched = false;
    this._passed = false; // prevents from running secured actions multiple times
    this._unlockError = false;

    // User implemented canvas and draw function (if any)
    this._loadDesign(config.design);
    this._sx = this._w * this._slider_value / 100;
  }

  StandaLockClass.prototype.checkCanvasSupport = function(){
    try {
      document.createElement('canvas').getContext('2d');
    }
    catch(e){
      alert("Canvas not supported!");
    }
  }

  // Load a user-provided design (if type is string, load a predefined design)
  StandaLockClass.prototype._loadDesign = function(design) {
    
    // No design instruction provided, load defaults
    if (!design) {
      design = this._fetchDesign('default');
    }

    // Load predefined embedded design
    if (typeof design === 'string') {
      design = this._fetchDesign(design);
    }

    // At this point, design should be user-provided
    if (typeof design !== 'object') {
      throw 'Problem loading user-provided design for "' + config.anchorSelector + '".';
    }

    // Load design
    this._drawLock      = design.drawLock;    // Bind user's function if any
    this._drawCursor    = design.drawCursor;  // Bind user's function if any
    this._width         = design.width;
    this._height        = design.height;
    this._cursor_radius = design.cursor_radius;
    this._x1            = design.x1;
    this._w             = design.w;
    this._y             = design.y;
    this._x_text        = design.x_text;
    this._y_text        = design.y_text;

    // Use picture instead of draw function
    if (!!design.image) {
      this.img = new Image();
      this.img.src = design.image;
      this._drawLock = this._drawDualImage; // Bind default draw to dual image mode
    }

    // Use default cursor design
    if (!design.drawCursor) {
      this._drawCursor = this._drawDefaultCursor;
    }
  }
    

    StandaLockClass.prototype._fetchDesign = function(designName) {

      function defaultLock(ctx, cursor_x) {

        // Helper function to create rounded rectangles
        CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
          if (w < 2 * r) r = w / 2;
          if (h < 2 * r) r = h / 2;
          this.beginPath();
          this.moveTo(x+r, y);
          this.arcTo(x+w, y,   x+w, y+h, r);
          this.arcTo(x+w, y+h, x,   y+h, r);
          this.arcTo(x,   y+h, x,   y,   r);
          this.arcTo(x,   y,   x+w, y,   r);
          this.closePath();
          return this;
        }

        // Lock
        var x = 10, y = 0, w = 443, h = 50, r = 40;
        var border = ctx.createLinearGradient(x, y, x, y+h);
        border.addColorStop(0, 'hsl(216,10%,40%)');
        border.addColorStop(1, 'hsl(216,10%,10%)');
        ctx.strokeStyle = border;
        ctx.lineWidth = 12;
        var background = ctx.createLinearGradient(x, y+10, x, y+h-10);
        background.addColorStop(0, 'hsl(0,0%,100%)');
        background.addColorStop(1, 'hsl(0,0%,85%)');
        ctx.fillStyle = background;
        var lock = ctx.roundRect(x, y+10, w, h, r);
        lock.fill();
        lock.stroke();

        // Empty slide bar
        var x = 95, y = 24, w = 343, h = 22, r = 40;
        var slidebackground = ctx.createLinearGradient(x, y, x, y+h);
        slidebackground.addColorStop(0, 'hsl(0,0%,75%)');
        slidebackground.addColorStop(0.1, 'hsl(0,0%,65%)');
        slidebackground.addColorStop(0.9, 'hsl(0,0%,85%)');
        slidebackground.addColorStop(1, 'hsl(0,0%,95%)');
        ctx.fillStyle = slidebackground;
        var slidebar = ctx.roundRect(x, y, w, h, r);
        slidebar.fill();

        ctx.globalCompositeOperation = "multiply";  // Add G.I.
        var slidebackground = ctx.createLinearGradient(x, y, x+w, y+h);
        slidebackground.addColorStop(0, 'hsl(0,0%,95%)');
        slidebackground.addColorStop(0.05, 'hsl(0,0%,100%)');
        slidebackground.addColorStop(0.95, 'hsl(0,0%,100%)');
        slidebackground.addColorStop(1, 'hsl(0,0%,95%)');
        ctx.fillStyle = slidebackground;
        var slidebar = ctx.roundRect(x, y, w, h, r);
        slidebar.fill();
        ctx.globalCompositeOperation = "source-over";

        ctx.globalCompositeOperation = "screen";  // Add G.I.
        var slidebackground = ctx.createLinearGradient(x, y, x+w, y+h);
        slidebackground.addColorStop(0, 'hsl(0,0%,0%)');
        slidebackground.addColorStop(0.5, 'hsl(0,0%,30%)');
        slidebackground.addColorStop(1, 'hsl(0,0%,0%)');
        ctx.fillStyle = slidebackground;
        var slidebar = ctx.roundRect(x, y, w, h, r);
        slidebar.fill();
        ctx.globalCompositeOperation = "source-over";

        // Filled slide bar
        var x = 97, y = 26, w = 339, h = 18, r = 340;
        var radgrad = ctx.createRadialGradient(x+60, y-10, 0, x, y, r);
        radgrad.addColorStop(0, 'hsl(76,93%,42%)');
        radgrad.addColorStop(1, 'hsl(80,95%,35%)');
        ctx.fillStyle = radgrad;
        var slidebar = ctx.roundRect(x, y, cursor_x-x, h, r);
        slidebar.fill();
/*
        ctx.globalCompositeOperation = "overlay"; // Add G.I.
        ctx.beginPath();
        if (cursor_x > x+w/4-1) ctx.rect(x+w/4-1, y, 1, h);
        if (cursor_x > x+2*w/4-1) ctx.rect(x+2*w/4-1, y, 1, h);
        if (cursor_x > x+3*w/4-1) ctx.rect(x+3*w/4-1, y, 1, h);
        ctx.fillStyle = "white";
        slidebar.fill();
        ctx.globalCompositeOperation = "source-over";*/

      };

      function defaultCursor(ctx, cursor_x) {
        // Cursor
        var x = cursor_x, y = 24+11, r = 13;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI, false);
        var radgrad = ctx.createRadialGradient(x, y, 0, x, y, r);
        radgrad.addColorStop(0, 'hsl(0,0%,85%)');
        radgrad.addColorStop(0.7, 'hsl(0,0%,80%)');
        radgrad.addColorStop(0.9, 'hsl(0,0%,80%)');
        radgrad.addColorStop(1, 'hsl(0,0%,65%)');
        ctx.fillStyle = radgrad;
        ctx.fill();
        ctx.globalCompositeOperation = "overlay"; // Add G.I.
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI, false);
        var radgrad = ctx.createLinearGradient(x-r, y-r, x+r, y+r);
        radgrad.addColorStop(0, 'hsl(0,0%,20%)');
        radgrad.addColorStop(0.5, 'hsl(0,0%,60%)');
        radgrad.addColorStop(0.5, 'hsl(0,0%,60%)');
        radgrad.addColorStop(1, 'hsl(0,0%,20%)');
        ctx.fillStyle = radgrad;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI, false);
        ctx.globalCompositeOperation = "source-over";
      };

      var defaultDesign = { 
        drawLock: defaultLock,
        drawCursor: defaultCursor,
        //image: 'progress-tiles.jpg',
        width: 460,
        height: 68,
        cursor_radius: 13,
        x1: 95 + 13,            // X position where the cursor starts
        w: 427 - 95 - 13,       // sliding course
        y: 24+11,               // Y position of center of the cursor
        x_text: 95 + 13 - 70,   // X position where to write text
        y_text: 24+11 + 7       // Y position where to write text
      };

      var defaultDualImageDesign = {
        image: 'progress-tiles.jpg',
        width: 469,
        height: 68,                   // half-height, one bar only if dual image provided
        cursor_radius: 13,
        x1: 114 + (13-1),             // X position where the progress segment starts
        x2: 445 - (13-1),             // X position where the progress segment ends
        w: (445 - (13-1)) - (114 + (13-1)),  // slider width
        y: 33,                        // Y position of center of the slider
        x_text: (114 + (13-1)) - 70,  // X position where to write text
        y_text: 33 + 7
      }

      switch (designName) {
        case "default":
          return defaultDesign;
        case "defaultImage":
          return defaultDualImageDesign;
        default:
          return defaultDesign;
      }

    }

  StandaLockClass.prototype._draw = function() {
    // Calculated x position where the overlayed image should end
    var cursor_pos = this._x1 + (this._w * this._slider_value) / 100; // relative to slide bar

    try {
      this._drawLock(this.ctx, cursor_pos);
      this._drawCursor(this.ctx, cursor_pos);
      this._drawText();
    }
    catch (e) {
      console.debug("Draw error on " + this.anchorSelector);
      throw e;
    }

  }

  StandaLockClass.prototype._drawDualImage = function(ctx, cursor_pos) {
    // Upper half, slide bar empty
    this.ctx.drawImage(this.img, 0, 0, this._width, this._height, 0, 0, this._width, this._height);
    // Lower half, slide bar full
    this.ctx.drawImage(this.img, 0, this._height, cursor_pos, this._height, 0, 0, cursor_pos, this._height);
  }

  StandaLockClass.prototype._drawDefaultCursor = function(ctx, cursor_pos) {
    this.ctx.beginPath();
    this.ctx.arc(cursor_pos, this._y, this._cursor_radius, 0, 2 * Math.PI, false);
    var radgrad = this.ctx.createRadialGradient(cursor_pos, this._y, 0, cursor_pos, this._y, this._cursor_radius);
    radgrad.addColorStop(0, 'hsl(0,0%,85%)');
    radgrad.addColorStop(0.7, 'hsl(0,0%,80%)');
    radgrad.addColorStop(0.9, 'hsl(0,0%,80%)');
    radgrad.addColorStop(1, 'hsl(0,0%,65%)');
    this.ctx.fillStyle = radgrad;
    this.ctx.fill();
  }

  StandaLockClass.prototype._drawText = function() {
    var text = '';
    if (this._passed === true) {
      this.ctx.font = "18pt Arial";
      if (this._unlockError === false) {
        this.ctx.fillStyle = "#66BB00";
        text = "✔";
      }
      else {
        this.ctx.fillStyle = "#AA0000";
        text = "✘";
      }
    }
    else
    {
      this.ctx.font = "14pt Arial";
      this.ctx.fillStyle = "grey";
      text = Math.round(this._slider_value) + " %";
    }
    this.ctx.fillText(text, this._x_text, this._y_text);
  }

  StandaLockClass.prototype.render = function() {
    // Generate HTML for the lock
    var docfrag = document.createDocumentFragment();
    var p = document.createElement('p');
    this.canvas = document.createElement('canvas');
    //this.canvas.setAttribute('style', 'border: 1px solid ; border-color: #ff0000');
    
    p.textContent = this.message;

    this.canvas.width = this._width;
    this.canvas.height = this._height;
    this.canvas.style.cursor = 'pointer';
    this._bindEvents();
    this.ctx = this.canvas.getContext('2d');

    docfrag.appendChild(p);
    docfrag.appendChild(this.canvas);

    if (!!this.outputContainerSelector) {
      this.ouputContainer = document.querySelector(this.outputContainerSelector);
    }
    else {
      this.ouputContainer = document.createElement('div');
      docfrag.appendChild(this.ouputContainer);
    }

    try{
      // No anchor given, place before configuration script by default
      if (this.anchor.nodeName === 'SCRIPT')
        this.anchor.parentNode.insertBefore(docfrag, this.anchor);
      else
      this.anchor.appendChild(docfrag);
    }
    catch(e){
      throw 'Can not find element ' + this.anchorSelector;
    }

    // Draw canvas!
    if (!!this.img) this.img.addEventListener('load', this._draw.bind(this), false);
    else this._draw();
  }

  StandaLockClass.prototype._bindEvents = function() {
    // handle clicks
    this.canvas.addEventListener('mousedown', this._onmousedown.bind(this), false);
    this.canvas.addEventListener('mousemove', this._onmousemove.bind(this), false);
    this.canvas.addEventListener('mouseup', this._onmouseup.bind(this), false);
    this.canvas.addEventListener('mouseout', this._onmouseout.bind(this), false);

    // handle touches for mobile devices
    this.canvas.addEventListener('touchstart', this._onmousedown.bind(this), false);
    this.canvas.addEventListener('touchmove', this._onmousemove.bind(this), false);
    this.canvas.addEventListener('touchend', function(){
      this._onmouseout();
      this._onmouseup();
    }.bind(this),false);

  };

  // Returns mouse position relatively to slide bar
  StandaLockClass.prototype._getMousePos = function(evt) {
    var rect = this.canvas.getBoundingClientRect();
    if (evt.targetTouches){
      evt.clientX = evt.targetTouches[0].pageX;
      evt.clientY = evt.targetTouches[0].pageY;
    }
    return {
      x: evt.clientX - rect.left - this._x1,
      y: evt.clientY - rect.top - this._y
    };
  }

  StandaLockClass.prototype._onmousemove = function(evt) {
    evt.preventDefault();

    if ((this._cursor_catched == false) || (this._passed === true)) {
      return;
    }
    var mousePos = this._getMousePos(evt);
    var s = mousePos.x / this._w * 100;
    if (s < 0.0) {
      s = 0.0;
    }
    if (s > 100.0) { // Access granted!
      s = 100.0;
      this._cursor_catched = false;
      this._passed = true;
      ///////////////////////////////////////
      ///// Launch secure commands here /////
      this._unlock();
      ///////////////////////////////////////
    }
    // Update slider value
    this._slider_value = s;
    // force redraw so that the progress bar follows the moving cursor
    this._draw();
  }

  StandaLockClass.prototype._onmouseup = function(evt) {
    this._cursor_catched = false;
    if (this._passed === true) {
      return false;
    }

    if (this._slider_value !== 100.0) {
      // In a slidelock, the cursor used to go back to original position
      // on mouse up.
      this._slider_value = 0;
      // force redraw so that the cursor is back to origin
      this._draw();
    }
  }

  StandaLockClass.prototype._onmousedown = function(evt) {
    var mousePos = this._getMousePos(evt);

    // Click is not on the bar
    if (!((mousePos.y >= -this._cursor_radius) && (mousePos.y <= this._cursor_radius))) {
      return false;
    }
    else if (this._passed === true) {
      return false;
    }

    // In standard cursors, the mouse used to catch the cursors anywhere
    // it is as soon as you click on the bar. If you want to get the same
    // behavior as standard cursors, just switch by reverting the condition.
    if (true) {
      // Slidelock behavior: need to catch the cursor itself to make it move.  
      if ((mousePos.x >= this._sx-20) && (mousePos.x <= this._sx+20)) {
        this._cursor_catched = true;
      }
    }
    else {
      // Standard cursor behavior: cursors goes where mouse clicks
      if  ((mousePos.x >= 0) && (mousePos.x <= this._w)){
        this._cursor_catched = true;
        this._slider_value = Math.round(mousePos.x / this._w * 100 * 100) / 100;
        // force redraw so that the cursor is 'catched' by the click
        this._draw();
      }
    }
  }

  StandaLockClass.prototype._onmouseout = function(evt) {
    this._cursor_catched = false;
    if (this._passed === true) {
      return false;
    }
    this._slider_value = 0;
    this._draw();
  }

  StandaLockClass.prototype._unlock = function() {  
      var o = {};
      if (!!this.decryptUrl){
          this._decryptFromServer();
      }
      else {
        this._decrypt();
      }
  }

  StandaLockClass.prototype._applyformat = function(format, obj){
    for(var val in obj){
      format = format.replace(new RegExp('{{'+val+'}}', 'g'), obj[val]);
    }
    this.ouputContainer.innerHTML = format;
  }

  StandaLockClass.prototype._decrypt = function(){
    var o = {};
    for(var d in this.data){
      o[d] = this.decryptFn(this.data[d])
    }
    this._applyformat(this.format, o);
  }

  StandaLockClass.prototype._decryptFromServer = function(){
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = false;
    xhr.addEventListener('load', function(evt){
      this._applyformat(this.format, JSON.parse(evt.target.response));
    }.bind(this), false);
    xhr.addEventListener('error', function(evt){
      this._unlockError = true;
      this._draw(); // terminate with visual feedback
    }.bind(this), false);
    xhr.open('POST', this.decryptUrl, true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify(this.data));
  }

  // expose globally
  var _jobs = [];
  win.StandaLock = win.StandaLock || {
    add: function(config){
      _jobs.push(new StandaLockClass(config));
      return this;
    },
    render: function(){
      _jobs.forEach(function(job){
        job.render();
      });
    }
  };

}(window, document));
