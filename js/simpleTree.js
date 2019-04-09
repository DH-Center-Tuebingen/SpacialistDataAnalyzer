// ============================================================================
;(function($){
$.fn.simpleTree = function(options, data) {
// ============================================================================
    var self = this;
    
    self._simpleTreeOptions = $.extend({
        indentSize: 25,
        childCountShow: true
    }, options);

    self._simpleTreeSelection = undefined;

    // ------------------------------------------------------------------------
    self.simpleTreeGetSelection = function() {
    // ------------------------------------------------------------------------
        return self._simpleTreeSelection;
    }

    // ------------------------------------------------------------------------
    self._render = function() {
    // ------------------------------------------------------------------------
        console.log('Tree data:', data);
        this.empty();
        return self;
    }

    self._render();
    return self;
// ============================================================================
}
})(jQuery);