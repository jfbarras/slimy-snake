
var userInterface = window.userInterface = (function(window, document) {
    // Saves original slither.io functions so they can be modified, or reenabled.
    var original_keydown = document.onkeydown;
    var original_onmouseDown = window.onmousedown;
    var original_oef = window.oef;
    var original_redraw = window.redraw;
    var original_onmousemove = window.onmousemove;

    window.oef = function() {};
    window.redraw = function() {};

    return {
        overlays: {},
        gfxEnabled: true,
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

            // Prepares a mid-left element. Holds past scores.
            var statsOverlay = document.createElement('div');
            statsOverlay.style.position = 'fixed';
            statsOverlay.style.left = '10px';
            statsOverlay.style.top = '295px';
            statsOverlay.style.width = '140px';
            statsOverlay.style.height = '210px';
            statsOverlay.style.color = '#C0C0C0';
            statsOverlay.style.fontFamily = 'Consolas, Verdana';
            statsOverlay.style.zIndex = 998;
            statsOverlay.style.fontSize = '14px';
            statsOverlay.style.padding = '5px';
            statsOverlay.style.borderRadius = '5px';
            statsOverlay.className = 'nsi';
            document.body.appendChild(statsOverlay);

            userInterface.overlays.botOverlay = botOverlay;
            userInterface.overlays.prefOverlay = prefOverlay;
            userInterface.overlays.statsOverlay = statsOverlay;
        },

        // Spread 'overlay visibility property' to all overlays.
        spreadOverlayVis: function() {
            Object.keys(userInterface.overlays).forEach(function(okey) {
                var oVis = userInterface.hiddenOverlays ? 'hidden' : 'visible';
                userInterface.overlays[okey].style.visibility = oVis;
                window.log('Overlay ' + okey + ' set to ' + oVis);
            });
        },

        toggleGfx: function() {
            if (userInterface.gfxEnabled) {
                var c = window.mc.getContext('2d');
                c.save();
                c.fillStyle = "#000000",
                    c.fillRect(0, 0, window.mww, window.mhh),
                    c.restore();

                var d = document.createElement('div');
                d.style.position = 'fixed';
                d.style.top = '50%';
                d.style.left = '50%';
                d.style.width = '200px';
                d.style.height = '60px';
                d.style.color = '#C0C0C0';
                d.style.fontFamily = 'Consolas, Verdana';
                d.style.zIndex = 999;
                d.style.margin = '-30px 0 0 -100px';
                d.style.fontSize = '20px';
                d.style.textAlign = 'center';
                d.className = 'nsi';
                document.body.appendChild(d);
                userInterface.gfxOverlay = d;

                window.lbf.innerHTML = '';
            } else {
                document.body.removeChild(userInterface.gfxOverlay);
                userInterface.gfxOverlay = undefined;
            }

            userInterface.gfxEnabled = !userInterface.gfxEnabled;
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
            // Allows letter 'Y' to toggle visual debugging.
            if (e.keyCode === 89) {
                window.visualDebugging++;
                if (window.visualDebugging > 3) window.visualDebugging = 0;
                userInterface.savePreference('visualDebugging', window.visualDebugging);
            }
            // Allows letter 'U' to toggle debugging to console.
            if (e.keyCode === 85) {
                window.logDebugging = !window.logDebugging;
                console.log('Debugging to console set to: ' + window.logDebugging);
                userInterface.savePreference('logDebugging', window.logDebugging);
            }
            // Allows letter 'H' to toggle overlay visibility.
            if (e.keyCode === 72) {
                userInterface.hiddenOverlays = !userInterface.hiddenOverlays;
                userInterface.spreadOverlayVis();
            }
            // Allows letter 'G' to toggle graphics. Also toggles visual debugging.
            if (e.keyCode === 71) {
                userInterface.toggleGfx();
                window.log('Graphics mode set to: ' + userInterface.gfxEnabled);
                if (userInterface.gfxEnabled) {
                    window.visualDebugging = userInterface.loadPreference('visualDebugging', 0);
                } else {
                    window.visualDebugging = 0;
                }
            }
            // Allows letter 'O' to toggle render mode.
            if (e.keyCode === 79) {
                userInterface.setMobileRendering(!window.mobileRender);
            }
            // Allows letter 'Z' to reset zoom.
            if (e.keyCode === 90) {
                canvas.resetZoom();
            }
            // Allows numeric pad to affect absolute heading.
            if (e.keyCode >= 97 && e.keyCode <= 105) {
                const howmany = [3,2,1,4,0,0,-3,-2,-1];
                actuator.changeHeadingAbs(howmany[e.keyCode-97] * Math.PI/4);
            }
            // Allows letter 'B' to toggle ball mode.
            if (e.keyCode === 66) {
                baller.ballMode = !baller.ballMode;
            }
            // Allows numpad '+' to incr ball size, by incr delay between turns.
            if (e.keyCode === 107) {
                baller.ballDelay++;
            }
            // Allows numpad '-' to decr ball size, by decr delay between turns.
            if (e.keyCode === 109) {
                baller.ballDelay--;
            }
            userInterface.onPrefChange();
        },

        // Updates the stats overlay.
        updateStats: function() {
            var oContent = [];
            var median;

            if (bot.scores.length === 0) return;

            median = Math.round((bot.scores[Math.floor((bot.scores.length - 1) / 2)] +
                bot.scores[Math.ceil((bot.scores.length - 1) / 2)]) / 2);

            oContent.push('games played: ' + bot.scores.length);
            oContent.push('avg: ' + Math.round(
                    bot.scores.reduce(function(a, b) {
                        return a + b;
                    }) / (bot.scores.length)) +
                ' med: ' + median);

            for (var i = 0; i < bot.scores.length && i < 10; i++) {
                oContent.push(i + 1 + '. ' + bot.scores[i]);
            }

            userInterface.overlays.statsOverlay.innerHTML = oContent.join('<br/>');
        },

        onPrefChange: function() {
            var oContent = [];
            var ht = userInterface.twoClassTC;

            // Displays options.
            oContent.push('version: ' + GM_info.script.version);
            oContent.push('[O] mobile rendering: ' + ht(window.mobileRender));
            oContent.push('[U] log debugging: ' + ht(window.logDebugging));
            oContent.push('[Y] visual debugging: ' + userInterface.fourClassTC(window.visualDebugging));
            oContent.push('[B] ball mode: ' + ht(baller.ballMode) + ' ms: ' + baller.ballDelay);

            userInterface.overlays.prefOverlay.innerHTML = oContent.join('<br/>');
        },

        // Sets window flags pertaining to render mode and quality.
        setMobileRendering: function(isMobile) {
            window.mobileRender = isMobile;
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

        getArrow: function(ang) {
            const ARROWS = '→↘↓↙←↖↑↗';
            if (ang < 0) ang += Math.PI * 2;
            var idx = Math.round(ang / (Math.PI/4)) % 8;
            return ARROWS.charAt(idx);
        },

        onFrameUpdate: function() {
            if (!window.playing || window.snake == null) return;
            let oContent = [];

            // Displays the frame rate.
            oContent.push('fps: ' + userInterface.framesPerSecond.fps);

            // Displays the X and Y of the snake.
            oContent.push(
                'x: ' + (Math.round(bot.xx) || 0) +
                ' y: ' + (Math.round(bot.yy) || 0));

            // Displays the width of the snake.
            oContent.push(
                'w: ' + (bot.snakeWidth || 0));

            // Displays the direction and speed of the snake.
            oContent.push(
                'sp: ' + userInterface.getArrow(window.snake.ehang) +
                ' ' + Math.round(window.snake.sp*100)/100);

            userInterface.overlays.botOverlay.innerHTML = oContent.join('<br/>');

            // Displays the full-screen black overlay
            if (userInterface.gfxOverlay) {
                let gContent = [];

                gContent.push('<b>' + window.snake.nk + '</b>');
                gContent.push(bot.snakeLength);
                gContent.push('[' + window.rank + '/' + window.snake_count + ']');

                userInterface.gfxOverlay.innerHTML = gContent.join('<br/>');
            }
        },

        oefTimer: function() {
            var start = Date.now();
            canvas.maintainZoom();
            original_oef();
            if (userInterface.gfxEnabled) {
                original_redraw();
            }

            if (window.playing && window.snake !== null) {
                bot.state = 'running';
                bot.go();
            } else if (bot.state === 'running') {
                bot.state = 'dying';

                if (window.lastscore && window.lastscore.childNodes[1]) {
                    bot.scores.push(parseInt(window.lastscore.childNodes[1].innerHTML));
                    bot.scores.sort(function(a, b) {
                        return b - a;
                    });
                    userInterface.updateStats();
                }

                bot.state = 'dead';
            }

            userInterface.onFrameUpdate();

            if (!window.no_raf) {
                window.raf(userInterface.oefTimer);
            } else {
                const bot_opt_targetFps = 60;
                setTimeout(userInterface.oefTimer,
                    (1000 / bot_opt_targetFps) - (Date.now() - start));
            }
        },

        fourClassTC: function(level) {
            const RDYLGN = ['#d7191c;\">off', '#fdae61;\">low', '#a6d96a;\">med', '#1a9641;\">high'];
            return '<span style=\"color:' + RDYLGN[level] + '</span>';
        },

        twoClassTC: function(enabled) {
            return '<span style=\"color:' + (enabled ? '#1a9641;\">enabled' : '#d7191c;\">disabled') + '</span>';
        }
    };
})(window, document);
