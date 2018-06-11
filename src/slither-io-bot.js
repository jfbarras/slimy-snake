
var actuator = window.actuator = (function(window) {
    return {
        // Spoofs moving the mouse to the provided coordinates.
        setMouseCoordinates: function(point) {
            window.xm = point.x;
            window.ym = point.y;
        },

        // Changes heading to ang.
        changeHeadingAbs: function(angle) {
            var cos = Math.cos(angle);
            var sin = Math.sin(angle);

            window.goalCoordinates = {
                x: Math.round(bot.xx + 3 * bot.snakeRadius * cos),
                y: Math.round(bot.yy + 3 * bot.snakeRadius * sin)
            };

            actuator.setMouseCoordinates(canvas.mapToMouse(window.goalCoordinates));
        },

        // Changes heading by ang.
        changeHeadingRel: function(angle) {
            var heading = {
                x: bot.xx + 3 * bot.snakeRadius * bot.cos,
                y: bot.yy + 3 * bot.snakeRadius * bot.sin
            };

            var cos = Math.cos(-angle);
            var sin = Math.sin(-angle);

            window.goalCoordinates = {
                x: Math.round(
                    cos * (heading.x - bot.xx) -
                    sin * (heading.y - bot.yy) + bot.xx),
                y: Math.round(
                    sin * (heading.x - bot.xx) +
                    cos * (heading.y - bot.yy) + bot.yy)
            };

            actuator.setMouseCoordinates(canvas.mapToMouse(window.goalCoordinates));
        }
    };
})(window);

// Sees the outer wall.
var wall = window.wall = (function(window) {
    return {
        opt: {
            // distance from the wall at which you start seeing it
            distance: 1000,
            // number of wall segments modelled; expects odd number
            segments: 5,
            // how close the wall segments are modelled, in radians
            arc: 0.004363
        },
        MID_X: 0,
        MID_Y: 0,
        MAP_R: 0,
        MIN_D: 0,

        isWallClose: function() {
            if (wall.MID_X === 0) {
                wall.MID_X = window.grd;
                wall.MID_Y = window.grd;
                wall.MAP_R = window.grd * 0.98;
                wall.MIN_D = Math.pow(wall.MAP_R - wall.opt.distance, 2);
            }
            var dist = canvas.getDistance2(wall.MID_X, wall.MID_Y, bot.xx, bot.yy);
            return (dist > wall.MIN_D);
        },

        seeWall: function() {
            if (!wall.isWallClose()) return;
            var midAng = canvas.fastAtan2(bot.yy - wall.MID_X, bot.xx - wall.MID_Y);
            var j = (wall.opt.segments - 1) / 2;
            for (var i = -j; i <= j; i++) {
                var scPoint = {
                    xx: wall.MID_X + wall.MAP_R * Math.cos(midAng + i * wall.opt.arc),
                    yy: wall.MID_Y + wall.MAP_R * Math.sin(midAng + i * wall.opt.arc),
                    snake: -1,
                    radius: bot.snakeWidth,
                    type: 'wall'
                };
                bot.injectDistance2(scPoint);
                wuss.collisionPoints.push(scPoint);
                wuss.addCollisionAngle(scPoint);
                if (window.visualDebugging > 1) {
                    pencil.drawCircle(canvas.circle(scPoint.xx, scPoint.yy, scPoint.radius),
                        'yellow', false);
                }
            }
        }
    };
})(window);

// Sees
var wuss = window.wuss = (function(window) {
    return {
        collisionPoints: [],
        collisionAngles: [],

        // Adds to the collisionAngles array, if distance is closer.
        addCollisionAngle: function(sp) {
            var ang = canvas.fastAtan2(
                Math.round(sp.yy - bot.yy),
                Math.round(sp.xx - bot.xx));
            var aIndex = bot.getAngleIndex(ang);

            var actualDistance = Math.round(Math.pow(
                Math.sqrt(sp.distance) - sp.radius, 2));

            if (wuss.collisionAngles[aIndex] === undefined ||
                wuss.collisionAngles[aIndex].distance > sp.distance) {
                wuss.collisionAngles[aIndex] = {
                    x: Math.round(sp.xx),
                    y: Math.round(sp.yy),
                    ang: ang,
                    snake: sp.snake,
                    distance: actualDistance,
                    radius: sp.radius,
                    aIndex: aIndex
                };
            }
        },

        // Sees
        scan: function() {
            wuss.collisionPoints = [];
            wuss.collisionAngles = [];
            wall.seeWall();
            wuss.collisionPoints.sort(bot.sortDistance);
            if (window.visualDebugging > 1) {
                for (var i = 0; i < wuss.collisionAngles.length; i++) {
                    if (wuss.collisionAngles[i] !== undefined) {
                        pencil.drawLine({
                                x: bot.xx,
                                y: bot.yy
                            }, {
                                x: wuss.collisionAngles[i].x,
                                y: wuss.collisionAngles[i].y
                            },
                            'red', 2);
                    }
                }
            }
        }
    };
})(window);

var bot = window.bot = (function(window) {
    return {
        ARCSIZE: Math.PI / 8,
        MAXARC: (2 * Math.PI) / (Math.PI / 8),
        state: 'init',
        scores: [],

        getSnakeWidth: function(sc) {
            if (sc === undefined) sc = window.snake.sc;
            return Math.round(sc * 29.0);
        },

        getSnakeLength: function(s) {
            if (s === undefined) s = window.snake;
            return Math.floor(15 * (window.fpsls[s.sct] + s.fam / window.fmlts[s.sct] - 1) - 5);
        },

        // Returns a circle offsetted from the snake's head. Offsets in number of widths.
        // dw < 0 is port (left). dw > 0 is starboard. dl < 0 is astern. dl > 0 is ahead.
        // @param {number} dw -- offsets width-wise
        // @param {number} dl -- offsets length-wise
        // @param {number} rm -- radius multiplier
        getHeadCircle: function(dw, dl, rm) {
            var s = bot.sin * bot.snakeWidth;
            var c = bot.cos * bot.snakeWidth;
            return canvas.circle(
                bot.xx + dl * c + s + (dw + 1) * (bot.cos - s),
                bot.yy + dl * s - c + (dw + 1) * (bot.sin + c),
                rm * bot.snakeRadius);
        },

        // Checks if the player's snake is fully alive.
        isAlive: function() {
            return (window.playing && window.snake !== null && window.snake.alive_amt === 1);
        },

        // Gives the specified point a distance property set to
        // the distance squared from the snake's head.
        injectDistance2: function(point) {
            point.distance = canvas.getDistance2(bot.xx, bot.yy, point.xx, point.yy);
        },

        // Gets the angle index from specified angle.
        getAngleIndex: function(angle) {
            const TP = 2 * Math.PI;
            var index;

            while (angle < 0) {
                angle += TP;
            }

            while (angle > TP) {
                angle -= TP;
            }

            index = Math.round(angle * (1 / (TP / bot.MAXARC)));

            if (index === bot.MAXARC) {
                return 0;
            }
            return index;
        },

        // Sorts by property 'distance' ascending.
        sortDistance: function(a, b) {
            return a.distance - b.distance;
        },

        every: function() {
            bot.cos = Math.cos(window.snake.ang);
            bot.sin = Math.sin(window.snake.ang);
            bot.xx = window.snake.xx + window.snake.fx;
            bot.yy = window.snake.yy + window.snake.fy;

            bot.speedMult = window.snake.sp / 5.78; //bot.opt.speedBase;
            bot.snakeWidth = bot.getSnakeWidth();
            bot.snakeRadius = bot.snakeWidth / 2;
            bot.snakeLength = bot.getSnakeLength();

            if (window.visualDebugging > 0) {
                // coral food collection sector
                pencil.drawAngle(window.snake.ehang - Math.PI / 4, window.snake.ehang + Math.PI / 4,
                    3 * bot.snakeRadius, 'coral', false);
                // dark red circles depict snake turn radius
                pencil.drawCircle(bot.getHeadCircle(-1, 0, 1), 'darkred');
                pencil.drawCircle(bot.getHeadCircle( 1, 0, 1), 'darkred');
                pencil.drawCircle(bot.getHeadCircle(-1, 0, 3), 'darkred');
                pencil.drawCircle(bot.getHeadCircle( 1, 0, 3), 'darkred');
            }
        },

        go: function() {
            bot.every();
            wuss.scan();
            baller.run();
        }
    };
})(window);

var baller = window.baller = (function(window) {
    return {
        mode: false,
        delay: 17,
        offset: -1820,
        angle: Math.PI / 4,

        getInfo: function() {
            if (baller.mode) {
                return '1 {o:' + baller.offset + ',d:' + baller.delay + '}';
            } else {
                return '0';
            }
        },

        run: function() {
            if (baller.actionTimeout !== undefined) return;
            if (baller.mode) {
                let delay = 64 * bot.snakeWidth + baller.offset;
                if (delay < 17) delay = 17;
                let angle = Math.PI / 4;
                while (delay > 500) {
                    delay *= 0.5;
                    angle *= 0.5;
                }
                baller.delay = delay;
                baller.angle = angle;
                baller.actionTimeout = window.setTimeout(baller.actionTimer, baller.delay);
            }
        },

        actionTimer: function() {
            if (bot.isAlive()) {
                if (baller.mode) {
                    actuator.changeHeadingRel(baller.angle);
                }
            }
            baller.actionTimeout = undefined;
        }
    };
})(window);
