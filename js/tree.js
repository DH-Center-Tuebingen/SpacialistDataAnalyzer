(function($) {
    var _tree;
    var _this;

    // -----------------------------------------------------------------
    function initialize(tree) {
    // -----------------------------------------------------------------
        if(_tree)
            _this.empty();
        _tree = tree;
        _tree.status = {};
        _tree.internalIdSequence = 1;
        _tree.objects = {};
        _tree.objectsLegacy = {};
        return render();
    }

    // -----------------------------------------------------------------
    function getObjectByInternalId(internalId) {
    // -----------------------------------------------------------------
        return _tree.objects[internalId];
    }

    // -----------------------------------------------------------------
    function setNextInternalId(object) {
    // -----------------------------------------------------------------
        object.legacyInternalId = _tree.internalIdSequence++;
        _tree.objectsLegacy[object.legacyInternalId] = object;
        object.internalId = String(object.id);
        (function up(orig, cur) {
            if(cur.parentAttribute) {
                orig.internalId = cur.parentAttribute.id + ':' + orig.internalId;
                up(orig, cur.parentAttribute);
            }
            else if(cur.parentContextType) {
                orig.internalId = cur.parentContextType.id + ':' + orig.internalId;
                up(orig, cur.parentContextType);
            }
        })(object, object);
        _tree.objects[object.internalId] = object;
    }

    // -----------------------------------------------------------------
    function renderAttribute(attribute, parent, table, depth, insertAfter) {
    // -----------------------------------------------------------------
        if(attribute.type === 'sql') {
            // add placeholder row
            table.append($('<tr/>').addClass('placeholder').attr('data-id', attribute.id));
            return; // will be added later
        }
        if(attribute.type === 'unknown')
            return // type of computed attribute could not be determined, presumably because there are no values at all; so ignore
        attribute.parentContextType = parent.what == 'ContextType' ? parent : parent.parentContextType;
        attribute.parentAttribute = parent.what == 'Attribute' ? parent : null;
        setNextInternalId(attribute);
        attribute.treeRow = $('<tr/>').addClass('attribute').data({
            id: attribute.id,
            type: attribute.type,
            internalId: attribute.internalId,
            contextTypeInternalId: attribute.parentContextType.internalId,
            object: attribute
        });
        let nameCell = getPaddedCell(depth)
            .html($('<span class="attr-type"/>').text(AttributeTypeSymbols[attribute.type])).append(attribute.label)
            .append($('<span/>').addClass('attr-info').text(l10n.attributeTypeLabels[attribute.type]));
        attribute.treeRow.append(nameCell);
        attribute.treeRow.on('mouseover mouseout', eventMouse);
        nameCell.on('mouseover mouseout click', eventMouse);
        nameCell.data('object', attribute);
        ['out', 'flt', 'grp'].forEach(c => attribute.treeRow.append($('<td/>').addClass('tree-col col-' + c)));
        if(insertAfter)
            attribute.treeRow.insertAfter(insertAfter);
        else
            table.append(attribute.treeRow);
        attribute.children.forEach((child) => {
            renderAttribute(child, attribute, table, depth + 1,
                typeof insertAfter === 'undefined' ? insertAfter : attribute.treeRow);
        });
        if(attribute.parentContextType.treeRow.find('.show-hide-properties').first().data('collapsed') === false)
            attribute.treeRow.fadeIn();
    }

    // -----------------------------------------------------------------
    function getPaddedCell(depth) {
    // -----------------------------------------------------------------
        return $('<td/>').css('padding-left', depth * 20).addClass('name');
    }

    // -----------------------------------------------------------------
    function eventMouse(e) {
    // -----------------------------------------------------------------
        if(_tree.status.mouseEvent) {
            let target = $(this);
            _tree.status.mouseEvent({
                type: e.type,
                cell: target,
                object: target.data('object')
            });
        }
    }

    // -----------------------------------------------------------------
    function renderContextType(contextType, parent, table, depth = 0) {
    // -----------------------------------------------------------------
        contextType.parentContextType = parent;
        setNextInternalId(contextType);
        contextType.typePathToRoot = [ contextType.id ];
        let p = contextType;
        while(p = p.parentContextType)
            contextType.typePathToRoot.push(p.id);
        contextType.treeRow = $('<tr/>').addClass('context-type').data({
            id: contextType.id,
            internalId: contextType.internalId,
            depth: depth,
            object: contextType
        });
        let nameCell = getPaddedCell(depth)
            .append($('<span/>').addClass('badge badge-secondary mr-2').text(contextType.countInstances.toLocaleString()))
            .append($('<b/>').text(contextType.name.toUpperCase()));
        if(contextType.attributes.length > 0) {
            nameCell.append(
                $('<button/>').addClass('btn btn-outline-secondary btn-sm show-hide-properties ml-3').data({
                    collapsed: true,
                    contextTypeInternalId: contextType.internalId
                }).text(l10n.treeShowProperties).click(function(e) {
                    let btn = $(this);
                    let expand = btn.data('collapsed') == true;
                    let ctId = btn.data('contextTypeInternalId');
                    $('#masterTree tr.attribute').filter(function() {
                        return $(this).data('contextTypeInternalId') == ctId;
                    }).each(function () {
                        expand ? $(this).fadeIn() : $(this).fadeOut();
                    });
                    btn.data('collapsed', !expand);
                    btn.text(expand ? l10n.treeHideProperties : l10n.treeShowProperties);
                    e.stopPropagation();
                })
            )
        }
        contextType.treeRow.append(nameCell);
        contextType.treeRow.on('mouseover mouseout', eventMouse);
        nameCell.on('mouseover mouseout click', eventMouse);
        nameCell.data('object', contextType);
        ['out', 'flt', 'grp'].forEach(c => contextType.treeRow.append($('<td/>').addClass('tree-col col-' + c)));
        table.append(contextType.treeRow);
        contextType.attributes.forEach((a) => {
            renderAttribute(a, contextType, table, depth + 1);
        });
        contextType.children.forEach((child) => {
            renderContextType(child, contextType, table, depth + 1);
        });
    }

    // -----------------------------------------------------------------
    function render() {
    // -----------------------------------------------------------------
        let table = $('<table/>').attr('id', 'masterTree').append(
            $('<tr/>').addClass('master-tree-head')
                .append($('<th/>').addClass('text-left').html(l10n.treeHeadStructure))
                .append($('<th/>').text(l10n.treeHeadOutput))
                .append($('<th/>').text(l10n.treeHeadFilter))
                .append($('<th/>').text(l10n.treeHeadAggregate))
        ).append($('<tr/>').addClass('master-tree-separator'));
        _tree.forEach((contextType, index) => {
            renderContextType(contextType, null, table);
        });
        _this.append(table);
        return _this;
    }

    // -----------------------------------------------------------------
    function addComputedAttributes(computedAttributes) {
    // -----------------------------------------------------------------
        computedAttributes.forEachValue((attrId, typeInfo) => {
            // add attribute to each relevant context type
            typeInfo.contextTypes.forEach(ctId => {
                // find context type in tree and then add
                $('#masterTree tr.context-type').filter(function() {
                    return $(this).data('object').id == ctId
                }).each(function() {
                    let tr = $(this);
                    let placeholder = tr.nextAll(`tr.placeholder[data-id="${attrId}"]`).first();
                    renderAttribute(buildTreeAttributeEntry(db.attributes[attrId]),
                        tr.data('object'), null, tr.data('depth') + 1, placeholder);
                    placeholder.remove();
                });
            });
        });
    }

    // -----------------------------------------------------------------
    // tree method
    function setStatus(status) {
    // -----------------------------------------------------------------
        _tree.status = status;
    }

    // -----------------------------------------------------------------
    function invokeMethod() {
    // -----------------------------------------------------------------
        var method = arguments[0];
        if(method == 'setStatus')
            setStatus(arguments[1]);
        else if(method == 'addComputedAttributes')
            addComputedAttributes(arguments[1]);
        return this;
    }

    // -----------------------------------------------------------------
    $.fn.extend({
    // -----------------------------------------------------------------
        spacialistTree: function() {
            _this = this;
            if(arguments.length == 1 && typeof arguments[0] === 'object')
                return initialize(arguments[0]);

            else if(arguments.length >= 1 && typeof arguments[0] === 'string')
                return invokeMethod.apply(null, arguments);

            // don't know what to do here
            console.error('spacialistTree invoked with invalid arguments');
            return this;
        }
    });
})(jQuery);
