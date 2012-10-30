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
            var pickingDeck = new kadi.PickingDeck(kadi.Suite.getDeckOfCards());

            it("Picks a valid starting card to begin the game", function() {
                expect(pickingDeck.numCards()).toBe(54);

                var startingCard = pickingDeck.cut();
                expect(kadi.RuleEngine.canStart(startingCard)).toBe(true);
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
        });

        describe("Game play rules", function() {

            it("A player can move cards", function() {
                var options = new kadi.GameOptions(kadi.GameOptions.MODE_ELIMINATION, kadi.GameOptions.ONE_CARD_KADI, kadi.GameOptions.PICKING_MODE_TOP_ONLY);
                var game = new kadi.Game(null, players, options);

                var playerOneCards = [kadi.spades("J"), kadi.spades("2"), kadi.hearts("3")];
                var playerTwoCards = [kadi.clubs("J"), kadi.diamonds("2"), kadi.spades("3")];
                var playerThreeCards = [kadi.hearts("J"), kadi.hearts("2"), kadi.clubs("3")];

                var cards = [playerOneCards, playerTwoCards, playerThreeCards];
                var topCard = kadi.spades("5");
                game.startGame(0, cards, topCard);

                expect(compA.isMyTurn()).toBe(true);
                expect(compB.isMyTurn()).toBe(false);

                expect(compA.canDeclareKADI()).toBe(false);
                expect(compA.active).toBe(true);

                compA.pick(true);

                expect(compA.isMyTurn()).toBe(false);

                waitsFor(function() {
                    return compB.isMyTurn();
                });

                runs(function() {
                    //its now player B's turn
                });
            });
        });
    });
});