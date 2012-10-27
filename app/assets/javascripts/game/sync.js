var Sync = JS.Class({
    statics: {
        PUB_KEY: "pub-65335e90-6f51-4378-a307-c6ee83a27931",
        SUB_KEY: "sub-5fb01873-fb3e-11e1-b760-112b06073279",
        GAME_CHANNEL: "kadi-game-channel"
    },

    construct: function() {
        console.log("KEY: ", Sync.PUB_KEY, Sync.SUB_KEY);

//        this.pubnub = PUBNUB.init({
//            publish_key   : Sync.PUB_KEY,
//            subscribe_key : Sync.SUB_KEY,
//            ssl           : false,
//            origin        : 'pubsub.pubnub.com'
//        });
//
//        this.pubnub.subscribe({
//            channel  : "kadi-game-channel", // Channel Name
//            publish_key   : Sync.PUB_KEY,
//            subscribe_key : Sync.SUB_KEY,
//            ssl           : false,
//            connect  : function() {
//                console.log("Someone connected");
//            }, // OnConnect Callback
//            callback : function() {
//
//            },  // Received Message Callback
//            presence : function() {
//                console.log("Someone checked in the the presence channel");
//            } // Presence Callback
//        });
    }
});

$(document).ready(function () {
    console.log("sync.js loaded");

    var s = new Sync();
});