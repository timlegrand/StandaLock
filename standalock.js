"use strict";

;(function(win, doc){

  function StandaLockClass(config){

    this.checkCanvasSupport();

    // Mandatory inputs
    if (!config.placeholder) throw 'Missing placeholder.';
    if (((!config.decrypt) && (!config.decryptUrl)) && ((!config.template) && (!config.data))) throw 'Missing decrypt method for "' + config.placeholderSelector + '".';
    if (!config.template) throw 'Missing template for "' + config.placeholderSelector + '".';

    this.placeholder = document.querySelector(config.placeholder);
    this.placeholderSelector = config.placeholder;
    this.template = config.template;
    
    // Optional inputs
    this.message = config.message;
    this.outputContainerSelector = config.outputPlaceholder;
    this.data = config.data;
    this.decryptFn = config.decrypt;
    this.decryptUrl = config.decryptUrl;

    // Global state
    this._slider_value = 0.0; // represents percentage
    this._cursor_catched = false;
    this._passed = false; // prevents from running secured actions multiple times
    this._unlockError = false;

    // User implemented canvas and draw function (if any)
    this._loadCanvas(config.userCanvas);

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

  StandaLockClass.prototype._loadCanvas = function(canvas) {
    if (!!canvas) {
      if ((!canvas.image) && (!canvas.draw)) {
        throw 'Missing draw function or image for "' + this.placeholderSelector + '".';
      }
      this._drawCanvas    = canvas.draw;    // Bind user's function
      this._drawCursor    = canvas.cursor;  // Bind user's function
      this._width         = canvas.width;
      this._height        = canvas.height;
      this._cursor_radius = canvas.cursor_radius;
      this._x1            = canvas.x1;
      this._w             = canvas.w;
      this._y             = canvas.y;
      this._x_text        = canvas.x_text;
      this._y_text        = canvas.y_text;

      if (!!canvas.image) { // Use picture instead of canvas
        this.img = new Image();
        this.img.src = canvas.image;
        // Bind default draw to dual image mode
        this._drawCanvas = this._drawDualImage;
      }
      if (!canvas.cursor) { // Use default cursor design
        this._drawCursor = this._drawDefaultCursor;
      }
    }
    else {  // Load defaults
      var defaultCanvas = {
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
      this._loadCanvas(defaultCanvas);
    }
  }

  StandaLockClass.prototype._draw = function() {
    // Calculated x position where the overlayed image should end
    var cursor_pos = this._x1 + (this._w * this._slider_value) / 100; // relative to slide bar

    try {
      this._drawCanvas(this.ctx, cursor_pos);
      this._drawCursor(this.ctx, cursor_pos);
      this._drawText();
    }
    catch (e) {
      console.debug("Draw error on " + this.placeholderSelector);
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
    //this.canvas.setAttribute('style', 'border: 1px solid');
    
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
      this.placeholder.appendChild(docfrag);
    }
    catch(e){
      throw 'Can not find element ' + this.placeholderSelector;
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

  StandaLockClass.prototype._applyTemplate = function(template, obj){
    for(var val in obj){
      template = template.replace(new RegExp('{{'+val+'}}', 'g'), obj[val]);
    }
    this.ouputContainer.innerHTML = template;
  }

  StandaLockClass.prototype._decrypt = function(){
    var o = {};
    for(var d in this.data){
      o[d] = this.decryptFn(this.data[d])
    }
    this._applyTemplate(this.template, o);
  }

  StandaLockClass.prototype._decryptFromServer = function(){
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = false;
    xhr.addEventListener('load', function(evt){
      this._applyTemplate(this.template, JSON.parse(evt.target.response));
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
