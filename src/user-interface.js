var userInterface = window.userInterface = (function(window, document) {
    // Saves original slither.io functions so they can be modified, or reenabled.
    var original_keydown = document.onkeydown;

    return {
        // Track FPS
        framesPerSecond: {
            fps: 0,
            fpsTimer: function() {
                if (window.playing && window.fps && window.lrd_mtm) {
                    if (Date.now() - window.lrd_mtm > 970) {
                        userInterface.framesPerSecond.fps = window.fps;
                    }
                }
            }
        },
        
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

        onFrameUpdate: function() {
            if (window.playing && window.snake !== null) {
                let oContent = [];

                // Displays the frame rate.
                oContent.push('fps: ' + userInterface.framesPerSecond.fps);

                // Displays the X and Y of the snake.
                oContent.push(
                    ' x: ' + (Math.round(window.snake.xx + window.snake.fx) || 0) +
                    ' y: ' + (Math.round(window.snake.yy + window.snake.fy) || 0));
            }
        },
        
        oefTimer: function() {
            var start = Date.now();
            canvas.maintainZoom();

            userInterface.onFrameUpdate();

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
