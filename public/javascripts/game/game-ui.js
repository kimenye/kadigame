window.kadi.game = (function(me, $, undefined){

    me.Events = JS.Class({
        statics : {
            CARD_SELECTED : "card-selected",
            CARD_DESELECTED: "card-deselected",
            PICK_CARD: "pick-card",
            CARDS_DEALT: "cards-dealt",
            END_TURN: "end-turn",
            RECEIVE_TURN: "receive-turn",
            ACTIVATE_CARD: "activate-card",
            DEACTIVATE_CARD: "deactivate-card",
            PLAY_CARDS: "play-cards",
            BLOCK: "block-picking",
            MSG_RECEIVED: "msg-received",
            REJECT_MOVES: "reject-moves",
            REPLENISH_PICKING_CARDS: "replenish-picking-cards",
            REPLENISHED_CARDS: "replenished-cards",
            PLAYER_NOTIFICATION_UI: "player-notification-ui",
            ACCEPT_PICKING: "accept-picking",
            SUITE_REQUESTED: "suite-requested",
            HIDE_REQUESTED_SUITE: "hide-requested-suite",
            DISPLAY_REQUESTED_SUITE: "display-requested-suite",
            DECLARE_KADI: "declare-kadi",
            UNDECLARE_KADI: "undeclare-kadi",
            FINISH: "finish",
            UNHANDLED_ERROR: "unhandled-error"
        }
    });

    return me;
})(window.kadi.game || {}, jQuery);