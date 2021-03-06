
/* jshint esversion: 6 */

// Sends arguments to console log.
window.log = function() {
    if (window.logDebugging) {
        console.log.apply(console, arguments);
    }
};

// Helps with coordinate convertion.
var convert = window.convert = (function(window) {
    return {
        // Converts Map coordinates to Mouse coordinates.
        mapToMouse: function(point) {
            return {
                x: (point.x - bot.xx) * window.gsc,
                y: (point.y - bot.yy) * window.gsc
            };
        },

        // Converts Map coordinates to Canvas cordinates.
        mapToCanvas: function(point) {
            return {
                x: window.mww2 + (point.x - window.view_xx) * window.gsc,
                y: window.mhh2 + (point.y - window.view_yy) * window.gsc
            };
        },

        // Converts Map circle to Canvas circle.
        circleMapToCanvas: function(circle) {
            // Convert origin.
            var newCircle = convert.mapToCanvas({
                x: circle.x,
                y: circle.y
            });
            // Scales radius by gsc.
            return shapes.circle(
                newCircle.x,
                newCircle.y,
                circle.radius * window.gsc
            );
        }
    };
})(window);

// Helps with building shapes. Rounds positions and dimensions.
var shapes = window.shapes = (function(window) {
    return {
        // Constructs a rectangle.
        rect: function(x, y, w, h) {
            return {
                x: Math.round(x),
                y: Math.round(y),
                width: Math.round(w),
                height: Math.round(h)
            };
        },

        // Constructs a circle.
        circle: function(x, y, r) {
            return {
                x: Math.round(x),
                y: Math.round(y),
                radius: Math.round(r)
            };
        }
    };
})(window);

const TAU = 2 * Math.PI;

// Helps with geometry and trig.
var canvas = window.canvas = (function(window) {
    return {
        // Approximates the value of the arc tangent of y/ x.
        fastAtan2: function(y, x) {
            var r = 0.0;
            var angle = 0.0;
            var abs_y = Math.abs(y) + 1e-10; // kludge to prevent 0/0 condition
            if (x < 0) {
                r = (x + abs_y) / (abs_y - x);
                angle = 3 * Math.PI / 4;
            } else {
                r = (x - abs_y) / (x + abs_y);
                angle = Math.PI / 4;
            }
            angle += (0.1963 * r * r - 0.9817) * r;
            if (y < 0) {
                return -angle; // negate if in quad III or IV
            }
            return angle;
        },

        // Returns the shortest signed difference between two angles,
        // ie How much does Source need to turn to align with Target?
        angleBetween: function(target, source) {
            var da = target - source;
            if (da > Math.PI) da -= TAU;
            if (da < -Math.PI) da += TAU;
            return da;
        },

        // Computes distance squared.
        getDistance2: function(x1, y1, x2, y2) {
            var distance2 = Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2);
            return distance2;
        },

        // Checks if a point is inside a rectangle.
        pointInRect: function(point, rect) {
            return (rect.x <= point.x && rect.y <= point.y &&
                rect.x + rect.width >= point.x && rect.y + rect.height >= point.y);
        }
    };
})(window);

// Helps with zoom.
var zoom = window.zoom = (function(window) {
    return {
        // Adjusts zoom in response to mouse wheel.
        set: function(e) {
            if (window.gsc) {
                window.gsc *= Math.pow(0.9, e.wheelDelta / -120 || e.detail / 2 || 0);
                window.desired_gsc = window.gsc;
            }
        },

        // Restores zoom to the default value.
        reset: function() {
            window.gsc = 0.9;
            window.desired_gsc = 0.9;
        },

        // Sets zoom to desired zoom.
        maintain: function() {
            if (window.desired_gsc !== undefined) {
                window.gsc = window.desired_gsc;
            }
        }
    };
})(window);

// Draws shapes to the canvas.
var pencil = window.pencil = (function(window) {
    return {
        // Draws a rectangle on the canvas.
        drawRect: function(rect, color, fill, alpha) {
            if (alpha === undefined) alpha = 1;

            var context = window.mc.getContext('2d');
            var lc = convert.mapToCanvas({x: rect.x, y: rect.y});

            context.save();
            context.globalAlpha = alpha;
            context.strokeStyle = color;
            context.rect(lc.x, lc.y, rect.width * window.gsc, rect.height * window.gsc);
            context.stroke();
            if (fill) {
                context.fillStyle = color;
                context.fill();
            }
            context.restore();
        },

        // Draws a circle on the canvas.
        drawCircle: function(circle, color, fill, alpha) {
            if (alpha === undefined) alpha = 1;
            if (circle.radius === undefined) circle.radius = 5;

            var context = window.mc.getContext('2d');
            var newCircle = convert.circleMapToCanvas(circle);

            context.save();
            context.globalAlpha = alpha;
            context.beginPath();
            context.strokeStyle = color;
            context.arc(newCircle.x, newCircle.y, newCircle.radius, 0, TAU);
            context.stroke();
            if (fill) {
                context.fillStyle = color;
                context.fill();
            }
            context.restore();
        },

        // Draws a sector (angle + arc = a pie slice) centered on the canvas.
        // @param {number} start -- where to start the angle
        // @param {number} end -- where to end the angle
        drawAngle: function(start, end, arcradius, color, fill, alpha) {
            if (alpha === undefined) alpha = 0.6;

            var context = window.mc.getContext('2d');

            context.save();
            context.globalAlpha = alpha;
            context.beginPath();
            context.strokeStyle = color;
            context.moveTo(window.mc.width / 2, window.mc.height / 2);
            context.arc(window.mc.width / 2, window.mc.height / 2, arcradius * window.gsc, start, end);
            context.lineTo(window.mc.width / 2, window.mc.height / 2);
            context.closePath();
            context.stroke();
            if (fill) {
                context.fillStyle = color;
                context.fill();
            }
            context.restore();
        },

        // Draws a line on the canvas.
        drawLine: function(p1, p2, color, width) {
            if (width === undefined) width = 2;

            var context = window.mc.getContext('2d');
            var dp1 = convert.mapToCanvas(p1);
            var dp2 = convert.mapToCanvas(p2);

            context.save();
            context.beginPath();
            context.lineWidth = width * window.gsc;
            context.strokeStyle = color;
            context.moveTo(dp1.x, dp1.y);
            context.lineTo(dp2.x, dp2.y);
            context.stroke();
            context.restore();
        }
    };
})(window);
