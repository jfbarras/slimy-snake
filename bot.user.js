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
// @version      0.0.3
// @description  Slither.io Snake Whisperer
// @author       J.-F. Barras
// @match        http://slither.io/
// @grant        none
// ==/UserScript==

var canvas = window.canvas = (function(window) {
    return {
        // Adjusts zoom in response to mouse wheel.
        setZoom: function(e) {
            if (window.gsc) {
                window.gsc *= Math.pow(0.9, e.wheelDelta / -120 || e.detail / 2 || 0);
                window.desired_gsc = window.gsc;
            }
        },

        // Restores zoom to the default value.
        resetZoom: function() {
            window.gsc = 0.9;
            window.desired_gsc = 0.9;
        },

        // Sets zoom to desired zoom.
        maintainZoom: function() {
            if (window.desired_gsc !== undefined) {
                window.gsc = window.desired_gsc;
            }
        }
    };
})(window);

var userInterface = window.userInterface = (function(window, document) {
    // Saves original slither.io functions so they can be modified, or reenabled.
    var original_keydown = document.onkeydown;

    return {
        onkeydown: function(e) {
            // Triggers original slither.io onkeydown function.
            original_keydown(e);
            if (window.playing) {
                // Allows letter 'Z' to reset zoom.
                if (e.keyCode === 90) {
                    canvas.resetZoom();
                }
            }
        },

        oefTimer: function() {
            var start = Date.now();
            canvas.maintainZoom();

            if (!window.no_raf) {
                window.raf(userInterface.oefTimer);
            } else {
                const bot_opt_targetFps = 60;
                setTimeout(userInterface.oefTimer,
                    (1000 / bot_opt_targetFps) - (Date.now() - start));
            }
        }

    };
})(window, document);

// Main
(function(window, document) {
    document.onkeydown = userInterface.onkeydown;

    // Listens for mouse wheel scroll.
    document.body.addEventListener('mousewheel', canvas.setZoom);
    document.body.addEventListener('DOMMouseScroll', canvas.setZoom);

    // Start!
    userInterface.oefTimer();
})(window, document);
