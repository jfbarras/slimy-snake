
var bot = window.bot = (function(window) {
    return {
        state: 'init',
        scores: [],

        getSnakeWidth: function(sc) {
            if (sc === undefined) sc = window.snake.sc;
            return Math.round(sc * 29.0);
        },

        getSnakeLength: function(sct) {
            if (sct === undefined) sct = window.snake.sct;
            return Math.floor(15 * (window.fpsls[sct] + window.snake.fam /
                window.fmlts[sct] - 1) - 5);
        },

        every: function() {
            bot.cos = Math.cos(window.snake.ang);
            bot.sin = Math.sin(window.snake.ang);
            bot.xx = window.snake.xx + window.snake.fx;
            bot.yy = window.snake.yy + window.snake.fy;

            bot.snakeWidth = bot.getSnakeWidth();
            bot.snakeRadius = bot.snakeWidth / 2;
            bot.snakeLength = bot.getSnakeLength();

            canvas.drawAngle(window.snake.ehang - Math.PI/8, window.snake.ehang + Math.PI/8,
                3 * bot.snakeRadius, 'cyan', false);
        }
    };
})(window);
