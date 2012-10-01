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
     * Safe check for value. Returns false if is null or undefined.
     * @param val
     * @return {*}
     */
    me.getVal = function(val) {
        if (!me.isSomethingMeaningful(val))
            return false;
        else
            return val;
    }

    me.isEnabled = function(btn) {
        return $(btn).attr('disabled') != 'disabled';
    }

    me.findLivePlayer = function(players) {
        return _.filter(players, function(p) {
            return kadi.getVal(p.live) == true;
        })
    }

    me.coinToss = function(players) {
        var starter = Math.floor( Math.random() * players.length);
        return players[starter];
    }

    me.safeAssign = function(val, prev) {
        if (me.isSomethingMeaningful(val)) {
            prev = val;
        }
    }

    String.prototype.hashCode = function() {
        var hash = 0;
        if (this.length == 0) return hash;
        for (var i = 0; i < this.length; i++) {
            var char = this.charCodeAt(i);
            hash = ((hash<<5)-hash)+char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }

    me.centerLine = function(containerSize, offset) {
        return (containerSize / 2) + offset;
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
    }


    me.calculateFanWidthWithoutOverlap = function(itemWidth, optionalMargin, numItems) {
        var minWidth = optionalMargin;
        _.each(_.range(numItems), function(item) {
           minWidth += (itemWidth + optionalMargin);
        });
        return minWidth;
    }

    me.createLink = function(className) {
        var elem = document.createElement("a");
        elem.className = className;
        return elem;
    }

    me.createDiv = function(className,id) {
        var elem = document.createElement("div");
        elem.className = className;
        if (kadi.isSomethingMeaningful(id))
            elem.id = id;
        return elem;
    }

    me.isEven = function(num) {
        return num === 0 || num % 2 == 0
    }

    me.isLeft = function(idx, num) {
        return idx < (num - 1) / 2;
    }

    me.isRight = function(idx, num) {
        return idx > (num - 1) / 2;
    }

    me.isMiddle = function(idx, num) {
        return idx == Math.floor((num-1) / 2);
    }

    me.middleIdx = function(num) {
        return Math.floor((num - 1) / 2);
    }

    me.negate = function(num) {
        return 0-num;
    }

    me.getMultiplier = function(idx,num) {

    }


    me.getOffset = function(idx, num, itemWidth, margin) {
        if (num >= 2) {
//            if (idx == 0) {
//                return kadi.negate((itemWidth + margin) / 2);
//            }
//            else if (idx == 1) {
//                return (itemWidth + margin) / 2;
//            }
//            if (kadi.isEven(idx)) {
//            }
//            if(kadi.isLeft(idx, num)) {
//                return kadi.negate((itemWidth + margin) / 2);
//            }
//            else if(kadi.isMiddle(idx,num)) {
//
//            }
//            else {
//                return (itemWidth + margin) / 2;
//            }

//            console.log(idx,num);
            var isMiddle = kadi.isMiddle(idx,num);
            var isLeft = kadi.isLeft(idx,num);
            var isRight = kadi.isRight(idx, num);

            console.log("idx: %d, num: %d, middle: %s, left: %s, right: %s", idx, num, isMiddle, isLeft, isRight);

            if (isMiddle)
                return 0;
            else if (isLeft)
                return (itemWidth + margin);
            else if (isRight)
                return kadi.negate((itemWidth + margin));

//            if(kadi.isMiddle(idx, num))
//                return 0;
//            else if (kadi.isLeft(idx, num)) {
//                return (itemWidth + margin) / 2;
//            }
//            else {
//                return kadi.negate((itemWidth + margin) / 2);
//            }
            return 0;
        }
    }

    me.chineseFan = function(containerWidth,offSet,itemWidth,numItems,margin) {
//        console.log("Width: %d, offset: %d, itemWidth: %d, numItems: %d, margin: %d", containerWidth, offSet, itemWidth, numItems, margin);
        var coords = [];
        var middle = kadi.centerLine(containerWidth,offSet);
//        console.log("Middle line: ", middle);
        _.each(_.range(numItems), function(idx) {
//            coords.push(new kadi.Pos(null,margin+itemWidth,null,me.Pos.RESET));
            var offset = me.getOffset(idx,numItems, itemWidth, margin);
//            var pos = new kadi.Pos(null,)
//            console.log("idx: %d, offset: %d", idx, offset);

            var pos = new kadi.Pos(null, offset, null, null);
            coords.push(pos);
        });
        return coords;
    }

    me.buildVerticalFan = function(containerWidth,innerWidth, itemWidth, numItems, margin, reverse) {
        var first = kadi.centerInFrame(containerWidth, innerWidth);
        console.log("First: ", first);
        var coords = [];
        coords.push(new kadi.Pos(kadi.game.PlayerDeck.X_C, first));

        for(var ctr=1;ctr<numItems;ctr++) {
            var prior = coords[ctr-1].y + itemWidth + margin;
            coords.push(new kadi.Pos(kadi.game.PlayerDeck.X_C,prior));
        }

        return coords;
    }

    me.buildFan = function(containerWidth,innerWidth, itemWidth, numItems, margin, reverse) {
        var first = kadi.centerInFrame(containerWidth, innerWidth);
        var x = kadi.centerInFrame(containerWidth, innerWidth);
        var coords = [];
        coords.push(new kadi.Pos(x,0));
        reverse = kadi.getVal(reverse);

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
                if (!center && left)
                    if (reverse)
                        c.rotate = -7;
                    else
                        c.rotate = 7;
                else if (!center && right)
                    if (reverse)
                        c.rotate = 7;
                    else
                        c.rotate = -7;
                else
                    c.rotate = 0;
            }
        });

        return coords;
    }


    me.getRandomLocation = function(containerBox, xMax, yMax, rotationMax) {
        var ranX = Math.floor( Math.random() * xMax );
        var ranY = Math.floor( Math.random() * yMax );
        var left = containerBox.left() + ranX;
        var top = containerBox.top() + ranY;

        var randomRotation = Math.floor( Math.random() * rotationMax );
        var negative = Math.floor( Math.random() * 2 ) == 1;

        if (negative) randomRotation = 0 - randomRotation;

        return new me.Pos(left, top, randomRotation);
    }

    me.randomizeCardLocations = function(numCards, boundingBox) {
        var locations = [];
        _.each(_.range(numCards), function(idx) {
            locations.push(me.getRandomLocation(boundingBox, 10, 5, 10));
        });
        return locations;
    }

    me.flatVerticalFan = function(containerWidth, itemWidth, optionalMargin, numItems, reverse) {
//        console.log("CW: %d, IW: %d, OM: %d, Num: %d, R: %s", containerWidth, itemWidth, optionalMargin, numItems, reverse);
        var coords = [];
        var widthWithoutOverlap = kadi.calculateFanWidthWithoutOverlap(itemWidth,optionalMargin,numItems);
        console.log("Width without OL: %s, C: %s", widthWithoutOverlap, containerWidth);

        if (widthWithoutOverlap <= containerWidth) {
            coords = kadi.buildVerticalFan(containerWidth,widthWithoutOverlap,itemWidth,numItems,optionalMargin,reverse);
        }

        return coords;
    }

    /**
     * returns an array of left values for items
     */
    me.flatChineseFan = function(containerWidth, itemWidth, optionalMargin, numItems,reverse) {
        var widthWithoutOverlap = kadi.calculateFanWidthWithoutOverlap(itemWidth,optionalMargin,numItems);
        var coords = [];

        if (widthWithoutOverlap <= containerWidth) {
            coords = kadi.buildFan(containerWidth,widthWithoutOverlap,itemWidth,numItems,optionalMargin,reverse);
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
            coords = kadi.buildFan(containerWidth,newInnerWidth,newWidth,numItems,0,reverse);
        }
        return coords;
    }

    me.Pos = JS.Class({
        statics: {
            RESET: '0px 0px'
        },
        construct : function(x,y,rotate,origin) {
            this.x = x;
            this.y = y;
            this.rotate = rotate;
            this.origin = origin;
        },
        toS: function() {
            return "x: " + this.x + ", y: " + this.y + ", rotate: " + this.rotate + ", origin: " + this.origin;
        }
    });

    me.BBox = JS.Class({
        construct: function(topLeft,width,height) {
            this.topLeft = topLeft;
            this.width = width;
            this.height = height;
            this.left = function() {
                return this.topLeft.x;
            }
            this.top = function() {
                return this.topLeft.y;
            }
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

    me.Handler = JS.Class({
        construct : function(func,scope) {
            this.func = func;
            this.scope = scope;
        },

        callBack : function(params) {
            var mthd = _.bind(this.func,this.scope,params);
            mthd();
        }
    });

    return me;
})(window.kadi || {}, jQuery);

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
