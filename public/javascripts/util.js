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

    /**
     * returns an array of left values for items
     */
    me.flatChineseFan = function(containerWidth, itemWidth, optionalMargin, numItems) {
        var widthWithoutOverlap = kadi.calculateFanWidthWithoutOverlap(itemWidth,optionalMargin,numItems);
        var coords = [];

        if (widthWithoutOverlap <= containerWidth) {
//            _.each(_.range(numItems), function(item) {
//                console.log("Processing ", item);
//                var x = kadi.centerInFrame(containerWidth, widthWithoutOverlap)
//                coords.push(new kadi.Pos(x,0));
//            });
            var first = kadi.centerInFrame(containerWidth, widthWithoutOverlap);
            var x = kadi.centerInFrame(containerWidth, widthWithoutOverlap);
            coords.push(new kadi.Pos(x,0));
//            var ctr=1;

            for(var ctr=1;ctr<numItems;ctr++) {
                var prior = coords[ctr-1].x + itemWidth + optionalMargin;
//                coords.push(new )
//                var left = x + (numItems)
                coords.push(new kadi.Pos(prior,0));
            }
        }
        return coords;
    }

    me.Pos = JS.Class({
        construct : function(x,y) {
            this.x = x;
            this.y = y;
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
