// ------------------------------------------------------------------------------------
function buildTreeAttributeEntry(attribute) {
// ------------------------------------------------------------------------------------
    let treeAttribute = {
        what: 'Attribute',
        id: attribute.id,
        label: attribute.name,
        name: attribute.name,
        type: attribute.type,
        thesaurus_root_url: attribute.thesaurus_root_url,
        text: attribute.text,
        children: []
    };
    db.attributes.forEachValue((id, attr) => {
        if(attr.parentAttribute && attr.parentAttribute.id === attribute.id)
            treeAttribute.children.push(buildTreeAttributeEntry(attr));
    });
    return treeAttribute;
}

// ------------------------------------------------------------------------------------
function buildTreeContextTypeEntry(contextType, typePathToRoot, hierarchyRelation) {
// ------------------------------------------------------------------------------------
    let treeContextType = {
        what: 'ContextType',
        id: contextType.id,
        name: contextType.name,
        children: [],
        attributes: [],
        countInstances: hierarchyRelation.count
    };
    contextType.attributes.forEach(attribute => {
        treeContextType.attributes.push(buildTreeAttributeEntry(attribute));
    });
    db.hierarchy.forEach(rel => {
        if(rel.parentTypeId == contextType.id && rel.typePathToRoot.equals([rel.childTypeId].concat(typePathToRoot))) {
            treeContextType.children.push(buildTreeContextTypeEntry(
                db.contextTypes[rel.childTypeId], rel.typePathToRoot, rel
            ));
        }
    });
    return treeContextType;
}

// ------------------------------------------------------------------------------------
function buildTree() {
// ------------------------------------------------------------------------------------
    // find root context types
    tree = [];
    db.hierarchy.forEach(rel => {
        if(rel.parentTypeId === null) {
            let contextType = db.contextTypes[rel.childTypeId];
            tree.push(buildTreeContextTypeEntry(contextType, [ contextType.id ], rel));
        }
    });
    masterTree = $('#tree').spacialistTree(tree);
}

// ------------------------------------------------------------------------------------
function resetCell(cell) {
// ------------------------------------------------------------------------------------
    cell.css({
        'background-color': 'inherit',
        cursor: 'inherit'
    });
}

// ------------------------------------------------------------------------------------
function treeMouseEvent(eventInfo) {
// ------------------------------------------------------------------------------------
    let canClick = !(analysis.curSection === 'group' || (analysis.curSection === 'filters' && eventInfo.object && eventInfo.object.what != 'Attribute'));

    switch(eventInfo.type) {
        case 'mouseover':
            if(eventInfo.cell.prop('nodeName').toLowerCase() == 'td') {
                if(canClick) {
                    eventInfo.cell.css({
                        cursor: 'pointer'
                    });
                }
            }
            else
                eventInfo.cell.css({
                    'background-color': '#ff9'
                });
            break;

        case 'mouseout':
            resetCell(eventInfo.cell);
            break;

        case 'click':
            if(!canClick)
                return;
            if(analysis.curSection == 'output')
                setAnalysisStatus({
                    curSection: 'output',
                    outputObject: eventInfo.object
                });
            else if(analysis.curSection === 'filters') {
                filterObjectSelected(eventInfo.object);
            }
            break;
    }
}

// ------------------------------------------------------------------------------------
function updateGui(update) {
// ------------------------------------------------------------------------------------

    // ------------------------------------------------------------------------------------
    if(update.outputObject) {
    // Output - first step, object selected
    // ------------------------------------------------------------------------------------
        $('.result-button').prop('disabled', true);
        // update info text
        $('#outputStart').hide();
        let div_info = $('#outputObject').empty();
        if(update.outputObject.what == 'ContextType') {
            div_info.append($('<p/>').html(l10n.get('outputSelectedEntityType', update.outputObject.name)));
            $('.outputObjectName').text(update.outputObject.name);
            let expandBtn = update.outputObject.treeRow.find('button');
            if(expandBtn.data('collapsed') === true)
                expandBtn.trigger('click');
        }
        else {
            div_info.append($('<p/>').html(l10n.get('outputSelectedProperty', 
                update.outputObject.label, 
                update.outputObject.parentAttribute ? l10n.get('outputSelectedPropertyParent', update.outputObject.parentAttribute.label) : '', update.outputObject.parentContextType.name)
            ));

        }
        // add additional options
        if(update.outputObject.what === 'Attribute') {
            let options = { '': '' };
            let displayType = update.outputObject.type;
            AttributeDisplayTypeMapping[displayType].forEach(display => {
                options[display] = "%s %s".with(Symbols[display], l10n.attributeDisplayTypeLabels[display]);
            });
            let select;
            div_info.append(
                $('<p/>').attr('id', 'outputAttributeDisplay').text(l10n.outputSelectPropertyDisplayType).append(
                    select = $('<select/>').attr('id', 'displayType').change(function(e) {
                        updateAnalysisStatus({
                            outputDisplay: {
                                type: $(this).val()
                            }
                        })
                    })
                )
            );
            let sel = '';
            options.forEach(key => {
                select.append($('<option/>').attr('value', key).text(options[key]));
                if(sel == '' && key != '')
                    sel = key;
            });
            select.val(sel).trigger('change');
        }
        else { // ContextType
            let fmt = '%s %s';
            let options = [
                { value: 'table', label: fmt.with(Symbols.table, l10n.contextTypeDisplayLabels.table) },
                { value: 'map', label: fmt.with(Symbols.map, l10n.contextTypeDisplayLabels.map) },
                { value: 'count', label: fmt.with(Symbols.count, l10n.contextTypeDisplayLabels.count) }
            ];
            div_info.append(
                $('<p/>').attr('id', 'outputContextTypeDisplay').text(l10n.outputSelectEntityDisplay).append(
                    get_select({id: 'displayType'}, { initialValue: options[0].value }, options, function() {
                        updateAnalysisStatus({
                            outputDisplay: {
                                type: $(this).val()
                            }
                        })
                    })
                )
            );
            makeSelect2($('#displayType'), { width: '300px' });
        }

        let ctName = update.outputObject.what == 'ContextType' ? update.outputObject.name : update.outputObject.parentContextType.name;
        $('<div/>').addClass('form-check').append(
            get_checkbox({ id: 'tree-analysis' }, null, true, l10n.get('outputHierarchicalAnalysis', ctName, ctName))
        ).appendTo(div_info);

        // highlight column
        $('.col-out').empty().removeClass('selected');
        update.outputObject.treeRow.find('td.col-out')
            .text(Symbols[$('#displayType').val()])
            .addClass('selected');
        fillGroupTab();
    }

    // ------------------------------------------------------------------------------------
    if(update.outputDisplay) {
    // Output - first step, object selected
    // ------------------------------------------------------------------------------------
        analysis.outputObject.treeRow.find('td.col-out').text(Symbols[update.outputDisplay.type]);
        $('#resultButtonIcon').text(Symbols[update.outputDisplay.type] + ' ');
        $('.result-button').prop('disabled', false);
    }

    if(analysis.outputObject && analysis.outputDisplay &&
        analysis.outputObject.what === 'ContextType' && analysis.outputDisplay.type === 'table')
        $('#nav-group-tab').fadeIn();
    else
        $('#nav-group-tab').fadeOut();

    updateOutputBadge();
    updateFiltersBadge();

    if(!analysis.outputObject && !analysis.outputDisplay) {
        resetOutputSelection();
    }

    renderRowIngoreSettings();
}

// ------------------------------------------------------------------------------------
function getPathToRoot(object) {
// ------------------------------------------------------------------------------------
    let curObj = (object.what == 'Attribute' ? object.parentContextType : object);
    let path = [ curObj.id ];
    while(curObj = curObj.parentContextType)
        path.push(curObj.id);
    return path;
}

// ------------------------------------------------------------------------------------
function doIgnoreTableRows() {
// ------------------------------------------------------------------------------------
    if(!analysis.outputObject)
        return false;
    return $('#discardTableRows').prop('disabled') === false &&
        $('#discardTableRows').prop('checked') === true;
}


// ------------------------------------------------------------------------------------
function getFiltersObject() {
// make sure compatible with parseAnalysis() and stringifyAnalysis()
// ------------------------------------------------------------------------------------
    try {
        let filters = [];
        let lastStandaloneIndex = -1;
        $('#filtersTable tbody tr').each(function(index, tr) {
            let row = $(tr);
            let obj = row.data('object');
            let operatorDropdown = row.data('operatorDropdown');
            if(obj) {
                if(operatorDropdown && operatorDropdown.val() == '')
                    throw l10n.errorMissingFilterOperators;
                let filter = {
                    object: obj,
                    conjunction: index == 0 ? null : row.data('conjunctionDropdown').val(),
                    transformation: row.data('transformationDropdown') ? row.data('transformationDropdown').val() : null,
                    operator: row.data('operatorDropdown') ? row.data('operatorDropdown').val() : null,
                    values: [],
                    combinedFilters: [],
                    typePathToRoot: getPathToRoot(obj)
                };
                let ctrls = row.data('valueControls');
                ctrls && ctrls.forEach(ctrl => filter.values.push(ctrl.val()));
                if(index > 0 && filter.conjunction === 'combine')
                    filters[filters.length - 1].combinedFilters.push(filter);
                else
                    filters.push(filter);
            }
        });
        return filters;
    }
    catch(e) {
        return e;
    }
}

// ------------------------------------------------------------------------------------
function getGroupingObject() {
// make sure compatible with parseAnalysis() and stringifyAnalysis()
// ------------------------------------------------------------------------------------
    try {
        let g = {
            group: [],
            aggregate: {}
        };
        $('#groupAttrs table select').each(function() {
            let box = $(this);
            let val = box.val();
            if(val === 'group')
                g.group.push(box.data('attribute').id);
            else if(val != '')
                g.aggregate[box.data('attribute').id] = box.val();
        });
        return g.group.length + g.aggregate.countProperties() === 0 ? false : g;
    }
    catch(e) {
        return e;
    }
}

// ------------------------------------------------------------------------------------
function getFilterAndOrDropdown(row) {
// ------------------------------------------------------------------------------------
    let options = [
        { value: 'and', label: 'And' },
        { value: 'or', label: 'Or' },
    ];
    let thisObj; ;
    if(row && (thisObj = row.data('object')) && thisObj.parentAttribute) {
        // check if previous row is a table attribute filter
        let prevRow = row.prev('tr');
        let prevObj;
        if(prevRow.length > 0
            && (prevObj = prevRow.data('object'))
            && prevObj.parentAttribute
            && prevObj.parentAttribute.internalId == thisObj.parentAttribute.internalId
        ) {
            options.push({
                value: 'combine',
                label: l10n.filterAndOrCombine
            });
        }
    }
    let s = get_select(null, { width: '100%' }, options);
    if(row)
        row.data('conjunctionDropdown', s);
    return s;
}

// ------------------------------------------------------------------------------------
function getFilterTransformationCell(row, object) {
// ------------------------------------------------------------------------------------
    return getFilterTransformationDropdown(row, object);
}

// ------------------------------------------------------------------------------------
function getFilterTransformationDropdown(row, object) {
// ------------------------------------------------------------------------------------
    if(!object)
        return null;

    if(!ObjectFilterTransformations[object['what']]
        || !ObjectFilterTransformations[object['what']][object['type']]
    ) {
        return null;
    }

    let options = [{
        value: '',
        label: l10n.labelNone,
        data: { type: object['type'] }
    }];
    let transformations = ObjectFilterTransformations[object['what']][object['type']];
    transformations.forEach((trans) => {
        options.push({
            value: trans,
            label: '%s %s'.with(Symbols[trans], l10n.objectFilterLabels[trans]),
            data: {
                type: transformations[trans]
            }
        });
    });
    let select = get_select(null, { row: row, allowClear: true, width: '100%' }, options, function(e) {
        let dropdown = $(this);
        let row = dropdown.data('row');
        row.find('.col-flt-value').empty();
        row.removeData('valueControls');
        row.find('.col-flt-op').empty().append(
            getFilterOperatorDropdown(row, dropdown.find('option:selected').data('type'))
        );
    });
    row.data('transformationDropdown', select);
    return select;
}

// ------------------------------------------------------------------------------------
function getThesaurusOptions(object, select) {
// ------------------------------------------------------------------------------------
    let options = db.thesaurus.getDescendants(db.attributes[object.id].thesaurusRoot);
    select.empty().append($('<option/>').attr({ value: '' }).text(''));
    options.forEach(concept => select.append(
        $('<option/>').attr({ value: concept.url }).text(concept.label)
    ));
    select.removeClass('hidden');
}

// ------------------------------------------------------------------------------------
function getFilterValueControls(row) {
// ------------------------------------------------------------------------------------
    let op = row.data('operatorDropdown');
    let obj = row.data('object');
    op = op ? op.val() : null;
    let ctrls = [];
    let select;
    switch(op) {
        case 'lower':
        case 'lower-equal':
        case 'greater':
        case 'greater-equal':
        case 'equal':
        case 'not-equal':
            // here we're certainly numeric
            ctrls.unshift(get_textbox());
            break;

        case 'equal-thesaurus':
        case 'not-equal-thesaurus':
            select = get_select(null, { width: '100%' }).addClass('hidden');
            getThesaurusOptions(obj, select);
            ctrls.unshift(select);
            break;

        case 'contain':
        case 'not-contain':
            ctrls.unshift(get_textbox());
            break;

        case 'contain-thesaurus':
        case 'not-contain-thesaurus':
            select = get_select(null, { width: '100%' }).addClass('hidden');
            getThesaurusOptions(obj, select);
            ctrls.unshift(select);
            break;
    }
    return ctrls;
}

// ------------------------------------------------------------------------------------
function getFilterOperatorCell(row, object) {
// ------------------------------------------------------------------------------------
    return getFilterOperatorDropdown(row, object.type);
}

// ------------------------------------------------------------------------------------
function getFilterOperatorDropdown(row, type) {
// ------------------------------------------------------------------------------------
    if(!ObjectFilterOperatorMapping[type])
        return null;

    let options = [];
    ObjectFilterOperatorMapping[type].forEach((op) => {
        options.push({
            value: op,
            label: '%s %s'.with(Symbols[op], l10n.objectFilterLabels[op])
        });
    });
    let select = get_select(null, {
        row: row,
        initialValue: ObjectFilterOperatorMapping[type][0],
        width: '100%'
    }, options, () => {
        let cell = row.find('.col-flt-value');
        let curControls = row.data('valueControls');
        let newControls = getFilterValueControls(row);
        // if cur and new controls are same type, we leave the value controls as is
        if(!$.isArray(curControls)
            || curControls.length !== newControls.length
            || newControls.some((ctrl, i) => !curControls[i].is(ctrl.prop('tagName')) || curControls[i].attr('type') !== ctrl.attr('type'))
        ) {
            cell.empty();
            newControls.forEach(ctrl => cell.append(ctrl));
            row.data('valueControls', newControls);
        }
    });
    row.data('operatorDropdown', select);
    return select;
}

// ------------------------------------------------------------------------------------
function removeFilter(row, adjustHighlight = true) {
// ------------------------------------------------------------------------------------
    if(adjustHighlight && row.hasClass('row-cur')) {
        let sibling = row.next('tr');
        if(!sibling)
            sibling = row.prev('tr')
        if(sibling)
            sibling.addClass('row-cur');
    }
    let obj = row.data('object');
    if(obj) removeFilterIndicator(obj);
    row.remove();
    updateFiltersBadge();
    updateRemoveFilterButtons();
    renderRowIngoreSettings();
}

// ------------------------------------------------------------------------------------
function updateRemoveFilterButtons(/*e, ui*/) {
// ------------------------------------------------------------------------------------
    let rows = [];
    $('#filtersTable tbody tr').each((index, tr) => {
        tr = $(tr);
        rows.push(tr);
        let andOrCell = tr.find('.col-flt-andor');
        if(index == 0)
            andOrCell.empty();
        else {
            if(andOrCell.find('select').length == 0)
                andOrCell.append(getFilterAndOrDropdown(tr));
            let conjBox = tr.data('conjunctionDropdown');
            if(conjBox.val() === 'combine') {
                // now if prev row has no object or object is not an attribute of the same table - reset to 'and'
                let prevObj, thisObj;
                if(!(prevObj = rows[index - 1].data('object'))
                    || !prevObj.parentAttribute
                    || !(thisObj = tr.data('object'))
                    || !thisObj.parentAttribute
                    || prevObj.parentAttribute.internalId != thisObj.parentAttribute.internalId
                ) {
                    conjBox.val('and').trigger('change');
                    conjBox.find('option[value="combine"]').remove();
                    conjBox.trigger('change');
                }
            }
            else if(conjBox.find('option[value="combine"]').length == 0) {
                // if - after drag&drop of rows 'combine' becomes possible -> add the option
                let prevObj, thisObj;
                if((prevObj = rows[index - 1].data('object'))
                    && prevObj.parentAttribute
                    && (thisObj = tr.data('object'))
                    && thisObj.parentAttribute
                    && prevObj.parentAttribute.internalId == thisObj.parentAttribute.internalId
                ) {
                    conjBox.append(
                        $('<option/>').attr('value', 'combine').text(l10n.filterAndOrCombine)
                    ).trigger('change');
                }
            }
        }

        tr.find('.col-flt-actions').empty().append(
            $('<button/>').addClass('btn btn-outline-danger btn-sm remove-filter-button').attr({
                title: l10n.filterRemoveTooltip
            }).text('🞬').click(function() {
                removeFilter($(this).parents('tr').first());
            })
        );
    });
}

// ------------------------------------------------------------------------------------
function removeFilterIndicator(object) {
// ------------------------------------------------------------------------------------
    let cell = object.treeRow.find('.col-flt');
    let ind = cell.find('.flt-count-indicator');
    if(ind.length == 0)
        return;
    let cnt = parseInt(ind.text());
    if(cnt == 1)
        cell.empty();
    else
        ind.text(cnt - 1);
}


// ------------------------------------------------------------------------------------
function addFilterIndicator(object) {
// ------------------------------------------------------------------------------------
    let cell = object.treeRow.find('.col-flt');
    let ind = cell.find('.flt-count-indicator');
    let cnt = 0;
    if(ind.length > 0)
        ind.text(parseInt(ind.text()) + 1);
    else
        cell.text('⛛').append($('<span/>').addClass('flt-count-indicator').text('1'));
}

// ------------------------------------------------------------------------------------
function escapeHtml(text) {
// ------------------------------------------------------------------------------------
    return $('<div/>').text(text).html();
}

// ------------------------------------------------------------------------------------
function getFilterObjectLabel(object) {
// ------------------------------------------------------------------------------------
    let attrName = '<b>%s</b>'.with(escapeHtml(object.label ? object.label : object.name));
    let parentAttrName = object.parentAttribute ? l10n.get('filterObjectAttrParent', object.parentAttribute.name) : '';
    let ctName = l10n.get('filterObjectAttrContextType', object.parentContextType.name);
    return attrName + escapeHtml(parentAttrName + ctName);
}

// ------------------------------------------------------------------------------------
function filterObjectSelected(object) {
// ------------------------------------------------------------------------------------
    let filtersTable = $('#filtersTable');
    let row =  filtersTable.find('tr.row-cur');
    if(row.length == 0)
        return;
    let oldObject = row.data('object');
    if(oldObject)
        oldObject.treeRow.find('.col-flt').empty();
    row.data('object', object);
    row.find('td').empty();
    row.find('.col-flt-andor').append(getFilterAndOrDropdown(row));
    row.find('.col-flt-object').html(getFilterObjectLabel(object));
    row.find('.col-flt-trans').append(getFilterTransformationCell(row, object));
    row.find('.col-flt-op').append(getFilterOperatorCell(row, object));
    addFilterIndicator(object);
    updateRemoveFilterButtons();
    updateFiltersBadge();
    renderRowIngoreSettings();
}

// ------------------------------------------------------------------------------------
function renderRowIngoreSettings() {
// ------------------------------------------------------------------------------------
    let filtersTable = $('#filtersTable');
    let tableRowSettingsContainer = $('#tableRowSettingsContainer');
    if(tableRowSettingsContainer.length === 0) {
        tableRowSettingsContainer = $('<p/>').attr('id', 'tableRowSettingsContainer').insertAfter(filtersTable).append(
            $('<div/>').addClass('form-check').append(
                get_checkbox({ id: 'discardTableRows' }, null, true, '').append($('<span/>').html(l10n.filterDiscardTableRows))
            )
        );
    }
    let disable = true;
    if(analysis.outputObject) {
        if(analysis.outputObject.what === 'ContextType') {
            $('.outputObjectName').text(analysis.outputObject.name);
            filtersTable.find('tbody tr').each(function() {
                let obj = $(this).data('object');
                if(obj && obj.what === 'Attribute' && obj.parentAttribute && obj.parentContextType.internalId === analysis.outputObject.internalId) {
                    disable = false;
                    return false;
                }
            });
        }
        else if(analysis.outputObject.parentAttribute) {
            // table attribute selected as output; enable discarding of there is a filter on the same table
            $('.outputObjectName').text(l10n.get('filterDiscardTableRowsOutputObjectNameTable', analysis.outputObject.parentAttribute.name));
            filtersTable.find('tbody tr').each(function() {
                let obj = $(this).data('object');
                if(obj && obj.what === 'Attribute' && obj.parentAttribute && obj.parentAttribute.internalId === analysis.outputObject.parentAttribute.internalId) {
                    disable = false;
                    return false;
                }
            });
        }
    }
    else {
        $('.outputObjectName').text(l10n.filterDiscardTableRowsOutputObjectNameEntity);
    }
    tableRowSettingsContainer.find('input').prop('disabled', disable);
}

// ------------------------------------------------------------------------------------
function showReloadDbModal() {
// ------------------------------------------------------------------------------------
    $('#reloadDbModal').remove();
    $('<div/>').addClass('modal').attr({
        id: 'reloadDbModal',
        role: 'dialog'
    }).append(
        $('<div/>').addClass('modal-dialog modal-md').append(
            $('<div/>').addClass('modal-content p-4')
                .append($('<h4/>').text(l10n.dbReloadModalTitle))
                .append($('<p/>').addClass('text-muted').text(
                    db.cacheTimestamp ? l10n.get('dbReloadModalTimestamp', new Date(db.cacheTimestamp).toLocaleString()) : ''
                ))
                .append($('<p/>').text(l10n.dbReloadModalInfo))
                .append($('<p/>').append(
                    get_button(l10n.dbReloadModalOK, function () {
                        $(this).prop('disabled', true);
                        reloadDb();
                    }).addClass('btn-success')
                ).append(
                    get_button(l10n.dbReloadModalCancel).addClass('btn-secondary ml-3').attr('data-dismiss', 'modal')
                ))
        )
    ).appendTo($('body')).modal({ show: true });
}

// ------------------------------------------------------------------------------------
function showTableModal() {
// ------------------------------------------------------------------------------------
    let btn = $(this);
    $('#modalTableInCell').remove();
    let div = $('<div/>').addClass('modal').attr({
        id: 'modalTableInCell',
        role: 'dialog'
    }).append(
        $('<div/>').addClass('modal-dialog modal-lg').append(
            $('<div/>').addClass('modal-content').append(
                getResultTable(btn.data('table')).div
            )
        )
    ).css('display', 'none');
    $('body').append(div);
    makeDataTable(div.find('table#result-table'), {
        iDisplayLength: 100,
        order: []
    }, [3, 5, 4]);
    div.on('shown.bs.modal', () => {
        $(window).resize(); // will auto adjust DataTables column widths
        $('#modalEntityDetails').hide();
        div.fadeIn();
    }).on('hidden.bs.modal', () => {
        $('#modalEntityDetails').fadeIn();
    }).modal({ show: true });
}

// ------------------------------------------------------------------------------------
function tryCutCellText(
    val, 
    attr = undefined
) {
// ------------------------------------------------------------------------------------
    switch(attr && attr.type) {
        case 'string':
        case 'stringf':
            return {
                show: val.substring(0, Settings.resultTable.textMaxChars),
                hide: val.substring(Settings.resultTable.textMaxChars)
            };

        case 'string-mc': {
            let chars = 0;
            let res = { show: [], hide: [] };
            val.split(Settings.mcSeparator).forEach(item => {
                if(chars > Settings.resultTable.textMaxChars)
                    res.hide.push(item);
                else {
                    res.show.push(item);
                    chars += item.length;
                } 
            });
            res.show = res.show.join(Settings.mcSeparator);
            res.hide = res.hide.length === 0 ? '' : Settings.mcSeparator + res.hide.join(Settings.mcSeparator);
            return res;
        }
        
        default:
            return {
                show: val,
                hide: ''
            };
    }
}

// ------------------------------------------------------------------------------------
function getShowMoreSpan(hiddenContent, isHtml, label) {
// ------------------------------------------------------------------------------------
    return $('<span/>').append(
        $('<a/>').attr('href', 'javascript:void(0)').text(label ? label : l10n.resultTableShowMore).addClass('font-italic').on('click', function() {
            let e = $(this).parent('span');
            e.empty();
            if(e.data('isHtml'))
                e.before(e.data('hiddenContent'));
            else
                e.before(document.createTextNode(e.data('hiddenContent')));
            e.remove();
        })
    ).data({
        hiddenContent,
        isHtml
    });
}

// ------------------------------------------------------------------------------------
function getHierarchicalPathBreadcrumbs(context) {
// ------------------------------------------------------------------------------------
    let p = $('<div/>');
    if(!context.parentContext)
        return p.append(l10n.entityDetailsHierarchyTopLevel);
    let crumbs = $('<span/>').text(context.name);
    let parent = context;
    while(parent = parent.parentContext) {
        crumbs.prepend('%s » '.with(db.getEntityDetailsLink(
            parent.id,
            '%s (%s)'.with(parent.name, parent.contextType.name),
            { 'data-navigate': true }
        )));
    }
    return p.append(crumbs);
}

// ------------------------------------------------------------------------------------
function renderEntityDetails(
    container, 
    historyPos, 
    context
) {
// ------------------------------------------------------------------------------------
    let div = $('<div/>').addClass('p-4');
    let history = container.data('history');
    if(context === undefined)
        context = history[historyPos];
    else if(history[historyPos] !== context) 
        history.splice(historyPos, 0, context);
    container.data({ historyPos, history });
    div.append(
        $('<h3>').text(context.name)
        .append($('<small/>').addClass('ml-4').text(context.contextType.name))
    ).append($('<p/>')
        .append($('<button/>')
            .addClass('btn btn-sm btn-secondary pb-0 pt-0 mr-1 pl-1')
            .attr('title', l10n.entityDetailsHistoryPrev)
            .text(Symbols.prev)
            .prop('disabled', historyPos === 0)
            .click(() => {
                renderEntityDetails(container, historyPos - 1);
            }))
        .append($('<button/>')
            .addClass('btn btn-sm btn-secondary pb-0 pt-0 mr-4 pr-1')
            .attr('title', l10n.entityDetailsHistoryNext)
            .text(Symbols.next)
            .prop('disabled', historyPos >= history.length - 1)
            .click(() => {
                renderEntityDetails(container, historyPos + 1);
            }))
        .append(db.getSpacialistLink(context.id, l10n.entityDetailsShowInSpacialist))
    );
    let tableContainer = $('<div/>').addClass('table-responsive').appendTo(div);
    let table = $('<table/>').addClass('table table-striped table-sm mb-0 mt-1').appendTo(tableContainer);
    let tbody = $('<tbody/>').appendTo(table);
    tbody.append($('<tr/>').append(
        $('<th/>').text(l10n.entityDetailsHierarchyLabel)
    ).append(
        $('<td/>').append(getHierarchicalPathBreadcrumbs(context))
    ));
    context.contextType.attributes.forEach(attr => {
        if(attr.pseudoAttributeKey === PseudoAttributes.Name)
            return;
        let value = attr.pseudoAttributeKey === PseudoAttributes.ID 
            ? context.attributes[attr.id]
            : db.getDisplayValue(context.attributes[attr.id], attr, false);
        if(value === undefined || value === null || value === '')
            return;
        let row = $('<tr/>').appendTo(tbody);
        $('<th/>').text(attr.name).appendTo(row);
        renderAttributeValue('html', value, row, attr);
    });
    if(context.childContexts.length) {
        let typeLists = {};
        context.childContexts.forEach(child => {
            let list = typeLists[child.contextType.name];
            if(!list)
                list = typeLists[child.contextType.name] = [];
            list.push(db.getEntityDetailsLink(
                child.id,
                child.name,
                { 'data-navigate': true },
                'mr-2'
            ));
        });
        typeLists.forEachValue((typeName, items) => {
            let tr = $('<tr/>').append(
                $('<th/>').text(l10n.get('entityDetailsChildEntities', typeName))
            );
            renderAttributeValue('html', { display: 'entityLinkList', value: items, overrideMaxShow: 10 }, tr);
            tbody.append(tr);
        });
    }
    container.empty().append(div);
}

// ------------------------------------------------------------------------------------
function showEntityDetails(id) {
// ------------------------------------------------------------------------------------
    let context = db.contexts[id];
    let dialog, container;
    $('#modalEntityDetails').remove();
    dialog = $('<div/>').addClass('modal').attr({
        id: 'modalEntityDetails',
        role: 'dialog'
    }).append(
        $('<div/>').addClass('modal-dialog modal-lg').append(
            container = $('<div/>').addClass('modal-content').data({
                history: []
            })
        )
    ).css('display', 'none').appendTo($('body'));
    renderEntityDetails(container, 0, context);
    dialog.modal({ show: true });
}

// ------------------------------------------------------------------------------------
function clickedShowEntityDetails(source) {
// ------------------------------------------------------------------------------------
    let link = $(source);
    if(link.attr('data-navigate') === undefined)
        showEntityDetails(parseInt(link.attr('data-contextId')));
    else {
        let container = $('#modalEntityDetails div.modal-content');
        renderEntityDetails(container, 
            container.data('historyPos') + 1, 
            db.contexts[parseInt(link.attr('data-contextId'))]
        );
    }
}

// ------------------------------------------------------------------------------------
function renderAttributeValue(
    type,   // html or data
    val, 
    tr, 
    attr = undefined // may be undefined for computed attributes
) {
// ------------------------------------------------------------------------------------
    if(val !== null && typeof val === 'object') {
        switch(val.display) {
            case 'html':
            if(type === 'html') {
                let td = $('<td/>').html(val.value);
                if(val.order !== undefined)
                    td.attr('data-order', val.order);
                tr.append(td);
                break;
            }
            else {
                return {
                    v: val.value,
                    s: val.order !== undefined ? val.order : val.value
                };
            }
            case 'entityLinkList':
                if($.isArray(val.value)) {
                    let maxShow = val.overrideMaxShow || Settings.resultTable.entityLinkListMaxItems;
                    let cut = {
                        show: val.value.slice(0, maxShow).join(''),
                        hide: val.value.slice(maxShow)
                    };
                    let hidden = '';
                    if(cut.hide.length > 0)
                        hidden = getShowMoreSpan(cut.hide.join(''), true, l10n.get('resultTableShowMoreListItems', cut.hide.length));
                    if(type === 'html') {
                        let td = $('<td/>');
                        td.html(cut.show);
                        td.append(hidden);
                        if(val.order !== undefined)
                            td.attr('data-order', val.order);
                        tr.append(td);
                        break;
                    }
                    else {
                        return {
                            v: cut.show + hidden,
                            s: val.order !== undefined ? val.order : (cut.show + hidden)
                        };
                    }
                }
            case 'table':
                let btn = $('<button/>').attr({
                    type: 'button',
                    title: l10n.resultShowTableModalTooltip
                }).addClass('btn btn-outline-dark btn-sm pb-0 pt-0').data({
                    table: val.value,
                    target: '#modalTableInCell'
                }).click(showTableModal).text('%s %s'.with(Symbols.table, l10n.resultShowTableModal));
                if(type === 'html') {
                    tr.append($('<td/>').append(btn));
                    break;
                }
                else {
                    return {
                        v: btn.html(),
                        s: val.value.body.length
                    };
                }
            default:
                if(type === 'html') {
                    tr.append($('<td/>').text('???'));
                    break;
                }
                else
                    return { v: '???', s: '???' };
        }
    }
    else {
        let cell = $('<td/>');
        if(val === null || val === undefined)
            cell/*.attr('data-order', '')*/.text('');
        else switch(typeof val) {
            case 'number': 
                cell.attr('data-order', val).text(
                    attr && attr.pseudoAttributeKey === PseudoAttributes.ID ? val : val.toLocaleString()
                ); 
                break;
            
            case 'date': 
                cell.attr('data-order', val.getTime()).text(val.toLocaleDateString()); 
                break;

            default: {
                let cut = tryCutCellText(val, attr);
                cell.text(cut.show);
                if(cut.hide)
                    cell.append(getShowMoreSpan(cut.hide, false));
                break;
            }
        }
        if(type === 'html')
            tr.append(cell);
        else
            return { v: cell.html(), s: cell.attr('data-order') ? cell.attr('data-order') : cell.text() };
    }
}

// ------------------------------------------------------------------------------------
function getResultTable(r, info, limit) {
// ------------------------------------------------------------------------------------
    if(r.head.length == 0)
        return $('<div/>').addClass('alert alert-info').text(l10n.resultsNone);
    var t = $('<table/>').attr({ id: 'result-table' }).addClass('table table-striped table-bordered table-nonfluid table-sm').data({
        contexts: r.contexts,
        resultBody: r.body,
        resultHead: r.head
    });
    let c = 0;
    let res = {
        total: r.body.length
    }
    r.body.forEach(row => {
        if(limit && ++c > limit)
            return false;
        for(let i = row.length - 1; i >= 0; i--)
            row[i] = renderAttributeValue('data', row[i], undefined, r.attrs ? r.attrs[i] : undefined);
    });
    res.div = $('<div/>').addClass('table-responsive').append(t);
    return res;
}

// ------------------------------------------------------------------------------------
function clearResultLoadingTimeout() {
// ------------------------------------------------------------------------------------
    if(window.resultLoading) {
        window.clearTimeout(window.resultLoading);
        window.resultLoading = null;
    }
}

// ------------------------------------------------------------------------------------
function setResultLoadingTimeout() {
// ------------------------------------------------------------------------------------
    clearResultLoadingTimeout();
    $('#result').text('⏳');
}

// -----------------------------------------------------------------------------
function adjustMapHeight() {
// -----------------------------------------------------------------------------
    let result_div = $('#result');
    let map_div = $('#result-map');
    if(result_div.length > 0 && map_div.length > 0) {
        let oldHeight = result_div.height();
        let newHeight = window.innerHeight - result_div.offset().top - 8;
        if(oldHeight != newHeight) {
            result_div.height(newHeight);
            map_div.data('map').invalidateSize();
        }
    }
}

// ------------------------------------------------------------------------------------
function getContextMapMarkers(contexts, geoDataProperty, withPopupTooltip) {
// ------------------------------------------------------------------------------------
    let markers = [];
    contexts.forEach(context => {
        if(context.geoData && typeof context.geoData[geoDataProperty] === 'string') {
            let marker = L.geoJson({
                type: 'Feature',
                geometry: JSON.parse(context.geoData[geoDataProperty]),
                properties: {
                    Name: context.name,
                    ID: context.id
                }
            });
            if(withPopupTooltip) {
                marker.bindPopup(context.id.toString());
                marker.bindTooltip($('<span/>').addClass('badge badge-dark map-tooltip').text(context.name)[0].outerHTML, {
                    permanent: false,
                    direction: 'top',
                    className: 'custom-tooltip',
                    offset: [0, -2]
                });
            }
            markers.push(marker);
        }
    });
    return markers;
}

// ------------------------------------------------------------------------------------
function addResultMap(contexts, result_div) {
// ------------------------------------------------------------------------------------

    function getTileLayer() {
    // -----------------------------------------------------------------------------
        let layer = L.tileLayer(
            //'https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png',
            //'https://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png',
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                maxZoom: 19,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }
        );
        layer.getAttribution = function() { return ''; };
        return layer;
    }
    let markers = getContextMapMarkers(contexts, 'geojson4326', true);
    if(markers.length === 0) {
        result_div.append(
            $('<div/>').addClass('alert alert-info').text(
                l10n.get('resultNoCoordinates', contexts.length)
            )
        );
        $('#export-geojson').prop('disabled', true);
        return;
    }
    let map_div = $('<div/>').attr('id', 'result-map').appendTo(result_div);
    let map = L.map('result-map', {
        attributionControl: false,
        zoomSnap: .2,
        zoomDelta: .5
    });
    L.control.attribution({
        prefix: '',
        position: 'bottomright'
    }).addAttribution(
        'Map &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    ).addTo(map);
    getTileLayer().addTo(map);
    // add markers
    let markers_group = L.featureGroup(markers);
    markers_group.addTo(map);
    map_div.data({
        map: map,
        featureGroup: markers_group
    });
    map.on('popupopen', function(e) {
        //let marker = e.popup._source;
        let div = e.popup.getContent();
        if(typeof div !== 'string' || !div.match(/^[0-9]+$/))
            return;
        let contextId = parseInt(div);
        let context = db.contexts[contextId];
        let table = $('<table/>').append(
            $('<tr/>').append($('<th/>').attr('colspan', 2).addClass('context-name').append($('<div/>').text(context.name)))
        );
        context.contextType.attributes.forEach(attr => {
            if(attr.pseudoAttributeKey === PseudoAttributes.Name)
                return;
            let value = context.attributes[attr.id];
            if(value === null || typeof value === 'undefined')
                return;
            let tr = $('<tr/>').append($('<th/>').text(attr.name));
            renderAttributeValue(
                'html',
                attr.pseudoAttributeKey === PseudoAttributes.ID // this is the column with the ID attribute -> make Spacialist link
                ? { display: 'html', value: db.getEntityDetailsLink(context.id), order: context.id } 
                : db.getDisplayValue(value, attr), 
                tr, attr);
            table.append(tr);
        });
        div = $('<div/>').html('<!--X-->').append(table);
        e.popup.setContent(div[0]);
    });
    L.control.fitContent({
        feature_group: markers_group,
        tooltip: l10n.resultMapFitToContentTooltip
    }).addTo(map);
    L.control.scale({
        maxWidth: 200,
        metric: true,
        imperial: false,
        updateWhenIdle: true,
        position: 'bottomright'
    }).addTo(map);
    $(window).deferredResize(adjustMapHeight);
    adjustMapHeight();
    map.fitBounds(markers_group.getBounds().pad(.05), {
        animate: true,
        duration: .5
    });
}

// ------------------------------------------------------------------------------------
function makeDataTable(table, customOptions, domColumns = [4, 4, 4]) {
// ------------------------------------------------------------------------------------
    let init_button = (foo, node) => node.removeClass('btn-secondary').addClass('btn-outline-secondary btn-sm');
    let buttons = [];
    ['excel', 'copy', 'print', 'colvis'].forEach(i => {
        buttons.push({ 
            extend: i, 
            text: '%s %s'.with(ResultTableIcons[i], l10n.resultTableButtons[i]), 
            titleAttr: l10n.resultTableButtonTooltips[i], 
            init: init_button 
        });
    });
    let options = {
        scrollX: true,
        deferRender: true,
        data: table.data('resultBody'),
        columns: table.data('resultHead').map((title, colIndex) => {
            return { 
                title,  
                data: { 
                    _: '%s.v'.with(colIndex), 
                    sort: '%s.s'.with(colIndex) 
                },
                type: 'html'
            }
        }),
        buttons,
        dom: ("<'row font-sm'<'col-sm-12 col-md-%s'l><'col-sm-12 col-md-%s'B><'col-sm-12 col-md-%s'f>>" +
           "<'row font-sm'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>" +
          + "<'row'<'col-sm-12'tr>>").with(domColumns[0], domColumns[1], domColumns[2])
    };
    if(l10n.dataTablesLocalization)
        options.language = l10n.dataTablesLocalization;
    if(typeof customOptions === 'object')
        $.extend(options, customOptions);
    return table.DataTable(options);
}

// ------------------------------------------------------------------------------------
function clearResultTableButtons() {
// ------------------------------------------------------------------------------------
    $('#result-container div.datatable-buttons').remove();
}

// ------------------------------------------------------------------------------------
function updateResult(callback) {
// ------------------------------------------------------------------------------------
    clearResultTableButtons();
    let filterObject = getFiltersObject();
    if(typeof filterObject === 'string') {
        $('#result').empty().append(
            $('<div/>').text(filterObject).addClass('alert alert-danger')
        );
        return;
    }
    let groupingObject = getGroupingObject();
    if(typeof groupingObject === 'string') {
        $('#result').empty().append(
            $('<div/>').text(groupingObject).addClass('alert alert-danger')
        );
        return;
    }
    setResultLoadingTimeout();
    $('.result-button').prop('disabled', true);
    $('#export-geojson').prop('disabled', true);
    console.log('Start query', analysis);
    setTimeout(function() {
        try {
            analysis.filters = filterObject;
            analysis.grouping = groupingObject;
            analysis.hierarchical = $('#tree-analysis').prop('checked');
            analysis.discardTableRows = doIgnoreTableRows();
            let result = db.getAnalysisResults(analysis);
            let result_div = $('#result');
            console.log(result);
            if(result.error)
                result_div.empty().append(
                    $('<div/>').html(result.error).prepend('<b>%s</b>'.with(l10n.errorHeading)).addClass('alert alert-danger')
                );
            else if(result.hasOwnProperty('result')) {
                let r = result.result;
                if(r === null)
                    r = l10n.resultNoValue;
                if(typeof r === 'number')
                    result_div.empty().append(
                        $('<div/>').addClass('alert alert-info result-number').text(r.toLocaleString())
                    );
                else if(typeof r === 'object') { // tabular result
                    $('#export-geojson').prop('disabled', ['map', 'table'].indexOf(analysis.outputDisplay.type) === -1);

                    if(analysis.outputDisplay.type === 'map') {
                        addResultMap(r, result_div.empty());
                    }
                    else {
                        const limit = Infinity;
                        let tbl = getResultTable(r, result.info, limit);

                        result_div.empty()
                        if(tbl.total > limit) {
                            result_div.append(
                                $('<p/>').addClass('alert alert-warning').text(
                                    l10n.get('resultTableLimit', limit.toLocaleString(), tbl.total.toLocaleString())
                                )
                            );
                        }
                        result_div.append(tbl.div);
                        let customOrder;
                        if(analysis.outputDisplay.type === 'distribution')
                            customOrder = { order: [[ 1, 'desc']] }; // order by second column descending
                        let table = result_div.find('table').first();
                        makeDataTable(table, customOrder, [5, 1, 6]);
                        result_div.find('div.dt-buttons').detach().appendTo('#result-heading').addClass('datatable-buttons').removeClass('btn-group dt-buttons');
                    }
                }
                else
                    result_div.empty().append(
                        $('<div/>').addClass('alert alert-info').text(r)
                    );
            }
        }
        finally {
            clearResultLoadingTimeout();
            $('.result-button').prop('disabled', false);
            if(callback)
                callback();
        }
    }, 0);
}

// ------------------------------------------------------------------------------------
function updateAnalysisStatus(update) {
// ------------------------------------------------------------------------------------
    if(update.newFilter) {
        if(!analysis.filters)
            analysis.filters = [];
        analysis.filters.push(update.newFilter);
    }
    else
        analysis = $.extend(analysis || {}, update);
    console.log('Analysis update:', update, 'Current status:', analysis);
    updateGui(update);
}

// ------------------------------------------------------------------------------------
function setAnalysisStatus(fullStatus) {
// ------------------------------------------------------------------------------------
    analysis = {};
    updateAnalysisStatus(fullStatus);
}

// ------------------------------------------------------------------------------------
function getResultButton(inPara) {
// ------------------------------------------------------------------------------------
    return get_result_button(l10n.resultButtonLabel, function() {
        updateResult();
    }, inPara).prepend($('<span/>').attr('id', 'resultButtonIcon'));
}

// ------------------------------------------------------------------------------------
function initializeOutputTab() {
// ------------------------------------------------------------------------------------
    var div = $('#output-tab');
    div.empty().append($('<p>').attr('id', 'outputStart').text(l10n.outputSelectHint));
    div.append($('<p/>').attr('id', 'outputObject'));
    masterTree.spacialistTree('setStatus', {
        mouseEvent: treeMouseEvent
    });
}

// ------------------------------------------------------------------------------------
function updateFilterRowSelectionHandler() {
// ------------------------------------------------------------------------------------
    $('#filtersTable tbody tr').click(function() {
        let tr = $(this);
        if(tr.hasClass('row-cur'))
            return;
        $('#filtersTable .row-cur').removeClass('row-cur');
        tr.addClass('row-cur');
    });
}

// ------------------------------------------------------------------------------------
function addFilterRow() {
// ------------------------------------------------------------------------------------
    let table = $('table#filtersTable');
    table.find('tr').removeClass('row-cur');
    let row = $('<tr/>').addClass('row-cur')
        .append($('<td/>').addClass('col-flt-andor').text(''))
        .append($('<td/>').addClass('col-flt-object').text('Select from tree'))
        .append($('<td/>').addClass('col-flt-trans').text(''))
        .append($('<td/>').addClass('col-flt-op').text(''))
        .append($('<td/>').addClass('col-flt-value').text(''))
        .append($('<td/>').addClass('col-flt-actions').text(''));
    table.find('tbody').append(row);
    updateFilterRowSelectionHandler();
    updateRemoveFilterButtons();
    return row;
}

// ------------------------------------------------------------------------------------
function initializeFilterTab() {
// ------------------------------------------------------------------------------------
    var div = $('#filters-tab');
    div.empty().append($('<p>').attr('id', 'filterStart').text(l10n.filterIntro));
    div.append($('<table/>')
        .attr('id', 'filtersTable')
        .addClass('table table-bordered table-nonfluid table-sm')
        .append($('<thead/>')
            .addClass('thead-light')
            .append($('<tr/>')
                .append($('<th/>').text(''))
                .append($('<th/>').text(l10n.filterTableCols.what))
                .append($('<th/>').text(l10n.filterTableCols.transformation))
                .append($('<th/>').text(l10n.filterTableCols.operator))
                .append($('<th/>').text(l10n.filterTableCols.value))
                .append($('<th/>').text(''))
            )
        )
        .append($('<tbody/>'))
    );
    $('#filtersTable tbody').sortable({
        update: updateRemoveFilterButtons
    });
    addFilterRow();
    masterTree.spacialistTree('setStatus', {
        mouseEvent: treeMouseEvent
    });
    div.append($('<p/>').append(
        get_button('%s %s'.with(Symbols.add, l10n.filterAdd), addFilterRow).addClass('btn-outline-success mr-2 btn-sm')
    ).append(
        get_button('%s %s'.with(Symbols.remove, l10n.filterRemoveAll), removeAllFilters).addClass('btn-outline-danger btn-sm').attr('id', 'removeAllFilters')
    ));
}

// ------------------------------------------------------------------------------------
function removeAllFilters() {
// ------------------------------------------------------------------------------------
    $('#filtersTable tbody tr').each(function() {
        removeFilter($(this), false);
    });
    addFilterRow();
}

// ------------------------------------------------------------------------------------
function updateOutputBadge() {
// ------------------------------------------------------------------------------------
    let badge = $('#output-badge');
    badge.text(analysis.outputObject && analysis.outputDisplay ? '✓' : '');
}

// ------------------------------------------------------------------------------------
function updateFiltersBadge() {
// ------------------------------------------------------------------------------------
    let badge = $('#filters-badge');
    let c = 0;
    $('#filtersTable tbody tr').each(function() {
        let row = $(this);
        if(row.data('object'))
            c++;
    });
    badge.text(c === 0 ? '' : c);
}

// ------------------------------------------------------------------------------------
function updateGroupBadge() {
// ------------------------------------------------------------------------------------
    let badge = $('#group-badge');
    let count = 0;
    $('#groupAttrs table select').each(function () {
        let box = $(this);
        let val = box.val();
        if(val != '')
            count++;
        !analysis.outputObject || analysis.outputObject.treeRow.nextAll('tr').each(function () {
            let row = $(this);
            if(!row.hasClass('attribute'))
                return false;
            if(row.data('id') == box.data('attribute').id) {
                row.find('td.col-grp').text(val == '' ? '' : Symbols[val]);
                return false;
            }
        });
    });
    badge.text(count === 0 ? '' : count);
}

// ------------------------------------------------------------------------------------
function initializeGroupTab() {
// ------------------------------------------------------------------------------------
    $('#nav-group-tab').hide();
    $('#group-tab').empty();
    let div_info = $('<p/>').attr('id', 'groupInfo').html(l10n.groupIntro);
    let div_attrs = $('<p/>').attr('id', 'groupAttrs');
    $('#group-tab').append(div_info).append(div_attrs);
}

// ------------------------------------------------------------------------------------
function addAttributeToGroupingTable(tbody, attr) {
// ------------------------------------------------------------------------------------
    let options = [{ value: '', label: Symbols.longdash }];
    let aggregates = AttributeGroupMapping[attr.type].slice();
    if(!aggregates) {// e.g. when a type 'unknown'
        console.warn('No group mapping for attribute type', attr.type, 'of attribute', attr);
        return;
    }
    if(PseudoAttributes.ID === attr.pseudoAttributeKey)
        aggregates.splice(0, 1, 'list-entities', 'list-links'); // no sense to group for ID so replace grouping
    else if(PseudoAttributes.Name === attr.pseudoAttributeKey)
        aggregates.splice(1, 0, 'list-entities', 'list-links'); // add after grouping
    aggregates.forEach(op => {
        options.push({
            value: op,
            label: '%s %s'.with(Symbols[op], l10n.attributeDisplayTypeLabels[op])
        });
    });
    let box = get_select({ id: 'attrGrouping' + attr.id }, { attribute: attr, allowClear: true, width: '100%' }, options, updateGroupBadge);
    let nameCell = $('<td/>').text(attr.name).append($('<span/>').addClass('attr-info').text(l10n.attributeTypeLabels[attr.type]));
    if(attr.parentAttribute)
        nameCell.css('padding-left', 20).prepend('└ ');
    tbody.append($('<tr/>').append(nameCell).append($('<td/>').append(box)));
    makeSelect2(box, {
        dropdownAutoWidth: true,
        placeholder: l10n.groupDropdownPlaceholder
    });
    if(attr.type === 'table' && $.isArray(attr.children)) {
        attr.children.forEach(a => addAttributeToGroupingTable(tbody, a));
    }
    return box;
}

// ------------------------------------------------------------------------------------
function getResetAggregatesButton() {
// ------------------------------------------------------------------------------------
    return $('<button/>').addClass('btn btn-outline-danger btn-sm pt-0 pb-0 ml-3').text('%s %s'.with(Symbols.remove, l10n.groupReset)).click(resetAggregates);
}

// ------------------------------------------------------------------------------------
function resetAggregates() {
// ------------------------------------------------------------------------------------
    $('#groupAttrs').find('table select').val('').trigger('change');
}

// ------------------------------------------------------------------------------------
function fillGroupTab(forceAndPreserve = false) {
// ------------------------------------------------------------------------------------
    if(!analysis.outputObject)
        return;
    let div_attrs = $('#groupAttrs');
    if(analysis.outputObject.what != 'ContextType') {
        updateGroupBadge();
        return;
    }
    let prevObj = div_attrs.data('outputObject');
    if(!forceAndPreserve && prevObj && prevObj.id == analysis.outputObject.id)
        return; // same same
    let restore = {};
    if(forceAndPreserve) {
        div_attrs.find('select').each((index, element) => {
            let box = $(element);
            restore[box.attr('id')] = box.val();
        });
    }
    div_attrs.empty().data('outputObject', analysis.outputObject);
    let contextType = db.contextTypes[analysis.outputObject.id];
    let table = $('<table/>').addClass('table table-striped table-bordered table-nonfluid table-sm').appendTo(div_attrs);
    table.append(
        $('<thead/>').append(
            $('<tr/>').append(
                $('<th/>').text(l10n.get('groupTableColProperty', analysis.outputObject.name))
            ).append(
                $('<th/>').text(l10n.groupTableColSelect).append(getResetAggregatesButton())
            )
        )
    );
    let tbody = $('<tbody/>').appendTo(table);
    contextType.attributes.forEachValue((id, attr) => {
        addAttributeToGroupingTable(tbody, attr);
    });
    !forceAndPreserve || div_attrs.find('select').each(function() {
        let box = $(this);
        if(restore[box.attr('id')] != '')
            box.val(restore[box.attr('id')]).trigger('change');
    });
    updateGroupBadge();
}

// ------------------------------------------------------------------------------------
function installTabChangeHandler() {
// ------------------------------------------------------------------------------------
    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        // e.target // newly activated tab
        // e.relatedTarget // previous active tab
        let curtab = $(e.target);
        updateAnalysisStatus({ curSection: curtab.data('section') });
    });
}

// ------------------------------------------------------------------------------------
function makeSelect2(box, options) {
// ------------------------------------------------------------------------------------
    let opt = {
        dropdownAutoWidth: true,
        placeholder: 'Click to select',
        width: box.data('width') ? box.data('width') : 'resolve',
        minimumResultsForSearch: 10,
        allowClear: box.data('allowClear') === true
    };
    if(options)
        $.extend(opt, options);
    box.select2(opt);
    let initialValue = box.data('initialValue');
    if(typeof initialValue !== 'undefined')
        box.val(initialValue).change();
}

// ------------------------------------------------------------------------------------
function installFullscreenToggle() {
// ------------------------------------------------------------------------------------
    $('#fullscreen-toggle').click(function() {
        if($('#tree-container').is(':visible')) {
            // make full screen
            $('#tree-container').hide();
            $('#display-container').removeClass('col-' + (12 - Settings.splitScreen.treeCols)).addClass('col-12');
            $('#analysis-container').hide();
            $('#result-container').css('height', '100%').removeClass('border-top');
        }
        else {
            // make split screen
            $('#tree-container').show();
            $('#display-container').removeClass('col-12').addClass('col-' + (12 - Settings.splitScreen.treeCols));
            $('#analysis-container').show();
            $('#result-container').css('height', (100 - Settings.splitScreen.analysisHeight) + '%').addClass('border-top');
        }
        $(window).resize(); // so the DataTable will auto adjust column widths in header and rows
        adjustMapHeight();
    });
}

// ------------------------------------------------------------------------------------
function installGeoJSONExport() {
// ------------------------------------------------------------------------------------
    $('#export-geojson').click(function() {
        let map = $('#result-map');
        if(map.length > 0) {
            createGeoJSONDownloadFile(JSON.stringify(map.data('featureGroup').toGeoJSON()), 'contexts.geojson');
            return;
        }

        let table = $('#result-table');
        if(table.length > 0) {
            let markers = getContextMapMarkers(table.data('contexts'), 'geojsonOrig', false);
            if(markers.length === 0)
                alert(l10n.resultGeoJsonNone);
            else
                createGeoJSONDownloadFile(JSON.stringify(L.featureGroup(markers).toGeoJSON()), 'contexts.geojson');
            return;
        }
    });
}

// ------------------------------------------------------------------------------------
function getTreeRowFromInternalId(internalId) {
// ------------------------------------------------------------------------------------
    let ret;
    masterTree.find('tr').each(function() {
        let tr = $(this);
        let obj = tr.data('object');
        if(obj && obj.internalId === internalId) {
            ret = tr;
            return false;
        }
    });
    return ret;
}

// ------------------------------------------------------------------------------------
function clearStatusText() {
// ------------------------------------------------------------------------------------
    setStatusText('', 0);
}

// ------------------------------------------------------------------------------------
function setStatusText(text, seconds = 5) {
// ------------------------------------------------------------------------------------
    if(window.clearStatusTimeout)
        clearTimeout(window.clearStatusTimeout);
    let span = $('<span/>').text(text).appendTo($('#status-text').empty());
    window.clearStatusTimeout = setTimeout(
        () => span.fadeOut(() => span.remove()),
        seconds * 1000
    );
}

// ------------------------------------------------------------------------------------
function parseAnalysis(jsonString, complete) {
// ------------------------------------------------------------------------------------
    let json = JSON.parse(jsonString);
    console.log(json);
    clearAnalysis();

    // construct 'analysis' object
    analysis = {
        curSection: json.curSection
    };

    if(json.outputObjectInternalId) {
        masterTree.find('tr').each(function() {
            let obj = $(this).data('object');
            if(obj && obj.internalId === json.outputObjectInternalId) {
                updateAnalysisStatus({
                    outputObject: obj
                });
                if(json.outputDisplay)
                    $('#displayType').val(json.outputDisplay.type).trigger('change');
                return false;
            }
        });
    }

    if(json.hierarchical !== undefined)
        $('#tree-analysis').prop('checked', json.hierarchical).trigger('change');

    // reconstruct filters
    $('.remove-filter-button').trigger('click');
    json.filters.forEach((filter, index) => {
        let filterRow = addFilterRow();
        let treeRow = getTreeRowFromInternalId(filter.object);
        if(!treeRow)
            return;
        filterObjectSelected(treeRow.data('object'));
        filterRow.find('.col-flt-object').trigger('click'); // activate current filter row
        if(filter.conjunction)
            filterRow.find('td.col-flt-andor select').val(filter.conjunction).trigger('change');
        if(filter.transformation) // pick transformation
            filterRow.find('td.col-flt-trans select').val(filter.transformation).trigger('change');
        if(filter.operator) // pick operator
            filterRow.find('td.col-flt-op select').val(filter.operator).trigger('change');
        let valueControls = filterRow.data('valueControls');
        !$.isArray(filter.values) || filter.values.forEach((value, index) => {
            valueControls[index].val(value).trigger('change');
        })
    });

    if(json.version < 2)
        $('#discardTableRows').prop('checked', false);
    else
        $('#discardTableRows').prop('checked', json.discardTableRows);

    // reconstruct aggregates
    if(json.grouping) {
        json.grouping.group.forEach(attrId => {
            $('select#attrGrouping' + attrId).val('group').trigger('change');
        });
        json.grouping.aggregate.forEachValue((attrId, value) => {
            $('select#attrGrouping' + attrId).val(value).trigger('change');
        });
    }

    // fetch results
    updateResult(complete);

    // go to original tab
    if($('#nav-tab a.active').data('section') !== json.curSection)
        $('#nav-tab a[data-section="' + json.curSection + '"]').tab('show');
}

// ------------------------------------------------------------------------------------
function stringifyAnalysis() {
// ------------------------------------------------------------------------------------
    let flat = {
        //version: 1
        version: 2 // analysis.discardTableRows now available; default = false
    };
    flat.dbName = spacialistInstance.db;
    flat.curSection = analysis.curSection;
    flat.outputDisplay = analysis.outputDisplay;
    if(analysis.outputObject)
        flat.outputObjectInternalId = analysis.outputObject.internalId;
    flat.filters = getFiltersObject();
    // flatten combinedFilters
    flat.filters.forEach(filter => {
        filter.combinedFilters.forEach(cf => flat.filters.push(cf));
    });
    flat.filters.forEach(filter => {
        delete filter.combinedFilters;
        filter.object = filter.object.internalId;
    });
    flat.grouping = getGroupingObject();
    flat.hierarchical = $('#tree-analysis').prop('checked');
    flat.discardTableRows = doIgnoreTableRows();
    return JSON.stringify(flat, undefined, 2);
}

// ------------------------------------------------------------------------------------
function handleAnalysisFile(e) {
// ------------------------------------------------------------------------------------
    setStatusText(l10n.statusAnalysisLoading, 1000);
    let file = e.target.files[0];
    if(e.target.files.length > 1)
        console.warn('Multiple files selected; loading only from ' + file.name)
    let reader = new FileReader();
    reader.onload = (loaded) => {
        $('#loading-progress').text(l10n.statusAnalysisReadFromFile);
        $('#loading').show().delay(100).queue(function() {
            let content = loaded.target.result;
            let q;
            try {
                q = this;
                parseAnalysis(content, () => {
                    setStatusText(l10n.statusAnalysisLoaded);
                    $.dequeue(q);
                    $('#loading').fadeOut();
                });
            }
            catch(e) {
                !q || $.dequeue(q);
                $('#loading').hide();
                alert(l10n.errorAnalysisLoadInvalid);
                clearStatusText();
            }
        });
    };
    try {
        reader.readAsText(file);
    }
    catch(e) {
        setStatusText(l10n.errorAnalysisLoadOther);
    }
    $('#analysis-file').val('');
}

// ------------------------------------------------------------------------------------
function initUi() {
// ------------------------------------------------------------------------------------
    $('#tree-container').addClass('col-' + Settings.splitScreen.treeCols);
    $('#display-container').addClass('col-' + (12 - Settings.splitScreen.treeCols));
    $('#analysis-container').css('height', Settings.splitScreen.analysisHeight + '%');
    $('#result-container').css('height', (100 - Settings.splitScreen.analysisHeight) + '%');
    $('#result-heading').prepend(getResultButton(false).addClass('mr-3'));
    $('#analysis-file').on('change', handleAnalysisFile);
    $('#load-analysis').click(function() {
        $('#analysis-file').trigger('click');
    });
    $('#save-analysis').click(() => {
        createDownloadFile(
            'application/json',
            stringifyAnalysis(),
            spacialistInstance.name.replace(/[^.\-+a-z0-9_ ]/gi, '') + '-analysis.json'
        );
        setStatusText(l10n.statusDownloadComplete);
    });
    $('#reload-db').click(showReloadDbModal);
}

// ------------------------------------------------------------------------------------
function clearAnalysis() {
// ------------------------------------------------------------------------------------
    removeAllFilters();
    resetAggregates();
    resetOutputSelection();
    clearResultTableButtons();
    $('.result-button').prop('disabled', true);
    $('#resultButtonIcon').text('');
    $('#export-geojson').prop('disabled', true);
    $('#result').empty();
    if(analysis.curSection !== 'output') {
        $('#nav-tab a').first().tab('show');
        setAnalysisStatus({curSection: 'output'});
    }
}

// ------------------------------------------------------------------------------------
function initializeAnalysisOptions() {
// ------------------------------------------------------------------------------------
    initializeOutputTab();
    initializeFilterTab();
    initializeGroupTab();
    installTabChangeHandler();
    installFullscreenToggle();
    installGeoJSONExport();
    $('#reset-all').click(clearAnalysis);
}

// ------------------------------------------------------------------------------------
function enableReloadDb(enabled) {
// ------------------------------------------------------------------------------------
    const btn = $('#reload-db');
    btn.prop('disabled', !enabled);
}

// ------------------------------------------------------------------------------------
function resetOutputSelection() {
// ------------------------------------------------------------------------------------
    $('#outputObject').empty();
    $('#outputStart').show();
    $('#masterTree .tree-col').empty();
}

// ------------------------------------------------------------------------------------
function reloadDb() {
// ------------------------------------------------------------------------------------
    enableReloadDb(false);
    db.clearCache(() => {
        location.reload(true);
    });
}

// ------------------------------------------------------------------------------------
function start() {
// ------------------------------------------------------------------------------------
    $(document).on('DOMNodeInserted', 'select', function () { makeSelect2($(this)) });
    $('#loading-progress').text(l10n.statusInitUI);
    initUi();
    updateAnalysisStatus({ curSection: 'output'});
    initializeAnalysisOptions();
    $('.result-button').prop('disabled', true);
    $('#loading').fadeOut();
}

// ------------------------------------------------------------------------------------
function localizeGUI() {
// ------------------------------------------------------------------------------------
    initL10N(l10nLang);
    $('[data-l10n],[data-tooltip]').each(function() {
        let tooltip, e = $(this);
        e.text(l10n[e.data('l10n')]);
        if(tooltip = e.data('tooltip'))
            e.attr('title', l10n[tooltip]);
    });
}

// ------------------------------------------------------------------------------------
// MAIN ENTRY POINT
$(function() {
// ------------------------------------------------------------------------------------
    localizeGUI();
    $('#loading-progress').text(l10n.statusFetchDB);
    db.init((error) => {
        if(error) {
            $('#loading-text').text(l10n.errorHeading);
            $('#loading-progress').text(error.message).append($('<div/>')
                .addClass('loading-error')
                .text(l10n.get('errorContactWithInfo', error.trace))
            );
            $('#loading').css('color', 'darkred');
            console.error('Error loading database: ' + error.trace);
            enableReloadDb(true);
            return;
        }
        buildTree();
        start();
        setStatusText(l10n.statusLoadComputedProperties, 1000);
        db.loadComputedAttributeValues((computedAttributes, error) => {
            clearStatusText();
            if(error) {
                alert(l10n.get('errorLoadComputedProperties', error.trace));
                console.error('Error loading computed attributes: ' + error.trace);
                return;
            }
            masterTree.spacialistTree('addComputedAttributes', computedAttributes);
            fillGroupTab(true);
            $('#load-analysis').prop('disabled', false); // only now we allow loading analysis
            enableReloadDb(true);
        });
    });
});
