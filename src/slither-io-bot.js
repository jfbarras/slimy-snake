
/* jshint esversion: 6 */

// Allows the bot to perform actions.
var actuator = window.actuator = (function(window) {
    return {
        // Spoofs moving the mouse to the provided coordinates.
        setMouseCoordinates: function(point) {
            window.xm = point.x;
            window.ym = point.y;
        },

        // Changes heading TO ang.
        changeHeadingAbs: function(angle) {
            const goal = {
                x: Math.round(bot.xx + bot.stdBubble * Math.cos(angle)),
                y: Math.round(bot.yy + bot.stdBubble * Math.sin(angle))
            };
            actuator.setMouseCoordinates(convert.mapToMouse(goal));
        },

        // Changes heading BY ang. Makes a left turn when given +π/2.
        changeHeadingRel: function(angle) {
            const heading = {
                x: bot.xx + bot.stdBubble * bot.cos,
                y: bot.yy + bot.stdBubble * bot.sin
            };
            const cos = Math.cos(-angle);
            const sin = Math.sin(-angle);
            const goal = {
                x: Math.round(
                    cos * (heading.x - bot.xx) -
                    sin * (heading.y - bot.yy) + bot.xx),
                y: Math.round(
                    sin * (heading.x - bot.xx) +
                    cos * (heading.y - bot.yy) + bot.yy)
            };
            actuator.setMouseCoordinates(convert.mapToMouse(goal));
        }
    };
})(window);

// Provides sorting functions.
var sortby = window.sortby = (function(window) {
    return {
        // Sorts by property 'da' ascending.
        ascDa: function(a, b) {
            return a.da - b.da;
        },

        // Sorts by property 'distance' ascending.
        ascDistance: function(a, b) {
            return a.distance - b.distance;
        },

        // Sorts by property 'score' descending.
        desScore: function(a, b) {
            return b.score - a.score;
        },

        // Sorts by property 'sz' descending.
        desSz: function(a, b) {
            return b.sz - a.sz;
        }
    };
})(window);

// Sees snake heads.
var head = window.head = (function(window) {
    return {
        opt: {
            // radius x speed multiplier
            mult: 10 / 4,
        },

        draw: function(obs) {
            if (tracer.check('wuss', 1)) {
                pencil.drawCircle(shapes.circle(obs.xx, obs.yy, obs.bubble), 'yellow');
            }
        },

        seeHeads: function() {
            var obs;
            for (let snake = 0, ls = window.snakes.length; snake < ls; snake++) {
                obs = undefined;

                // Skips the player's snake and also dead snakes.
                if (window.snakes[snake].id === window.snake.id ||
                    window.snakes[snake].alive_amt !== 1) continue;

                const s = window.snakes[snake];
                const snakeRadius = bot.getSnakeWidth(s.sc) / 2;
                const sSpMult = Math.min(1, s.sp / 5.78 - 0.2);
                const sRadius = (1.7 * bot.snakeRadius + snakeRadius / 2) * sSpMult * head.opt.mult;

                obs = {
                    xx: s.xx + Math.cos(s.ehang) * sRadius * 0.75,
                    yy: s.yy + Math.sin(s.ehang) * sRadius * 0.75,
                    snake: snake,
                    hardBody: 1,
                    bubble: sRadius,
                    type: 'pred'
                };

                bot.injectDistance2(obs);
                wuss.addCollisionAngle(obs);
                wuss.collisionPoints.push(obs);

                head.draw(obs);

                obs = {
                    xx: s.xx,
                    yy: s.yy,
                    snake: snake,
                    hardBody: snakeRadius,
                    bubble: sRadius,
                    type: 'head'
                };

                bot.injectDistance2(obs);
                wuss.addCollisionAngle(obs);
                wuss.collisionPoints.push(obs);

                head.draw(obs);

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
            mult: 10 / 10,
        },

        // Checks if a snake part is inside the normally visible window.
        isInBox: function(s, pts) {
            const sectorSide = Math.floor(Math.sqrt(window.sectors.length)) * window.sector_size;
            const sectorBox = shapes.rect(
                bot.xx - (sectorSide / 2),
                bot.yy - (sectorSide / 2),
                sectorSide, sectorSide);
            return canvas.pointInRect({x: s.pts[pts].xx, y: s.pts[pts].yy}, sectorBox);
        },

        draw: function(obs) {
            if (obs.distance <= Math.pow(5 * bot.snakeRadius + obs.bubble, 2)) {
                wuss.collisionPoints.push(obs);

                if (tracer.check('wuss', 1)) {
                    pencil.drawCircle(shapes.circle(obs.xx, obs.yy, obs.bubble), 'red');
                }
            } else if (tracer.check('wuss', 2)) {
                pencil.drawCircle(shapes.circle(obs.xx, obs.yy, obs.bubble), 'orange');
            }
        },

        seeParts: function(snake) {
            const s = window.snakes[snake];
            const snakeRadius = bot.getSnakeWidth(s.sc) / 2;
            const k = Math.ceil(snakeRadius / 15);

            // Basic observation of a snake part. No (x,y) yet.
            var obs = {
                snake: snake,
                hardBody: snakeRadius,
                bubble: (snakeRadius + bot.stdBubble) * part.opt.mult,
                type: 'part'
            };

            for (let pts = 0, lp = s.pts.length; pts < lp; pts += k) {
                // Skips dying and invisible parts.
                if (s.pts[pts].dying || !part.isInBox(s, pts)) continue;

                obs.xx = s.pts[pts].xx;
                obs.yy = s.pts[pts].yy;

                bot.injectDistance2(obs);
                wuss.addCollisionAngle(obs);

                part.draw(obs);
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
            arc: Math.PI / 720
        },
        MID_X: 0,
        MID_Y: 0,
        MAP_R: 0,
        MIN_D: 0,

        // Checks how far from center, the snake is.
        isWallClose: function() {
            if (wall.MID_X !== window.grd) {
                wall.MID_X = window.grd;
                wall.MID_Y = window.grd;
                wall.MAP_R = 0.98 * window.grd;
                wall.MIN_D = Math.pow(wall.MAP_R - wall.opt.distance, 2);
            }
            const dist = canvas.getDistance2(wall.MID_X, wall.MID_Y, bot.xx, bot.yy);
            return (dist > wall.MIN_D);
        },

        draw: function(obs) {
            if (tracer.check('wuss', 1)) {
                pencil.drawCircle(shapes.circle(obs.xx, obs.yy, obs.bubble), 'yellow');
            }
        },

        seeWall: function() {
            if (!wall.isWallClose()) return;
            const midAng = canvas.fastAtan2(bot.yy - wall.MID_X, bot.xx - wall.MID_Y);
            const j = (wall.opt.segments - 1) / 2;
            var obs = {
                snake: -1,
                hardBody: 1,
                bubble: bot.stdBubble,
                type: 'wall'
            };
            for (let i = -j; i <= j; i++) {
                obs.xx = wall.MID_X + wall.MAP_R * Math.cos(midAng + i * wall.opt.arc);
                obs.yy = wall.MID_Y + wall.MAP_R * Math.sin(midAng + i * wall.opt.arc);
                bot.injectDistance2(obs);
                wuss.collisionPoints.push(obs);
                wuss.addCollisionAngle(obs);

                wall.draw(obs);
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
            let j;
            if (i === 0) {
                j = 0;
            } else if (i % 2) {
                j = (i + 1) / 2;
            } else {
                j = (i / -2) + max;
            }
            return (base + j) % max;
        },

        drawBest: function(ang) {
            if (tracer.check('wuss', 0)) {
                pencil.drawLine({
                        x: bot.xx,
                        y: bot.yy
                    }, {
                        x: bot.xx + 1000 * Math.cos(ang),
                        y: bot.yy + 1000 * Math.sin(ang)
                    },
                    'lime');
            }
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
                wuss.drawBest(ang);
                return ang;
            }
        },

        // Adds to the collisionAngles array, if distance is closer.
        addCollisionAngle: function(sp) {
            const ang = canvas.fastAtan2(
                Math.round(sp.yy - bot.yy),
                Math.round(sp.xx - bot.xx));
            const aIndex = bot.getAngleIndex(ang);

            if (wuss.collisionAngles[aIndex] === undefined ||
                sp.distance < wuss.collisionAngles[aIndex].distance) {
                wuss.collisionAngles[aIndex] = {
                    x: Math.round(sp.xx),
                    y: Math.round(sp.yy),
                    ang: ang,
                    snake: sp.snake,
                    distance: sp.distance,
                    radius: sp.bubble
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
            wuss.collisionPoints.sort(sortby.ascDistance);

            if (tracer.check('wuss', 1)) {
                for (let i = 0; i < wuss.collisionAngles.length; i++) {
                    if (wuss.collisionAngles[i] !== undefined) {
                        pencil.drawLine({
                                x: bot.xx,
                                y: bot.yy
                            }, {
                                x: wuss.collisionAngles[i].x,
                                y: wuss.collisionAngles[i].y
                            },
                            '#251d11'); // very dark (mostly black) orange
                    }
                }
            }
        }
    };
})(window);

// Sees food.
var glut = window.glut = (function(window) {
    return {
        opt: {
            // how many frames per food check
            frames: 4,
        },
        foodAngles: [],
        currentFood: {},
        eating: false,

        // Checks which angle is best to get to this food.
        getFoodAng: function(f) {
            var choices = [];
            // mid angle
            const mid = canvas.fastAtan2(
                Math.round(f.yy - bot.yy),
                Math.round(f.xx - bot.xx));
            choices[0] = {
                ang: mid,
                da: Math.abs(canvas.angleBetween(mid, window.snake.ehang))
            };
            // adapt some getHeadCircle code
            const s = Math.sin(mid) * bot.snakeWidth * 0.707;
            const c = Math.cos(mid) * bot.snakeWidth * 0.707;
            const leftLip = {
                x: bot.xx + c + s,
                y: bot.yy + s - c,
            };
            const rightLip = {
                x: bot.xx + c - s + 2 * Math.cos(mid),
                y: bot.yy + s + c + 2 * Math.sin(mid),
            };
            // left angle
            let tmp = canvas.fastAtan2(
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

            choices.sort(sortby.ascDa);
            return choices[0].ang;
        },

        // Adds and scores foodAngles.
        addFoodAngle: function(f) {
            const ang = glut.getFoodAng(f);
            const aIndex = bot.getAngleIndex(ang);

            bot.injectDistance2(f);
            // Rejects food beyond obstacles.
            if (wuss.collisionAngles[aIndex] !== undefined &&
                f.distance > wuss.collisionAngles[aIndex].distance) return;

            const fdistance = Math.sqrt(f.distance);

            // Rejects food that is too close. (Can't turn this sharp.)
            if (fdistance < 5 * bot.snakeRadius) return;

            const nx = Math.round(bot.xx + fdistance * Math.cos(ang));
            const ny = Math.round(bot.yy + fdistance * Math.sin(ang));
            const da = canvas.angleBetween(ang, window.snake.ehang);
            const div = 3 * bot.snakeRadius * Math.abs(da) + fdistance;

            // Rejects food with low score.
            if (f.sz > 10 || div < 15 * bot.snakeWidth) {
                if (glut.foodAngles[aIndex] === undefined) {
                    glut.foodAngles[aIndex] = {
                        x: nx,
                        y: ny,
                        ang: ang,
                        da: da,
                        distance: f.distance,
                        sz: f.sz,
                        score: f.sz / div
                    };
                } else {
                    glut.foodAngles[aIndex].sz += f.sz;
                    glut.foodAngles[aIndex].score += f.sz / div;
                    if (f.distance < glut.foodAngles[aIndex].distance) {
                        glut.foodAngles[aIndex].x = nx;
                        glut.foodAngles[aIndex].y = ny;
                        glut.foodAngles[aIndex].ang = ang;
                        glut.foodAngles[aIndex].da = da;
                        glut.foodAngles[aIndex].distance = f.distance;
                    }
                }
            }
        },

        // Checks if the snake should turn towards the provided foodAngle.
        signCheck: function(fa) {
            const da = glut.currentFood.da;
            const sameSign = (fa.da < 0 && da < 0) || (fa.da > 0 && da > 0);
            const small = Math.abs(fa.da) < bot.opt.arcSize;
            return sameSign || small;
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

            glut.foodAngles.sort(sortby.desScore);

            let found = false;

            for (let i = 0; i < glut.foodAngles.length; i++) {
                if (glut.foodAngles[i] !== undefined && glut.foodAngles[i].sz > 0) {
                    const fa = glut.foodAngles[i];

                    const j = bot.getAngleIndex(fa.ang);
                    fa.safe = wuss.collisionAngles[j] === undefined ||
                        Math.sqrt(wuss.collisionAngles[j].distance) >
                        Math.sqrt(fa.distance) + wuss.collisionAngles[j].radius;

                    if (!found && fa.safe && glut.signCheck(fa)) {
                        glut.currentFood = {
                            x: fa.x,
                            y: fa.y,
                            sz: fa.sz,
                            da: fa.da
                        };
                        found = true;
                    }
                }
            }

            // Adopts best undefined angle.
            if (!found) {
                const ang = wuss.bestUndefAngle();
                glut.currentFood = {
                    x: bot.xx + bot.stdBubble * Math.cos(ang),
                    y: bot.yy + bot.stdBubble * Math.sin(ang),
                    sz: 0,
                    da: 0
                };
            }
        },

        run: function() {
            if (tracer.check('glut', 1)) {
                for (let i = 0; i < glut.foodAngles.length; i++) {
                    if (glut.foodAngles[i] !== undefined && glut.foodAngles[i].sz > 0) {
                        const fa = glut.foodAngles[i];
                        pencil.drawLine({
                                x: bot.xx,
                                y: bot.yy
                            }, {
                                x: fa.x,
                                y: fa.y
                            },
                            fa.safe ? 'DarkCyan' : 'red',
                            fa.safe ? 1 : 2
                        );
                    }
                }
            }

            if (tracer.check('glut', 0)) {
                pencil.drawLine({
                        x: bot.xx,
                        y: bot.yy
                    }, {
                        x: glut.currentFood.x,
                        y: glut.currentFood.y
                    },
                    'cyan');
            }

            if (glut.actionTimeout !== undefined) return;
            const delay = (1000 / bot.opt.targetFps) * glut.opt.frames;
            glut.actionTimeout = window.setTimeout(glut.actionTimer, delay);
        },

        actionTimer: function() {
            if (bot.isAlive()) {
                glut.scan();
                if (glut.eating) {
                    actuator.setMouseCoordinates(convert.mapToMouse(glut.currentFood));
                }
            }
            glut.actionTimeout = undefined;
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
            return Math.round(29.0 * sc);
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
            return shapes.circle(
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
            while (angle < 0) {
                angle += TAU;
            }

            while (angle > TAU) {
                angle -= TAU;
            }

            const index = Math.round(angle * (1 / (TAU / bot.MAXARC)));

            if (index === bot.MAXARC) {
                return 0;
            }
            return index;
        },

        every: function() {
            bot.cos = Math.cos(window.snake.ang);
            bot.sin = Math.sin(window.snake.ang);
            bot.MAXARC = TAU / bot.opt.arcSize;
            bot.xx = window.snake.xx + window.snake.fx;
            bot.yy = window.snake.yy + window.snake.fy;

            bot.speedMult = window.snake.sp / bot.opt.speedBase;
            bot.snakeWidth = bot.getSnakeWidth();
            bot.snakeRadius = bot.snakeWidth / 2;
            bot.stdBubble = 3 * bot.snakeRadius;
            bot.snakeLength = bot.getSnakeLength();

            if (tracer.level > 0) {
                // coral food collection sector
                pencil.drawAngle(window.snake.ehang - Math.PI / 4, window.snake.ehang + Math.PI / 4,
                    bot.stdBubble, 'coral', false);
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
            glut.run();
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
