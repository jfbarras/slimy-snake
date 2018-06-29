
/* jshint esversion: 6 */

var actuator = window.actuator = (function(window) {
    return {
        // Spoofs moving the mouse to the provided coordinates.
        setMouseCoordinates: function(point) {
            window.xm = point.x;
            window.ym = point.y;
        },

        // Changes heading to ang.
        changeHeadingAbs: function(angle) {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);

            window.goalCoordinates = {
                x: Math.round(bot.xx + 3 * bot.snakeRadius * cos),
                y: Math.round(bot.yy + 3 * bot.snakeRadius * sin)
            };

            actuator.setMouseCoordinates(canvas.mapToMouse(window.goalCoordinates));
        },

        // Changes heading by ang.
        changeHeadingRel: function(angle) {
            const heading = {
                x: bot.xx + 3 * bot.snakeRadius * bot.cos,
                y: bot.yy + 3 * bot.snakeRadius * bot.sin
            };

            const cos = Math.cos(-angle);
            const sin = Math.sin(-angle);

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

// Sees snake heads.
var head = window.head = (function(window) {
    return {
        opt: {
            // radius x speed multiplier
            mult: 10,
        },

        seeHeads: function() {
            var scPoint;
            for (let snake = 0, ls = window.snakes.length; snake < ls; snake++) {
                scPoint = undefined;

                if (window.snakes[snake].id === window.snake.id ||
                    window.snakes[snake].alive_amt !== 1) continue;

                const s = window.snakes[snake];
                const snakeRadius = bot.getSnakeWidth(s.sc) / 2;
                const sSpMult = Math.min(1, s.sp / 5.78 - 0.2);
                const sRadius = (bot.snakeRadius * 1.7 + snakeRadius / 2) * sSpMult * head.opt.mult / 4;

                scPoint = {
                    xx: s.xx + Math.cos(s.ehang) * sRadius * 0.75,
                    yy: s.yy + Math.sin(s.ehang) * sRadius * 0.75,
                    snake: snake,
                    hardBody: undefined,
                    bubble: sRadius,
                    type: 'pred'
                };

                bot.injectDistance2(scPoint);
                wuss.addCollisionAngle(scPoint);
                wuss.collisionPoints.push(scPoint);

                if (window.visualDebugging) {
                    pencil.drawCircle(canvas.circle(scPoint.xx, scPoint.yy, scPoint.bubble),
                        'yellow', false);
                }

                scPoint = {
                    xx: s.xx,
                    yy: s.yy,
                    snake: snake,
                    hardBody: snakeRadius,
                    bubble: sRadius,
                    type: 'head'
                };

                bot.injectDistance2(scPoint);
                wuss.addCollisionAngle(scPoint);
                wuss.collisionPoints.push(scPoint);

                if (window.visualDebugging) {
                    pencil.drawCircle(canvas.circle(scPoint.xx, scPoint.yy, scPoint.bubble),
                        'yellow', false);
                }

                part.seeParts(snake);
            }
        }
    };
})(window);

// Sees snake parts.
var part = window.part = (function(window) {
    return {
        opt: {
            // radius multiplier
            mult: 10,
        },

        isInBox: function(s, pts) {
            const sectorSide = Math.floor(Math.sqrt(window.sectors.length)) * window.sector_size;
            const sectorBox = canvas.rect(
                bot.xx - (sectorSide / 2),
                bot.yy - (sectorSide / 2),
                sectorSide, sectorSide);
            return canvas.pointInRect({x: s.pts[pts].xx, y: s.pts[pts].yy}, sectorBox);
        },

        seeParts: function(snake) {
            const s = window.snakes[snake];
            const snakeRadius = bot.getSnakeWidth(s.sc) / 2;
            const k = Math.ceil(snakeRadius / 15);
            var scPoint = {
                snake: snake,
                hardBody: snakeRadius,
                bubble: (snakeRadius + bot.snakeWidth * 1.5) * part.opt.mult / 10,
                type: 'part'
            };
            for (let pts = 0, lp = s.pts.length; pts < lp; pts += k) {
                if (s.pts[pts].dying || !part.isInBox(s, pts)) continue;

                scPoint.xx = s.pts[pts].xx;
                scPoint.yy = s.pts[pts].yy;

                bot.injectDistance2(scPoint);
                wuss.addCollisionAngle(scPoint);

                if (window.visualDebugging > 2) {
                    pencil.drawCircle(canvas.circle(scPoint.xx, scPoint.yy, scPoint.bubble),
                        'yellow', false);
                }

                if (scPoint.distance <= Math.pow((5 * bot.snakeRadius) + scPoint.radius, 2)) {
                    wuss.collisionPoints.push(scPoint);
                    if (window.visualDebugging > 1) {
                        pencil.drawCircle(canvas.circle(scPoint.xx, scPoint.yy, scPoint.bubble),
                            'red', false);
                    }
                }
            }
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
            segments: 7,
            // how close together the wall segments are modelled, in radians
            arc: 0.004363
        },
        MID_X: 0,
        MID_Y: 0,
        MAP_R: 0,
        MIN_D: 0,

        isWallClose: function() {
            if (wall.MID_X !== window.grd) {
                wall.MID_X = window.grd;
                wall.MID_Y = window.grd;
                wall.MAP_R = window.grd * 0.98;
                wall.MIN_D = Math.pow(wall.MAP_R - wall.opt.distance, 2);
            }
            const dist = canvas.getDistance2(wall.MID_X, wall.MID_Y, bot.xx, bot.yy);
            return (dist > wall.MIN_D);
        },

        seeWall: function() {
            if (!wall.isWallClose()) return;
            const midAng = canvas.fastAtan2(bot.yy - wall.MID_X, bot.xx - wall.MID_Y);
            const j = (wall.opt.segments - 1) / 2;
            var scPoint = {
                snake: -1,
                hardBody: 1,
                bubble: bot.snakeWidth * 1.5,
                type: 'wall'
            };
            for (let i = -j; i <= j; i++) {
                scPoint.xx = wall.MID_X + wall.MAP_R * Math.cos(midAng + i * wall.opt.arc);
                scPoint.yy = wall.MID_Y + wall.MAP_R * Math.sin(midAng + i * wall.opt.arc);
                bot.injectDistance2(scPoint);
                wuss.collisionPoints.push(scPoint);
                wuss.addCollisionAngle(scPoint);
                if (window.visualDebugging > 1) {
                    pencil.drawCircle(canvas.circle(scPoint.xx, scPoint.yy, scPoint.bubble),
                        'yellow', false);
                }
            }
        }
    };
})(window);

// Sees obstacles.
var wuss = window.wuss = (function(window) {
    return {
        collisionPoints: [],
        collisionAngles: [],

        // Finds the collision angles, on left and right, of a start angle.
        fanOut: function(start) {
            var left = {
                arcIdx: 0,
                colIdx: undefined,
                angObj: undefined
            };
            do {
                left.colIdx = (start + left.arcIdx) % bot.MAXARC;
                left.angObj = wuss.collisionAngles[left.colIdx];
                left.arcIdx++;
            }
            while (left.arcIdx < bot.MAXARC && left.angObj === undefined);

            var right = {
                arcIdx: 0,
                colIdx: undefined,
                angObj: undefined
            };
            do {
                right.colIdx = start - right.arcIdx;
                if (right.colIdx < 0) right.colIdx += bot.MAXARC;
                right.angObj = wuss.collisionAngles[right.colIdx];
                right.arcIdx++;
            }
            while (right.arcIdx < bot.MAXARC && right.angObj === undefined);

            return {
                left: left.arcIdx - 1,
                right: right.arcIdx - 1
            };
        },

        // 0 to 7 --> 0,1,7,2,6,3,5,4
        oscillate: function(i, base, max) {
            if (base === undefined) base = bot.getAngleIndex(window.snake.ehang);
            if (max === undefined) max = bot.MAXARC;
            var j;
            if (i === 0) {
                j = 0;
            } else if (i % 2) {
                j = (i + 1) / 2;
            } else {
                j = (i / -2) + max;
            }
            return (base + j) % max;
        },

        // Finds the best (largest + closest) angle with no collision.
        bestUndefAngle: function() {
            var best = {
                size: 0,
                idx: undefined
            };
            for (let a = 0; a < bot.MAXARC; a++) {
                const i = wuss.oscillate(a);
                const fan = wuss.fanOut(i);
                const middle = (fan.left + fan.right) / 2;
                const penalty = Math.abs(middle - fan.left) + Math.abs(middle - fan.right);
                const size = fan.left + fan.right - (penalty / 100);
                if (size > best.size) {
                    best.size = size;
                    best.idx = i;
                }
            }
            if (best.idx !== undefined) {
                const ang = best.idx * bot.opt.arcSize;
                if (window.visualDebugging > 0) {
                    pencil.drawLine({
                            x: bot.xx,
                            y: bot.yy
                        }, {
                            x: bot.xx + 1000 * Math.cos(ang),
                            y: bot.yy + 1000 * Math.sin(ang)
                        },
                        'lime', 2);
                }
                return ang;
            }
        },

        // Adds to the collisionAngles array, if distance is closer.
        addCollisionAngle: function(sp) {
            const ang = canvas.fastAtan2(
                Math.round(sp.yy - bot.yy),
                Math.round(sp.xx - bot.xx));
            const aIndex = bot.getAngleIndex(ang);

            const actualDistance = Math.round(Math.pow(
                Math.sqrt(sp.distance) - sp.bubble, 2));

            if (wuss.collisionAngles[aIndex] === undefined ||
                wuss.collisionAngles[aIndex].distance > sp.distance) {
                wuss.collisionAngles[aIndex] = {
                    x: Math.round(sp.xx),
                    y: Math.round(sp.yy),
                    ang: ang,
                    snake: sp.snake,
                    distance: actualDistance,
                    radius: sp.bubble,
                    aIndex: aIndex
                };
            }
        },

        // Sees obstacles.
        scan: function() {
            wuss.collisionPoints = [];
            wuss.collisionAngles = [];
            head.seeHeads();
            wall.seeWall();
            wuss.bestUndefAngle();
            wuss.collisionPoints.sort(bot.sortDistance);

            if (window.visualDebugging > 1) {
                for (let i = 0; i < wuss.collisionAngles.length; i++) {
                    if (wuss.collisionAngles[i] !== undefined) {
                        pencil.drawLine({
                                x: bot.xx,
                                y: bot.yy
                            }, {
                                x: wuss.collisionAngles[i].x,
                                y: wuss.collisionAngles[i].y
                            },
                            '#251d11', 2);
                    }
                }
            }
        }
    };
})(window);

// Sees food
var glut = window.glut = (function(window) {
    return {
        foodAngles: [],
        currentFood: {},

        // Checks which angle is best to get to this food.
        getFoodAng: function(f) {
            var tmp;
            var choices = [];
            // mid angle
            tmp = canvas.fastAtan2(
                Math.round(f.yy - bot.yy),
                Math.round(f.xx - bot.xx));
            choices[0] = {
                ang: tmp,
                da: Math.abs(canvas.angleBetween(tmp, window.snake.ehang))
            };
            // adapt some getHeadCircle code
            const s = Math.sin(ang) * bot.snakeWidth;
            const c = Math.cos(ang) * bot.snakeWidth;
            const leftLip = {
                x: bot.xx + c + s,
                y: bot.yy + s - c,
            };
            const rightLip = {
                x: bot.xx + c + s + 2 * (Math.cos(ang) - s),
                y: bot.yy + s - c + 2 * (Math.sin(ang) + c),
            };
            // left angle
            tmp = canvas.fastAtan2(
                Math.round(f.yy - leftLip.y),
                Math.round(f.xx - leftLip.x));
            choices[1] = {
                ang: tmp,
                da: Math.abs(canvas.angleBetween(tmp, window.snake.ehang))
            };
            // right angle
            tmp = canvas.fastAtan2(
                Math.round(f.yy - rightLip.y),
                Math.round(f.xx - rightLip.x));
            choices[2] = {
                ang: tmp,
                da: Math.abs(canvas.angleBetween(tmp, window.snake.ehang))
            };

            // sort by delta angle
            choices.sort(function (a, b) {
              return a.da - b.da;
            });

            return choices[0].ang;
        },

        // Adds and scores foodAngles.
        addFoodAngle: function(f) {
            const ang = glut.getFoodAng(f);
            const aIndex = bot.getAngleIndex(ang);

            bot.injectDistance2(f);
            // reject food beyond obstacles
            if (wuss.collisionAngles[aIndex] !== undefined &&
              f.distance > wuss.collisionAngles[aIndex].distance) return;

            const fdistance = Math.sqrt(f.distance);

            if (f.sz > 10 || fdistance < bot.snakeWidth * 10) {
                if (glut.foodAngles[aIndex] === undefined) {
                    glut.foodAngles[aIndex] = {
                        x: Math.round(f.xx),
                        y: Math.round(f.yy),
                        ang: ang,
                        da: canvas.angleBetween(ang, window.snake.ehang),
                        distance: f.distance,
                        sz: f.sz,
                        score: f.sz / f.distance
                    };
                } else {
                    glut.foodAngles[aIndex].sz += f.sz;
                    glut.foodAngles[aIndex].score += f.sz / f.distance;
                    if (glut.foodAngles[aIndex].distance > f.distance) {
                        glut.foodAngles[aIndex].x = Math.round(f.xx);
                        glut.foodAngles[aIndex].y = Math.round(f.yy);
                        glut.foodAngles[aIndex].distance = f.distance;
                    }
                }
            }
        },

        // Scans for food.
        scan: function() {
            glut.foodAngles = [];

            for (let i = 0; i < window.foods.length && window.foods[i] !== null; i++) {
                const f = window.foods[i];

                if (!f.eaten) {
                    glut.addFoodAngle(f);
                }
            }

            glut.foodAngles.sort(function(a, b) {
              return b.score - a.score;
            });

            for (let i = 0; i < glut.foodAngles.length; i++) {
                if (glut.foodAngles[i] !== undefined && glut.foodAngles[i].sz > 0) {
                    const fa = glut.foodAngles[i];

                        glut.currentFood = {
                            x: fa.x,
                            y: fa.y,
                            sz: fa.sz,
                            da: fa.da
                        };

                    break;
                }
            }

            if (window.visualDebugging > 0) {
                pencil.drawLine({
                        x: bot.xx,
                        y: bot.yy
                    }, {
                        x: glut.currentFood.x,
                        y: glut.currentFood.y
                    },
                    'blue', 2);
            }
        }
    };
})(window);

// Assembles robot modules.
var bot = window.bot = (function(window) {
    return {
        opt: {
            // how long the main loop tries to be
            targetFps: 60,
            // size of arc between collision angles
            arcSize: Math.PI / 8,
            // snake speed when small and not boosting
            speedBase: 5.78
        },
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
            const s = bot.sin * bot.snakeWidth;
            const c = bot.cos * bot.snakeWidth;
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

            while (angle < 0) {
                angle += TP;
            }

            while (angle > TP) {
                angle -= TP;
            }

            const index = Math.round(angle * (1 / (TP / bot.MAXARC)));

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
            bot.MAXARC = (2 * Math.PI) / bot.opt.arcSize;
            bot.xx = window.snake.xx + window.snake.fx;
            bot.yy = window.snake.yy + window.snake.fy;

            bot.speedMult = window.snake.sp / bot.opt.speedBase;
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
            glut.scan();
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
