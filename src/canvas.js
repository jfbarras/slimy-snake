
// Sends arguments to console log.
window.log = function() {
    if (window.logDebugging) {
        console.log.apply(console, arguments);
    }
};

var canvas = window.canvas = (function(window) {
    return {
        // Adjusts zoom in response to mouse wheel.
        setZoom: function(e) {
            if (window.gsc) {
                window.gsc *= Math.pow(0.9, e.wheelDelta / -120 || e.detail / 2 || 0);
                window.desired_gsc = window.gsc;
            }
        },

        // Restores zoom to the default value.
        resetZoom: function() {
            window.gsc = 0.9;
            window.desired_gsc = 0.9;
        },

        // Sets zoom to desired zoom.
        maintainZoom: function() {
            if (window.desired_gsc !== undefined) {
                window.gsc = window.desired_gsc;
            }
        }
    };
})(window);

var bot = window.bot = (function(window) {
    return {
        scores: []
    };
})(window);
