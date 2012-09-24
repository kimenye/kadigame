window.kadi = (function(me, $, undefined){

    /**
     * Check if an item is null or empty
     *
     * @param val
     * @return {Boolean}
     */
    me.isSomethingMeaningful = function(val) {
        return !_.isUndefined(val) && !_.isNull(val);
    }

    /**
     * Centers a child element in a parent
     *
     * @param parentDimension
     * @param childDimension
     * @return {Number}
     */
    me.centerInFrame = function (parentDimension, childDimension) {
        return (parentDimension - childDimension) / 2;
    }

    /**
     * Create a span
     *
     * @param text
     * @param className
     * @param id
     * @return {Element}
     */
    me.createSpan = function(text, className, id) {
        var span = document.createElement("span");
        span.innerHTML = text;
        if (me.isSomethingMeaningful(className)) {
            span.className = className;
        }

        if (me.isSomethingMeaningful(id)) {
            span.id = id;
        }
        return span;
    }


    return me;
})(window.kadi || {}, jQuery);

//function isSomethingMeaningful(val) {
//    return !_.isUndefined(val) && !_.isNull(val);
//}


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
