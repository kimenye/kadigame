window.kadi = (function(me, $, undefined){

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
            this.parentDiv.appendChild(this.overlay);

            SHOTGUN.listen(kadi.Events.PLAYER_NOTIFICATION_UI, function(player, action, playedCards, numToPick) {
                if (action == kadi.RuleEngine.ACTION_PICK_OR_BLOCK) {
                    self.showBlock(player, playedCards, numToPick);
                } else if (action == kadi.RuleEngine.ACTION_PICK_SUITE) {
                    self.showSuitePicker(player);
                }
            });

            SHOTGUN.listen(kadi.Events.UNHANDLED_ERROR, function(err) {
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

        showSuitePicker: function(player) {
            var self = this;
            this.showOverlay();

            this.suitePicker = kadi.createDiv("suite_picker btn-group button_holder", "suitePickerDialog");

            var heartsButton= kadi.createButton("red btn btn-large hearts",kadi.Suite.getSuiteSymbol(kadi.Suite.HEARTS));
            $(heartsButton).click(function() {
                self.select(kadi.Suite.HEARTS, player);
            });

            var spadesButton = kadi.createButton("black btn btn-large spades",kadi.Suite.getSuiteSymbol(kadi.Suite.SPADES));
            $(spadesButton).click(function() {
                self.select(kadi.Suite.SPADES, player);
            });

            var diamondsButton = kadi.createButton("red btn btn-large diamonds",kadi.Suite.getSuiteSymbol(kadi.Suite.DIAMONDS));
            $(diamondsButton).click(function() {
                self.select(kadi.Suite.DIAMONDS, player);
            });

            var clubsButton = kadi.createButton("black btn btn-large clubs",kadi.Suite.getSuiteSymbol(kadi.Suite.CLUBS));
            $(clubsButton).click(function() {
                self.select(kadi.Suite.CLUBS, player);
            });

            var anyButton = kadi.createButton('btn btn-large any', "Any");
            $(anyButton).click(function() {
                self.select(kadi.Suite.ANY, player);
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

                SHOTGUN.fire(kadi.Events.DISPLAY_REQUESTED_SUITE, [suite]);
                SHOTGUN.fire(kadi.Events.MSG_RECEIVED, [ player.name + " has requested for " + kadi.Suite.getSuiteName(suite) ]);
                SHOTGUN.fire(kadi.Events.SUITE_REQUESTED, [player, suite]);
            });
        },

        showBlock: function(player, playedCards, numToPick) {
            var self = this;
            this.showOverlay();
            this.resetDialog(this.blockDialog);

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
                    SHOTGUN.fire(kadi.Events.ACCEPT_PICKING, [player, pickingCards]);
                } else {
                    //TODO: Tightly coupled. Use an event
                    player.activateForBlocking(pickingCards);
                }
            });
        },

        showSuiteSelector: function(title) {
            var spades = kadi.Suite.getSuiteDiv(kadi.Suite.SPADES);
            var diamonds = kadi.Suite.getSuiteDiv(kadi.Suite.DIAMONDS);
            var hearts = kadi.Suite.getSuiteDiv(kadi.Suite.HEARTS);
            var clubs = kadi.Suite.getSuiteDiv(kadi.Suite.CLUBS);

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

    me.GameOverScreenUI = JS.Class({
        construct: function(mode) {
            this.mode = mode;
            var self = this;
            if (mode == kadi.GameOptions.MODE_FIRST_TO_WIN) {
                SHOTGUN.listen(kadi.Events.FINISH, function(winner, action, playedCards, mode) {
                    if (mode == kadi.GameOptions.MODE_FIRST_TO_WIN) {
                        self.showPlayAgain(winner);
                    }
                });
            } else {
                SHOTGUN.listen(kadi.Events.ELIMINATION_GAME_OVER, function(players, winner) {
                    self.showGameOverScreen(players, winner);
                });
            }
        },
        buildHeader: function(winner) {
            var dialog = kadi.createDiv('game-over-elimination', 'game_over');
            var header = kadi.createDiv('page-header', 'game_over_header');
            header.appendChild(kadi.createElement("h3", "", "", "Game Over"));
            dialog.appendChild(header);

            var winnerDiv = kadi.createElement('div', 'winner');

            var avatar = kadi.createElement('img', 'opponent center');
            avatar.src = winner.avatar.src;
            winnerDiv.appendChild(avatar);

            if(winner.live) {
                var social = kadi.createElement('div', 'social');
                var twitter_btn = kadi.createElement('a', 'twitter-mention-button btn btn-small btn-primary', '', 'Brag');
                twitter_btn.href = "https://twitter.com/intent/tweet?screen_name=kadigame&text=I won!! I won!!";

                var dash = kadi.createElement('div', 'dashboard');

                dash.appendChild(kadi.createElement("p", 'muted', null, "Played: " + "<small> " + winner.numberOfTimesPlayed + " </small>"));
                dash.appendChild(kadi.createElement("p", 'muted', null, "Won: " + "<small> " + (winner.numberOfTimesWon + 1) + " </small>"));
                social.appendChild(dash);

                var share = kadi.createElement('div', 'share');
                share.appendChild(twitter_btn);
                social.appendChild(share);

                winnerDiv.appendChild(social);
            }

            var win = kadi.createElement('p', "lead", "", winner.name + " wins!");
            winnerDiv.appendChild(win);

            dialog.appendChild(winnerDiv);
            dialog.appendChild(kadi.createElement("hr"));
            return dialog;
        },
        showPlayAgain: function(winner) {
            var self = this;
            var dialog =  this.buildHeader(winner);
            var btns = [];
            btns.push(
                {
                    "label" : "Re-match!",
                    "id": "btn-rematch",
                    "class" : "btn-primary",
                    "callback" : function() {
                        self.rematch(winner);
                    }
                },
                {
                    "label" : "Options",
                    "id" : "btn-options",
                    "class" : "btn",
                    "icon"  : "icon-wrench icon-black",
                    "callback" : function() {
                        self.showOptions(winner);
                    }
                }
            );
            bootbox.dialog($(dialog), btns);
        },
        showOptions: function(winner) {
            bootbox.hideAll();
            SHOTGUN.fire(kadi.Events.SHOW_OPTIONS, [winner]);
        },
        showGameOverScreen: function(players, winner) {
            var self = this;
            var dialog = this.buildHeader(winner);

            var playersDiv = kadi.createElement("div");
            players = _.sortBy(players, function(p) { return kadi.RuleEngine.calculateHandEliminationValue(p.cards()) });
            var eliminatedPlayer = _.last(players);
            var livePlayerIsEliminated = eliminatedPlayer.live;
            var gameIsOver = livePlayerIsEliminated || players.length == 2;
            _.each(players, function(p, i) {
                if (!p.eq(winner)) {
                    var isEliminated = p.eq(eliminatedPlayer);
                    var playerDiv = kadi.createElement('div', 'opponent_result');

                    var pic = kadi.createElement("div", "thumbnail");
                    var img = kadi.createElement("img", "opponent");
                    img.src = p.avatar.src;
                    pic.appendChild(img);
                    var caption = kadi.createElement("div", "caption", "", "<small class='muted'>" + p.name + "</small>");
                    pic.appendChild(caption);
                    playerDiv.appendChild(pic);

                    if (isEliminated) {
                        var strikeThrough = kadi.createElement("span",'strikethrough',null, '');
                        playerDiv.appendChild(strikeThrough);
                    }

                    var cardHolder = kadi.createElement("div", "cards");
                    _.each(p.cards(), function(c, idx) {
                        var card = new kadi.CardUI(c.rank, c.suite, false);
                        var multiplier = idx * 60;
                        card.container().transition({ scale: 0.5, x: (-40 + multiplier) + 'px', y: -60 + 'px' }, 1000, 'snap');
                        card.flip();
                        card.active = false;

                        $(cardHolder).append(card.container());
                    });

                    playerDiv.appendChild(cardHolder);

                    var scoreType = (isEliminated)? 'eliminated' : '';
                    var score = kadi.createElement("span",'score lead ' + scoreType,null, kadi.RuleEngine.calculateHandEliminationValue(p.cards()));

                    playerDiv.appendChild(score);

                    playersDiv.appendChild(playerDiv);
                }
            });

            var btns = [];
            if (!gameIsOver) {
                btns.push({
                    "label" : "Continue!",
                    "id": "btn-play",
                    "class" : "btn-primary",
                    "callback": function() {
                        self.continue(eliminatedPlayer, winner);
                    }
                });
            } else {
                btns.push({
                    "label" : "Re-match!",
                    "id": "btn-rematch",
                    "class" : "btn-primary",
                    "callback" : function() {
                        self.rematch(winner);
                    }
                })
            }
            dialog.appendChild(playersDiv);
            bootbox.dialog($(dialog), btns);
        },
        continue: function(eliminated, winner) {
            SHOTGUN.fire(kadi.Events.ELIMINATE_PLAYER, [eliminated, winner]);
            this.hide(1000);
        },
        rematch: function(winner) {
            SHOTGUN.fire(kadi.Events.REINIT_GAME, [winner]);
            this.hide(1000);
        },
        hide: function(delay) {
            _.delay(function() {
                bootbox.hideAll();
            }, delay);
        }
    });

    me.GameOptionsUI = JS.Class({
        construct: function(availablePlayers, handler, me, eliminationMode, kadiMode, pickTopCard) {
            kadi.disableLoading('game');
            this.me = me;

            this.availablePlayers = availablePlayers;
            this.handler = handler;
            this.elimination = kadi.getVal(eliminationMode);
            this.kadiWithOnlyOneCard = kadi.getVal(kadiMode);
            this.pickTopCardOnly = kadi.getVal(pickTopCard);
            this.showSelector();
        },

        updateFriends: function(friends) {
            var list = kadi.createElement("ul", "thumbnails");
            _.each(friends, function(p) {
                var li = kadi.createElement("li", "thumbnail span1");
                var img = kadi.createElement("img", "opponent");
                img.src = kadi.getProfileUrl(p.id, false);
                li.appendChild(img);

                var caption = kadi.createElement("div", "caption", "", "<small class='muted'>" + p.name + "</small>");
                li.appendChild(caption);
                list.appendChild(li);
            });
            this.content.find('.body.loading').replaceWith($(list));
        },

        showProfile: function() {
            var self = this;
            this.profileDiv = kadi.createDiv('options', 'profile_div');
            var header = kadi.createDiv('page-header', 'options_header');
            header.appendChild(kadi.createElement("h3", "", "", "KADI <small>Welcome " + this.me.name + "</small>"));
            this.profileDiv.appendChild(header);

            var spinner = new Spinner({
                lines: 13,
                width: 4,
                radius: 8,
                corners: 1,
                color: "#fff",
                shadow: true
            }).spin();

            this.body = kadi.createDiv('body loading');
            this.body.appendChild(kadi.createElement('p', "lead", "", "Looking for your friends on Facebook..."));
            this.body.appendChild(spinner.el);

            this.profileDiv.appendChild(this.body);
            this.content = $(this.profileDiv);

            bootbox.dialog(this.content, {
                "label" : "Play!",
                "id": "btn-play",
                "class" : "btn-primary"
            });
        },

        showSelector: function() {
            var self = this;
            this.dialogDiv = kadi.createDiv('options', 'options_div');

            var header = kadi.createDiv('page-header', 'options_header');
            header.appendChild(kadi.createElement("h3", "", "", "KADI <small>Choose your options...</small>"));
            this.dialogDiv.appendChild(header);

            var body  = kadi.createDiv('body');
            body.appendChild(kadi.createElement('p', "lead", "", "Customize how you play KADI, including choosing your opponents and your Rules!"));

            var list = kadi.createElement("ul", "thumbnails");

            body.appendChild(list);
            _.each(this.availablePlayers, function(p) {

                var li = kadi.createElement("li", "thumbnail span1");
                var img = kadi.createElement("img", "opponent");
                img.src = kadi.getProfileUrl(p.id, false);
                li.appendChild(img);

                var caption = kadi.createElement("div", "caption", "", "<small class='muted'>" + p.name + "</small>");
                li.appendChild(caption);

                if (p.selectedOpponent)
                    $(li).addClass("selected");

                $(li).click(function() {
                    p.selectedOpponent = !p.selectedOpponent;
                    $(li).toggleClass("selected");

                    var numSelected = _.reject(self.availablePlayers, function(p) { return !p.selectedOpponent }).length;
                    kadi.enable($('.modal-footer a'), numSelected >= 1);
                });

                list.appendChild(li);
            });

            body.appendChild(kadi.createElement("legend",null,null, "Game Options"));

            var lblMode = kadi.createElement("label", "checkbox inline");
            var chkMode = kadi.createElement("input", "chk_elimination");
            chkMode.type = "checkbox";
            lblMode.appendChild(chkMode);
            lblMode.appendChild(kadi.createElement("span","","","Elimination"));

            $(chkMode).click(function() {
                self.elimination = !self.elimination;
            });

            var lblFinish = kadi.createElement("label", "checkbox inline");
            var chkFinish = kadi.createElement("input", 'chk_finish');
            chkFinish.type = "checkbox";
            lblFinish.appendChild(chkFinish);
            lblFinish.appendChild(kadi.createElement("span","","","Only finish with one card"));

            $(chkFinish).click(function() {
                self.kadiWithOnlyOneCard = !self.kadiWithOnlyOneCard;
            });

            var lblPick = kadi.createElement("label", "checkbox inline");
            var chkPick = kadi.createElement("input", 'chk_kadi');
            chkPick.type = "checkbox";
            lblPick.appendChild(chkPick);
            lblPick.appendChild(kadi.createElement("span","","","Only pick the top card"));

            $(chkPick).click(function() {
                self.pickTopCardOnly = !self.pickTopCardOnly;
            });

            body.appendChild(lblMode);
            body.appendChild(lblFinish);
            body.appendChild(lblPick);

            this.dialogDiv.appendChild(body);
            bootbox.dialog($(this.dialogDiv), {
                "label" : "Play!",
                "id": "btn-play",
                "class" : "btn-primary",
                "callback" : function() {
                    var opponents = _.reject(self.availablePlayers, function(p) { return !p.selectedOpponent });
                    var mode = self.elimination? kadi.GameOptions.MODE_ELIMINATION : kadi.GameOptions.MODE_FIRST_TO_WIN;
                    var kadiMode = self.kadiWithOnlyOneCard ? kadi.GameOptions.ONE_CARD_KADI : kadi.GameOptions.ANY_CARDS_KADI;
                    var pickMode = self.pickTopCardOnly ? kadi.GameOptions.PICKING_MODE_TOP_ONLY : kadi.GameOptions.PICKING_MODE_ALL;
                    self.handler.callBack([opponents, mode, kadiMode, pickMode]);
                }
            });

            if (this.elimination) {
                $('.chk_elimination').attr('checked', 'checked');
            }

            if (this.pickTopCardOnly) {
                $('.chk_finish').attr('checked', 'checked');
            }

            if (this.kadiWithOnlyOneCard) {
                $('.chk_kadi').attr('checked', 'checked');
            }
        }
    });

    me.GameUI = me.Game.extend({
        statics: {
            width: 800,
            height: 600,
            ID: 'game',
            CONTAINER_ID: 'game-container'
        },

        construct: function(player, opponents, options) {
            this.parent.construct.apply(this, [player, opponents, options]);
        },

        initComponents: function() {
            this.pickingDeck = new kadi.PickingDeckUI();
            this.tableDeck = new kadi.TableDeckUI();
            this.noticeBoard = new kadi.NoticeBoard();
        },

        dealCards: function() {
            this.parent.dealCards.apply(this, []);
        },

        dealSpecificCards: function(playerCards, topCard) {
            this.parent.dealSpecificCards.apply(playerCards, topCard);
        }
    });

    me.GameUIContainer = JS.Class({
        construct: function(player, vs, mode, kadiMode, pickingMode) {
            this.id = me.GameUI.ID;
            this.me = player;
            this.socialDashboard = new kadi.SocialDashboard();

            this.opponents = [];
            _.each(vs, function(opponent, idx) {
                this.opponents.push(new me.GamePlayerUI(opponent,new kadi.PlayerDeckUI.fromIndex(idx), true));
            },this);
            this.gameOverScreen = new kadi.GameOverScreenUI(mode);
            this.requestedSuiteDeck = new kadi.RequestedSuiteNotification();
            this.gameOptions = new me.GameOptions(mode,kadiMode, pickingMode);
            this.game = new me.GameUI(this.me,this.opponents, this.gameOptions);

            var self = this;
            SHOTGUN.listen(kadi.Events.SHOW_OPTIONS, function(winner)  {

                var handler = new kadi.Handler(function(args) {
                    self.game.options = new me.GameOptions(args[1], args[2], args[3]);
                    bootbox.hideAll();
                    SHOTGUN.fire(kadi.Events.RESTART_GAME, [winner]);
                });

                var optionsDialog = new kadi.GameOptionsUI(vs, handler,
                    player, self.game.eliminationMode(), self.game.singleCardKadi(), self.game.pickTopOnly());
            });
        },
        display : function() {
            var self = this;
            _.delay(function() {
                kadi.disableLoading('game');
                self.game.startGame();
            }, 2000);
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
            kadi.updateLoadingText('Welcome ' + player.name + ". The game will be ready in a few moments...");

        var livePlayer = new kadi.GamePlayerUI(player, new kadi.PlayerDeckUI(kadi.PlayerDeckUI.TYPE_A, true));
        livePlayer.initDisplay();

        var preload = new createjs.PreloadJS();
        preload.onFileLoad = handleFileLoaded;
        preload.onError = handleFileError;

        var loadCount = 0;

        function handleFileLoaded(event) {
            switch (event.type){
                case createjs.PreloadJS.CSS:
                    loadCount++;
                    break;
                case createjs.PreloadJS.IMAGE:
                    loadCount++;
                    if (loadCount == 2)
                        showOptions();
                    break;
            }
        }

        function handleFileError(result) {
            console.log("Error with loading file ", result);
        }

        function showOptions() {
            kadi.updateLoadingText("Almost there...");
            var compB = new kadi.Player('FD03', 'Karucy',false);
            var compC = new kadi.Player('O03', 'Makmende',false);
            var compD = new kadi.Player('O02', 'Prezzo',false);
            var ops = _.shuffle([compB, compC, compD]);

            var handler = new kadi.Handler(function(args) {
                me.gameObject = new me.GameUIContainer(livePlayer, args[0], args[1], args[2], args[3]);
                bootbox.hideAll();
                me.gameObject.display();
            });

            var optionsDialog = new kadi.GameOptionsUI(ops, handler, livePlayer, false, false, false);
//            handler.callBack([ops, kadi.GameOptions.MODE_FIRST_TO_WIN, kadi.GameOptions.ONE_CARD_KADI, kadi.GameOptions.PICKING_MODE_TOP_ONLY]);
//            handler.callBack([ops, kadi.GameOptions.MODE_FIRST_TO_WIN, kadi.GameOptions.ANY_CARDS_KADI, kadi.GameOptions.PICKING_MODE_TOP_ONLY]);
        }
        preload.loadFile('../images/woodback.jpg');
        preload.loadFile('../images/card_back_generic.png');
    };

    return me;
})(window.kadi || {}, jQuery);