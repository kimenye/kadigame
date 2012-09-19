var Player = JS.Class({
    construct: function(roarPlayerId,fbId,name,roarApi, syncHandler) {
        this.roarPlayerId = roarPlayerId;
        this.fbId = fbId;
        this.name = name;
        this.roarApi = roarApi;
        this.synced = false;
        this.syncHandler = syncHandler;
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
        var success = result[0];
        var raw = result[1];
        window.raw = raw;
        if (success) {
            var attributes = raw.find('attribute');

            this.xp = this._findAttributeValue(attributes, 'xp');
            this.level = this._findAttributeValue(attributes, 'level');
            this.credits = this._findAttributeValue(attributes, 'premium_currency');

            if (isSomethingMeaningful(this.syncHandler)) {
                this.syncHandler.callBack(this);
            }
        }
    },

    _findAttributeValue : function(collection, name) {
        var attr = this._findAttribute(collection, name);
        if (isSomethingMeaningful(attr)) {
            return $(attr).attr('value');
        }
    },

    _findAttribute: function(collection, name) {
        return _.detect(collection, function(item) {
            return $(item).attr('ikey') == name;
        });
    }
});