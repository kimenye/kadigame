window.kadi.ui = (function(me, $, undefined){

    /**
     * Hide the loading text
     *
     * @param elementToDisplay
     */
    me.disableLoading  = function(elementToDisplay) {
        $('#loading').hide();
        $('#' + elementToDisplay).show();
        return true;
    };

    me.updateLoadingText = function(text) {
        $('#loading-text').html(text);
    };

    me.BoundingBox = JS.Class({

        construct: function(x,y,width,height,idx) {
            this.idx = idx;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        },

        xMax : function() {
            return this.x + this.width;
        },

        xMin : function() { return this.x; },

        yMax : function() {
            return this.y + this.height;
        },

        xCenter: function() {
            return this.x + (this.width / 2);
        }

        ,yCenter: function() {
            return this.y + (this.height / 2);
        },

        yMin : function() { return this.y},

        contains : function(other) {
            return this.xMin() <= other.xMin() && this.xMax() >= other.xMax() && this.yMin() <= other.yMin() && this.yMax() >= other.yMax();
        }
    });


    return me;
})(window.kadi.ui || {}, jQuery);
