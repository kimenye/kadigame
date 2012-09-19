var Player = JS.Class({
    construct: function(roarPlayerId,fbId,name,roarApi) {
        this.roarPlayerId = roarPlayerId;
        this.fbId = fbId;
        this.name = name;
        this.roarApi = roarApi;
        this.synced = false;
        this.sync();
    },

    /**
     * Synchronizes the roar data with the server
     */
    sync: function() {
        $.post('/player/sync', { fb_id: this.fbId, roar_id: this.roarPlayerId }, function(data) {
            this.synced = data.success;
        });
    }
});