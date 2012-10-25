describe("Card rules:", function() {

    var rule = new kadi.game.RuleEngine();

    it("The two jokers are named differently", function() {
        var jokerA = kadi.joker("0");
        var jokerB = kadi.joker("1");

        expect(jokerA.eq(jokerB)).toBe(false);
        expect(jokerA.toS()).toBe("Joker");
    });

    it("Only valid cards can start", function() {
        var king = kadi.diamonds("K");
        expect(kadi.game.RuleEngine.canStart(king)).toBe(false);

        var queen = kadi.hearts("Q");
        expect(kadi.game.RuleEngine.canStart(queen)).toBe(false);

        var five = kadi.hearts("5");
        expect(kadi.game.RuleEngine.canStart(five)).toBe(true);
    });

    it("Cards of the same suite can follow each other", function() {
        var random_spade_card = kadi.spades("6");
        var other_spade_card = kadi.spades("5");
        var cant_follow = kadi.diamonds("4");

        expect(kadi.game.RuleEngine.canFollow(random_spade_card, other_spade_card)).toBe(true);
        expect(kadi.game.RuleEngine.canFollow(other_spade_card,random_spade_card)).toBe(true);
        expect(kadi.game.RuleEngine.canFollow(other_spade_card,cant_follow)).toBe(false);
    });

    it("Cards of a different suite but same rank can follow each other", function() {
        var rank = "4";
        var random_diamond = kadi.diamonds(rank);
        var random_spade = kadi.spades(rank);

        expect(kadi.game.RuleEngine.canFollow(random_diamond,random_spade)).toBe(true);
    });

    it("An ace can follow any card", function() {
        var any_card = kadi.diamonds("Q");
        var an_ace = kadi.spades("A");

        expect(kadi.game.RuleEngine.canFollow(an_ace,any_card));
    });

    it("Any card can follow a joker", function() {
        var anyCard = kadi.diamonds("Q");
        var j = kadi.joker("0");

        expect(kadi.game.RuleEngine.canFollow(anyCard, j)).toBe(true);
        expect(kadi.game.RuleEngine.canFollow(j, anyCard)).toBe(true);
    });

    it("A card can be be in a move with another if they are the same rank", function() {
        var five_d = kadi.diamonds("5");
        var five_s = kadi.spades("5");

        expect(kadi.game.RuleEngine.canPlayTogetherWith(five_d, five_s)).toBe(true);
    });

    it("A card cannot be in a move with another if they are not the same rank", function() {
        var five_d = kadi.diamonds("5");
        var six_d = kadi.diamonds("6");

        expect(kadi.game.RuleEngine.canPlayTogetherWith(five_d, six_d)).toBe(false);
    });

    it("An ace can not be in a move a non ace card", function() {
        var five_d = kadi.diamonds("5");
        var ace = kadi.diamonds("A");

        expect(kadi.game.RuleEngine.canPlayTogetherWith(five_d, ace)).toBe(false);
    });
    
    it("A King and a Queen cannot be in a move even if they are in the same rank", function() {
        
        var king_spades = kadi.spades("K");
        var queen_spades = kadi.spades("Q");
        
        expect(kadi.game.RuleEngine.canPlayTogetherWith(king_spades, queen_spades)).toBe(false);
    });
    
    it("A Queen can be in a move with Kings if the player reverses cancel each other out", function() {
        
        var king_diamonds = kadi.diamonds("K");
        var king_spades = kadi.spades("K");
        var queen_spades = kadi.spades("Q");
        var hand = [king_diamonds, king_spades, queen_spades];
        
        expect(kadi.game.RuleEngine.evaluateGroup(hand)).toBe(true);
        expect(kadi.game.RuleEngine.evaluateGroup([kadi.diamonds("K"), kadi.diamonds("Q")])).toBe(false);
        expect(kadi.game.RuleEngine.evaluateGroup([kadi.hearts("K"), kadi.diamonds("K"), kadi.diamonds("Q")])).toBe(true);
        expect(kadi.game.RuleEngine.evaluateGroup([kadi.hearts("K"), kadi.spades("K"), kadi.diamonds("K"), kadi.diamonds("Q")])).toBe(false);

        hand = [kadi.hearts("K"), kadi.spades("K"), kadi.diamonds("K"), kadi.diamonds("Q")];
        expect(kadi.game.RuleEngine.isValidMove(hand, kadi.joker('0'))).toBe(false);

        hand = [kadi.hearts("K"), kadi.spades("K"), kadi.clubs("K"), kadi.diamonds("K"), kadi.diamonds("Q")];
        expect(kadi.game.RuleEngine.evaluateGroup(hand)).toBe(true);
        
        expect(kadi.game.RuleEngine.isValidMove(hand, kadi.joker('0'))).toBe(true);
        expect(kadi.game.RuleEngine.isValidMove([kadi.clubs("8")], kadi.clubs("3"))).toBe(true);

        expect(kadi.game.RuleEngine.isValidMove([kadi.hearts("K"), kadi.clubs("K"), kadi.joker("0")], kadi.joker("1"))).toBe(true);
    });

    it("Assesses whether a move is valid", function() {
        var hand = [kadi.joker("0"), kadi.spades("2")];
        expect(kadi.game.RuleEngine.isValidMove(hand, kadi.diamonds("6"))).toBe(true);
        hand = [kadi.spades("2"),kadi.joker("0")];
        expect(kadi.game.RuleEngine.isValidMove(hand, kadi.diamonds("6"))).toBe(false);
    });
    
    it("A Queen can follow a King if the previous number of kings after the first king is odd", function() {
        //K,Q
        expect(kadi.game.RuleEngine.canPlayTogetherWith(kadi.diamonds("K"), kadi.diamonds("Q"))).toBe(false);
        
        //K,K,Q
        expect(kadi.game.RuleEngine.canPlayTogetherWith(kadi.diamonds("K"), kadi.diamonds("Q"), [kadi.hearts("K")])).toBe(true);
       
        expect(kadi.game.RuleEngine.canPlayTogetherWith(kadi.diamonds("K"), kadi.diamonds("Q"), [kadi.hearts("K"), kadi.spades("K")])).toBe(false);
       
        expect(kadi.game.RuleEngine.canPlayTogetherWith(kadi.diamonds("K"), kadi.diamonds("Q"), [kadi.hearts("K"), kadi.spades("K"), kadi.clubs("K")])).toBe(true);
    });
    
    it("An ace can only follow a King if the previous card to the King is also a King", function() {
       expect(kadi.game.RuleEngine.canPlayTogetherWith(kadi.diamonds("K"), kadi.diamonds("A"))).toBe(false);
       
       expect(kadi.game.RuleEngine.canPlayTogetherWith(kadi.diamonds("K"), kadi.diamonds("A"), [kadi.hearts("K")])).toBe(true);
       
       expect(kadi.game.RuleEngine.canPlayTogetherWith(kadi.diamonds("K"), kadi.diamonds("A"), [kadi.hearts("K"), kadi.spades("K")])).toBe(false);
       
       expect(kadi.game.RuleEngine.canPlayTogetherWith(kadi.diamonds("K"), kadi.diamonds("A"), [kadi.hearts("K"), kadi.spades("K"), kadi.clubs("K")])).toBe(true);
       
    });

    it("A queen cannot finish a move", function() {
        var card = kadi.diamonds("Q");
        expect(kadi.game.RuleEngine.canEndMove(card)).toBe(false);

        card = kadi.diamonds("K");
        expect(kadi.game.RuleEngine.canEndMove(card)).toBe(true);

        card = kadi.diamonds("Q");
        expect(kadi.game.RuleEngine.canEndMove(card)).toBe(false);
    });

    describe("Queen rules", function() {

        it("A queen can play together with another queen", function() {
            var q_d = kadi.diamonds("Q");
            var q_s = kadi.spades("Q");

            expect(kadi.game.RuleEngine.canPlayTogetherWith(q_d, q_s)).toBe(true);
        });

        it("A queen can play together with another ordinary card of the same suite", function() {
            var q_d = kadi.diamonds("Q");
            var seven_d = kadi.diamonds("7");
            var seven_c = kadi.clubs("7");

            expect(kadi.game.RuleEngine.canPlayTogetherWith(q_d, seven_d)).toBe(true);
            expect(kadi.game.RuleEngine.canPlayTogetherWith(q_d, seven_c)).toBe(false);
        });

        it("An eight can act as a queen", function() {
            var eight_d = kadi.diamonds("8");
            var seven_d = kadi.diamonds("7");

            expect(kadi.game.RuleEngine.canPlayTogetherWith(eight_d, seven_d)).toBe(true);
        });
    });

    describe("Elimination rules", function() {

        it("Cards have specified values that are used for eliminating players", function() {
            expect(kadi.spades("A").eliminationValue()).toBe(100);
            expect(kadi.spades("2").eliminationValue()).toBe(50);
            expect(kadi.spades("3").eliminationValue()).toBe(75);
            expect(kadi.spades("4").eliminationValue()).toBe(4);
            expect(kadi.spades("5").eliminationValue()).toBe(5);
            expect(kadi.spades("6").eliminationValue()).toBe(6);
            expect(kadi.spades("7").eliminationValue()).toBe(7);
            expect(kadi.hearts("8").eliminationValue()).toBe(8);
            expect(kadi.spades("9").eliminationValue()).toBe(9);
            expect(kadi.spades("10").eliminationValue()).toBe(10);
            expect(kadi.clubs("J").eliminationValue()).toBe(20);
            expect(kadi.diamonds("Q").eliminationValue()).toBe(20);
            expect(kadi.spades("K").eliminationValue()).toBe(20);
            expect(kadi.joker("0").eliminationValue()).toBe(500);
            expect(kadi.joker("1").eliminationValue()).toBe(500);
        });

        it("The hand value is the sum of the elimination values of the cards in the hand", function() {
            var hand = [kadi.spades("2"), kadi.diamonds("4"), kadi.hearts("7")];
            expect(kadi.game.RuleEngine.calculateHandEliminationValue(hand)).toBe(61);

            hand = hand.concat([kadi.spades("3"), kadi.joker("0"), kadi.spades("A"), kadi.hearts("A")]);
            expect(kadi.game.RuleEngine.calculateHandEliminationValue(hand)).toBe(836);
        });
    });

    describe("Picking card rules", function() {

        it("An ace can block any picking card", function() {
            var h = [kadi.diamonds("A"), kadi.diamonds("5")];
            expect(kadi.game.RuleEngine.canBlock(h)).toBe(true);
        });

        it("An ace can answer any question", function() {
            expect(kadi.game.RuleEngine.canPlayTogetherWith(kadi.spades("Q"), kadi.hearts("A")));
        });

        it("An ordinary card cannot block a picking card", function() {
            var h = [kadi.diamonds("5")];
            expect(kadi.game.RuleEngine.canBlock(h)).toBe(false);
        });

        it("Any picking card block another picking card", function() {
            var h = [kadi.diamonds("3"), kadi.spades("5"), kadi.clubs("J")];
            expect(kadi.game.RuleEngine.canBlock(h)).toBe(true);
        });

        it("A picking card is a picking card", function() {
            expect(kadi.game.RuleEngine.canFollow(kadi.diamonds("3"), kadi.spades("2"))).toBe(true);
            expect(kadi.game.RuleEngine.canPlayTogetherWith(kadi.joker("0"), kadi.spades("2"))).toBe(true);
        });

        it("Returns the number of cards that can be used to block", function() {
            expect(kadi.game.RuleEngine.countBlockingCards([kadi.spades("A")])).toBe(1);
        });

        it("A picking move cannot mix a picking card and an ace", function() {
            var h = [kadi.diamonds("3"), kadi.spades("A")];
            expect(kadi.game.RuleEngine.canBlock(h)).toBe(true);
            expect(kadi.game.RuleEngine.isValidBlockingMove(h)).toBe(false);
            expect(kadi.game.RuleEngine.isValidBlockingMove([kadi.spades("A")])).toBe(true);
            expect(kadi.game.RuleEngine.isValidBlockingMove([kadi.spades("3"), kadi.clubs("2")])).toBe(true);
        });
    });

    describe("Ace rules", function() {

        it("The first card of a move is what determines whether play can proceed", function() {
            var requested = kadi.game.Suite.SPADES;
            var move = [kadi.clubs("Q"),kadi.diamonds("A")];
            expect(kadi.game.RuleEngine.canFollowRequestedSuite(move,requested)).toBe(false);
            move = [kadi.spades("Q"),kadi.diamonds("A")];
            expect(kadi.game.RuleEngine.canFollowRequestedSuite(move,requested)).toBe(true);
        });

        it("An ace can follow any requested suite", function() {
            var requested = kadi.game.Suite.SPADES;
            var move = [kadi.diamonds("A")];
            expect(kadi.game.RuleEngine.canFollowRequestedSuite(move,requested)).toBe(true);

        });

        it("Anything can follow an empty requested suite", function() {
            var requested = kadi.game.Suite.ANY;
            var move = [kadi.diamonds("J")];
            expect(kadi.game.RuleEngine.canFollowRequestedSuite(move,requested)).toBe(true);

            var hand = [kadi.hearts("J"), kadi.clubs("10"), kadi.clubs("5"), kadi.diamonds("8")];
            expect(kadi.game.RuleEngine.canFollowRequestedSuite(move,requested)).toBe(true);

        });

        it("Cards matching the requested suite", function() {
            var requested = kadi.game.Suite.SPADES;
            var hand = [kadi.spades("A"), kadi.diamonds("A"), kadi.diamonds("K")];

            expect(kadi.game.RuleEngine.cardsInHandMatchingSuite(hand,requested).length).toBe(2);
            expect(kadi.game.RuleEngine.canMeetMatchingSuite(hand,requested)).toBe(true);
        });

        it("All cards in hard match the requested suite if any suite is specified", function() {
            var req = kadi.game.Suite.ANY;
            var hand = [kadi.spades("A"), kadi.diamonds("A"), kadi.diamonds("K")];

            expect(kadi.game.RuleEngine.cardsInHandMatchingSuite(hand,req).length).toBe(3);
        });

        it("The best move matching the suite is the best group that can follow a requested card", function() {
            var requested = kadi.game.Suite.DIAMONDS;
            var hand = [kadi.clubs("2"), kadi.diamonds("J"), kadi.spades("3"), kadi.clubs("J")];
            expect(kadi.game.Strategy.bestMoveForRequestedSuite(hand,requested).length).toBe(2);

            var hand = [kadi.clubs("2"), kadi.diamonds("J"), kadi.clubs("A"), kadi.spades("3"), kadi.clubs("J")];
            expect(kadi.game.Strategy.bestMoveForRequestedSuite(hand,requested).length).toBe(2);
        });
    });

    describe("KADI rules", function() {

        it("A player cannot be on kadi if they have any picking cards", function() {
            var hand = [kadi.spades("4"), kadi.spades("2"), kadi.joker("0")];
            expect(kadi.game.RuleEngine.canDeclareKADI(hand)).toBe(false);
        });

        it("A player cannot be on kadi if they have either a K or J", function() {
            var hand = [kadi.spades("4"), kadi.spades("K"), kadi.hearts("J")];
            expect(kadi.game.RuleEngine.canDeclareKADI(hand)).toBe(false);
        });

        it("A player cannot be on kadi if they have a single ace", function() {
            var hand = [kadi.spades("A")];
            expect(kadi.game.RuleEngine.canDeclareKADI(hand)).toBe(false);
        });

        it("A player can be on kadi if they have a single ordinary card", function() {
            var hand = [kadi.spades("4")];
            expect(kadi.game.RuleEngine.canDeclareKADI(hand)).toBe(true);
        });

        it("A player cant be on kadi if they have a single Q", function() {
            var hand = [kadi.clubs("Q")];
            expect(kadi.game.RuleEngine.canDeclareKADI(hand)).toBe(false);
        });

        it("A player cannot be on kadi if their remaining cards cannot form a single move", function() {
            var hand = [kadi.spades("6"), kadi.clubs("4")];
            expect(kadi.game.RuleEngine.canDeclareKADI(hand)).toBe(false);
        });

        it("A player can be on on kadi if their remaining cards can form a single move", function() {
            var hand = [kadi.spades("4"), kadi.diamonds("4")];
            expect(kadi.game.RuleEngine.canDeclareKADI(hand)).toBe(true);
        });

        it("A player can be on kadi if they have questions only if they can be answered", function() {
            var hand = [kadi.spades("8"), kadi.diamonds("8"), kadi.diamonds("Q"), kadi.diamonds("4")];
            expect(kadi.game.RuleEngine.canDeclareKADI(hand)).toBe(true);

            hand = [kadi.spades("Q"), kadi.hearts("Q")];
            expect(kadi.game.RuleEngine.canDeclareKADI(hand)).toBe(false);

            hand = [kadi.spades("Q"), kadi.spades("5"), kadi.hearts("Q")];
            expect(kadi.game.RuleEngine.canDeclareKADI(hand)).toBe(true);
        });

        it("A player can finish with a single card", function() {
            var hand = [kadi.spades("4")];
            expect(kadi.game.RuleEngine.canFinish(hand, null, kadi.game.Suite.SPADES)).toBe(true);
        });

        it("A player can finish if the can form a move that matches the current top card", function() {
            var hand = [kadi.spades("8"), kadi.diamonds("8"), kadi.diamonds("Q"), kadi.diamonds("4")];
            var topCard = kadi.spades("3");

            expect(kadi.game.RuleEngine.canFinish(hand, topCard)).toBe(true);
        });

        it("A player cannot finish if the cant form a move that matches the current top card", function() {
            var hand = [kadi.spades("8"), kadi.diamonds("8"), kadi.diamonds("Q"), kadi.diamonds("4")];
            var topCard = kadi.hearts("3");

            expect(kadi.game.RuleEngine.canFinish(hand, topCard)).toBe(false);
        });

        it("A player an finish if they can form a move that matches the request suite", function() {
            var hand = [kadi.spades("8"), kadi.diamonds("8"), kadi.diamonds("Q"), kadi.diamonds("4")];
            var requestedSuite = kadi.game.Suite.ANY;
            expect(kadi.game.RuleEngine.canFinish(hand, null, requestedSuite)).toBe(true);

            requestedSuite = kadi.game.Suite.HEARTS;
            expect(kadi.game.RuleEngine.canFinish(hand, null, requestedSuite)).toBe(false);
        });

        it("The number of entire moves possible is the number of moves that can follow the top card", function() {
            var hand = [kadi.spades("8"), kadi.diamonds("8")];
            var topCard = kadi.spades("7");

            expect(kadi.game.RuleEngine.movesThatCanFollowTopCardOrSuite(hand, topCard).length).toBe(1);
        });

        it("The number of entire moves possible is the number of moves that can follow the requested suite", function() {

            var hand = [kadi.spades("8"), kadi.diamonds("8"), kadi.diamonds("4")];
            var requestedSuite = kadi.game.Suite.HEARTS;

            expect(kadi.game.RuleEngine.movesThatCanFollowTopCardOrSuite(hand, null, requestedSuite).length).toBe(0);

            requestedSuite = kadi.game.Suite.SPADES;
            var moves = kadi.game.RuleEngine.movesThatCanFollowTopCardOrSuite(hand, null, requestedSuite);
            expect(moves.length).toBe(1);

            hand = [kadi.spades("4")];
            var moves = kadi.game.RuleEngine.movesThatCanFollowTopCardOrSuite(hand, null, requestedSuite);
            expect(moves.length).toBe(1);
        });

        it("In single card KADI mode, you can only be only finish with one card", function() {
            var hand = [kadi.spades("8"), kadi.spades("4")];
            expect(kadi.game.RuleEngine.canDeclareKADI(hand)).toBe(true);
            expect(kadi.game.RuleEngine.canDeclareKADI(hand,true)).toBe(false);

            hand = [kadi.spades("8")];
            expect(kadi.game.RuleEngine.canDeclareKADI(hand,true)).toBe(false);
            expect(kadi.game.RuleEngine.canDeclareKADI(hand,false)).toBe(false);

            hand = [kadi.spades("4")];
            expect(kadi.game.RuleEngine.canDeclareKADI(hand,true)).toBe(true);
            expect(kadi.game.RuleEngine.canDeclareKADI(hand,false)).toBe(true);
        });
    });
});

describe("Move rules:", function() {

    var startingCard = kadi.diamonds("10");
    var hand, deck, computer, board;

    it("No moves are possible if no cards can follow", function() {
        hand = [kadi.hearts("2"),kadi.spades("3"),kadi.hearts("4"),kadi.clubs("4")];
        expect(kadi.game.RuleEngine.possibleMoves(startingCard, hand).length).toBe(0);
    });

    it("Multiple moves are possible without grouping cards", function() {
        hand = [kadi.diamonds("5"), kadi.diamonds("6"), kadi.spades("K"), kadi.spades("A")];
        expect(kadi.game.RuleEngine.possibleMoves(kadi.diamonds("10"),hand).length).toBe(3);
    });

    describe("Group rules", function() {

        it("A group is a series of cards that an be played together", function() {
            var g = [kadi.clubs("6"), kadi.diamonds("6")];
            expect(kadi.game.RuleEngine.evaluateGroup(g)).toBe(true);

            g = [kadi.clubs("7"), kadi.clubs("8")];
            expect(kadi.game.RuleEngine.evaluateGroup(g)).toBe(false);

            g = [kadi.clubs("Q"), kadi.clubs("7")];
            expect(kadi.game.RuleEngine.evaluateGroup(g)).toBe(true);
        });

        it("Any non playable cards in a set makes the group invalid", function() {
            var g = [kadi.clubs("Q"), kadi.clubs("7"), kadi.diamonds("8")];
            expect(kadi.game.RuleEngine.evaluateGroup(g)).toBe(false);
        });

        it("All consecutive cards must be playable for the cards to form a group", function() {
            var g = [kadi.clubs("Q"), kadi.clubs("7"), kadi.diamonds("7")];
            expect(kadi.game.RuleEngine.evaluateGroup(g)).toBe(true);
        });

        it("A group requires at least 2 cards in a hand", function() {
            var h = [kadi.clubs("3")];
            expect(kadi.game.RuleEngine.group(h, null).length).toBe(0);
        });

        it("A group does not exist if no cards in a hand can be played together even if they can follow each other", function () {
            var h = [kadi.diamonds("5"), kadi.diamonds("6")];
            expect(kadi.game.RuleEngine.group(h, null).length).toBe(0);
        });

        it("A group exists if more than one cards in a hand can be played together", function () {
            var h = [kadi.spades("4"), kadi.clubs("4"), kadi.hearts("3"), kadi.spades("5")];
            var tC = kadi.spades("6");
            expect(kadi.game.RuleEngine.group(h,tC).length).toBe(1);
        });

        it("A group with more cards is more valuable than one with less", function() {
            var h = [kadi.spades("4"), kadi.clubs("4"), kadi.hearts("4"), kadi.spades("5"), kadi.hearts("5")];
            expect(kadi.game.RuleEngine.group(h,kadi.spades("6")).length).toBe(2);

            var group = kadi.game.RuleEngine.bestGroup(h,kadi.spades("6"));
            expect(group.length).toBe(3);
        });

        it("It can play selections", function() {
            var h = [kadi.diamonds("5"), kadi.spades("5")];
            expect(kadi.game.RuleEngine.canPlay(h, kadi.diamonds(9))).toBe(true);

            h = [kadi.hearts("K"), kadi.clubs("10"), kadi.spades("A")];
            expect(kadi.game.RuleEngine.canPlay(h, kadi.clubs("A"))).toBe(true);
        });
    });
});

describe("Game mechanics:", function() {
    var playerA = new kadi.game.Player('A', 'Chaos');
    var playerB = new kadi.game.Player('B', 'Player B', true);
    var playerC = new kadi.game.Player('C', 'Player C');
    var playerD = new kadi.game.Player('D', 'Player D');

    it("correctly formats the next player message", function() {
        var order = new kadi.game.PlayingOrder([playerA, playerB, playerC, playerD], 0);
        expect(order.turn()).toBe("Chaos' turn to play");

        order.next();
        expect(order.turn()).toBe("Your turn to play");

        order.next();
        expect(order.turn()).toBe("Player C's turn to play");
    });

    it("Returns the next player", function() {
        var order = new kadi.game.PlayingOrder([playerA, playerB, playerC, playerD], 0);
        expect(order.current().eq(playerA)).toBe(true);
        expect(order.current().eq(playerB)).toBe(false);
    });

    it("When clockwise the index moves incrementally", function() {
        var order = new kadi.game.PlayingOrder([playerA, playerB, playerC, playerD], 0);
        order.next();
        expect(order.current().eq(playerB)).toBe(true);
    });


    it("Peek tells you who the next turn will be without affecting the run of play", function() {
        var order = new kadi.game.PlayingOrder([playerA, playerB, playerC, playerD], 0);
        order.next();
        expect(order.current().eq(playerB)).toBe(true);
        var next = order.peek();
        expect(next.eq(playerC)).toBe(true);
    });

    it("When anti-clockwise the index moves incrementally", function() {
        var order = new kadi.game.PlayingOrder([playerA, playerB, playerC, playerD], 0);
        order.direction = kadi.game.PlayingOrder.ANTI_CLOCKWISE;
        order.next();
        expect(order.current().eq(playerD)).toBe(true);
    });

    it("Turn reversal changes the direction of the game", function() {
        var order = new kadi.game.PlayingOrder([playerA, playerB, playerC, playerD], 0);
        order.next();
        expect(order.current().eq(playerB)).toBe(true);
        order.reverse();
        expect(order.current().eq(playerA)).toBe(true);
    });

    it("When a player finishes the game in last player standing the game continues without the player", function() {
        var order = new kadi.game.PlayingOrder([playerA, playerB, playerC, playerD], 0);
        order.next();
        order.next();
        expect(order.current().eq(playerC)).toBe(true);
        expect(order.peek().eq(playerD)).toBe(true);

        order.finish(playerC);
        expect(order.current().eq(playerD)).toBe(true);
        order.next();
        expect(order.current().eq(playerA)).toBe(true);
    });

    it("A single King causes a reverse action", function() {
        var king = kadi.spades("K");
        var h = [king];
        var action = kadi.game.RuleEngine.actionRequired(h);
        expect(action).toBe(kadi.game.RuleEngine.ACTION_REVERSE);
        expect(kadi.game.RuleEngine.calculateTurnsReverse(h)).toBe(1);
    });
    
    it("Two Kings cause a double reverse action", function() {
        
        var hand = [kadi.spades("K"), kadi.hearts("8"), kadi.diamonds("K")];
        var action = kadi.game.RuleEngine.actionRequired(hand);

        expect(action).toBe(kadi.game.RuleEngine.ACTION_REVERSE);
        expect(kadi.game.RuleEngine.calculateTurnsReverse(hand)).toBe(2);
    });

    it("Two jumps causes a double jump action", function() {
        var hand = [kadi.spades("J"), kadi.diamonds("J")];
        expect(kadi.game.RuleEngine.actionRequired(hand)).toBe(kadi.game.RuleEngine.ACTION_SKIP);

        expect(kadi.game.RuleEngine.calculateTurnsSkipped(hand)).toBe(2);
    });

    it("An ordinary card causes no action", function() {
        var five = kadi.spades("5");
        expect(five.isOrdinary()).toBe(true);
        var h = [five];
        var action = kadi.game.RuleEngine.actionRequired(h);
        expect(action == kadi.game.RuleEngine.ACTION_NONE).toBe(true);
    });

    it("A picking card causes a picking or block action", function() {
        var card = kadi.spades("2");
        expect(card.isPickingCard()).toBe(true);
        var h = [card];
        var action = kadi.game.RuleEngine.actionRequired(h);
        expect(action == kadi.game.RuleEngine.ACTION_PICK_OR_BLOCK).toBe(true);
    });

    it("An ace that isnt blocking a card causes a choose suite action", function() {
        var hand = [kadi.spades("Q"), kadi.spades("A")];
        var action = kadi.game.RuleEngine.actionRequired(hand);
        expect(action).toBe(kadi.game.RuleEngine.ACTION_PICK_SUITE);
    });

    it("The best suite to ask for is the one most common in my hand", function() {
        var hand = [kadi.spades("Q"), kadi.spades("4"), kadi.diamonds("3")];
        var suite = kadi.game.Strategy.askFor(hand);

        expect(suite).toBe(kadi.game.Suite.SPADES);

        hand = hand.concat([kadi.diamonds("Q"), kadi.diamonds("K")]);

        expect(kadi.game.Strategy.askFor(hand)).toBe(kadi.game.Suite.DIAMONDS);

        hand = hand.concat([kadi.spades("2")]);
        expect(kadi.game.Strategy.askFor(hand)).toBe(kadi.game.Suite.DIAMONDS);

        hand = [kadi.hearts("5")];
        expect(kadi.game.Strategy.askFor(hand)).toBe(kadi.game.Suite.HEARTS);

        hand = [kadi.joker("0")];
        expect(kadi.game.Strategy.askFor(hand)).toBe(kadi.game.Suite.ANY);
    });

    it("Two causes two cards to be picked", function() {
        var card = kadi.spades("2");
        var h = [card];

        expect(kadi.game.RuleEngine.calculatePicking(h)).toBe(2);
    });

    it("Three causes two cards to be picked", function() {
        var card = kadi.spades("3");
        var h = [card];

        expect(kadi.game.RuleEngine.calculatePicking(h)).toBe(3);
    });

    it("Joker causes 5 cards to be picked", function() {
        var card = kadi.joker("0");
        var h = [card,kadi.spades("3")];

        expect(kadi.game.RuleEngine.calculatePicking(h)).toBe(8);
    });

    it("When the game mode is to pick only the top card", function() {
        var h = [kadi.joker("0"), kadi.spades("2")];

        expect(kadi.game.RuleEngine.calculatePicking(h)).toBe(7);
        expect(kadi.game.RuleEngine.calculatePicking(h, false)).toBe(7);
        expect(kadi.game.RuleEngine.calculatePicking(h, true)).toBe(2);
    });

    it("A Question card causes an incomplete action", function() {
        var card = kadi.spades("Q");
        var h = [card];
        var action = kadi.game.RuleEngine.actionRequired(h);
        expect(action == kadi.game.RuleEngine.ACTION_INCOMPLETE).toBe(true);
    });

    it("A Jack card causes a skip action", function() {
        var card = kadi.spades("J");
        var h = [card];
        var action = kadi.game.RuleEngine.actionRequired(h);
        expect(action == kadi.game.RuleEngine.ACTION_SKIP).toBe(true);
    });
    
    it("A Jack can block a skip", function() {
        
    })
});

describe("Utilities:", function() {
    it("Executes a handler when it is called", function() {
        var toUpdate = false;
        var handler = new kadi.Handler(function() {
            toUpdate = true;
        });
        handler.callBack();
        expect(toUpdate).toBe(true);
    });

    it("It can correctly calculate permutations", function() {
        expect(kadi.permute([1,2]).length).toBe(2);
        var hand = [kadi.spades("2"), kadi.spades("3"), kadi.spades("4"), kadi.spades("5")];
        expect(kadi.permute(hand).length).toBe(24)
    });

    it("Picks the oldest cards", function() {
        var spade = kadi.spades("2");
        var last = kadi.clubs("J");
        var deck = [spade, kadi.spades("5"), kadi.hearts("A"), kadi.hearts("5"), kadi.clubs("5"), last , kadi.diamonds("J"), kadi.diamonds("K"), kadi.diamonds("A"), kadi.clubs("Q")];

        expect(deck.length).toBe(10);
        var oldest = _.initial(deck, 5);

        var rest = _.rest(deck,5);

        expect(oldest.length).toBe(5);
        expect(rest.length).toBe(5);

        expect(_.first(oldest).eq(spade)).toBe(true);
        expect(_.first(rest).eq(last)).toBe(true);
    });

    it("Can check if a hand has any rank", function() {
        var hand = [kadi.spades("2"), kadi.spades("3")];

        expect(kadi.containsCardOfRank(hand, "2")).toBe(true);
        expect(kadi.containsCardOfRank(hand, "J")).toBe(false);
    });

    it("Returns the highest picking card", function() {
        var hand = [kadi.spades("5"), kadi.spades("2")];
        expect(kadi.highestPickingCard(hand).eq(kadi.spades("2"))).toBe(true);

        hand.push(kadi.diamonds("3"));
        expect(kadi.highestPickingCard(hand).eq(kadi.diamonds("3"))).toBe(true);

        hand.push(kadi.joker("0"));
        expect(kadi.highestPickingCard(hand).eq(kadi.joker("0"))).toBe(true);
    });
    
    it("Returns the number of cards of the specified rank in the hand", function() {
       var hand = [kadi.diamonds("K")];
       expect(kadi.countNumberOfCardsOfRank(hand, "Q")).toBe(0);
       expect(kadi.countNumberOfCardsOfRank(hand,"K")).toBe(1);
       
       var newHand = hand.concat([kadi.spades("K"), kadi.hearts("K")]);
       expect(kadi.countNumberOfCardsOfRank(newHand,"K")).toBe(3);
    });

    it("Builds the correct profile url", function() {
        expect(kadi.getProfileUrl("FD03", false)).toBe("/images/avatars/FD03.png");
        expect(kadi.getProfileUrl("FD03", true)).toBe("http://graph.facebook.com/FD03/picture");
    });
});

(function() {
    var jasmineEnv = jasmine.getEnv();
    jasmineEnv.updateInterval = 250;

    var htmlReporter = new jasmine.HtmlReporter();
    jasmineEnv.addReporter(htmlReporter);

    jasmineEnv.specFilter = function(spec) {
        return htmlReporter.specFilter(spec);
    };

    var currentWindowOnload = window.onload;
    window.onload = function() {
        if (currentWindowOnload) {
            currentWindowOnload();
        }

        document.querySelector('.version').innerHTML = jasmineEnv.versionString();
        execJasmine();
    };

    function execJasmine() {
        jasmineEnv.execute();
    }
})();