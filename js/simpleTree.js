// ============================================================================
;(function($){
$.fn.simpleTree = function(options, data) {
// ============================================================================
    var self = this;

    // ------------------------------------------------------------------------
    self.simpleTreeGetSelection = function(
    ) {
    // ------------------------------------------------------------------------
        return self._simpleTreeSelection;
    }

    // ------------------------------------------------------------------------
    self.simpleTreeScrollToNode = function(
        node
    ) {
    // ------------------------------------------------------------------------
        let nt = node.domContainer.offset().top,
            nh = node.domContainer.height(),
            dt = self.offset().top,
            dh = self.height();
        
        if(nt < dt || nt + nh > dt + dh) {
            self.animate({
                scrollTop: nt - dt - dh / 2 // scroll to middle of the tree
            });
        }
    }

    // ------------------------------------------------------------------------
    self.simpleTreeToggle = function(
        node
    ) {
    // ------------------------------------------------------------------------
        if(node.expanded)
            node.domChildren.hide();
        else {
            // expand ancestor nodes if needed
            if(node.parent && !node.parent.expanded) 
                self.simpleTreeToggle(node.parent);
            if(node.domChildren.children().length > 0)
                node.domChildren.show();
            else
                node.children.forEach(child => self._simpleTreeRenderNode(child));
        }
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
        node.domContainer = node.domLabel = undefined;
        node.children.forEach(child => self._simpleTreeRemoveNode(child));
        if(node.domChildren)
            node.domChildren.hide();
        return self;
    } 

    // ------------------------------------------------------------------------
    self.simpleTreeClearSelection = function(
        fireEvent = true
    ) {
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
    self.simpleTreeSelectNode = function(
        node,
        fireEvent = true
    ) {
    // ------------------------------------------------------------------------
        if(node === self._simpleTreeSelection)
            return;
        self.simpleTreeClearSelection(false);
        // expand ancestry if needed
        /*let iterator = node;
        while(iterator = iterator.parent) {
            if(iterator.expanded)
                break;
            self.simpleTreeToggle(iterator);
        }*/
        self.simpleTreeExpandDownTo(node);
        node.domLabel.addClass(self._simpleTreeOptions.css.selected);
        self._simpleTreeSelection = node;
        if(fireEvent)
            self.trigger('simpleTree:change', [ self._simpleTreeSelection ]);
        return self;
    }

    // ------------------------------------------------------------------------
    self.simpleTreeGetNode = function(
        value
    ) {
    // ------------------------------------------------------------------------
        return self._simpleTreeNodeMap[value];
    }

    // ------------------------------------------------------------------------
    self._simpleTreeNodeClicked = function(
        node
    ) {
    // ------------------------------------------------------------------------
        if(node === self._simpleTreeSelection)
            self.simpleTreeClearSelection(true);
        else
            self.simpleTreeSelectNode(node);
        return self;
    }
        
    // ------------------------------------------------------------------------
    self._simpleTreeRenderNode = function(
        node
    ) {
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
                .addClass(options.css.childCountBadge)
                .text(node.children.length)
            );
        }
        div.data('node', node);
        if(node.parent) {
            if(!node.parent.domChildren)
                self._simpleTreeRenderNode(node.parent);
            node.parent.domChildren.append(div);
        }
        else
            self.append(div);
        node.domContainer = div;
        if(node.children.length > 0)
            node.domChildren = $('<div/>').addClass(options.css.childrenContainer).insertAfter(div);
        if(node.expanded)
            node.children.forEach(child => self._simpleTreeRenderNode(child));
        return self;
    }

    self._simpleTreeIsNodeRendered = function(
        node
    ) {
        return !!node.domContainer;
    }

    self._simpleTreeIsNodeVisible = function(
        node
    ) {
        return node.domContainer 
            && (!node.parent || self._simpleTreeIsNodeVisible(node.parent));
    }

    self._simpleTreeShowNode = function(
        node,
        renderIfNeeded = true
    ) {
        if(!self._simpleTreeIsNodeRendered(node))
            self._simpleTreeRenderNode(node);
        node.domContainer.removeClass('hidden');
        node.domChildren && node.domChildren.removeClass('hidden');
        return self;
    }

    self._simpleTreeHideNode = function(
        node,
        renderIfNeeded = true
    ) {
        if(!self._simpleTreeIsNodeRendered(node))
            self._simpleTreeRenderNode(node);
        node.domContainer.addClass('hidden');
        node.domChildren && node.domChildren.addClass('hidden');
        return self;
    }

    self._simpleTreeToggleVisibility = function(
        node,
        renderIfNeeded = true
    ) {
        return self._simpleTreeIsNodeVisible() 
            ? self._simpleTreeHideNode(node) 
            : self._simpleTreeShowNode(node, renderIfNeeded);
    }

    // ------------------------------------------------------------------------
    self._simpleTreeRender = function(
    ) {
    // ------------------------------------------------------------------------
        self.empty();
        self._simpleTreeData.forEach(node => self._simpleTreeRenderNode(node));
        return self;
    }

    // ------------------------------------------------------------------------
    self.simpleTreeExpandDownTo = function(
        node
    ) {
    // ------------------------------------------------------------------------
        if(node.parent && !node.parent.expanded)
            self.simpleTreeToggle(node.parent);
    }

    // ------------------------------------------------------------------------
    self.simpleTreeDoSearch = function(
        searchTerm
    ) {
    // ------------------------------------------------------------------------
        if(self._lastSearchTerm === searchTerm)
            return;
        console.log('Searching for:', searchTerm);
        //self.hide();
        self._lastSearchTerm = searchTerm;
        function doNodeSearch(node) {
            // first make upper label for comparison
            if(!node.upperLabel)
                node.upperLabel = node.label.toUpperCase();

            if(node.searchInfo) {
                node.searchInfo.match = searchTerm === '' || node.upperLabel.includes(searchTerm);
            }
            else {
                node.searchInfo = {
                    match: searchTerm === '' || node.upperLabel.includes(searchTerm),
                    expandedBefore: node.expanded,
                    visibleBefore: self._simpleTreeIsNodeVisible(node)
                };
            }

            // TODO: NEEDS DEBUGGING TO SEE WHAT'S WRONG FFS
            let anyChildMatches = false;
            node.children.forEach(child => {
                if(doNodeSearch(child))
                    anyChildMatches = true;
            });

            if(node.searchInfo.match) { // MATCH
                if(!self._simpleTreeIsNodeVisible(node)) {
                    self._simpleTreeShowNode(node, true);
                    self.simpleTreeExpandDownTo(node);
                }
            }
            else { // NO MATCH
                // SHOW IF DESCENDANTS MATCH
                if(node.children.length > 0 && anyChildMatches && !self._simpleTreeIsNodeVisible(node)) {
                    self._simpleTreeShowNode(node, true);
                    self.simpleTreeExpandDownTo(node);
                }
                else {
                    self._simpleTreeHideNode(node);
                }
            }
            if(node.expanded && !node.searchInfo.match && !anyChildMatches)
                self.simpleTreeToggle(node);
            return node.searchInfo.match || anyChildMatches;
        }
        function restoreNode(node) {
            if(node.searchInfo) {
                let isVisible = self._simpleTreeIsNodeVisible(node);
                if(node.searchInfo.visibleBefore && !isVisible) {
                    self._simpleTreeShowNode(node, true);
                    self.simpleTreeExpandDownTo(node);
                }
                else if(!node.searchInfo.visibleBefore && isVisible) {
                    self._simpleTreeHideNode(node);
                }
                node.children.forEach(child => restoreNode(child));
            }  
        }
        if(searchTerm === '') {
            // restore previous
            self._simpleTreeData.forEach(node => restoreNode(node));
        }
        else {
            self._simpleTreeData.forEach(node => doNodeSearch(node));
        }
        self.show();
        return self;
    }

    // ------------------------------------------------------------------------
    self._simpleTreeInstallSearch = function(
    ) {
    // ------------------------------------------------------------------------
        let box = self._simpleTreeOptions.searchBox;
        box && box.bind('keyup focus', function() {
            let v = String(box.val()).trim().toUpperCase();
            self.simpleTreeDoSearch(
                v.length >= self._simpleTreeOptions.searchMinInputLength ? v : ''
            );
        });
        return self;
    }    

    // ------------------------------------------------------------------------
    self._simpleTreeInit = function(
        options,
        data
    ) {
    // ------------------------------------------------------------------------
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
                childCountBadge: 'simpleTree-childCountBadge badge badge-pill badge-secondary'
            }
        }, options);

        self._simpleTreeNodeMap = {};
        // augment data object with essential info for processing
        (function traverseData(nodeArray, indent = 0, parent = undefined) {
            nodeArray.sort((a, b) => {
                return a.label.localeCompare(b.label);
            }).forEach((node, index) => {
                node.index = index;
                node.indent = indent;
                node.parent = parent;
                self._simpleTreeNodeMap[node.value] = node;
                traverseData(node.children, indent + 1, node);
            });
        })(data);
        self._simpleTreeData = data;
        self._simpleTreeSelection = undefined;
        self._lastSearchTerm = '';
    }

    self._simpleTreeInit(options, data);
    self._simpleTreeRender();
    self._simpleTreeInstallSearch();
    return self;
// ============================================================================
}
})(jQuery);