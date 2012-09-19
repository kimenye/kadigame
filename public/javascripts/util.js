function isSomethingMeaningful(val) {
    return !_.isUndefined(val) && !_.isNull(val);
}

var Handler = JS.Class({
    construct : function(func,scope) {
        this.func = func;
        this.scope = scope;
    },

    callBack : function(params) {
        var _mthd = _.bind(this.func,this.scope,params);
        _mthd();
    }
});

