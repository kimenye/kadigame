window.kadi.game = (function(me, $, undefined){
    me.PlayingOrder = JS.Class({
        statics: {
            CLOCKWISE: 1,
            ANTI_CLOCKWISE: 0
        },
        construct: function(players, startIdx) {
            this.players = players;
            this.startIdx = startIdx;
            this.direction = me.PlayingOrder.CLOCKWISE;
            this.turnCount = 0;
            this.isPaused = false;
            this.pauseHandler = null;
            this.begin();
        },
        playerCount: function() {
            return this.players.length;
        },
        begin: function() {
            this.currentIdx = this.startIdx;
        },
        current: function() {
            return this.players[this.currentIdx];
        },
        pause: function(handler) {
            this.pauseHandler = handler;
            this.isPaused = true;
        },
        finish: function(player) {
            this.players = _.reject(this.players, function(p) { return p.eq(player); }, this);
        },
        end: function() {
            this.isPaused = true;
        },
        unPause: function() {
            this.isPaused = false;
            this.pauseHandler = null;
        },
        executeHandler : function() {
            if (kadi.isSomethingMeaningful(this.pauseHandler)) {
                this.pauseHandler.callBack();
            }
        },
        peek: function() {
            var n = this.currentIdx;
            if (this.isClockwise()) {
                n += 1;
                if (n >= this.playerCount())
                    n = 0;
            }   else {
                n = Math.max(0, n -1 );
            }
            return this.players[n];
        },
        turn: function() {
            var n = this.current();
            return n.live? "Your turn to play" : this.formatTurn(n.name);
        },
        formatTurn: function(name) {
            if (name.charAt(name.length - 1) == "s") {
                return name + "' turn to play";
            }
            else
                return name + "'s turn to play";
        },
        next: function() {
            if (!this.isPaused) {
                this.turnCount++;
                if (this.isClockwise()) {
                    var n = this.currentIdx + 1;
                    if (n >= this.playerCount())
                        n = 0;
                    this.currentIdx = n;
                } else {
                    var n = this.currentIdx - 1;
                    if (n < 0)
                        n = this.playerCount() - 1;
                    this.currentIdx = n;
                }
            }
        },
        reverse: function() {
            if (!this.isPaused) {
                if (this.isClockwise())
                    this.direction = kadi.game.PlayingOrder.ANTI_CLOCKWISE;
                else
                    this.direction = kadi.game.PlayingOrder.CLOCKWISE;
                this.next();
            }
        },
        isClockwise: function() {
            return this.direction == kadi.game.PlayingOrder.CLOCKWISE;
        },
        isAntiClockwise: function() { return ! this.isClockwise() }
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

    me.PlayerDeck = me.Box.extend({
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
//                var types = [kadi.game.PlayerDeck.TYPE_B,kadi.game.PlayerDeck.TYPE_C,kadi.game.PlayerDeck.TYPE_D];
                var types = [kadi.game.PlayerDeck.TYPE_D,kadi.game.PlayerDeck.TYPE_B,kadi.game.PlayerDeck.TYPE_C];
                return types[index];
            },
            fromIndex : function(index) {
                return new me.PlayerDeck(me.PlayerDeck.typeFromIndex(index));
            }

        },
        construct: function(type) {
            this.type = type;
            this.parent.construct.apply(this, ['game', 'player_deck_div' + type, 'player_deck ' + type]);
            this.display();
            this.cards = [];
        },

        left: function() {
            if (this.isHorizontal())
                return kadi.game.PlayerDeck.X_A;
            else if (this.isRight())
                return kadi.game.PlayerDeck.X_C;
            else if (this.isLeft())
                return kadi.game.PlayerDeck.X_D;
        },

        top : function() {
            if (this.isBottom())
                return kadi.game.PlayerDeck.Y_A;
            else if (this.isTop())
                return kadi.game.PlayerDeck.Y_B;
            else if (this.isRight())
                return kadi.game.PlayerDeck.Y_C;
            else if (this.isLeft())
                return kadi.game.PlayerDeck.Y_D;
        },

        width: function() {
            if (this.isHorizontal())
                return kadi.game.PlayerDeck.WIDTH_H;
            else
                return kadi.game.PlayerDeck.WIDTH_V;
        },

        height: function() {
            if (this.isHorizontal())
                return kadi.game.PlayerDeck.HEIGHT_H;
            else
                return kadi.game.PlayerDeck.HEIGHT_V;
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
            return this.type == kadi.game.PlayerDeck.TYPE_B;
        },

        isBottom: function() {
            return this.type == kadi.game.PlayerDeck.TYPE_A;
        },

        isLeft: function() {
            return this.type == kadi.game.PlayerDeck.TYPE_D;
        },

        isRight: function() {
            return this.type == kadi.game.PlayerDeck.TYPE_C;
        },

        isHorizontal : function() {
            return this.type == kadi.game.PlayerDeck.TYPE_A || this.type == kadi.game.PlayerDeck.TYPE_B;
        },

        isVertical: function() { return ! this.isHorizontal() },

        removeCard: function(card) {
            this.cards = _.reject(this.cards, function(c) {
                return c.id == card.id;
            })
        },

        hasCards: function() {
            return this.cards.length > 0;
        },

        addCard: function(card) {
            this.cards.push(card);
            var self = this;
            var left = 0;
            var top = 0;
            var rotate = 0;
            var origin = null;
            if (this.isHorizontal()) {
                left = this.left() + kadi.centerInFrame(this.width(),kadi.game.CardUI.WIDTH); //center the card along the deck
                top = this.top();
            }
            else {
                top = this.top() + kadi.centerInFrame(this.height(), kadi.game.CardUI.WIDTH);
                origin = kadi.Pos.ORIGIN_RESET;
                rotate = 90;
                left = this.left() + (this.isRight() ? kadi.game.CardUI.LENGTH : kadi.game.CardUI.WIDTH);
            }
            card.moveTo(left,top, rotate, origin);
        },

        redrawCards: function() {
            if (this.hasCards()) {
                var fan = [];
                if (this.isVertical()) {
                    var init = kadi.centerInFrame(this.height(), kadi.game.CardUI.WIDTH) +  this.top();
                    fan = kadi.chineseFan(this.height(), this.top(), kadi.game.CardUI.WIDTH, this.cards.length, 5, this.isLeft());
                    _.each(fan, function (blade, idx) {
                        var card = this.cards[idx];
                        var z = me.PlayerDeck.Z + idx;
                        card.container().css('z-index', z);
                        var posY = init + blade.y;
                        var rotate = kadi.game.PlayerDeck.ROTATE_V + blade.rotate;
                        card.moveTo(blade.x, posY, rotate);
                    }, this);
                }
                else if (this.isHorizontal())
                {
                    fan = kadi.flatChineseFan(this.width(),kadi.game.CardUI.WIDTH,kadi.game.CardUI.MARGIN,this.cards.length,this.type == kadi.game.PlayerDeck.TYPE_A);
                    _.each(fan, function(blade, idx) {
                        var card = this.cards[idx];
                        var z = me.PlayerDeck.Z + idx;
                        card.container().css('z-index', z);
                        card.moveTo(this.left() + blade.x,null,blade.rotate);
                    }, this);
                }
            }
        }
    })

    me.PickingDeck = me.Box.extend({
        statics : {
            WIDTH:  150,
            HEIGHT: 200,
            X: 500,
            Y: 200,
            REPLENISH_THRESHOLD: 10
        },
        construct : function() {
            var self = this;
            this.parent.construct.apply(this, ['game', 'picking_box_div', 'picking_box']);
            this.deck = kadi.game.Suite.getDeckOfCards();
            this.topLeft = function() { return new kadi.Pos(me.PickingDeck.X, me.PickingDeck.Y) };
            this.active = false;
            this.replenished = false;
            this.activePlayer = null;
            this.bBox = function() { return new kadi.BBox(this.topLeft(), me.PickingDeck.WIDTH, me.PickingDeck.HEIGHT) };
            this.display();

            self.node().css('z-index', 6000);
            this.node().hover(function() {
                if (self.active) {
                    self.node().css( 'cursor', 'pointer' );
                }
            }, function() {
                if (self.active && !self.selected) {
                    self.node().css( 'cursor', 'default' );
                }
            });

            this.node().click(function() {
                if (self.active && kadi.isSomethingMeaningful(self.activePlayer)) {
                    self.activePlayer.pick();
                }
            });

            SHOTGUN.listen(kadi.game.Events.RECEIVE_TURN, function(player) {
                self.active = player.live;
                self.activePlayer = player; //TODO: this is still tightly coupled, you need to pass an event to the game
            }, 'deck');
        },

        returnCard: function(card) {
            var pos = kadi.getRandomLocation(this.bBox(), 10, 5, 10);
            card.container().css('z-index', kadi.game.TableDeck.Z);
            card.moveTo(pos.x, pos.y, pos.rotate);
//            this.deck.push([card]); //TODO: to change when we do shift / pop
            this.deck.push(card);
        },

        giveCardTo: function(card, player) {
            var card = _.find(this.deck, function(c) {
                return c.eq(card);
            });

            if (kadi.isSomethingMeaningful(card)) {
                player.addCard(card,true);
            }
        },

        display: function() {
            this.parent.appendChild(this.div);
            var positions = kadi.randomizeCardLocations(this.deck.length, this.bBox());
            _.each(this.deck, function(card,idx) {
                var pos = positions[idx];
                card.display(me.GameUI.ID, pos.x, pos.y, pos.rotate);
            });
        },

        numCards: function() {
            return this.deck.length;
        },

        cut: function() {
            var canStart = false;
            var card = null;
            do
            {
                var card = this.deck.shift();
                canStart = kadi.game.RuleEngine.canStart(card);
                if (!canStart)
                    this.deck.push(card);
            }
            while(!canStart)
            return card;
        },

        deal: function() {
            if (this.deck.length <= kadi.game.PickingDeck.REPLENISH_THRESHOLD && !this.replenished) {
                this.replenished = true;
                SHOTGUN.fire(kadi.game.Events.REPLENISH_PICKING_CARDS,[]);
            }
//            return this.deck.shift();
            return this.deck.pop();
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
            SHOTGUN.listen(kadi.game.Events.DISPLAY_REQUESTED_SUITE, function(suite) {
                self.show(suite);
            });

            SHOTGUN.listen(kadi.game.Events.HIDE_REQUESTED_SUITE, function() {
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
            var symbol = kadi.game.Suite.getSuiteSymbol(suite);
            var label = kadi.createSpan(symbol, "suite " + suite + " " + kadi.game.Suite.getColorClass(suite,"") + " larger", null);

            this.suiteHolder.appendChild(label);
            this.div.appendChild(this.suiteHolder);

            $(this.div).transition({
                opacity: 0.5,
                scale: 0.6
            }, 1000, 'snap');
        }
    });

    me.TableDeck = me.Box.extend({
        statics: {
            WIDTH: 150,
            HEIGHT: 200,
            X: 300,
            Y: 200,
            Z: 5000,
            MIN_CARDS: 5
        },
        construct : function() {
            this.parent.construct.apply(this, ['game', 'table_deck_div', 'table_deck']);
            this.cards = [];
            this.highestCard = kadi.game.TableDeck.Z;
            this.display();
        },

        addCard: function(card, flip) {
            this.cards.push(card);
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
            SHOTGUN.fire(kadi.game.Events.RETURNED_CARDS, [this.cards]);
            this.cards = [];
        },

        replenishCards: function() {
            if (this.numCards() >= kadi.game.TableDeck.MIN_CARDS) {
                var availCards = this.numCards();
                var cardsToPick = availCards - kadi.game.TableDeck.MIN_CARDS;
                var cardsToRecycle = _.first(this.cards,cardsToPick);
                var remaining = _.rest(this.cards,cardsToPick);
                this.cards = remaining;
                return cardsToRecycle;
            }
            return [];
        },

        bBox : function() {
            var topLeft = new kadi.Pos(kadi.game.TableDeck.X,kadi.game.TableDeck.Y);
            return new kadi.BBox(topLeft, kadi.game.TableDeck.WIDTH, kadi.game.TableDeck.HEIGHT);
        },

        numCards: function() {
            return this.cards.length;
        },

        topCard: function() {
            return _.last(this.cards);
        }
    });

    me.Message = JS.Class({
        construct: function(idx, text) {
            this.idx = idx;
            this.text = text;
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

            window.node = this.node();
            this.node().transition({ rotate: '20 deg' }, 500, 'snap');
            this.messages = [];
            var linesDiv = document.createElement("DIV");
            linesDiv.className = "lines";
            this.div.appendChild(linesDiv);

            var ul = document.createElement("UL");
            ul.className = "list";
            this.listDiv = ul;
            this.ctr = 0;

            this.div.appendChild(ul);

            SHOTGUN.listen(kadi.game.Events.MSG_RECEIVED, function(text) {
                self.log(text);
            });
        },

        reset: function() {
            $('.msg').remove();
        },

        log: function(text) {
            var li = document.createElement("LI");
            this.ctr += 1;
            li.id = "msg-" + this.ctr;
            li.className = "msg";
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

    me.PlayerNotification = me.Box.extend({
        statics: {
            WIDTH: 250,
            HEIGHT: 70
        },
        construct : function() {
            var self = this;
            this.parent.construct.apply(this, ['game', 'player_notification_div', 'player_notification hidden']);
            this.display();
            $(this.div).css('left', kadi.centerInFrame(800, me.PlayerNotification.WIDTH));
            $(this.div).css('top', 600);
            $(this.div).css('z-index',8001);

            this.overlay = kadi.createDiv('overlay hidden', 'notification_overlay');
            this.parent.appendChild(this.overlay);

            SHOTGUN.listen(kadi.game.Events.PLAYER_NOTIFICATION_UI, function(player, action, playedCards) {
                if (action == kadi.game.RuleEngine.ACTION_PICK_OR_BLOCK) {
                    self.showBlock(player, playedCards);
                } else if (action == kadi.game.RuleEngine.ACTION_PICK_SUITE) {
                    self.showSuitePicker(player);
                }
            });

            SHOTGUN.listen(kadi.game.Events.FINISH, function(player, action, playedCards, mode) {
                if (mode == kadi.game.Game.MODE_FIRST_TO_WIN || player.live) {
                    self.showPlayAgain(player);
                }
            });

            SHOTGUN.listen(kadi.game.Events.UNHANDLED_ERROR, function(err) {
                self.showError();
            });
        },
        showOverlay: function() {
            $(this.overlay).removeClass('hidden');
        },

        hideOverlay: function() {
            $(this.overlay).addClass('hidden');
        },

        resetDialog: function(dialog) {
            if (kadi.isSomethingMeaningful(dialog)) {
                $(dialog).remove();
                dialog = null;
            }
        },

        showError: function() {
            var self = this;
            this.showOverlay();

            this.resetDialog(this.errorDialog);
            this.errorDialog = kadi.createDiv('win_screen', 'errorDialog');

            var title = document.createElement("h4");
            title.innerHTML = "Ooops! An error occured :-(";
            this.errorDialog.appendChild(title);

            var refresh = document.createElement("p");
            refresh.innerHTML = "Please refresh to start again";

            this.errorDialog.appendChild(refresh);

            this.div.appendChild(this.errorDialog);

            $(this.div).removeClass('hidden');

            $(this.div).transition({
                top: 200 + "px"
            }, 500, 'snap');
        },

        showPlayAgain: function(player) {
            var self = this;
            this.showOverlay();

            player.kadi(false);

            this.resetDialog(this.gameOverDialog);
            this.gameOverDialog = kadi.createDiv('win_screen', 'gameOverDialog');

            var title = document.createElement("h3");
            title.innerHTML = player.name + " won!";
            this.gameOverDialog.appendChild(title);

            var playAgainButton = kadi.createButton("btn btn-large btn-success","Play Again!");
            $(playAgainButton).click(function() {
                SHOTGUN.fire(kadi.game.Events.RESTART_GAME, []);
                $(self.div).addClass('hidden');
                $(self.gameOverDialog).remove();
                self.gameOverDialog = null;
                self.hideOverlay();
            });

            this.gameOverDialog.appendChild(playAgainButton);

            this.div.appendChild(this.gameOverDialog);

            $(this.div).removeClass('hidden');

            $(this.div).transition({
                top: 200 + "px"
            }, 500, 'snap');
        },

        showSuitePicker: function(player) {
            var self = this;
            this.showOverlay();

            this.suitePicker = kadi.createDiv("suite_picker btn-group button_holder", "suitePickerDialog");

            var heartsButton= kadi.createButton("red btn btn-large hearts",kadi.game.Suite.getSuiteSymbol(kadi.game.Suite.HEARTS));
            $(heartsButton).click(function() {
                self.select(kadi.game.Suite.HEARTS, player);
            });

            var spadesButton = kadi.createButton("black btn btn-large spades",kadi.game.Suite.getSuiteSymbol(kadi.game.Suite.SPADES));
            $(spadesButton).click(function() {
                self.select(kadi.game.Suite.SPADES, player);
            });

            var diamondsButton = kadi.createButton("red btn btn-large diamonds",kadi.game.Suite.getSuiteSymbol(kadi.game.Suite.DIAMONDS));
            $(diamondsButton).click(function() {
                self.select(kadi.game.Suite.DIAMONDS, player);
            });

            var clubsButton = kadi.createButton("black btn btn-large clubs",kadi.game.Suite.getSuiteSymbol(kadi.game.Suite.CLUBS));
            $(clubsButton).click(function() {
                self.select(kadi.game.Suite.CLUBS, player);
            });

            var anyButton = kadi.createButton('btn btn-large any', "Any");
            $(anyButton).click(function() {
                self.select(kadi.game.Suite.ANY, player);
            });

            this.suitePicker.appendChild(heartsButton);
            this.suitePicker.appendChild(spadesButton);
            this.suitePicker.appendChild(diamondsButton);
            this.suitePicker.appendChild(clubsButton);
            this.suitePicker.appendChild(anyButton);

            this.div.appendChild(this.suitePicker);

            $(this.div).removeClass('hidden');

            var top = 600 - me.PlayerNotification.HEIGHT;
            $(this.div).transition({
                top: top + "px"
            }, 500, 'snap');
        },

        select: function(suite, player) {
            var self = this;
            this.hideOverlay();
            var top = 600;
            $(this.div).transition({
                top: top + "px"
            }, 500, 'snap', function() {
                $(self.div).addClass('hidden');
                $(self.suitePicker).remove();
                self.suitePicker = null;

                SHOTGUN.fire(kadi.game.Events.DISPLAY_REQUESTED_SUITE, [suite]);
                SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ player.name + " has requested for " + kadi.game.Suite.getSuiteName(suite) ]);
                SHOTGUN.fire(kadi.game.Events.SUITE_REQUESTED, [player, suite]);
            });
        },

        showBlock: function(player, playedCards) {
            var self = this;
            this.showOverlay();
            this.resetDialog(this.blockDialog);
            var numToPick = kadi.game.RuleEngine.calculatePicking(playedCards);

            this.blockDialog = kadi.createDiv("pick_or_block btn-group button_holder", "pickOrBlockDialog");

            var pickButton = document.createElement("button");

            pickButton.className = "btn btn-danger btn-disabled";
            pickButton.innerHTML = "Pick " + numToPick + " :-( ";

            var blockButton = document.createElement("button");

            blockButton.className = "btn btn-success";
            blockButton.innerHTML = "Block :-)";

            this.blockDialog.appendChild(blockButton);
            this.blockDialog.appendChild(pickButton);

            $(blockButton).click(function() {
                $(blockButton).addClass('disabled');
                $(pickButton).addClass('disabled');
                self.hideBlock(false, player, playedCards);
            });

            $(pickButton).click(function() {
                $(blockButton).addClass('disabled');
                $(pickButton).addClass('disabled');
                self.hideBlock(true, player, playedCards);
            });

            this.div.appendChild(this.blockDialog);

            $(this.div).removeClass('hidden');

            var top = 600 - me.PlayerNotification.HEIGHT;
            $(this.div).transition({
                top: top + "px"
            }, 500, 'snap');
        },

        hideBlock: function(accept, player, pickingCards) {
            var self = this;
            this.hideOverlay();
            var top = 600;
            $(this.div).transition({
                top: top + "px"
            }, 500, 'snap', function() {
                $(self.div).addClass('hidden');
                $(self.blockDialog).remove();
                self.blockDialog = null;

                if (accept) {
                    SHOTGUN.fire(kadi.game.Events.ACCEPT_PICKING, [player, pickingCards]);
                } else {
                    //TODO: Tightly coupled. Use an event
                    player.activateForBlocking(pickingCards);
                }
            });
        },

        showSuiteSelector: function(title) {

            var spades = kadi.game.Suite.getSuiteDiv(kadi.game.Suite.SPADES);
            var diamonds = kadi.game.Suite.getSuiteDiv(kadi.game.Suite.DIAMONDS);
            var hearts = kadi.game.Suite.getSuiteDiv(kadi.game.Suite.HEARTS);
            var clubs = kadi.game.Suite.getSuiteDiv(kadi.game.Suite.CLUBS);

            this.div.appendChild(spades);
            this.div.appendChild(hearts);
            this.div.appendChild(clubs);
            this.div.appendChild(diamonds);

            $(this.div).removeClass('hidden');

            var top = 600 - me.PlayerNotification.HEIGHT;
            $(this.div).transition({
                top: top + "px"
            }, 500, 'snap');
        }
    });

    me.GameUI = JS.Class({
        statics: {
            width: 800,
            height: 600,
            ID: 'game',
            CONTAINER_ID: 'game-container'
        },
        construct: function(player, vs, mode) {
            this.id = me.GameUI.ID;
            if (kadi.isSomethingMeaningful(player))
                this.me = new kadi.game.GamePlayerUI(player, new kadi.game.PlayerDeck(kadi.game.PlayerDeck.TYPE_A));

            this.opponents = [];
            _.each(vs, function(opponent, idx) {
                this.opponents.push(new me.GamePlayerUI(opponent,new kadi.game.PlayerDeck.fromIndex(idx)));
            },this);
            this.game = new me.Game(this.me,this.opponents, mode);
        },

        display : function() {
            kadi.ui.disableLoading('game');
            this.game.startGame();
        }
    });

    /**
     * Initialize the game environment
     *
     * @param player
     * @param opponents
     */
    me.initGameUI = function(player, opponents) {
        if (kadi.isSomethingMeaningful(player))
            kadi.ui.updateLoadingText('Welcome ' + player.name + '. Preparing the game...');
        me.gameObject = new me.GameUI(player, opponents, kadi.game.Game.MODE_FIRST_TO_WIN);
        me.gameObject.display();
    };

    return me;
})(window.kadi.game || {}, jQuery);