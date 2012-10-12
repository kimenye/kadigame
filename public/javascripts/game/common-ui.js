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

    me.Box = JS.Class({
        construct: function(parent,id,className,x,y,width,height) {
            this.id = id;
            this.div = document.createElement("DIV");
            this.div.id = id;
            this.div.className = className;
            this.parent = document.getElementById(parent);
            $(this.div).css('z-index','0');
        },

        node : function() {
            return $(this.div);
        },

        hide: function() {
            this.node().hide();
        },

        display: function() {
            this.parent.appendChild(this.div);
        },
        moveTo: function(x,y) {
            var options = {};
            if (kadi.isSomethingMeaningful(x)) {
                _.extend(options, {x: x + "px" });
            }
            if (kadi.isSomethingMeaningful(y)) {
                _.extend(options, {y: y + "px" });
            }
            this.node().transition(options, 500, 'snap');
        }
    });

    return me;
})(window.kadi.ui || {}, jQuery);
