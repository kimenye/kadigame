describe("Integration tests:", function() {

    describe("A player", function() {
        var player = new kadi.Player('100004183626950', 'Trevor', true, 0, 0, 0);

        it("Can manage a player", function() {
            expect(player).not.toBeNull();
            expect(player.id).not.toBeNull();
            expect(player.id).toBe('100004183626950');
            expect(player.name).not.toBeNull();
            expect(player.name).toBe('Trevor');
            expect(player.live).toBe(true);
        });

        it("Customizes the name when required to", function() {
            expect(player.name).toBe('Trevor');
            expect(player.displayName(true)).toBe('You');
        });

        it("Tells between a bot and real player", function() {
            expect(player.isBot()).toBe(false);
            player.live = false;
            expect(player.isBot()).toBe(true);
        });
    });

    describe("A deck", function() {
        var deck = new kadi.Deck();

        it("A deck can manage cards", function() {
            deck.cards = [];
            expect(deck.isEmpty()).toBe(true);
            deck.addCard(kadi.spades("5"));
            expect(deck.isEmpty()).toBe(false);

            deck.removeCard(kadi.spades("6"));
            expect(deck.isEmpty()).toBe(false);
            deck.removeCard(kadi.spades("5"));
            expect(deck.isEmpty()).toBe(true);
        });

        describe("Picking deck", function() {
            var pickingDeck = null;

            beforeEach(function() {
                pickingDeck = new kadi.PickingDeck(kadi.Suite.getDeckOfCards());
            });

            it("Picks a valid starting card to begin the game", function() {
                expect(pickingDeck.numCards()).toBe(54);

                var startingCard = pickingDeck.cut();
                expect(kadi.RuleEngine.canStart(startingCard)).toBe(true);

                expect(pickingDeck.numCards()).toBe(53);
            });

            it("Can deal a specific card", function() {
                var card = pickingDeck.dealCard(kadi.clubs("5"));
                expect(card.eq(kadi.clubs("5"))).toBe(true);

                expect(pickingDeck.numCards()).toBe(53);
                pickingDeck.dealCard(kadi.clubs("6"));
                expect(pickingDeck.numCards()).toBe(52);
            });
        });
    });

    describe("A game", function() {
        var compA = null, compB = null, compC = null, players = null;

        beforeEach(function() {
            compA = new kadi.Player('100004303570767', 'Wills', false, 0, 0, 0, new kadi.Deck());
            compB = new kadi.Player('100004432652693', 'Prezzo', false, 0, 0, 0, new kadi.Deck());
            compC = new kadi.Player('100004430102934', 'Smally', false, 0, 0, 0, new kadi.Deck());
            players = [compA, compB, compC];
        });

        afterEach(function() {
            _.each([compA, compB, compC], function(p) { p.removeListeners() });
            compA, compB, compC = null;
        });

        it("Game Options are mutually exclusive", function() {
            var options = new kadi.GameOptions(kadi.GameOptions.MODE_ELIMINATION, kadi.GameOptions.ONE_CARD_KADI, kadi.GameOptions.PICKING_MODE_TOP_ONLY);
            expect(options.isEliminationMode()).toBe(true);
            expect(options.isFirstToWin()).toBe(false);
            expect(options.canFinishWithMultipleCards()).toBe(false);
            expect(options.mustFinishWithOnlyOneCard()).toBe(true);
            expect(options.canPickOnlyTheTopCard()).toBe(true);
            expect(options.mustPickAllTheCards()).toBe(false);

            options = new kadi.GameOptions(kadi.GameOptions.MODE_FIRST_TO_WIN, kadi.GameOptions.ANY_CARDS_KADI, kadi.GameOptions.PICKING_MODE_ALL);
            expect(options.isEliminationMode()).not.toBe(true);
            expect(options.isFirstToWin()).not.toBe(false);
            expect(options.canFinishWithMultipleCards()).not.toBe(false);
            expect(options.mustFinishWithOnlyOneCard()).not.toBe(true);
            expect(options.canPickOnlyTheTopCard()).not.toBe(true);
            expect(options.mustPickAllTheCards()).not.toBe(false);
        });

        it("A game has options", function() {
            var options = new kadi.GameOptions(kadi.GameOptions.MODE_ELIMINATION, kadi.GameOptions.ONE_CARD_KADI, kadi.GameOptions.PICKING_MODE_TOP_ONLY);
            var game = new kadi.Game(null, players, options);

            expect(game.pickTopOnly()).toBe(true);
            expect(game.eliminationMode()).toBe(true);
            expect(game.singleCardKadi()).toBe(true);
        });

        it("A game has a number of players", function() {
            var options = new kadi.GameOptions(kadi.GameOptions.MODE_ELIMINATION, kadi.GameOptions.ONE_CARD_KADI, kadi.GameOptions.PICKING_MODE_TOP_ONLY);
            var game = new kadi.Game(null, players, options);

            expect(game.hasLivePlayer()).toBe(false);
            expect(game.players.length).toBe(3);
        });

        it("Can start a game", function() {
            var options = new kadi.GameOptions(kadi.GameOptions.MODE_ELIMINATION, kadi.GameOptions.ONE_CARD_KADI, kadi.GameOptions.PICKING_MODE_TOP_ONLY);
            var game = new kadi.Game(null, players, options);

            game.startGame(0);
            expect(game.order.current().eq(players[0])).toBe(true);
            expect(game.order.current().gameContext.topCard.eq(game.tableDeck.topCard())).toBe(true);

            _.each(game.players, function(p) {
                expect(p.deck.hasCards()).toBe(true);
                expect(p.deck.numCards()).toBe(3);
            });
            game.removeListeners();
        });

        it("Can deal specific cards to players", function() {
            var options = new kadi.GameOptions(kadi.GameOptions.MODE_ELIMINATION, kadi.GameOptions.ONE_CARD_KADI, kadi.GameOptions.PICKING_MODE_TOP_ONLY);
            var game = new kadi.Game(null, players, options);

            var playerOneCards = [kadi.spades("J"), kadi.spades("2"), kadi.hearts("3")];
            var playerTwoCards = [kadi.clubs("J"), kadi.diamonds("2"), kadi.spades("3")];
            var playerThreeCards = [kadi.hearts("J"), kadi.hearts("2"), kadi.clubs("3")];

            var cards = [playerOneCards, playerTwoCards, playerThreeCards];
            var topCard = kadi.spades("5");

            game.startGame(1, cards, topCard);
            var curr = game.order.current();
            _.each(curr.deck.cards, function(c, idx) {
                expect(c.eq(playerTwoCards[idx])).toBe(true);
            });

            expect(game.tableDeck.topCard().eq(topCard)).toBe(true);

            //count the total number of cards
            var playerCards = 0;
            _.each(players, function(p) { playerCards += p.deck.numCards(); });

            expect(playerCards).toBe(9);
            expect(game.tableDeck.numCards()).toBe(1);
            expect(game.pickingDeck.numCards()).toBe(44);
            expect(playerCards + game.tableDeck.numCards() + game.pickingDeck.numCards()).toBe(54);

            game.removeListeners();
            game = null;
        });

        describe("Game play rules", function() {

            it("Basic rules : Picking, Requesting Ace and Jumping", function() {
                var options = new kadi.GameOptions(kadi.GameOptions.MODE_ELIMINATION, kadi.GameOptions.ONE_CARD_KADI, kadi.GameOptions.PICKING_MODE_TOP_ONLY);
                var game = new kadi.Game(null, players, options);
                var playerACards = [kadi.spades("Q"), kadi.spades("7"), kadi.diamonds("Q")];
                var playerBCards = [kadi.clubs("A"), kadi.spades("3")];
                var playerCCards = [kadi.hearts("J"), kadi.hearts("5"), kadi.clubs("4")];

                var cards = [playerACards, playerBCards, playerCCards];
                var topCard = kadi.spades("5");
                game.startGame(0, cards, topCard);

                expect(compA.isMyTurn()).toBe(true);
                expect(compB.isMyTurn()).toBe(false);

                expect(compA.canDeclareKADI()).toBe(false);
                expect(compA.active).toBe(true);

                compA.pick(true); //Player A picks

                expect(compA.isMyTurn()).toBe(false);

                waitsFor(function() {
                    return compB.isMyTurn(); //Player B turn because A picked
                });

                runs(function() {
                    //its now player B's turn
                    compB.play([kadi.spades("3")]); //Player B plays 3

                    waitsFor(function() {
                        return compA.isMyTurn(); // Player C is skipped because he picks
                    });

                    runs(function() {
                        expect(compC.deck.numCards()).toBe(6);
                        compA.play([kadi.spades("Q"),kadi.diamonds("Q")], true); //Player A needs to answer

                        waitsFor(function() {
                            return compB.isMyTurn(); //Player B's turn
                        });

                        runs(function() {
                            expect(compA.deck.numCards()).toBe(3);

                            compB.play([kadi.clubs("A")], true); //Player B plays an A - requests any card

                            waitsFor(function() {
                                return compC.isMyTurn(); //its now player c's turn
                            });

                            runs(function() {
                                expect(game.requestedSuite).not.toBeNull();
                                expect(game.requestedSuite).toBe(kadi.Suite.ANY); //check for requested suite
                                expect(game.cardlessPlayerExists()).toBe(true); //player b has no card

                                compC.play([kadi.hearts("J")], true);

                                waitsFor(function() {
                                    return compB.isMyTurn();
                                });

                                runs(function(){
                                    game.removeListeners();
                                    game = null;
                                });
                            });
                        });
                    });
                });
            });

            it("Basic rules : Reversing and KADI", function() {
                var options = new kadi.GameOptions(kadi.GameOptions.MODE_ELIMINATION, kadi.GameOptions.ONE_CARD_KADI, kadi.GameOptions.PICKING_MODE_TOP_ONLY);
                var game = new kadi.Game(null, players, options);
                var playerACards = [kadi.spades("Q"), kadi.spades("3"), kadi.clubs("9")];
                var playerBCards = [kadi.clubs("A"), kadi.diamonds("K")];
                var playerCCards = [kadi.spades("K"), kadi.clubs("4"), kadi.diamonds("4"), kadi.clubs("5")];

                var cards = [playerACards, playerBCards, playerCCards];
                var topCard = kadi.spades("5");
                game.startGame(0, cards, topCard);

                expect(compB.onKADI).toBe(false);
                compA.play([kadi.spades("Q"), kadi.spades("3")], true);

                waitsFor(function() {
                    return compC.isMyTurn();
                });

                runs(function() {
                    expect(compA.canDeclareKADI()).toBe(true);
                    expect(game.cardlessPlayerExists()).toBe(false);
                    expect(compA.onKADI).toBe(true);
                    compC.play([kadi.spades("K")], true);

                    waitsFor(function() {
                       return compB.isMyTurn();
                    });

                    runs(function() {
                        compB.play([kadi.diamonds("K")], true);

                        waitsFor(function() {
                            return compC.isMyTurn();
                        });

                        runs(function() {
                            expect(compC.onKADI).toBe(false);
                            compC.play([kadi.diamonds("4"), kadi.clubs("4")]);

                            waitsFor(function() {
                               return compA.isMyTurn();
                            });

                            runs(function() {
                                expect(compA.onKADI).toBe(true);
                                expect(game.cardlessPlayerExists()).toBe(true);
                                compA.pick(true);

                                waitsFor(function() {
                                    return compB.isMyTurn();
                                });

                                runs(function() {
                                    expect(compA.isCardless()).toBe(false);
                                    expect(compB.isCardless()).toBe(true);
                                    expect(compC.isCardless()).toBe(false);
                                    expect(game.cardlessPlayerExists()).toBe(true);
                                    compB.pick(true);

                                    waitsFor(function() {
                                        return compC.isMyTurn();
                                    });

                                    runs(function() {
                                        expect(game.cardlessPlayerExists()).toBe(false);
                                        expect(compA.isCardless()).toBe(false);
                                        expect(compB.isCardless()).toBe(false);
                                        expect(compC.isCardless()).toBe(false);
                                        expect(compC.onKADI).toBe(true);
                                        expect(compC.canFinish()).toBe(true);
                                        compC.bot(true); //finish

                                        waitsFor(function() {
                                            return game.gameOver;
                                        });

                                        runs(function() {
                                            game.removeListeners();
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });

            it("Basic rules : Adding picking cards", function() {
                var options = new kadi.GameOptions(kadi.GameOptions.MODE_ELIMINATION, kadi.GameOptions.ONE_CARD_KADI, kadi.GameOptions.PICKING_MODE_ALL);
                var game = new kadi.Game(null, players, options);
                var playerACards = [kadi.spades("2"), kadi.spades("3"), kadi.clubs("9")];
                var playerBCards = [kadi.clubs("3"), kadi.diamonds("K")];
                var playerCCards = [kadi.spades("K"), kadi.clubs("4"), kadi.diamonds("4")];

                var cards = [playerACards, playerBCards, playerCCards];
                var topCard = kadi.spades("5");
                game.startGame(0, cards, topCard);

                compA.play([kadi.spades("2"), kadi.spades("3")], true);

                waitsFor(function() {
                   return compA.isMyTurn();
                });

                runs(function() {
                    expect(compA.deck.numCards()).toBe(1);
                    expect(compB.deck.numCards()).toBe(1);
                    expect(compC.deck.numCards()).toBe(11);

                    game.removeListeners();
                });
            });

            it("Basic rules : Blocking and requesting a card at the same time", function() {
                var options = new kadi.GameOptions(kadi.GameOptions.MODE_ELIMINATION, kadi.GameOptions.ONE_CARD_KADI, kadi.GameOptions.PICKING_MODE_ALL);
                var game = new kadi.Game(null, [compA, compB], options);

                var playerACards = [kadi.spades("2"), kadi.spades("3"), kadi.diamonds("9")];
                var playerBCards = [kadi.clubs("A"), kadi.diamonds("A"), kadi.clubs("5")];

                var cards = [playerACards, playerBCards];
                var topCard = kadi.spades("5");
                game.startGame(0, cards, topCard);

                compA.bot(true);

                waitsFor(function() {
                    return compA.isMyTurn();
                });

                runs(function() {
                    expect(compA.deck.numCards()).toBe(1);
                    expect(compB.deck.numCards()).toBe(2); //TODO: should the computer be blocking and requesting...
                    console.log(game.tableDeck.topCard().toS());
                    game.removeListeners();
                });
            });

            it("Basic rules : Requesting a card", function() {
                var options = new kadi.GameOptions(kadi.GameOptions.MODE_ELIMINATION, kadi.GameOptions.ONE_CARD_KADI, kadi.GameOptions.PICKING_MODE_ALL);
                var game = new kadi.Game(null, [compA, compB], options);

                var playerACards = [kadi.spades("A"), kadi.diamonds("3"), kadi.diamonds("9")];
                var playerBCards = [kadi.clubs("5"), kadi.diamonds("5")];

                var cards = [playerACards, playerBCards];
                var topCard = kadi.spades("5");
                game.startGame(0, cards, topCard);

                game.removeListeners();
            });

            it("Advanced rules : Blocking a Jump with another jump", function() {
                var options = new kadi.GameOptions(kadi.GameOptions.MODE_ELIMINATION, kadi.GameOptions.ONE_CARD_KADI, kadi.GameOptions.PICKING_MODE_ALL);
                var game = new kadi.Game(null, [compA, compB, compC], options);

                var playerACards = [kadi.spades("J"), kadi.spades("3"), kadi.diamonds("9")];
                var playerBCards = [kadi.clubs("J"), kadi.diamonds("J"), kadi.diamonds("5")];
                var playerCCards = [kadi.spades("K"), kadi.clubs("4"), kadi.diamonds("4")];

                var cards = [playerACards, playerBCards, playerCCards];
                var topCard = kadi.spades("5");
                game.startGame(0, cards, topCard);

                compA.play([kadi.spades("J")], true);

                waitsFor(function() {
                    return compB.isMyTurn();
                });

                runs(function() {
                    expect(compB.deck.numCards()).toBe(1);
                });
            });
        });
    });
});