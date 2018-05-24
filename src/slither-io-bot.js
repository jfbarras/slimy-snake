
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
        }
    };
})(window);

var bot = window.bot = (function(window) {
    return {
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

        drawSideCircles: function() {
          var sidecircle;
          var s = bot.sin * bot.snakeWidth;
          var c = bot.cos * bot.snakeWidth;
          var r = bot.snakeRadius;

          //inner-right
          sidecircle = canvas.circle(bot.xx - s, bot.yy + c, r);
          pencil.drawCircle(sidecircle, 'darkred', false);

          //inner-left
          sidecircle = canvas.circle(bot.xx + s, bot.yy - c, r);
          pencil.drawCircle(sidecircle, 'darkred', false);

          //outer-right
          sidecircle = canvas.circle(bot.xx - s, bot.yy + c, 3 * r);
          pencil.drawCircle(sidecircle, 'darkred', false);

          //outer-left
          sidecircle = canvas.circle(bot.xx + s, bot.yy - c, 3 * r);
          pencil.drawCircle(sidecircle, 'darkred', false);
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
                pencil.drawAngle(window.snake.ehang - Math.PI/4, window.snake.ehang + Math.PI/4,
                    3 * bot.snakeRadius, 'coral', false);
                // dark red circles depict snake turn radius
                bot.drawSideCircles();
            }
        }
    };
})(window);
