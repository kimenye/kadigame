/*!
 * jQuery Wiggle
 * http://www.userdot.net/#!/jquery
 *
 * Copyright 2011, UserDot www.userdot.net
 * Licensed under the GPL Version 3 license.
 * Version 1.0.0
 *
 */
(function($) {
    $.fn.wiggle = function(method, options) {
        options = $.extend({
            degrees: ['2','4','2','0','-2','-4','-2','0'],
            delay: 35,
            limit: null,
            randomStart: true,
            onWiggle: function(o) {},
            onWiggleStart: function(o) {},
            onWiggleStop: function(o) {}
        }, options);
        var methods = {
            wiggle: function(o, step){
                if (step === undefined) {
                    step = options.randomStart ? Math.floor(Math.random() * options.degrees.length) : 0;
                }
                if (!$(o).hasClass('wiggling')) {
                    $(o).addClass('wiggling');
                }
                var degree = options.degrees[step];
                var opt = {
                    rotate: degree + 'deg'
                };
                $(o).transition(opt, 5);
                if (step == (options.degrees.length - 1)) {
                    step = 0;
                    if ($(o).data('wiggles') === undefined) {
                        $(o).data('wiggles', 1);
                    }
                    else {
                        $(o).data('wiggles', $(o).data('wiggles') + 1);
                    }
                    options.onWiggle(o);
                }
                if (options.limit && $(o).data('wiggles') == options.limit) {
                    return methods.stop(o);
                }
                o.timeout = setTimeout(function() {
                    methods.wiggle(o, step + 1);
                }, options.delay);
            },
            stop: function(o) {
                $(o).data('wiggles', 0);
                var opt = {
                    rotate: 0 + 'deg'
                };
                $(o).transition(opt, 5);
                if ($(o).hasClass('wiggling')) {
                    $(o).removeClass('wiggling');
                }
                clearTimeout(o.timeout);
                o.timeout = null;
                options.onWiggleStop(o);
            },
            isWiggling: function(o) {
                return !o.timeout ? false : true;
            }
        };
        if (method == 'isWiggling' && this.length == 1) {
            return methods.isWiggling(this[0]);
        }
        this.each(function() {
            if ((method == 'start' || method === undefined) && !this.timeout) {
                methods.wiggle(this);
                options.onWiggleStart(this);
            }
            else if (method == 'stop') {
                methods.stop(this);
            }
        });
        return this;
    }
})(jQuery);