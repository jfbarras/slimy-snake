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
