window.kadi = (function(me, $, undefined){

    me.Message = JS.Class({
        construct: function(idx, text) {
            this.idx = idx;
            this.text = text;
        }
    });

    me.Box = JS.Class({
        construct: function(parent,id,className) {
            this.id = id;
            this.div = kadi.createElement('div', className, id);
            this.parentDiv = document.getElementById(parent);
            $(this.div).css('z-index','0');
        },

        node : function() {
            return $(this.div);
        },

        display: function() {
            this.parentDiv.appendChild(this.div);
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

    me.PlayerDeckUI = me.Deck.extend({
        statics: {
            WIDTH_H: 400,
            HEIGHT_H: 100,
            WIDTH_V: 100,
            HEIGHT_V: 400,
            ROTATE_V: 90,
            Y_A: 500,
            Y_B: -60,
            X_A: 200,
            X_B: 200,
            Y_C: 100,
            X_C: 730,
            X_D: -30,
            Y_D: 100,
            Z: 5000,
            TYPE_A: 'A',
            TYPE_B: 'B',
            TYPE_C: 'C',
            TYPE_D: 'D',
            typeFromIndex: function(index) {
                //locations on the table...
                //A - user who is playing
                //B - TOP
                //C - Right
                //D - Left
//                var types = [kadi.PlayerDeckUI.TYPE_B,kadi.PlayerDeckUI.TYPE_C,kadi.PlayerDeckUI.TYPE_D];
                var types = [kadi.PlayerDeckUI.TYPE_D,kadi.PlayerDeckUI.TYPE_B,kadi.PlayerDeckUI.TYPE_C];
                return types[index];
            },
            fromIndex : function(index) {
                return new me.PlayerDeckUI(me.PlayerDeckUI.typeFromIndex(index));
            }

        },
        construct: function(type) {
            this.parent.construct.apply(this, []);
            this.type = type;
            kadi.display('game','player_deck_div' + type, 'player_deck ' + type);
        },

        left: function() {
            if (this.isHorizontal())
                return kadi.PlayerDeckUI.X_A;
            else if (this.isRight())
                return kadi.PlayerDeckUI.X_C;
            else if (this.isLeft())
                return kadi.PlayerDeckUI.X_D;
        },

        top : function() {
            if (this.isBottom())
                return kadi.PlayerDeckUI.Y_A;
            else if (this.isTop())
                return kadi.PlayerDeckUI.Y_B;
            else if (this.isRight())
                return kadi.PlayerDeckUI.Y_C;
            else if (this.isLeft())
                return kadi.PlayerDeckUI.Y_D;
        },

        width: function() {
            if (this.isHorizontal())
                return kadi.PlayerDeckUI.WIDTH_H;
            else
                return kadi.PlayerDeckUI.WIDTH_V;
        },

        height: function() {
            if (this.isHorizontal())
                return kadi.PlayerDeckUI.HEIGHT_H;
            else
                return kadi.PlayerDeckUI.HEIGHT_V;
        },

        activatePickingCards: function() {
            _.each(this.cards, function(c) {
                if (c.isPickingCard() || c.isAce()) {
                    c.active = true;
                }
                else {
                    c.active = false;
                    c.reset();
                }
            });
        },

        activateCards: function(status) {
            _.each(this.cards, function(c) {
                c.active = status;
                if (!status && c.selected)
                {
                    c.selected = false
                    c.reset();
                }
            });
        },

        isTop: function() {
            return this.type == kadi.PlayerDeckUI.TYPE_B;
        },

        isBottom: function() {
            return this.type == kadi.PlayerDeckUI.TYPE_A;
        },

        isLeft: function() {
            return this.type == kadi.PlayerDeckUI.TYPE_D;
        },

        isRight: function() {
            return this.type == kadi.PlayerDeckUI.TYPE_C;
        },

        isHorizontal : function() {
            return this.type == kadi.PlayerDeckUI.TYPE_A || this.type == kadi.PlayerDeckUI.TYPE_B;
        },

        isVertical: function() { return ! this.isHorizontal() },

        addCard: function(card) {
            this.parent.addCard.apply(this, [card]);
            var left, top, rotate = 0;
            var origin = null;
            if (this.isHorizontal()) {
                left = this.left() + kadi.centerInFrame(this.width(),kadi.CardUI.WIDTH); //center the card along the deck
                top = this.top();
            }
            else {
                top = this.top() + kadi.centerInFrame(this.height(), kadi.CardUI.WIDTH);
                origin = kadi.Pos.ORIGIN_RESET;
                rotate = 90;
                left = this.left() + (this.isRight() ? kadi.CardUI.LENGTH : kadi.CardUI.WIDTH);
            }
            card.moveTo(left,top, rotate, origin);
        },

        redrawCards: function() {
            if (this.hasCards()) {
                var fan = [];
                if (this.isVertical()) {
                    var init = kadi.centerInFrame(this.height(), kadi.CardUI.WIDTH) +  this.top();
                    fan = kadi.chineseFan(this.height(), this.top(), kadi.CardUI.WIDTH, this.cards.length, 5, this.isLeft());
                    _.each(fan, function (blade, idx) {
                        var card = this.cards[idx];
                        var z = me.PlayerDeckUI.Z + idx;
                        card.container().css('z-index', z);
                        var posY = init + blade.y;
                        var rotate = kadi.PlayerDeckUI.ROTATE_V + blade.rotate;
                        card.moveTo(blade.x, posY, rotate);
                    }, this);
                }
                else if (this.isHorizontal())
                {
                    fan = kadi.flatChineseFan(this.width(),kadi.CardUI.WIDTH,kadi.CardUI.MARGIN,this.cards.length,this.type == kadi.PlayerDeckUI.TYPE_A);
                    _.each(fan, function(blade, idx) {
                        var card = this.cards[idx];
                        var z = me.PlayerDeckUI.Z + idx;
                        card.container().css('z-index', z);
                        card.moveTo(this.left() + blade.x,null,blade.rotate);
                    }, this);
                }
            }
        }
    });

    me.PickingDeckUI = me.PickingDeck.extend({
        statics : {
            WIDTH:  150,
            HEIGHT: 200,
            X: 500,
            Y: 200
        },
        construct : function() {
            this.parent.construct.apply(this, []);
            var self = this;
            this.cards = kadi.Suite.getDeckOfCards();
            this.topLeft = function() { return new kadi.Pos(me.PickingDeckUI.X, me.PickingDeckUI.Y) };
            this.active = false;
            this.activePlayer = null;
            this.bBox = function() { return new kadi.BBox(this.topLeft(), me.PickingDeckUI.WIDTH, me.PickingDeckUI.HEIGHT) };
            this.display();

            this.node.css('z-index', 6000);
            this.node.hover(function() {
                if (self.active) {
                    self.node.css( 'cursor', 'pointer' );
                }
            }, function() {
                if (self.active && !self.selected) {
                    self.node.css( 'cursor', 'default' );
                }
            });

            this.node.click(function() {
                if (self.active && kadi.isSomethingMeaningful(self.activePlayer)) {
                    self.activePlayer.pick();
                }
            });

            SHOTGUN.listen(kadi.Events.RECEIVE_TURN, function(player) {
                self.active = player.live;
                self.activePlayer = player; //TODO: this is still tightly coupled, you need to pass an event to the game
            }, 'deck');
        },

        returnCard: function(card) {
            var pos = kadi.getRandomLocation(this.bBox(), 10, 5, 10);
            card.container().css('z-index', kadi.TableDeckUI.Z);
            card.moveTo(pos.x, pos.y, pos.rotate);
            this.parent.returnCard.apply(this, [card]);
        },

        display: function() {
            this.node = kadi.display('game', 'picking_box_div', 'picking_box');
            var positions = kadi.randomizeCardLocations(this.numCards(), this.bBox());
            _.each(this.cards, function(card,idx) {
                var pos = positions[idx];
                card.display(me.GameUI.ID, pos.x, pos.y, pos.rotate);
            });
        }
    });

    me.TableDeckUI = me.TableDeck.extend({
        statics: {
            WIDTH: 150,
            HEIGHT: 200,
            X: 300,
            Y: 200,
            Z: 5000
        },
        construct : function() {
            this.parent.construct.apply(this, []);
            this.highestCard = kadi.TableDeckUI.Z;
            kadi.display('game', 'table_deck_div', 'table_deck');
        },

        addCard: function(card, flip) {
            this.parent.addCard.apply(this, [card]);
            this.highestCard += 1;
            card.container().css('z-index', this.highestCard);

            var pos = kadi.getRandomLocation(this.bBox(), 15, 10, 15);
            if (this.cards.length == 1)
                pos.rotate = 0;

            card.moveTo(pos.x, pos.y, pos.rotate);
            if (flip) {
                card.flip();
            }
        },

        reset: function() {
            SHOTGUN.fire(kadi.Events.RETURNED_CARDS, [this.cards]);
            this.cards = [];
        },

        bBox : function() {
            var topLeft = new kadi.Pos(kadi.TableDeckUI.X,kadi.TableDeckUI.Y);
            return new kadi.BBox(topLeft, kadi.TableDeckUI.WIDTH, kadi.TableDeckUI.HEIGHT);
        }
    });

    return me;
})(window.kadi || {}, jQuery);
