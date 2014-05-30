"use strict";

;(function(win, doc){

  function StandLockClazz(config){

    this.checkCanvasSupport();

    this.decryptFn = config.decrypt;
    this.decryptUrl = config.decryptUrl;
    this.template = config.template;
    this.placeholderSelector = config.placeholder;
    this.placeholder = document.querySelector(config.placeholder);
    this.data = config.data;
    this.message = config.message;

    // Global state
    this._slider_value = 0.0; // represents percentage
    this._cursor_catched = false;
    this._passed = false; // prevents from running secured actions multiple times

    // Graphics-dependant constants
    this._iWIDTH = 469;
    this._iHEIGHT = 68; // half-height, one bar only
    this._cursor_radius = 13;
    this._x1 = 114 + (this._cursor_radius-1); // X position where the progress segment starts
    this._x2 = 445 - (this._cursor_radius-1); // X position where the progress segment ends
    this._w = this._x2 - this._x1;  // slider width
    this._y = 33;  // Y position of center of the slider
    this._x_text = this._x1 - 70;  // X position where to write text
    this._y_text = this._y + 7;
    this._sx = this._w * this._slider_value / 100;

  }

  StandLockClazz.prototype.checkCanvasSupport = function(){
    try {
      document.createElement('canvas').getContext('2d');
    }
    catch(e){
      alert("Canvas not supported!");
    }
  }

  StandLockClazz.prototype.render = function() {

    var docfrag = document.createDocumentFragment();
    var p = document.createElement('p');
    this.canvas = document.createElement('canvas');
    this.ouputContainer = document.createElement('div');
    
    this.img = new Image();
    this.img.addEventListener('load', this._draw.bind(this), false);
    this.img.src = 'progress-tiles.jpg';

    p.textContent = this.message;

    this.canvas.width = this._iWIDTH;
    this.canvas.height = this._iHEIGHT;
    this.canvas.style.cursor = 'pointer';
    this._bindEvents();
    this.ctx = this.canvas.getContext('2d');

    docfrag.appendChild(p);
    docfrag.appendChild(this.canvas);
    docfrag.appendChild(this.ouputContainer);

    try{
      this.placeholder.appendChild(docfrag);
    }
    catch(e){
      throw 'Can not find element '+this.placeholderSelector;
    }

  }

  StandLockClazz.prototype._bindEvents = function() {

    // handle clicks
    this.canvas.addEventListener('mousedown', this._onmousedown.bind(this), false);
    this.canvas.addEventListener('mousemove', this._onmousemove.bind(this), false);
    this.canvas.addEventListener('mouseup', this._onmouseup.bind(this), false);
    this.canvas.addEventListener('mouseout', this._onmouseout.bind(this), false);

    // handle touches
    this.canvas.addEventListener('touchstart', this._onmousedown.bind(this), false);
    this.canvas.addEventListener('touchmove', this._onmousemove.bind(this), false);
    this.canvas.addEventListener('touchend', function(){
      this._onmouseout();
      this._onmouseup();
    }.bind(this),false);

  };

  StandLockClazz.prototype._draw = function() {
    this._drawBase();
    this._drawProgress();
  }

  StandLockClazz.prototype._drawBase = function() {
    this.ctx.drawImage(this.img, 0, 0, this._iWIDTH, this._iHEIGHT, 0, 0, this._iWIDTH, this._iHEIGHT);
  }

  StandLockClazz.prototype._drawProgress = function() {

    // Calculated x position where the overalyed image should end
    var x_end = this._x1 + (this._w * this._slider_value) / 100; // relative to slidebar

    this.ctx.drawImage(this.img, 0, this._iHEIGHT, x_end, this._iHEIGHT, 0, 0, x_end, this._iHEIGHT);

    // Text to screen
    this.ctx.fillStyle = "grey";
    this.ctx.font = "14pt Arial";
    this.ctx.fillText(Math.round(this._slider_value) + " %", this._x_text, this._y_text);

    /* Draw cursor */
    this.ctx.beginPath();
    this.ctx.arc(x_end, this._y, this._cursor_radius, 0, 2 * Math.PI, false);
    var radgrad = this.ctx.createRadialGradient(x_end, this._y, 0, x_end, this._y, this._cursor_radius);
    radgrad.addColorStop(0, 'hsl(0,0%,85%)');
    radgrad.addColorStop(0.7, 'hsl(0,0%,80%)');
    radgrad.addColorStop(0.9, 'hsl(0,0%,80%)');
    radgrad.addColorStop(1, 'hsl(0,0%,65%)');
    this.ctx.fillStyle = radgrad;
    this.ctx.fill();
  }

  // Returns mouse position relatively to slidebar
  StandLockClazz.prototype._getMousePos = function(evt) {
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

  StandLockClazz.prototype._onmousemove = function(evt) {
    evt.preventDefault();

    if ((this._cursor_catched == false) || (this._passed === true)) {
      return;
    }
    var mousePos = this._getMousePos(evt);
    var s = this._slider_value; // slider value is in percent
    s = Math.round(mousePos.x / this._w * 100 * 100) / 100; // rounded to two decimals
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

  StandLockClazz.prototype._onmouseup = function(evt) {
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

  StandLockClazz.prototype._onmousedown = function(evt) {
    var mousePos = this._getMousePos(evt);

    // Click is not on the bar
    if (!((mousePos.y >= -this._cursor_radius) && (mousePos.y <= this._cursor_radius))) {
      return false;
    }
    else if (this._passed === true) {
      return false;
    }

    // Slidelock behavior: need to catch the cursor itself to make it move.
    if ((mousePos.x >= this._sx-20) && (mousePos.x <= this._sx+20)) {
      this._cursor_catched = true;
    }

    // In standard cursors, the mouse used to catch the cursors anywhere
    // it is as soon as you click on the bar.
    // If you want to get the same behavior as standard cursors,
    // just replace the conditional block above by the one following.
    // if  ((mousePos.x >= 0) && (mousePos.x <= w)){
    //     _cursor_catched = true;
    //     _slider_value = Math.round(mousePos.x / w * 100 * 100) / 100;
    //     // force redraw so that the cursor is 'catched' by the click
    //     drawImage(ctx);
    // }
  }

  StandLockClazz.prototype._onmouseout = function(evt) {
    this._cursor_catched = false;
    if (this._passed === true) {
      return false;
    }
    this._slider_value = 0;
    this._draw();
  }

  StandLockClazz.prototype._unlock = function() {  
    var o = {};
    if (!!this.decryptUrl){
      this._decryptFromServer();
    }
    else {
      this._decrypt();
    }
  }

  StandLockClazz.prototype._applyTemplate = function(template, obj){
    for(var val in obj){
      template = template.replace(new RegExp('{{'+val+'}}', 'g'), obj[val]);
    }
    this.ouputContainer.innerHTML = template;
  }

  StandLockClazz.prototype._decrypt = function(){
    var o = {};
    for(var d in this.data){
      o[d] = this.decryptFn(this.data[d])
    }
    this._applyTemplate(this.template, o);
  }

  StandLockClazz.prototype._decryptFromServer = function(){
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = false;
    xhr.addEventListener('load', function(evt){
      this._applyTemplate(this.template, JSON.parse(evt.target.response));
    }.bind(this), false);
    xhr.open('POST', this.decryptUrl, true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify(this.data));
  }

  // expose globally
  var _jobs = [];
  win.StandLock = win.StandLock || {
    add: function(config){
      _jobs.push(new StandLockClazz(config));
      return this;
    },
    render: function(){
      _jobs.forEach(function(job){
        job.render();
      });
    }
  };

}(window, document));