
var userInterface = window.userInterface = (function(window, document) {
    // Saves original slither.io functions so they can be modified, or reenabled.
    var original_keydown = document.onkeydown;

    return {
        overlays: {},
        hiddenOverlays: false,

        initOverlays: function() {
            // Prepares a bottom-right element. Gets refreshed every frame.
            var botOverlay = document.createElement('div');
            botOverlay.style.position = 'fixed';
            botOverlay.style.right = '5px';
            botOverlay.style.bottom = '112px';
            botOverlay.style.width = '150px';
            botOverlay.style.height = '85px';
            botOverlay.style.color = '#C0C0C0';
            botOverlay.style.fontFamily = 'Consolas, Verdana';
            botOverlay.style.zIndex = 999;
            botOverlay.style.fontSize = '14px';
            botOverlay.style.padding = '5px';
            botOverlay.style.borderRadius = '5px';
            botOverlay.className = 'nsi';
            document.body.appendChild(botOverlay);

            // Prepares a top-left element. Gets refreshed on key-press.
            var prefOverlay = document.createElement('div');
            prefOverlay.style.position = 'fixed';
            prefOverlay.style.left = '10px';
            prefOverlay.style.top = '75px';
            prefOverlay.style.width = '260px';
            prefOverlay.style.height = '210px';
            prefOverlay.style.color = '#C0C0C0';
            prefOverlay.style.fontFamily = 'Consolas, Verdana';
            prefOverlay.style.zIndex = 999;
            prefOverlay.style.fontSize = '14px';
            prefOverlay.style.padding = '5px';
            prefOverlay.style.borderRadius = '5px';
            prefOverlay.className = 'nsi';
            document.body.appendChild(prefOverlay);

            userInterface.overlays.botOverlay = botOverlay;
            userInterface.overlays.prefOverlay = prefOverlay;
        },

        toggleOverlays: function() {
            userInterface.hiddenOverlays = !userInterface.hiddenOverlays;
            Object.keys(userInterface.overlays).forEach(function(okey) {
                var oVis = userInterface.hiddenOverlays ? 'hidden' : 'visible';
                userInterface.overlays[okey].style.visibility = oVis;
                window.log('overlay ' + okey + ' set to ' + oVis);
            });
        },

        // Saves a variable to local storage.
        savePreference: function(item, value) {
            window.localStorage.setItem(item, value);
            userInterface.onPrefChange();
        },

        // Loads a variable from local storage.
        loadPreference: function(preference, defaultVar) {
            var savedItem = window.localStorage.getItem(preference);
            if (savedItem !== null) {
                if (savedItem === 'true') {
                    window[preference] = true;
                } else if (savedItem === 'false') {
                    window[preference] = false;
                } else {
                    window[preference] = savedItem;
                }
                window.log('Setting found for ' + preference + ': ' + window[preference]);
            } else {
                window[preference] = defaultVar;
                window.log('No setting found for ' + preference +
                    '. Used default: ' + window[preference]);
            }
            userInterface.onPrefChange();
            return window[preference];
        },

        // Saves username when you click on "Play" button.
        playButtonClickListener: function() {
            userInterface.saveNick();
            userInterface.loadPreference('autoRespawn', false);
        },

        // Preserves the player's nickname.
        saveNick: function() {
            var nick = document.getElementById('nick').value;
            userInterface.savePreference('savedNick', nick);
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
            if (!window.playing) return;
            // Allows letter 'U' to toggle debugging to console.
            if (e.keyCode === 85) {
                window.logDebugging = !window.logDebugging;
                console.log('Debugging to console set to: ' + window.logDebugging);
                userInterface.savePreference('logDebugging', window.logDebugging);
            }
            // Letter 'H' to toggle hidden mode
            if (e.keyCode === 72) {
                window.log('H key pressed. hiddenOverlays: ' + userInterface.hiddenOverlays); 
                userInterface.toggleOverlays();
            }
            // Allows letter 'O' to change render mode.
            if (e.keyCode === 79) {
                userInterface.toggleMobileRendering(!window.mobileRender);
            }
            // Allows letter 'Z' to reset zoom.
            if (e.keyCode === 90) {
                canvas.resetZoom();
            }
            userInterface.onPrefChange();
        },

        onPrefChange: function() {
            var oContent = [];
            var ht = userInterface.handleTextColor;

            // Displays options.
            oContent.push('version: ' + GM_info.script.version);
            oContent.push('[O] mobile rendering: ' + ht(window.mobileRender));
            oContent.push('[U] log debugging: ' + ht(window.logDebugging));

            userInterface.overlays.prefOverlay.innerHTML = oContent.join('<br/>');
        },
        
        // Manual mobile rendering
        toggleMobileRendering: function(mobileRendering) {
            window.mobileRender = mobileRendering;
            window.log('Mobile rendering set to: ' + window.mobileRender);
            userInterface.savePreference('mobileRender', window.mobileRender);
            if (window.mobileRender) {
                window.render_mode = 1;
                window.want_quality = 0;
                window.high_quality = false;
            } else {
                window.render_mode = 2;
                window.want_quality = 1;
                window.high_quality = true;
            }
        },

        onFrameUpdate: function() {
            if (!window.playing || window.snake == null) return;
            let oContent = [];

            // Displays the frame rate.
            oContent.push('fps: ' + userInterface.framesPerSecond.fps);

            // Displays the X and Y of the snake.
            oContent.push(
                ' x: ' + (Math.round(window.snake.xx + window.snake.fx) || 0) +
                ' y: ' + (Math.round(window.snake.yy + window.snake.fy) || 0));

            userInterface.overlays.botOverlay.innerHTML = oContent.join('<br/>');
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
        },

        handleTextColor: function(enabled) {
            return '<span style=\"color:' +
                (enabled ? 'green;\">enabled' : 'red;\">disabled') + '</span>';
        }
    };
})(window, document);
