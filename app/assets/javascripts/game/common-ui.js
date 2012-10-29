window.kadi = (function(me, $, undefined){

    me.Message = JS.Class({
        construct: function(idx, text) {
            this.idx = idx;
            this.text = text;
        }
    });

    me.Box = JS.Class({
        construct: function(parent,id,className,x,y,width,height) {
            this.id = id;
            this.div = document.createElement("DIV");
            this.div.id = id;
            this.div.className = className;
            this.parentDiv = document.getElementById(parent);
            $(this.div).css('z-index','0');
        },

        node : function() {
            return $(this.div);
        },

        display: function() {
            this.parentDiv.appendChild(this.div);
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

    me.NoticeBoard = me.Box.extend({
        statics: {
            WIDTH: 125,
            HEIGHT: 175,
            X: 140,
            Y: 290
        },
        construct : function() {
            this.parent.construct.apply(this, ['game', 'notification_div', 'notification']);
            var self = this;
            this.display();

            this.node().transition({ rotate: '20 deg' }, 500, 'snap');
            this.messages = [];
            var linesDiv = kadi.createElement("DIV", 'lines');
            this.div.appendChild(linesDiv);

            var ul = kadi.createElement("UL", "list");
            this.listDiv = ul;
            this.ctr = 0;

            this.div.appendChild(ul);

            SHOTGUN.listen(kadi.Events.MSG_RECEIVED, function(text) {
                self.log(text);
            });
        },

        reset: function() {
            $('.msg').remove();
        },

        log: function(text) {
            this.ctr += 1;
            var li = kadi.createElement("li", "msg", "msg-" + this.ctr);
            var txt = kadi.createSpan(text);
            li.appendChild(txt);
            if (this.ctr > 2) {
                var earliest = this.ctr - 2;
                var old = document.getElementById('msg-' + earliest);
                $(old).remove();
            }
            this.listDiv.appendChild(li);
        }
    });

    me.RequestedSuiteNotification = me.Box.extend({
        statics: {
            WIDTH: 100,
            HEIGHT: 136
        },
        construct: function() {
            this.parent.construct.apply(this, ['game', 'requested_suite_div', 'requested_suite hidden']);
            this.display();
            var self = this;
            SHOTGUN.listen(kadi.Events.DISPLAY_REQUESTED_SUITE, function(suite) {
                self.show(suite);
            });

            SHOTGUN.listen(kadi.Events.HIDE_REQUESTED_SUITE, function() {
                self.hide();
            });
        },

        hide: function() {
            $(this.suiteHolder).remove();
            this.suiteHolder = null;
            $(this.div).transition({
                opacity: 0,
                scale: 1
            }, 500, 'snap');
        },

        show: function(suite) {
            $('.requested_suite').removeClass('hidden');

            if (kadi.isSomethingMeaningful(this.suiteHolder)) {
                $(this.suiteHolder).remove();
                this.suiteHolder = null;
            }

            this.suiteHolder = kadi.createDiv('suite_holder', 'suite_holder_div');
            var symbol = kadi.Suite.getSuiteSymbol(suite);
            var label = kadi.createSpan(symbol, "suite " + suite + " " + kadi.Suite.getColorClass(suite,"") + " larger", null);

            this.suiteHolder.appendChild(label);
            this.div.appendChild(this.suiteHolder);

            $(this.div).transition({
                opacity: 0.5,
                scale: 0.6
            }, 1000, 'snap');
        }
    });

    return me;
})(window.kadi || {}, jQuery);
