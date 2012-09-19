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


ko.bindingHandlers.fadeVisible = {
    init: function(element, valueAccessor) {
        // Initially set the element to be instantly visible/hidden depending on the value
        var value = valueAccessor();
        $(element).toggle(ko.utils.unwrapObservable(value)); // Use "unwrapObservable" so we can handle values that may or may not be observable
    },
    update: function(element, valueAccessor) {
        // Whenever the value subsequently changes, slowly fade the element in or out
        var value = valueAccessor();
        ko.utils.unwrapObservable(value) ? $(element).fadeIn("fast") : $(element).slideUp();
    }
};
