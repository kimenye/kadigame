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
        var idx = Math.floor( Math.random() * players.length);
        return idx;
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

    me.createButton = function(className, label, id) {
        var elem = document.createElement("button");
        elem.className = className;
        elem.innerHTML = label;
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
        var mid = kadi.middleIdx(num);
        return Math.abs(idx - mid);
    }


    me.getOffset = function(idx, num, itemWidth, margin, middle, init) {
        if (num >= 2) {
            var isMiddle = kadi.isMiddle(idx,num);
            var isLeft = kadi.isLeft(idx,num);
            var isRight = kadi.isRight(idx, num);
            var multi = kadi.getMultiplier(idx, num);
            var even = kadi.isEven(num);
            var middleIdx = kadi.middleIdx(num);

            if (even) {
                var offset = 0;

                if (idx == middleIdx)
                    offset = kadi.negate(middle - init);
                else if (idx == middleIdx + 1)
                    offset = middle - init;
                else if (idx < middleIdx) {
                    var pos = middle + (itemWidth * multi) + (margin * multi);
                    offset = pos - init;
                }
                else {
                    var pos = middle - (itemWidth * multi) - (margin * (multi-1));
                    offset = pos - init;
                }
                return offset;

            } else {
                if (isMiddle)
                    return 0;
                else if (isLeft)
                    return (itemWidth + margin) * multi;
                else if (isRight)
                    return kadi.negate((itemWidth + margin) * multi);
            }
            return 0;
        }
    }

    me.fan = function(num, itemWidth, margin, middle, init) {
        var coords = [];
        _.each(_.range(num), function(idx) {
            var offset = me.getOffset(idx,num, itemWidth, margin, middle, init);
            var rotate = 0;
            var pos = new kadi.Pos(null, offset, rotate, null);
            coords.push(pos);
        });
        return coords;
    }

    me.chineseFan = function(containerWidth,offSet,itemWidth,numItems,margin,reverse) {
        var coords = [];
        var middle = kadi.centerLine(containerWidth,offSet);
        var init = kadi.centerInFrame(containerWidth, itemWidth) + offSet;
        var fits = false;
        do
        {
            coords = kadi.fan(numItems, itemWidth, margin, middle, init);
            var fPos = _.first(coords);
            var lPos = _.last(coords);
            var largest = Math.max(Math.abs(fPos.y), Math.abs(lPos.y));
            var diff = (init + largest) - containerWidth;
            if (diff <= 0 || numItems <= 2 || margin == -70)
                fits = true;
            else
                margin -= 5;
        }
        while(!fits)

        if (numItems > 2)
            _.each(coords, function(c, idx) {
                var y = init + c.y;
                if (y >= middle)
                    c.rotate = -3;
                else
                    c.rotate = 3;

                if (reverse)
                    c.rotate = kadi.negate(c.rotate);
            });

        return coords;
    }

    me.buildVerticalFan = function(containerWidth,innerWidth, itemWidth, numItems, margin, reverse) {
        var first = kadi.centerInFrame(containerWidth, innerWidth);
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
            ORIGIN_RESET: '0px 0px'
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
            this.toS = function() {
                return "Top: " + this.topLeft.toS() + " W: " + this.width + " L: " + this.height;
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
    };

    me.containsCardOfRank = function(hand, rank) {
        return kadi.isSomethingMeaningful(_.detect(hand, function(c) { return c.rank == rank }));
    };

    me.highestPickingCard = function(hand) {
        var pickingCards = _.reject(hand, function(c) { return !c.isPickingCard() });
        var sorted = _.sortBy(pickingCards, function(c) {  return c.pickingValue() });
        return _.last(sorted);
    };

    me.containsPickingCard = function(hand) {
        return kadi.isSomethingMeaningful(_.detect(hand, function(c) { return c.isPickingCard() }));
    };

    me.diamonds = function(rank) {
        return new kadi.game.Card(rank, kadi.game.Suite.DIAMONDS);
    };

    me.spades = function(rank) {
        return new kadi.game.Card(rank, kadi.game.Suite.SPADES);
    }

    me.hearts = function(rank) {
        return new kadi.game.Card(rank, kadi.game.Suite.HEARTS);
    }
    me.clubs = function (rank) {
        return new kadi.game.Card(rank, kadi.game.Suite.CLUBS);
    }

    me.joker = function(t) {
        return new kadi.game.Card(t, kadi.game.Suite.JOKERS);
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

    me.handToS = function(hand) {
        var str = "";
        _.each(hand, function(c) {
            str += c.toS() + ",";
        });
        return str;
    }

    me.fbProfileImage = function(id, type) {
       return "http://graph.facebook.com/" + id + "/picture" + (kadi.isSomethingMeaningful(type) ? "?type=" + type : "");
    }

    //+ Jonas Raoni Soares Silva
    //@ http://jsfromhell.com/array/permute [rev. #1]
    me.permute = function(v, m){
        for(var p = -1, j, k, f, r, l = v.length, q = 1, i = l + 1; --i; q *= i);
        for(x = [new Array(l), new Array(l), new Array(l), new Array(l)], j = q, k = l + 1, i = -1;
            ++i < l; x[2][i] = i, x[1][i] = x[0][i] = j /= --k);
        for(r = new Array(q); ++p < q;)
            for(r[p] = new Array(l), i = -1; ++i < l; !--x[1][i] && (x[1][i] = x[0][i],
                x[2][i] = (x[2][i] + 1) % l), r[p][i] = m ? x[3][i] : v[x[3][i]])
                for(x[3][i] = x[2][i], f = 0; !f; f = !f)
                    for(j = i; j; x[3][--j] == x[2][i] && (x[3][i] = x[2][i] = (x[2][i] + 1) % l, f = 1));
        return r;
    }

    me.msgIsForMe = function(msg, id) {
        var fromMe = kadi.isSomethingMeaningful(msg) && kadi.isSomethingMeaningful(msg.from) && msg.from == id;
        var toMe = kadi.isSomethingMeaningful(msg) && kadi.isSomethingMeaningful(msg.to) && msg.to == id;

        return !fromMe || toMe;
    }

    me.resyncDeck = function(before,after) {
        var newDeck = [];
        _.each(after, function(id, idx) {
            var c =  kadi.game.Card.fromId(id);
            var card = _.detect(before, function(cd) { return cd.eq(c) });
            newDeck[idx] = card;
        });
        return newDeck;
    }

    window.onerror = function(msg, url, line) {
        console.log("An un caught error occurred %s on line %s", msg, line);
        SHOTGUN.fire(kadi.game.Events.UNHANDLED_ERROR, []);
    };

    return me;
})(window.kadi || {}, jQuery);

//ko.bindingHandlers.fadeVisible = {
//    init: function(element, valueAccessor) {
//        // Initially set the element to be instantly visible/hidden depending on the value
//        var value = valueAccessor();
//        $(element).toggle(ko.utils.unwrapObservable(value)); // Use "unwrapObservable" so we can handle values that may or may not be observable
//    },
//    update: function(element, valueAccessor) {
//        // Whenever the value subsequently changes, slowly fade the element in or out
//        var value = valueAccessor();
//        ko.utils.unwrapObservable(value) ? $(element).fadeIn("fast") : $(element).slideUp();
//    }
//};
