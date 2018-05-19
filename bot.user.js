/*
The MIT License (MIT)
 Copyright (c) 2016 Jesse Miller <jmiller@jmiller.com>
 Copyright (c) 2016 Alexey Korepanov <kaikaikai@yandex.ru>
 Copyright (c) 2016 Ermiya Eskandary & Théophile Cailliau and other contributors
 https://jmiller.mit-license.org/
*/
// ==UserScript==
// @name         Slither.io Snake Whisperer
// @namespace    https://github.com/jfbarras/slimy-snake
// @version      0.1.4
// @description  Slither.io Snake Whisperer
// @author       J.-F. Barras
// @match        http://slither.io/
// @require      src/canvas.js
// @require      src/user-interface.js
// @grant        none
// ==/UserScript==

// Main
(function(window, document) {
    document.onkeydown = userInterface.onkeydown;

    // Prepares the overlays.
    userInterface.initOverlays();
 
    // Listens for mouse wheel scroll.
    document.body.addEventListener('mousewheel', canvas.setZoom);
    document.body.addEventListener('DOMMouseScroll', canvas.setZoom);

    // Tracks FPS.
    setInterval(userInterface.framesPerSecond.fpsTimer, 80);

    // Start!
    userInterface.oefTimer();
})(window, document);
