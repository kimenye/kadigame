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
        var self = this;
        $.post('/player/sync', { fb_id: this.fbId, roar_id: this.roarPlayerId }, function(data) {
            self.synced = data.success;
            self.roarApi.viewUser(new Handler(self._readRoarUserData, self));
        });
    },

    _readRoarUserData: function(result) {
//        window.roarData = result[1];
        var success = result[0];
        var raw = result[1];
        if (success) {
            _.each($(raw).find('view').find('attributes'), function(attribute) {
                console.log("Analyzing attribute ", attribute);
            }, this);
        }
    }
});