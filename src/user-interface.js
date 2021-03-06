
/* jshint esversion: 6 */

var userInterface = window.userInterface = (function(window, document) {
    // Saves original slither.io functions so they can be modified, or reenabled.
    const original_keydown = document.onkeydown;
    const original_onmouseDown = window.onmousedown;
    const original_oef = window.oef;
    const original_redraw = window.redraw;
    const original_onmousemove = window.onmousemove;

    window.oef = function() {};
    window.redraw = function() {};

    return {
        overlays: {},
        gfxEnabled: true,
        hiddenOverlays: false,

        initOverlays: function() {
            // Prepares a bottom-right element.
            // Holds frame rate, XY position, width, direction, speed.
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

            // Prepares a top-left element.
            // Holds the state of options, like mobile render and visual debugging.
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

            // Prepares a mid-left element.
            // Holds past scores.
            var statsOverlay = document.createElement('div');
            statsOverlay.style.position = 'fixed';
            statsOverlay.style.left = '10px';
            statsOverlay.style.top = '295px';
            statsOverlay.style.width = '200px';
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

        // Spreads 'overlay visibility property' to all overlays.
        spreadOverlayVis: function() {
            Object.keys(userInterface.overlays).forEach(function(okey) {
                var oVis = userInterface.hiddenOverlays ? 'hidden' : 'visible';
                userInterface.overlays[okey].style.visibility = oVis;
                window.log('Overlay ' + okey + ' set to ' + oVis);
            });
        },

        // Swaps the regular graphics with a black rectangle.
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
        loadPreference: function(preference, defaultVal) {
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
                window[preference] = defaultVal;
                window.log('No setting found for ' + preference +
                    '. Used default: ' + window[preference]);
            }
            userInterface.onPrefChange();
            return window[preference];
        },

        // Saves the player's username when the "Play" button is clicked.
        playButtonClickListener: function() {
            var nick = document.getElementById('nick').value;
            userInterface.savePreference('savedNick', nick);

            userInterface.loadPreference('autoRespawn', false);
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
            // Allows number '6' to change tracer mode.
            if (e.keyCode === 54) {
                tracer.nextMode();
                userInterface.savePreference('tracerMode', tracer.mode);
            }
            // Allows letter 'Y' to change tracer level.
            if (e.keyCode === 89) {
                tracer.nextLevel();
                userInterface.savePreference('tracerLevel', tracer.level);
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
                    tracer.mode = userInterface.loadPreference('tracerMode', 0);
                    tracer.level = userInterface.loadPreference('tracerLevel', 0);
                } else {
                    tracer.mode = 0;
                    tracer.level = 0;
                }
            }
            // Allows letter 'O' to toggle render mode.
            if (e.keyCode === 79) {
                userInterface.setMobileRendering(!window.mobileRender);
            }
            // Allows letter 'Z' to reset zoom.
            if (e.keyCode === 90) {
                zoom.reset();
            }
            // Allows numeric pad to affect absolute heading.
            if (e.keyCode >= 97 && e.keyCode <= 105 && e.keyCode != 101) {
                const howmany = [3,2,1,4,0,0,-3,-2,-1];
                actuator.changeHeadingAbs(howmany[e.keyCode - 97] * Math.PI / 4);
            }
            // Allows letter 'B' to toggle ball mode.
            if (e.keyCode === 66) {
                baller.mode = !baller.mode;
                window.log('Baller mode set to: ' + baller.mode);
            }
            // Allows numpad '+' to incr ball size, by incr delay between turns.
            if (e.keyCode === 107) {
                baller.offset++;
            }
            // Allows numpad '-' to decr ball size, by decr delay between turns.
            if (e.keyCode === 109) {
                baller.offset--;
            }
            // Allows letter 'T' to toggle eating
            if (e.keyCode === 84) {
                glut.eating = !glut.eating;
                window.log('Eating set to: ' + glut.eating);
            }
            userInterface.onPrefChange();
        },

        // Updates the stats overlay. Done when snake is dying.
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

        // Updates the pref overlay. Done on key press.
        onPrefChange: function() {
            var oContent = [];
            var ht = userInterface.twoClassTC;

            // Displays options.
            oContent.push('version: ' + GM_info.script.version);
            oContent.push('[O] mobile rendering: ' + ht(window.mobileRender));
            oContent.push('[U] log debugging: ' + ht(window.logDebugging));
            oContent.push('[6] debugging: ' + tracer.modes[tracer.mode]);
            oContent.push('[Y] debug level: ' + userInterface.fourClassTC(tracer.level));
            oContent.push('[T] eating: ' + ht(glut.eating));
            oContent.push('[B] baller: ' + baller.getInfo());

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

        // Returns the ascii arrow corresponding to a given angle.
        getArrow: function(ang) {
            const ARROWS = '→↘↓↙←↖↑↗';
            if (ang < 0) ang += TAU;
            var idx = Math.round(ang / (Math.PI / 4)) % 8;
            return ARROWS.charAt(idx);
        },

        // Updates the bot overlay. Done every frame.
        onFrameUpdate: function() {
            if (!bot.isAlive()) return;
            let oContent = [];

            // Displays the frame rate.
            oContent.push('fps: ' + userInterface.framesPerSecond.fps);

            // Displays the X and Y of the snake.
            oContent.push(
                'x: ' + (Math.round(bot.xx) || 0) +
                ' y: ' + (Math.round(bot.yy) || 0));

            // Displays the width, direction and speed of the snake.
            oContent.push(
                'w: ' + (bot.snakeWidth || 0) + ' ' +
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

        // Loops.
        oefTimer: function() {
            var start = Date.now();
            zoom.maintain();
            original_oef();
            if (userInterface.gfxEnabled) {
                original_redraw();
            }

            if (bot.isAlive()) {
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
                setTimeout(userInterface.oefTimer,
                    (1000 / bot.opt.targetFps) - (Date.now() - start));
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

var tracer = window.tracer = (function(window) {
    return {
        modes: ['none','wuss','glut','BOTH'],
        mode: 0,
        level: 0,

        check: function(mo, le) {
            if (tracer.mode === 0) return false;
            if (tracer.mode === 3) return (tracer.level > le);
            return (mo === tracer.modes[tracer.mode]) && (tracer.level > le);
        },

        nextMode: function() {
            tracer.mode++;
            if (tracer.mode > 3) tracer.mode = 0;
        },

        nextLevel: function() {
            tracer.level++;
            if (tracer.level > 3) tracer.level = 0;
        }
    };
})(window);
