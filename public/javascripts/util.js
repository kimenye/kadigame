window.kadi = (function(me, $, undefined){

    /**
     * Check if an item is null or empty
     *
     * @param val
     * @return {Boolean}
     */
    me.isSomethingMeaningful = function(val) {
        return !_.isUndefined(val) && !_.isNull(val);
    }

    /**
     * Centers a child element in a parent
     *
     * @param parentDimension
     * @param childDimension
     * @return {Number}
     */
    me.centerInFrame = function (parentDimension, childDimension) {
        return (parentDimension - childDimension) / 2;
    }

    me.numThatCanFit = function(parent,child,margin) {
        var max = Math.floor(parent / (child + margin));
        return max;
//        var widthWithoutOverlap = kadi.calculateFanWidthWithoutOverlap(itemWidth,optionalMargin,numItems);
    }


    me.calculateFanWidthWithoutOverlap = function(itemWidth, optionalMargin, numItems) {
        var minWidth = optionalMargin;
        _.each(_.range(numItems), function(item) {
           minWidth += (itemWidth + optionalMargin);
        });
        return minWidth;
    }

    me.buildFan = function(containerWidth,innerWidth, itemWidth, numItems, margin) {
        var first = kadi.centerInFrame(containerWidth, innerWidth);
        var x = kadi.centerInFrame(containerWidth, innerWidth);
        var coords = [];
        coords.push(new kadi.Pos(x,0));

        for(var ctr=1;ctr<numItems;ctr++) {
            var prior = coords[ctr-1].x + itemWidth + margin;
            coords.push(new kadi.Pos(prior,0));
        }

        _.each(coords, function(c, idx) {
            if (numItems > 2) {
                var mid = Math.floor(numItems / 2);
                var left = idx < numItems / 2;
                var right = !left;

                var center = idx == mid;

                console.log("Mid: %d, Idx: %d of %d, L: %s, R: %s, Center: %s", mid, idx, numItems, left, right,center);
                if (!center && left)
                    c.rotate = -7;
                else if (!center && right)
                    c.rotate = 7;
                else
                    c.rotate = 0;
            }
        });

        return coords;
    }

    /**
     * returns an array of left values for items
     */
    me.flatChineseFan = function(containerWidth, itemWidth, optionalMargin, numItems) {
        var widthWithoutOverlap = kadi.calculateFanWidthWithoutOverlap(itemWidth,optionalMargin,numItems);
        var coords = [];

        if (widthWithoutOverlap <= containerWidth) {
            coords = kadi.buildFan(containerWidth,widthWithoutOverlap,itemWidth,numItems,optionalMargin);
        }
        else {
            var overlapStep = 5;
            var canFit = false;
            var newWidth = itemWidth;
            var newInnerWidth = 0;

            while (!canFit) {
                newInnerWidth = kadi.calculateFanWidthWithoutOverlap(newWidth,0,numItems);
                if (newInnerWidth <= containerWidth) {
                    canFit = true;
                }
                else {
                    newWidth -= overlapStep;
                }
            }
            coords = kadi.buildFan(containerWidth,newInnerWidth,newWidth,numItems,0);
        }
        return coords;
    }

    me.Pos = JS.Class({
        construct : function(x,y,rotate) {
            this.x = x;
            this.y = y;
            this.rotate = rotate;
        }
    });

    /**
     * Create a span
     *
     * @param text
     * @param className
     * @param id
     * @return {Element}
     */
    me.createSpan = function(text, className, id) {
        var span = document.createElement("span");
        span.innerHTML = text;
        if (me.isSomethingMeaningful(className)) {
            span.className = className;
        }

        if (me.isSomethingMeaningful(id)) {
            span.id = id;
        }
        return span;
    }


    return me;
})(window.kadi || {}, jQuery);

var Handler = JS.Class({
    construct : function(func,scope) {
        this.func = func;
        this.scope = scope;
    },

    callBack : function(params) {
        var _mthd = _.bind(this.func,this.scope,params);
        _mthd();
    }
});


ko.bindingHandlers.fadeVisible = {
    init: function(element, valueAccessor) {
        // Initially set the element to be instantly visible/hidden depending on the value
        var value = valueAccessor();
        $(element).toggle(ko.utils.unwrapObservable(value)); // Use "unwrapObservable" so we can handle values that may or may not be observable
    },
    update: function(element, valueAccessor) {
        // Whenever the value subsequently changes, slowly fade the element in or out
        var value = valueAccessor();
        ko.utils.unwrapObservable(value) ? $(element).fadeIn("fast") : $(element).slideUp();
    }
};
