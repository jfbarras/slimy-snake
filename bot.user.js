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
// @version      0.6.5
// @description  Slither.io Snake Whisperer
// @author       J.-F. Barras
// @match        http://slither.io/
// @require      src/canvas.js
// @require      src/user-interface.js
// @grant        none
// ==/UserScript==

// Main
(function(window, document) {
    // Ties listeners.
    window.play_btn.btnf.addEventListener('click', userInterface.playButtonClickListener);
    document.onkeydown = userInterface.onkeydown;

    // Prepares the overlays.
    userInterface.initOverlays();

    // Loads preferences.
    userInterface.loadPreference('logDebugging', false);
    userInterface.loadPreference('visualDebugging', false);
    userInterface.loadPreference('autoRespawn', false);
    userInterface.loadPreference('mobileRender', false);
    window.nick.value = userInterface.loadPreference('savedNick', 'Slither.io-bot');

    // Listens for mouse wheel scroll.
    document.body.addEventListener('mousewheel', canvas.setZoom);
    document.body.addEventListener('DOMMouseScroll', canvas.setZoom);

    // Sets the render mode.
    userInterface.setMobileRendering(window.mobileRender);

    // Unblocks all skins without the need for FB sharing.
    window.localStorage.setItem('edttsg', '1');

    // Removes social network icons from top left.
    window.social.remove();

    // Tracks FPS.
    setInterval(userInterface.framesPerSecond.fpsTimer, 80);

    // Start!
    userInterface.oefTimer();
})(window, document);
