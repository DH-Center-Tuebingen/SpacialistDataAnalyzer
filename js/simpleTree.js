// ============================================================================
;(function($){
$.fn.simpleTree = function(options, data) {
// ============================================================================
    var self = this;
    
    self._simpleTreeOptions = $.extend(true, {
        searchBox: undefined,
        searchMinInputLength: 3,
        indentSize: 25,
        childCountShow: true,
        symbols: {
            collapsed: '▶',
            expanded: '▼'
        },
        css: {
            nodeContainer: 'simpleTree-nodeContainer',
            indent: 'simpleTree-indent',
            label: 'simpleTree-label',
            childrenContainer: 'simpleTree-childrenContainer',
            selected: 'simpleTree-selected',
            childCountBadge: 'simpleTree-childCountBadge'
        }
    }, options);

    self._simpleTreeData = data;
    self._simpleTreeSelection = undefined;
    self._lastSearchTerm = '';

    // ------------------------------------------------------------------------
    self.simpleTreeGetSelection = function() {
    // ------------------------------------------------------------------------
        return self._simpleTreeSelection;
    }

    // ------------------------------------------------------------------------
    self.simpleTreeToggle = function(node) {
    // ------------------------------------------------------------------------
        node.children.forEach(child => {
            node.expanded 
            ? self._simpleTreeRemoveNode(child) 
            : self._simpleTreeRenderNode(child)
        }); 
        node.expanded = !node.expanded;
        node.domContainer
            .find('.simpleTree-toggle')
            .first()
            .text(self._simpleTreeOptions.symbols[node.expanded ? 'expanded' : 'collapsed']);
        return self;
    }

    // ------------------------------------------------------------------------
    self._simpleTreeRemoveNode = function(node) {
    // ------------------------------------------------------------------------
        if(!node.domContainer)
            return;
        node.domContainer.remove();
        node.domContainer = undefined;
        node.children.forEach(child => self._simpleTreeRemoveNode(child));
        return self;
    }

    // ------------------------------------------------------------------------
    self.simpleTreeClearSelection = function(fireEvent = true) {
    // ------------------------------------------------------------------------
        if(!self._simpleTreeSelection)
            return;
        self._simpleTreeSelection.domLabel.removeClass(self._simpleTreeOptions.css.selected);
        self._simpleTreeSelection = undefined;
        if(fireEvent)
            self.trigger('simpleTree:change', [ self._simpleTreeSelection ]);
        return self;
    }

    // ------------------------------------------------------------------------
    self.simpleTreeSelectNode = function(node, fireEvent = true) {
    // ------------------------------------------------------------------------
        if(node === self._simpleTreeSelection)
            return;
        self.simpleTreeClearSelection(false);
        node.domLabel.addClass(self._simpleTreeOptions.css.selected);
        self._simpleTreeSelection = node;
        if(fireEvent)
            self.trigger('simpleTree:change', [ self._simpleTreeSelection ]);
        return self;
    }

    // ------------------------------------------------------------------------
    self._simpleTreeNodeClicked = function(node) {
    // ------------------------------------------------------------------------
        if(node === self._simpleTreeSelection)
            self.simpleTreeClearSelection(true);
        else
            self.simpleTreeSelectNode(node);
        return self;
    }
        
    // ------------------------------------------------------------------------
    self._simpleTreeRenderNode = function(node) {
    // ------------------------------------------------------------------------
        let options = self._simpleTreeOptions;
        let div = $('<div/>').addClass(options.css.nodeContainer);
        div.append($('<div/>').addClass(options.css.indent).css({ 
            width: (node.children.length > 0 ? node.indent : (node.indent + 1)) * self._simpleTreeOptions.indentSize 
        }));
        if(node.children.length > 0) {
            div.append($('<div/>')
                .css({ width: self._simpleTreeOptions.indentSize })
                .addClass('simpleTree-toggle')
                .text(node.expanded ? options.symbols.expanded : options.symbols.collapsed)
                .on('click', () => self.simpleTreeToggle(node))
            );
        }  
        node.domLabel = $('<div/>').addClass(options.css.label).text(node.label)
            .on('click', () => self._simpleTreeNodeClicked(node));
        div.append(node.domLabel);
        if(node.children.length > 0 && options.childCountShow) {
            div.append($('<span/>')
                .addClass('badge badge-pill badge-secondary')
                .addClass(options.css.childCountBadge)
                .text(node.children.length)
            );
        }
        div.data('node', node);
        if(node.parent)
            node.parent.domChildren.append(div);
        else
            self.append(div);
        node.domContainer = div;
        if(node.children.length > 0)
            node.domChildren = $('<div/>').addClass(options.css.childrenContainer).insertAfter(div);
        if(node.expanded)
            node.children.forEach(child => self._simpleTreeRenderNode(child));
        return self;
    }

    // ------------------------------------------------------------------------
    self._simpleTreeRender = function() {
    // ------------------------------------------------------------------------
        self.empty();
        self._simpleTreeData.forEach(node => self._simpleTreeRenderNode(node));
        return self;
    }

    // ------------------------------------------------------------------------
    self.simpleTreeDoSearch = function(searchTerm) {
    // ------------------------------------------------------------------------
        if(self._lastSearchTerm === searchTerm)
            return;
        console.log('Searching for:', searchTerm);
        self.hide();
        self._lastSearchTerm = searchTerm;
        self.show();
        return self;
    }

    // ------------------------------------------------------------------------
    self._simpleTreeInstallSearch = function() {
    // ------------------------------------------------------------------------
        let box = self._simpleTreeOptions.searchBox;
        box && box.bind('keyup focus', function() {
            let v = String(box.val()).trim();
            self.simpleTreeDoSearch(
                v.length >= self._simpleTreeOptions.searchMinInputLength ? v : ''
            );
        });
        return self;
    }    

    self._simpleTreeRender();
    self._simpleTreeInstallSearch();
    return self;
// ============================================================================
}
})(jQuery);