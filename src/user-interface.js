var userInterface = window.userInterface = (function(window, document) {
    // Saves original slither.io functions so they can be modified, or reenabled.
    var original_keydown = document.onkeydown;

    return {
        overlays: {},

        initOverlays: function() {
            var botOverlay = document.createElement('div');
            botOverlay.style.position = 'fixed';
            botOverlay.style.right = '5px';
            botOverlay.style.bottom = '112px';
            botOverlay.style.width = '150px';
            botOverlay.style.height = '85px';
            // botOverlay.style.background = 'rgba(0, 0, 0, 0.5)';
            botOverlay.style.color = '#C0C0C0';
            botOverlay.style.fontFamily = 'Consolas, Verdana';
            botOverlay.style.zIndex = 999;
            botOverlay.style.fontSize = '14px';
            botOverlay.style.padding = '5px';
            botOverlay.style.borderRadius = '5px';
            botOverlay.className = 'nsi';
            document.body.appendChild(botOverlay);

            userInterface.overlays.botOverlay = botOverlay;
        },

        // Stores FPS data.
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

                userInterface.overlays.botOverlay.innerHTML = oContent.join('<br/>');
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
