var db;
initializeDbVar();

// --------------------------------------------------------------------------------------------
function initializeDbVar() {
// --------------------------------------------------------------------------------------------
    db = {
        // --------------------------------------------------------------------------------------------
        rootContexts: {},
        rootContextTypes: {},
        contextTypes: {},
        contexts: {},
        attributes: {},
        thesaurus: {},
        pseudoAttributes: {},
        filteredContexts: {},
        attributeOverrides: [],
        that: this,
        cache: {},

        // --------------------------------------------------------------------------------------------
        _initMemberFunctions: function(
        ) {
        // --------------------------------------------------------------------------------------------

            // ----------------------------------------------------------------------------------------
            db.thesaurus.getDescendants = /*array*/ function (
                attr,
                exclude_leaf_concepts = false
            ) {
            // ----------------------------------------------------------------------------------------
                function recurseThesaurus(concept, curResult, curNesting) {
                    let childNesting = curNesting + 1;
                    concept.childConcepts.forEach(child => {
                        if(exclude_leaf_concepts && child.childConcepts.length === 0)
                            return;
                        if(attr.controllingNestingLevel === undefined) {
                            curResult.push(child);
                            if(attr.isRecursive)
                                recurseThesaurus(child, curResult, childNesting);
                        }
                        else {
                            if(childNesting > attr.controllingNestingLevel) {
                                curResult.push(child);
                                if(attr.isRecursive)
                                    recurseThesaurus(child, curResult, childNesting);
                            }
                            else {
                                recurseThesaurus(child, curResult, childNesting);
                            }
                        }
                    });
                }
                let conceptArray = [];
                if(!attr.thesaurusRoot) { // we also allow thesaurus selection for non-thesaurus attributes. so if URL does not point to a thesaurus entry, we feed all thesaurus concepts
                    db.thesaurus.forEachValue((key, concept) => {
                        if(key.startsWith('http') && typeof concept === 'object' && concept.label !== null)
                            conceptArray.push(concept);
                    });
                }
                else {
                    recurseThesaurus(db.thesaurus[attr.thesaurusRoot], conceptArray, 0);
                }
                console.log(conceptArray.length, ' thesaurus options')
                return conceptArray.sort((x, y) => (typeof x.label === 'string' ? x.label : '').localeCompare(y.label));
            }
        },

        // --------------------------------------------------------------------------------------------
        getNextAttrId: function() {
        // --------------------------------------------------------------------------------------------
            if(!this.nextAttrId) {
                this.nextAttrId = 1;
                db.attributes.forEachValue((key, attr) => {
                    if(attr.id > this.nextAttrId)
                        this.nextAttrId = attr.id;
                });
            }
            return ++this.nextAttrId;
        },

        // --------------------------------------------------------------------------------------------
        clearCache: function(callback) {
        // --------------------------------------------------------------------------------------------
            $.get('lib/DBClearCache.php', { lang: l10nLang }, callback);
        },

        // --------------------------------------------------------------------------------------------
        /* value can be:
            - undefined: by default resolves to 'recursive-non-flat'
            - 'recursive-non-flat': thesaurus picker for all recursive attributes with descendants
            - array of attribute IDs: specific attributes that will show thesaurus picker
        */
        setForceThesaurusPicker: function(value) {
        // --------------------------------------------------------------------------------------------
            if(value === undefined)
                value = 'recursive-non-flat';
            this.forceThesaurusPicker = value;
        },

        // --------------------------------------------------------------------------------------------
        // this must be invoked after the db.attributes have been loaded
        resolveForceThesaurusPicker: function() {
        // --------------------------------------------------------------------------------------------
            if(this.forceThesaurusPicker === 'recursive-non-flat') {
                // force thesaurus picker on all recursive thesaurus attributes that are not flat lists
                this.forceThesaurusPicker = [];
                this.attributes.forEachValue((attrId, attr) => {
                    if(!attr.thesaurusRoot // doesn't have an thesaurus attached
                        || !attr.isRecursive // is not defined as recursive -> flat per definition
                        || attr.controllingAttributeId // has a controlling attribute - is handled separately
                    ) { 
                        return;
                    }
                    let rootConcept = db.thesaurus[attr.thesaurusRoot];
                    if(rootConcept && rootConcept.childConcepts.some(child => child.childConcepts.length > 0))
                        this.forceThesaurusPicker.push(attr.id);
                    return;
                });
            }
        },

        // --------------------------------------------------------------------------------------------
        getForceThesaurusPicker: function() {
        // --------------------------------------------------------------------------------------------
            return this.forceThesaurusPicker || [];
        },

        // --------------------------------------------------------------------------------------------
        setAttributeOverrides: function(attributeOverrides) {
        // --------------------------------------------------------------------------------------------
            this.attributeOverrides = attributeOverrides;
        },

        // --------------------------------------------------------------------------------------------
        getAttributeOverride: function(attrId, childIndex) {
        // --------------------------------------------------------------------------------------------
            let r;
            this.attributeOverrides.some(a => {
                if(a.id === attrId && a.childIndex === childIndex) {
                    r = a.override;
                    return true;
                }
            })
            return r;
        },

        // --------------------------------------------------------------------------------------------
        _handleSqlValsResult: function (
            result,
            startTime,
            callback
        ) {
        // --------------------------------------------------------------------------------------------
            if(result.error && typeof callback === 'function') {
                callback(undefined, result);
                return;
            }
            let computedAttrTypes = {};
            db.cacheTimestamp = result.cacheTimestamp;
            result.attributeValues.forEach(row => {
                let context = db.contexts[row.contextId];
                row.values.forEachValue((attrId, val) => {
                    // determine attribute type, if some value exists at all
                    if(!computedAttrTypes[attrId] && val !== null && val !== undefined) {
                        let typeInfo;
                        switch(typeof val) {
                            case 'boolean':
                                typeInfo = { type: 'boolean' };
                                break;

                            case 'date':
                                typeInfo = { type: 'date' };
                                break;

                            case 'number':
                                typeInfo = { type: 'double' };
                                break;

                            case 'string':
                                typeInfo = { type: 'string' };
                                break;

                            case 'object':
                                typeInfo = { type: 'table', columns: {}, columnTypes: {} };
                                // now we need to find out the table columns, add new attributes for those
                                val[0].forEachValue((columnName, value) => {
                                    let attribute = {
                                        id: db.getNextAttrId(),
                                        name: columnName.startsWith('http://') && db.thesaurus[columnName] ? db.thesaurus[columnName].label : columnName,
                                        info: null,
                                        parentAttribute: db.attributes[attrId],
                                        thesaurusRoot: null,
                                        type: 'unknown'
                                    };
                                    typeInfo.columns[columnName] = attribute.id;
                                    db.attributes[attribute.id] = attribute;
                                });
                                break;
                            
                            default:
                                console.log('Unknown type of computed table cell value: ' + (typeof val));
                                break;
                        }
                        if(typeInfo)
                            computedAttrTypes[attrId] = typeInfo;
                    }
                    // if table, we need to adjust the table to fit with the synthetic attributes created for its columns
                    let typeInfo;
                    if(computedAttrTypes[attrId] && (typeInfo = computedAttrTypes[attrId]).type === 'table') {
                        let columns = typeInfo.columns;
                        let tableVal = [];
                        val.forEach(row => {
                            let tableRow = {};
                            row.forEachValue((columnName, value, columnIndex) => {
                                let colAttrId = columns[columnName];
                                
                                let attrOverride = db.getAttributeOverride(parseInt(attrId), columnIndex);
                                if(attrOverride && !typeInfo.columnTypes[columnName]) {
                                    $.extend(db.attributes[colAttrId], attrOverride);
                                    if(attrOverride.type)
                                        typeInfo.columnTypes[columnName] = attrOverride.type;
                                }

                                if((!typeInfo.columnTypes[columnName] || typeInfo.columnTypes[columnName] === 'string')
                                    && typeof value === 'string' 
                                    && value.startsWith('http://') 
                                    && typeof db.thesaurus[value] !== 'undefined'
                                ) {
                                    value = db.thesaurus[value].label;
                                }

                                if(typeInfo.columnTypes[columnName] === 'string-sc' && typeof value === 'string')
                                    tableRow[colAttrId] = { concept_url: value };
                                else
                                    tableRow[colAttrId] = value; 

                                if(!typeInfo.columnTypes[columnName] && value !== null) {
                                    switch(typeof value) {
                                        case 'boolean':
                                            db.attributes[colAttrId].type = typeInfo.columnTypes[columnName] = 'boolean';
                                            break;

                                        case 'date':
                                            db.attributes[colAttrId].type = typeInfo.columnTypes[columnName] = 'date';
                                            break;

                                        case 'number':
                                            db.attributes[colAttrId].type = typeInfo.columnTypes[columnName] = 'double';
                                            break;

                                        case 'string':
                                            db.attributes[colAttrId].type = typeInfo.columnTypes[columnName] = 'string';
                                            break;
                                    }
                                }
                            });
                            tableVal.push(tableRow);
                        });
                        val = tableVal;
                    }
                    context.attributes[attrId] = val;
                });
            });

            computedAttrTypes.forEachValue((attrId, typeInfo) => {
                let a = db.attributes[attrId];
                a.isComputed = true;
                a.type = typeInfo.type;
                a.children = [];
                if(typeInfo.columns) {
                    typeInfo.columnAttributes = [];
                    typeInfo.columns.forEachValue((columnName, attrId) => {
                        let dbAttr = db.attributes[attrId];
                        typeInfo.columnAttributes.push(dbAttr);
                        a.children.push(dbAttr);
                    });
                    delete typeInfo.columns;
                }
                typeInfo.contextTypes = [];
                db.contextTypes.forEachValue((ctId, ct) => {
                    if(ct.attributeIds.indexOf(parseInt(attrId)) >= 0)
                        typeInfo.contextTypes.push(ctId);
                });
                if(db.getForceThesaurusPicker().includes(attrId)) {
                    a.isRecursive = true;
                    a.controlChain = [ attrId ];
                    a.controllingAttributeId = null;
                }
            });

            // now we need to notify the caller to include the new attributes into the tree
            if(typeof callback === 'function')
                callback(computedAttrTypes);

            let elapsed = debugGetElapsedSeconds(startTime);
            console.log('Computed SQL attribute values loaded in', elapsed, 's');
        },

        // --------------------------------------------------------------------------------------------
        loadComputedAttributeValues: function(callback) {
        // --------------------------------------------------------------------------------------------
            console.log('Loading computed attribute values...');
            var startTime = debugStartTiming();
            let params = {};
            if(Settings.forceLiveDb)
                params.force = 'live';
            $.get('lib/DBComputedAttributesAjax.php', params, data => db._handleSqlValsResult(data, startTime, callback));
        },

        // --------------------------------------------------------------------------------------------
        isNumericSpacialistType: function(spacialistType) {
        // --------------------------------------------------------------------------------------------
            const numericTypes = ['double', 'integer', 'percentage'];
            return numericTypes.includes(spacialistType);
        },

        // --------------------------------------------------------------------------------------------
        createAncestryTables: function(
        ) {
        // --------------------------------------------------------------------------------------------
            let tableAttr = {
                id: this.getNextAttrId(),
                info: null,
                name: l10n.dbAttributeAncestry,
                parentAttribute: null,
                thesaurusRoot: null,
                type: 'table',
                children: [],
                isAncestryTable: true
            };
            EntityDetailsHiddenAttributes.push(tableAttr.id);
            let degreeCol = {
                id: this.getNextAttrId(),
                info: null,
                name: l10n.dbAttributeAncestryDegree,
                parentAttribute: tableAttr,
                thesaurusRoot: null,
                type: 'integer'
            };
            let entityCol = {
                id: this.getNextAttrId(),
                info: null,
                name: l10n.dbAttributeAncestryEntity,
                parentAttribute: tableAttr,
                thesaurusRoot: null,
                type: 'entity'
            };
            [tableAttr, degreeCol, entityCol].forEach(attr => {
                this.attributes[attr.id] = attr;
            });
            this.contextTypes.forEachValue((id, ct) => ct.attributes.push(tableAttr));
            [degreeCol, entityCol].forEach(attr => tableAttr.children.push(attr));
            this.contexts.forEachValue((id, context) => {
                if(!context.parentContext)
                    return;
                let table = [];
                let parent = context;
                let degree = 1;
                while(parent = parent.parentContext) {
                    let row = {};
                    row[degreeCol.id] = degree++;
                    row[entityCol.id] = parent.id;
                    table.push(row);
                }
                context.attributes[tableAttr.id] = table;
            });
        },

        // --------------------------------------------------------------------------------------------
        createPseudoAttributes: function(
        ) {
        // --------------------------------------------------------------------------------------------
            let pseudoInfo = [
                { name: l10n.dbAttributeGeometry, type: 'geometry', attr: PseudoAttributes.GeoData },
                { name: l10n.dbAttributeName, type: 'string', attr: PseudoAttributes.Name },
                { name: l10n.dbAttributeID, type: 'integer', attr: PseudoAttributes.ID },
            ];
            // pseudoAttributes
            this.pseudoAttributes = [];
            pseudoInfo.forEach(a => this.pseudoAttributes.push({
                id: this.getNextAttrId(),
                info: null,
                name: a.name,
                parentAttribute: null,
                thesaurusRoot: null,
                type: a.type,
                pseudoAttributeKey: a.attr
            }));
            this.pseudoAttributes.forEach(pa => {
                this.attributes[pa.id] = pa;
                this.contextTypes.forEachValue((id, ct) => ct.attributes.unshift(pa));
                this.contexts.forEachValue((id, context) => context.attributes[pa.id] = context[pa.pseudoAttributeKey]);
            });
        },

        // --------------------------------------------------------------------------------------------
        _handleAjaxResult: function (
            result,
            startTime,
            callback
        ) {
        // --------------------------------------------------------------------------------------------
            // connect objects in the in-memory DB
            if(result.error) {
                callback(result);
                return;
            }
            result.forEach(key => this[key] = result[key]);
            this.hierarchy.forEach(h => h.typePathToRoot = JSON.parse(h.typePathToRoot));
            this.contextTypes.forEachValue((id, ct) => {
                ct.contexts = {};
                ct.attributes = JSON.parse(ct.attributes);
                ct.attributeIds = [];
                for(let i = ct.attributes.length - 1; i >= 0; i--) {
                    ct.attributeIds.push(ct.attributes[i]);
                    ct.attributes[i] = this.attributes[ct.attributes[i]];
                }
            });
            this.contexts.forEachValue((id, c) => {
                c.contextType = this.contextTypes[c.contextType];
                c.contextType.contexts[id] = c;
                if(c.parentContext === null)
                    this.rootContexts[id] = c;
                else
                    c.parentContext = this.contexts[c.parentContext];
                if(c.geoData)
                    c.geoData = JSON.parse(c.geoData);
                c.attributes = {};
                c.childContexts = [];
            });
            this.contexts.forEachValue((id, c) => {
                if(c.parentContext)
                    c.parentContext.childContexts.push(c);
                c.typePathToRoot = [ c.contextType.id ];
                let p = c;
                while(p = p.parentContext)
                    c.typePathToRoot.push(p.contextType.id);
            });
            this.attributes.forEachValue((id, a) => {
                a.parentAttribute = a.parentAttribute === null ? null : this.attributes[a.parentAttribute];
                if(a.parentAttribute) {
                    if(!a.parentAttribute.children)
                        a.parentAttribute.children = [];
                    a.parentAttribute.children.push(a);
                }
                // for attributes whose thesaurusRoot relies on the selection of a controlling attribute:
                // go up the tree and find the first controllign attribute that that does not have a 
                // controlling attribute itself. this is the thesaurus root we are looking for.
                if(a.controllingAttributeId !== null) {
                    a.isRecursive = true; // need to override whatever it says, we offer the whole tree ...
                    // ... unless it is an attribute on which some other attribute depends:
                    this.attributes.forEachValue((id2, a2) => {
                        if(a2.controllingAttributeId === a.id) {
                            a.isRecursive = false;
                            return false;
                        }
                    }, true);
                    a.controllingNestingLevel = 0;
                    let controlChain = [ a.id ];
                    let ca = a;
                    while(ca = this.attributes[ca.controllingAttributeId]) {
                        a.controllingNestingLevel++;
                        controlChain.unshift(ca.id);
                        if(ca.controllingAttributeId === null) {
                            a.thesaurusRoot = ca.thesaurusRoot;
                            // make sure to store the control chain in each of the attributes in the chain
                            if(!ca.controlChain || controlChain.length > ca.controlChain.length)
                                controlChain.forEach(id => db.attributes[id].controlChain = controlChain);
                            break;
                        }
                    }
                }
            });
            this.attributeValues.forEach(av => {
                let attr = db.attributes[av.attribute];
                let value = JSON.parse(av.value);
                if(attr.type === 'string-sc' && typeof value === 'string') // make object
                    value = { concept_url: value };
                if(attr.type === 'table') {
                    // to allow displaying DataTables correctly, each column needs to have a value. In Spacialist
                    // empty values are missing the attribute altogether, so we fix this by setting these values to null
                    attr.children.forEach(columnAttr => {  // for each column
                        value.forEach(row => { // for each row
                            let cellValue = row[columnAttr.id];
                            if(cellValue === undefined) {
                                row[columnAttr.id] = null;
                            }
                            else {
                                if(columnAttr.type === 'string-sc' && typeof cellValue === 'string') {
                                    cellValue = row[columnAttr.id] = { concept_url: cellValue };
                                }
                                //>> TODO FIXME: es kann sein, dass numerische Tabellenattribute als string gespeichert werden => umwandeln!
                                // sobald das gefixed ist, das hier entfernen
                                else if(typeof cellValue === 'string' && this.isNumericSpacialistType(columnAttr.type)) {
                                    let n = Number(cellValue);
                                    if(isNaN(n)) {
                                        console.info('Unknown numeric attribute value "%s" in attribute %s of context %s; setting to undefined'.with(
                                            cellValue, cellValue.name, av.context
                                        ));
                                        row[columnAttr.id] = null;
                                    }
                                    else
                                        row[columnAttr.id] = n;
                                }
                            }
                        });
                    });
                }
                // <<
                this.contexts[av.context].attributes[av.attribute] = value;
            });
            delete this.attributeValues;
            this.thesaurus.forEachValue((url, tc) => {
                tc.parentConcepts = [];
                tc.childConcepts = [];
                if(tc.parentUrls !== null)
                    JSON.parse(tc.parentUrls).forEach(pUrl => tc.parentConcepts.push(this.thesaurus[pUrl]));
                if(tc.childUrls !== null)
                    JSON.parse(tc.childUrls).forEach(cUrl => tc.childConcepts.push(this.thesaurus[cUrl]));
                delete tc.parentUrls;
                delete tc.childUrls;
            });
            this.createPseudoAttributes();
            this.createAncestryTables();
            this.resolveForceThesaurusPicker();
            db.getForceThesaurusPicker().forEach(attrId => {
                let a = db.attributes[attrId];
                a.isRecursive = true;
                a.controlChain = [ attrId ];
                a.controllingAttributeId = null;
            });
            console.log('DB loaded in', debugGetElapsedSeconds(startTime), 's');
            this._initMemberFunctions();
            if(typeof callback === 'function')
                callback();
        },

        // --------------------------------------------------------------------------------------------
        init: function(
            callback
        ) {
        // --------------------------------------------------------------------------------------------
            this.that = this;
            console.log('Fetching database...');
            var startTime = debugStartTiming();
            let params = { lang: l10nLang };
            if(Settings.forceLiveDb)
                params.force = 'live';
            $.get('lib/DBAjax.php', params, result => db._handleAjaxResult(result, startTime, callback));
        },

        // --------------------------------------------------------------------------------------------
        traverseContextsOfType: function (contextType, pathToRoot, applyFilters, callback) {
        // --------------------------------------------------------------------------------------------
            if(this.query.hierarchical) {
                this.contexts.forEachValue((id, context) => {
                    if(applyFilters && this.filteredContexts[context.id])
                        return;
                    if(context.typePathToRoot.equals(pathToRoot)) {
                        if(false === callback(context))
                            return false;
                    }
                }, true);
            }
            else {
                contextType.contexts.forEachValue((id, context) => {
                    if(applyFilters && this.filteredContexts[context.id])
                        return;
                    if(false === callback(context))
                        return false;
                }, true);
            }
        },

        // --------------------------------------------------------------------------------------------
        tryResolveThesaurus: function (
            value,
            ifMissing = ''
        ) {
        // --------------------------------------------------------------------------------------------
            if(value && value.concept_url) {
                let label = this.getThesaurusLabel(value.concept_url, ifMissing);
                return typeof label === 'string' ? label : ''; // sometimes label is null ?!?! WTF
            }
            return value;
        },

        // --------------------------------------------------------------------------------------------
        getEntityDisplayObject: function(entityId) {
        // --------------------------------------------------------------------------------------------
            let entity = db.contexts[entityId];
            if(entity)
                return {
                    display: 'html',
                    order: entity.name,
                    value: this.getEntityDetailsLink(entity, entity.name)
                };
            return undefined;
        },

        // --------------------------------------------------------------------------------------------
        getAttributeValue: function (context, attribute, resolveThesaurus) {
        // --------------------------------------------------------------------------------------------
            if(attribute.parentAttribute) {
                let parentVal = context.attributes[attribute.parentAttribute.id];
                if(typeof parentVal === 'undefined')
                    return undefined;
                switch(attribute.parentAttribute.type) {
                    case 'table': // we need to make sure to return every row!!!
                        let vals = [];
                        parentVal.forEach(row => {
                            let val = row[attribute.id];
                            vals.push(resolveThesaurus ? 
                                this.tryResolveThesaurus(val) 
                                : val
                            );
                        });
                        return vals;

                    default:
                        throw l10n.errorUnknownParentAttributeType;
                }
            }
            else {
                return resolveThesaurus ? 
                    this.tryResolveThesaurus(context.attributes[attribute.id])
                    : context.attributes[attribute.id];
            }
        },

        // --------------------------------------------------------------------------------------------
        getValueDistributionForAttribute: function (attribute) {
        // --------------------------------------------------------------------------------------------
            let distr = {};
            db.traverseContextsOfType(
                db.contextTypes[attribute.parentContextType.id],
                attribute.parentContextType.typePathToRoot,
                true,
                context => {
                    let values = this.getAttributeValue(context, attribute, true);
                    if(typeof values === 'undefined')
                        return;
                    if(!$.isArray(values))
                        values = [ values ];
                    values.forEach((val, index) => {
                        if(attribute.parentAttribute && !this.isRelevantTableRow(context, attribute.parentAttribute, index))
                            return;
                        if(val !== null) {
                            if(['string-mc', 'string-sc'].indexOf(attribute.type) >= 0) {
                                if(typeof val === 'object' && typeof val.concept_url !== 'undefined')
                                    val = val.concept_url;
                                let thVal = db.thesaurus[val];
                                if(thVal)
                                    val = thVal.label;
                            }
                            else
                                val = db.getDisplayValue(val, attribute, false);
                        }
                        if(typeof distr[val] === 'undefined')
                            distr[val] = 1;
                        else
                            distr[val]++;
                    });
                }
            );
            let result = {
                head: [attribute.name, l10n.resultTableHeadCount],
                body: []
            };
            if(this.isNumericSpacialistType(attribute.type))
                distr.forEachValue((v, c) => {
                    // Object keys are always stored as strings in JS, even though they were originally nubmers.
                    // For correct formatting of the value in the GUI, we need to convert the value back to a number
                    let num = Number(v);
                    result.body.push([v === null || v === undefined || isNaN(num) ? null : num, c]);
                });
            else if(attribute.type === 'entity')
                distr.forEachValue((v, c) => {
                    if(!v)
                        result.body.push([v, c]);
                    else {
                        let displayObj = db.getEntityDisplayObject(v);
                        if(displayObj)
                            result.body.push([ displayObj, c ]);
                    }
                });
            else
                distr.forEachValue((v, c) => result.body.push([v, c]));
            return result;
        },

        // --------------------------------------------------------------------------------------------
        getDescriptiveStatsForAttribute: function (attribute) {
        // --------------------------------------------------------------------------------------------
            let sum = 0;
            let cnt = 0;
            let min;
            let max;
            db.traverseContextsOfType(
                db.contextTypes[attribute.parentContextType.id],
                attribute.parentContextType.typePathToRoot,
                true,
                context => {
                    let values = this.getAttributeValue(context, attribute, true);
                    if(typeof values === 'undefined' || values === null)
                        return;
                    if(attribute.type === 'table') {
                        // only count
                        cnt++;
                        return;
                    }
                    if(!$.isArray(values))
                        values = [ values ];
                    values.forEach((val, index) => {
                        if(attribute.parentAttribute && !this.isRelevantTableRow(context, attribute.parentAttribute, index))
                            return;
                        cnt++;
                        if(typeof val === 'number')
                            sum += val;
                        if(typeof val === 'number'
                            || attribute.type === 'date' // comes as a string "YYYY-MM-DD", so can be compared with > and <
                        ) {
                            if(typeof min === 'undefined' || val < min)
                                min = val;
                            if(typeof max === 'undefined' || val > max)
                                max = val;
                        }
                    });
                }
            );
            return {
                min: min,
                max: max,
                count: cnt,
                sum: sum,
                avg: cnt > 0 ? sum * 1. / cnt : undefined
            };
        },

        // --------------------------------------------------------------------------------------------
        getContextTypeCount: function(
            contextType
        ) {
        // --------------------------------------------------------------------------------------------
            let cnt = 0;
            db.traverseContextsOfType(
                db.contextTypes[contextType.id],
                contextType.typePathToRoot,
                true,
                () => cnt++
            );
            return cnt;
        },

        // --------------------------------------------------------------------------------------------
        getDisplayValue: function(
            rawValue, attribute, rawNumbers = true, asString = true
        ) {
        // --------------------------------------------------------------------------------------------
            let val = rawValue;
            if(typeof val === 'undefined' || val === null)
                return null;

            switch(attribute.type) {
                case 'double':
                case 'integer':
                case 'percentage':
                    return rawNumbers ? val : val.toLocaleString();

                case 'date':
                    return asString ? val.toLocaleString() : val;

                case 'boolean':
                    return asString ? (val ? '🗹' : '☐') : val;

                case 'string-sc':
                    return this.tryResolveThesaurus(val);

                case 'string-mc':
                    let mc = [];
                    val.forEach(url => {
                        if(url !== null && typeof url === 'object' && url.concept_url)
                            url = url.concept_url;
                        let th = db.thesaurus[url];
                        mc.push(th ? th.label : url);
                    });
                    return asString ? mc.join(Settings.mcSeparator) : mc;

                case 'list':
                    if(!$.isArray(val))
                        return val;
                    let list = [];
                    val.forEach(s => list.push(s));
                    return asString ? list.join(Settings.mcSeparator) : list;

                case 'entity':
                    return val;

                case 'epoch':
                case 'timeperiod':
                    if(val && !asString) {
                        return {
                            start: db.getEpochStart(val),
                            end: db.getEpochEnd(val),
                            epoch: val.epoch ? db.getThesaurusLabel(val.epoch.concept_url, val.epoch.concept_url) : undefined
                        };
                    }
                    if(typeof val === 'object') {
                        let disp = '';
                        if(val.start !== undefined && val.start !== null)
                            disp = '%s %s'.with(val.start, val.startLabel ? val.startLabel.toUpperCase() : '');
                        if(val.end !== undefined && val.end !== null)
                            disp += ' ‒ %s %s'.with(val.end, val.endLabel ? val.endLabel.toUpperCase() : '');
                        if(val.epoch && typeof val.epoch === 'object' && val.epoch.concept_url) {
                            if(disp.length > 0)
                                disp += Settings.epochSeparator;
                            disp += db.getThesaurusLabel(val.epoch.concept_url, val.epoch.concept_url);
                        }
                        val = disp.trim();
                    }
                    return val;

                case 'dimension':
                    if(val && !asString) {
                        return {
                            b: val.B,
                            h: val.H,
                            d: val.T,
                            unit: val.unit
                        };
                    }
                    if(typeof val === 'object') {
                        let disp = [];
                        ['B', 'H', 'T'].forEach(dim => {
                            if(typeof val[dim] !== 'undefined')
                                disp.push('%s: %s %s'.with(
                                    dim, val[dim], val.unit ? val.unit : ''
                                ).trim())
                        });
                        val = disp.join(Settings.dimensionSeparator);
                    }
                    return val;

                case 'geometry':
                    if(!asString)
                        return val.wkt ? val.wkt : null;
                    if(val.wkt.length > 40)
                        val = val.wkt.trim().replace(/^([a-zA-Z]+)\(.+\)$/, '$1 (⋯)');
                    else
                        val = val.wkt.trim().replace(/^([a-zA-Z]+)\((.+)\)$/, '$1 ($2)');
                    return val.charAt(0).toUpperCase() + val.substr(1).toLowerCase();

                case 'table':
                    let table = {
                        head: [],
                        body: [],
                        attrs: [],
                        sortTypes: []
                    };
                    let colAttrs = {}; // for quicker access than via db.attributes
                    let i = 0;
                    val.forEach(row => {
                        let tblRow = [];
                        row.forEachValue((c, v) => {
                            let attr;
                            if(i == 0) {
                                attr = colAttrs[c] = db.attributes[c];
                                table.head.push(attr ? attr.name : c);
                                table.attrs.push(attr);
                                table.sortTypes.push(attr ? db.getSortTypeFromAttr(attr) : undefined);
                            }
                            else
                                attr = colAttrs[c];
                            tblRow.push(this.getDisplayValue(v, attr, true, asString));
                        });
                        table.body.push(tblRow);
                        i++;
                    });
                    if(!asString)
                        return table.body;
                    if(i > 0) {
                        val = {
                            display: 'table',
                            value: table
                        };
                    }
                    break;
            }
            return val;
        },

        // --------------------------------------------------------------------------------------------
        getListOfResultContexts: function(
            contextType
        ) {
        // --------------------------------------------------------------------------------------------
            let r = [];
            db.traverseContextsOfType(this.contextTypes[contextType.id], contextType.typePathToRoot, true, context => {
                r.push(context);
            });
            return r;
        },

        // --------------------------------------------------------------------------------------------
        getSpacialistLink: function(
            context,
            label,
            customClasses = ''
        ) {
        // --------------------------------------------------------------------------------------------
            let link;
            if(window.opener && window.opener.Vue) { // select entity in Spacialist
                link = $('<a/>').attr({
                    href: 'javascript:void(0)',
                    onclick: "window.opener.location='%s/%s/s/#/e/%s'".with(spacialistInstance.webRoot, spacialistInstance.folder, context.id),
                    title: l10n.dbSpacialistLinkTitle.with(context.contextType.name),
                });
            }
            else {
                link = $('<a/>').attr({
                    target: '_spacialist',
                    href: '%s/%s/s/#/e/%s'.with(spacialistInstance.webRoot, spacialistInstance.folder, context.id),
                    title: l10n.dbSpacialistLinkTitle.with(context.contextType.name),
                });
            }
            return (link.addClass('btn btn-sm btn-outline-dark pb-0 pt-0 ' + customClasses).text(
                '%s %s'.with(Symbols['entity-spacialist'], label === undefined? context.id : label).trim()
            ))[0].outerHTML;
        },

        // --------------------------------------------------------------------------------------------
        getEntityDetailsLink: function(
            context,
            label,
            customAttrs,
            customClasses = ''
        ) {
        // --------------------------------------------------------------------------------------------
            let xinfo = DataTableElementInfos.add({ ctxid: context.id }, 'clickedShowEntityDetails');
            let attrs = {
                href: 'javascript:void(0)',
                title: l10n.dbEntityDetailsTitle.with(context.contextType.name),
                'data-xinfo': xinfo,
                'data-ctxid': context.id
            };
            if(customAttrs)
                $.extend(attrs, customAttrs);
            return ($('<a/>').attr(attrs).addClass('xinfo btn btn-sm btn-outline-dark pb-0 pt-0 ' + customClasses).text(
                '%s %s'.with(Symbols['entity'], label === undefined? context.id : label).trim()
            ))[0].outerHTML;
        },

        // --------------------------------------------------------------------------------------------
        getSortTypeFromAttr: function(
            attr
        ) {
        // --------------------------------------------------------------------------------------------
            switch(attr.type) {
                case 'table': // sorts by number of table rows
                case 'double':
                case 'integer':
                case 'percentage':
                case 'date':
                    return 'num';

                default:
                    return 'string';
            }
        },

        // --------------------------------------------------------------------------------------------
        getTableOfContexts: function(
            contextType
        ) {
        // --------------------------------------------------------------------------------------------
            let r = {
                head: [],
                body: [],
                attrs: [],
                sortTypes: [],
                contexts: [],
                grandTotal: 0
            };
            let ct = this.contextTypes[contextType.id];
            ct.attributes.forEach(attr => {
                r.head.push(attr.name);
                r.attrs.push(attr);
                r.sortTypes.push(db.getSortTypeFromAttr(attr));
            });
            let count = 0;
            db.traverseContextsOfType(ct, contextType.typePathToRoot, true, context => {
                if(++count <= Settings.resultTable.maxRows) {
                    let row = [];
                    r.attrs.forEach(attr => row.push(
                        attr.pseudoAttributeKey === PseudoAttributes.ID // this is the column with the ID attribute -> make Spacialist link
                        ? { display: 'html', value: this.getEntityDetailsLink(context), order: context.id }
                        : this.getDisplayValue(context.attributes[attr.id], attr)
                    ));
                    r.body.push(row);
                    r.contexts.push(context);
                }
                r.grandTotal++;
            });
            return r;
        },

        // --------------------------------------------------------------------------------------------
        getEpochStart: function(
            epochObj
        ) {
        // --------------------------------------------------------------------------------------------
            if(!epochObj || epochObj.start === undefined || epochObj.start === null)
                return undefined;
            return db.epochIsBC(epochObj, 'start') ? -epochObj.start : epochObj.start;
        },

        // --------------------------------------------------------------------------------------------
        getEpochEnd: function(
            epochObj
        ) {
        // --------------------------------------------------------------------------------------------
            if(!epochObj || epochObj.end === undefined || epochObj.end === null)
                return undefined;
            return db.epochIsBC(epochObj, 'end') ? -epochObj.end : epochObj.end;
        },

        // --------------------------------------------------------------------------------------------
        epochIsBC: function(
            epoch,
            startEnd // 'start' or 'end'
        ) {
        // --------------------------------------------------------------------------------------------
            let lbl, key = startEnd + 'Label';
            return epoch && typeof (lbl = epoch[key]) === 'string' && lbl.toLowerCase() === 'bc';
        },

        // --------------------------------------------------------------------------------------------
        updateAggregateColumnValue: function(
            context,
            attribute,
            attrVal,
            aggregateType,
            currentValue,
            aggregateInfo
        ) {
        // --------------------------------------------------------------------------------------------
            if(attrVal === null || attrVal === undefined)
                return aggregateType === 'count' ? aggregateInfo.count : currentValue;

            if(attribute.type === 'table' && this.query.discardTableRows) {
                let isRelevantTable = attrVal.some((row, index) => {
                    return this.isRelevantTableRow(context, attribute, index);
                });
                if(!isRelevantTable)
                    return currentValue;
            }
            aggregateInfo.count++;
            if(aggregateInfo.sum === undefined)
                aggregateInfo.sum = 0;
            if(typeof attrVal === 'number')
                aggregateInfo.sum += attrVal;

            if(currentValue === null)
                currentValue = undefined;

            switch(aggregateType) {
                case 'avg': // double
                    return aggregateInfo.sum === undefined || aggregateInfo.count === 0 ? undefined : 1. * aggregateInfo.sum / aggregateInfo.count;

                case 'count': // all types
                    return aggregateInfo.count;

                case 'list-links': {
                    if(!$.isArray(currentValue))
                        currentValue = [];
                    let label = context.attributes[attribute.id];
                    currentValue.push({ label, html: db.getSpacialistLink(context, label, 'mr-2') });
                    return currentValue;
                }

                case 'list-entities': {
                    if(!$.isArray(currentValue))
                        currentValue = [];
                    let label = context.attributes[attribute.id];
                    currentValue.push({ label, html: db.getEntityDetailsLink(context, label, undefined, 'mr-2') });
                    return currentValue;
                }

                case 'min': // double, date
                    return currentValue === undefined || attrVal < currentValue ? attrVal : currentValue;

                case 'max': // double, date
                    return currentValue === undefined || attrVal > currentValue ? attrVal : currentValue;

                case 'sum': // double
                    return aggregateInfo.sum;

                case 'count-true': // boolean
                    if(currentValue === undefined)
                        currentValue = 0;
                    return attrVal === true ? ++currentValue : currentValue;

                case 'count-false': // boolean
                    if(currentValue === undefined)
                        currentValue = 0;
                    return attrVal === false ? ++currentValue : currentValue;

                case 'count-rows-total': // table
                    if(currentValue === undefined)
                        currentValue = 0;
                    return $.isArray(attrVal) ? currentValue + attrVal.length : currentValue;

                case 'count-rows-avg': // table
                    return 1. * (aggregateInfo.sum += attrVal.length) / aggregateInfo.count;

                case 'sum-area': // geometry
                    return aggregateInfo.sum += attrVal.area;

                case 'avg-area': // geometry
                    return 1. * (aggregateInfo.sum += attrVal.area) / aggregateInfo.count;

                case 'min-area': // geometry
                    return currentValue === undefined || attrVal.area < currentValue ? attrVal.area : currentValue;

                case 'max-area': // geometry
                    return currentValue === undefined || attrVal.area > currentValue ? attrVal.area : currentValue;

                case 'min-start': { // epoch
                    let start = this.getEpochStart(attrVal);
                    if(start === undefined)
                        return currentValue;
                    return currentValue === undefined || start < currentValue ? start : currentValue;
                }

                case 'max-start': { // epoch
                    let start = this.getEpochStart(attrVal);
                    if(start === undefined)
                        return currentValue;
                    return currentValue === undefined || start > currentValue ? start : currentValue;
                }

                case 'avg-start': // epoch
                    if(typeof attrVal.start !== 'number') {
                        aggregateInfo.count--;
                        return currentValue;
                    }
                    return 1. * (aggregateInfo.sum += this.getEpochStart(attrVal)) / aggregateInfo.count;

                case 'min-end': { // epoch
                    let end = this.getEpochEnd(attrVal);
                    if(end === undefined)
                        return currentValue;
                    return currentValue === undefined || end < currentValue ? end : currentValue;
                }

                case 'max-end': { // epoch
                    let end = this.getEpochEnd(attrVal);
                    if(end === undefined)
                        return currentValue;
                    return currentValue === undefined || end > currentValue ? end : currentValue;
                }

                case 'avg-end':// epoch
                    if(typeof attrVal.end !== 'number') {
                        aggregateInfo.count--;
                        return currentValue;
                    }
                    return 1. * (aggregateInfo.sum += this.getEpochEnd(attrVal)) / aggregateInfo.count;

                case 'min-span': { // epoch
                    let start = this.getEpochStart(attrVal);
                    let end = this.getEpochEnd(attrVal);
                    if(start === undefined || end === undefined)
                        return currentValue;
                    return currentValue === undefined || (end - start) < currentValue ? (end - start) : currentValue;
                }

                case 'max-span': { // epoch
                    let start = this.getEpochStart(attrVal);
                    let end = this.getEpochEnd(attrVal);
                    if(start === undefined || end === undefined)
                        return currentValue;
                    return currentValue === undefined || (end - start) > currentValue ? (end - start) : currentValue;
                }

                case 'avg-span':// epoch
                    if(typeof attrVal.end !== 'number' || typeof attrVal.start !== 'number') {
                        aggregateInfo.count--;
                        return currentValue;
                    }
                    return 1. * (aggregateInfo.sum += (this.getEpochEnd(attrVal) - this.getEpochStart(attrVal))) / aggregateInfo.count;

                case 'avg-b': // dimension
                    if(typeof attrVal.B !== 'number') {
                        aggregateInfo.count--;
                        return currentValue;
                    }
                    return 1. * (aggregateInfo.sum += attrVal.B) / aggregateInfo.count;
                case 'avg-h': // dimension
                    if(typeof attrVal.H !== 'number') {
                        aggregateInfo.count--;
                        return currentValue;
                    }
                    return 1. * (aggregateInfo.sum += attrVal.H) / aggregateInfo.count;
                case 'avg-t': // dimension
                    if(typeof attrVal.T !== 'number') {
                        aggregateInfo.count--;
                        return currentValue;
                    }
                    return 1. * (aggregateInfo.sum += attrVal.T) / aggregateInfo.count;
                case 'max-b': // dimension
                    return typeof attrVal.B === 'number' && (currentValue === undefined || attrVal.B > currentValue) ? attrVal.B : currentValue;
                case 'max-h': // dimension
                    return typeof attrVal.H === 'number' && (currentValue === undefined || attrVal.H > currentValue) ? attrVal.H : currentValue;
                case 'max-t': // dimension
                    return typeof attrVal.T === 'number' && (currentValue === undefined || attrVal.T > currentValue) ? attrVal.T : currentValue;
                case 'min-b': // dimension
                    return typeof attrVal.B === 'number' && (currentValue === undefined || attrVal.B < currentValue) ? attrVal.B : currentValue;
                case 'min-h': // dimension
                    return typeof attrVal.H === 'number' && (currentValue === undefined || attrVal.H < currentValue) ? attrVal.H : currentValue;
                case 'min-t': // dimension
                    return typeof attrVal.T === 'number' && (currentValue === undefined || attrVal.T < currentValue) ? attrVal.T : currentValue;
                case 'min-bh': // dimension
                    return typeof attrVal.B === 'number' && typeof attrVal.H === 'number' && (currentValue === undefined || attrVal.B * attrVal.H < currentValue) ? attrVal.B * attrVal.H : currentValue;
                case 'max-bh': // dimension
                    return typeof attrVal.B === 'number' && typeof attrVal.H === 'number' && (currentValue === undefined || attrVal.B * attrVal.H > currentValue) ? attrVal.B * attrVal.H : currentValue;
                case 'avg-bh': // dimension
                    if(typeof attrVal.B !== 'number' || typeof attrVal.H !== 'number') {
                        aggregateInfo.count--;
                        return currentValue;
                    }
                    return 1. * (aggregateInfo.sum += attrVal.B * attrVal.H) / aggregateInfo.count;
                case 'min-bt': // dimension
                    return typeof attrVal.B === 'number' && typeof attrVal.T === 'number' && (currentValue === undefined || attrVal.B * attrVal.T < currentValue) ? attrVal.B * attrVal.T : currentValue;
                case 'max-bt': // dimension
                    return typeof attrVal.B === 'number' && typeof attrVal.T === 'number' && (currentValue === undefined || attrVal.B * attrVal.T > currentValue) ? attrVal.B * attrVal.T : currentValue;
                case 'avg-bt': // dimension
                    if(typeof attrVal.B !== 'number' || typeof attrVal.T !== 'number') {
                        aggregateInfo.count--;
                        return currentValue;
                    }
                    return 1. * (aggregateInfo.sum += attrVal.B * attrVal.T) / aggregateInfo.count;
                case 'min-ht': // dimension
                    return typeof attrVal.H === 'number' && typeof attrVal.T === 'number' && (currentValue === undefined || attrVal.H * attrVal.T < currentValue) ? attrVal.H * attrVal.T : currentValue;
                case 'max-ht': // dimension
                    return typeof attrVal.H === 'number' && typeof attrVal.T === 'number' && (currentValue === undefined || attrVal.H * attrVal.T > currentValue) ? attrVal.H * attrVal.T : currentValue;
                case 'avg-ht': // dimension
                    if(typeof attrVal.H !== 'number' || typeof attrVal.T !== 'number') {
                        aggregateInfo.count--;
                        return currentValue;
                    }
                    return 1. * (aggregateInfo.sum += attrVal.H * attrVal.T) / aggregateInfo.count;
                case 'min-3d': // dimension
                    return typeof attrVal.B === 'number' && typeof attrVal.H === 'number' && typeof attrVal.T === 'number' && (currentValue === undefined || attrVal.B * attrVal.H * attrVal.T < currentValue) ? attrVal.B * attrVal.H * attrVal.T : currentValue;
                case 'max-3d': // dimension
                    return typeof attrVal.B === 'number' && typeof attrVal.H === 'number' && typeof attrVal.T === 'number' && (currentValue === undefined || attrVal.B * attrVal.H * attrVal.T > currentValue) ? attrVal.B * attrVal.H * attrVal.T : currentValue;
                case 'avg-3d': // dimension
                    if(typeof attrVal.B !== 'number' || typeof attrVal.H !== 'number' || typeof attrVal.T !== 'number') {
                        aggregateInfo.count--;
                        return currentValue;
                    }
                    return 1. * (aggregateInfo.sum += attrVal.B * attrVal.H * attrVal.T) / aggregateInfo.count;

                default:
                    break;
            }

            return currentValue;
        },

        // --------------------------------------------------------------------------------------------
        updateAggregateColumn: function(
            attribute,
            currentValue,
            aggregateInfo,
            context,
            groupColumns,
            resultRow
        ) {
        // --------------------------------------------------------------------------------------------
            let aggregateType = this.query.grouping.aggregate[attribute.id];
            if(attribute.parentAttribute) {
                let table = context.attributes[attribute.parentAttribute.id];
                if(table === undefined || table === null)
                    return currentValue;
                let newValue = currentValue;
                table.forEach((row, index) => {
                    if(!this.isRelevantTableRow(context, attribute.parentAttribute, index))
                        return;
                    // if there are grouped columns in this table, we must consider only those rows where the grouped columns match
                    let doAggregate = groupColumns.every((attr, index) => {
                        // check if same table
                        if(!attr.parentAttribute || attr.parentAttribute.id != attribute.parentAttribute.id)
                            return true;
                        // same table here
                        return resultRow[index] === this.getDisplayValue(row[attr.id], attr);
                    });
                    if(doAggregate)
                        newValue = this.updateAggregateColumnValue(context, attribute, row[attribute.id], aggregateType, newValue, aggregateInfo);
                });
                return newValue;
            }
            else {
                let attrVal = context.attributes[attribute.id];
                return this.updateAggregateColumnValue(context, attribute, attrVal, aggregateType, currentValue, aggregateInfo);
            }
        },

        // --------------------------------------------------------------------------------------------
        setTableFilterMap: function(
        ) {
        // --------------------------------------------------------------------------------------------
            this.query.tableRowMatches = {};
            if(!this.query.discardTableRows)
                return;
            this.query.tableFilters = [];
            if(!this.query.discardTableRows)
                return;
            this.query.filters.forEach(filter => {
                if(this.query.outputObject.what === 'ContextType') {
                    // table is relevant if this filter is on a table column in the output context type
                    if(filter.object.parentAttribute
                        && filter.object.parentContextType.internalId === this.query.outputObject.internalId
                        && !this.query.tableFilters.includes(filter.object.parentAttribute.id)
                    ) {
                        this.query.tableFilters.push(filter.object.parentAttribute.id);
                    }
                }
                else { // Attribute
                    // table is relevant if the output object is a table column and this filter is on a column in the same table
                    if(filter.object.parentAttribute &&
                        this.query.outputObject.parentAttribute &&
                        filter.object.parentAttribute.internalId === this.query.outputObject.parentAttribute.internalId &&
                        !this.query.tableFilters.includes(filter.object.parentAttribute.id)
                    ) {
                        this.query.tableFilters.push(filter.object.parentAttribute.id);
                    }
                }
            });
        },

        // --------------------------------------------------------------------------------------------
        getGroupedResult: function(
            contextType
        ) {
        // --------------------------------------------------------------------------------------------
            let r = {
                head: [],
                body: [],
                contexts: [],
                sortTypes: [],
                grandTotal: 0
            };
            let colAttrs = [];
            let ct = this.contextTypes[contextType.id];
            let groupColumns = [], aggrColumns = [], rowInfos = [], linkListColumns = [];
            this.query.grouping.group.forEach(attrId => {
                let attr = db.attributes[attrId];
                colAttrs.push(attr);
                groupColumns.push(attr);
                r.head.push(attr.name);
                r.sortTypes.push(db.getSortTypeFromAttr(attr));
            });
            this.query.grouping.aggregate.forEachValue((attrId, aggr) => {
                let attr = db.attributes[attrId];
                colAttrs.push(attr);
                aggrColumns.push(attr);
                let colIndex = r.head.push("%s: %s %s".with(db.attributes[attrId].name, Symbols[aggr], l10n.attributeDisplayTypeLabels[aggr])) - 1;
                if([PseudoAttributes.ID, PseudoAttributes.Name].includes(attr.pseudoAttributeKey) && ['list-links', 'list-entities'].includes(aggr))
                    linkListColumns.push(colIndex);
                r.sortTypes.push('num'); // aggregate columns always numberic ?!
            });
            db.traverseContextsOfType(ct, contextType.typePathToRoot, true, context => {
                // here we need to be aware that for a table attribute, there are multiple values per context
                let groupColumnValues = [];
                groupColumns.forEach(attr => {
                    if(attr.parentAttribute) { // table attribute
                        let table = context.attributes[attr.parentAttribute.id];
                        if($.isArray(table) && table.length > 0) { // we now include all distinct values of the column represented by attr
                            let seenValues = [];
                            table.forEach((tableRow, index) => {
                                if(!this.isRelevantTableRow(context, attr.parentAttribute, index))
                                    return;
                                let attrVal = tableRow[attr.id];
                                let displayVal = this.getDisplayValue(attrVal, attr);
                                if(!seenValues.includes(displayVal))
                                    seenValues.push(displayVal);
                            });
                            groupColumnValues.push(seenValues);
                        }
                        else {
                            groupColumnValues.push([null]);
                        }
                    }
                    else { // single attribute
                        if(attr.type === 'string-mc') {
                            let values = context.attributes[attr.id];
                            if($.isArray(values))
                                groupColumnValues.push(values.map(val => db.getThesaurusLabel(val.concept_url)));
                        }
                        else if(attr.type === 'list') {
                            let values = context.attributes[attr.id];
                            if($.isArray(values))
                                groupColumnValues.push(values);
                        }
                        else {
                            groupColumnValues.push([ this.getDisplayValue(context.attributes[attr.id], attr) ]);
                        }
                    }
                });

                if(groupColumns.length === 0) {
                    // add fake grouping
                    groupColumnValues.push([null]);
                }

                // Now we create a row for each value combination
                // determine the total rows we will need
                let cntRows = 1;
                for(let i = groupColumnValues.length - 1; i >= 0; i--)
                    cntRows *= groupColumnValues[i].length;
                let rows = new Array(cntRows);
                for(let r = 0; r < rows.length; r++)
                    rows[r] = new Array(groupColumns.length).fill(null);
                /*
                    Now the distinct values for grouped columns looks for example like this:
                        groupColumnValues = [
                            [ x, y ],
                            [ a, b, c, d],
                            [ k, l, m ]
                        ]
                    and therefore the total number of distinct combinations:
                        cntRows = 2 * 4 * 3 = 24

                    We know that:
                    - each of [x,y] is repeated 12 rows in the first column, 1 time
                    - each of [a,b,c,d] is repeated 3 rows in the second column, 2 times
                    - each of [k,l,m] is repeated 1 row in the third column, 8 times

                    So:
                    - the repetition count is the product of number of items in successor items ("below") in groupColumnValues
                    - the number of times this is repeated is the product of number of items in predecessor rows ("above") in groupColumnValues

                    Here we go:
                */
                for(let c = 0; c < groupColumnValues.length; c++) {
                    // count how often to repeat these values
                    let repeatCount = 1;
                    for(let above = c - 1; above >= 0; above--)
                        repeatCount *= groupColumnValues[above].length;
                    // count how many rows to fill in each repetition
                    let countPerRepetition = 1;
                    for(let below = c + 1; below < groupColumnValues.length; below++)
                        countPerRepetition *= groupColumnValues[below].length;
                    // now fill
                    let r = 0; // row
                    for(let repetition = 0; repetition < repeatCount; repetition++) {
                        groupColumnValues[c].forEach(value => {
                            for(let count = 0; count < countPerRepetition; count++) {
                                /*if(c < groupColumns.length && colAttrs[c].type === 'entity')
                                    rows[r++][c] = db.getEntityDisplayObject(value);
                                else*/
                                    rows[r++][c] = value;
                            }
                        });
                    }
                }

                rows.forEach(row => {
                    let rowIndex = r.body.length;
                    // look if this grouping already exists
                    let groupingExists = r.body.some((existingRow, existingRowIndex) => {
                        let found = true;
                        for(let i = groupColumns.length - 1; i >= 0; i--) {
                            if(row[i] !== existingRow[i]) {
                                found = false;
                                break;
                            }
                        }
                        if(found) { // take the existing row
                            row = existingRow;
                            rowIndex = existingRowIndex;
                        }
                        return found;
                    });
                    if(!groupingExists) {
                        r.body.push(row);
                        rowInfos.push(new Array(aggrColumns.length));
                    }
                    // now update the aggregate columns
                    for(let i = 0; i < aggrColumns.length; i++) {
                        let colIndex = groupColumns.length + i;
                        if(rowInfos[rowIndex][i] === undefined) {
                            rowInfos[rowIndex][i] = {
                                count: 0,
                                sum: undefined,
                                max: undefined,
                                min: undefined
                            };
                        }
                        row[colIndex] = db.updateAggregateColumn(aggrColumns[i], row[colIndex], rowInfos[rowIndex][i], context, groupColumns, row);
                    }
                });
            });

            // special attribute displays
            r.body.forEach(row => {
                for(let i = 0; i < groupColumns.length; i++) {
                    if(colAttrs[i].type === 'entity') {
                        row[i] = db.getEntityDisplayObject(row[i]);
                    }
                }
                linkListColumns.forEach(colIndex => {
                    let linkList = row[colIndex];
                    if($.isArray(linkList)) {
                        linkList.sort((a, b) => a.label > b.label ? 1 : (a.label < b.label ? -1 : 0));
                        row[colIndex] = { display: 'entityLinkList', value: linkList.map(x => x.html), order: linkList.length };
                    }
                });
            });

            r.grandTotal = r.body.length;
            if(r.grandTotal > Settings.resultTable.maxRows)
                r.body.length = Settings.resultTable.maxRows; // https://stackoverflow.com/questions/26568536/remove-all-items-after-an-index/26568611
            return r;
        },

        // --------------------------------------------------------------------------------------------
        getTreeObjectContextType(
            object,
            dbObject = false
        ) {
        // --------------------------------------------------------------------------------------------
            let ct = object.what == 'ContextType' ? object : object.parentContextType;
            return dbObject ? this.contextTypes[ct.id] : ct;
        },

        // --------------------------------------------------------------------------------------------
        /* returns:
            false,  if no overlap
            0, if same hierarchy level and context type
            positive, if path2 is descendant context type of path1
            negative, if path2 is ancestor context type of path1
        */
        getPathToRootRelation(
            path1, path2
        ) {
        // --------------------------------------------------------------------------------------------
            if(!this.query.hierarchical)
                return path1[0] == path2[0] ? 0 : false;

            if(path1.equals(path2))
                return 0;

            if(path1.endsWith(path2))
                return path2.length - path1.length;

            if(path2.endsWith(path1))
                return path2.length - path1.length;

            return false;
        },

        // --------------------------------------------------------------------------------------------
        getThesaurusLabel(
            url,
            valueIfUrlNotInThesaurus = undefined
        ) {
        // --------------------------------------------------------------------------------------------
            let th = this.thesaurus[url];
            return th ? th.label : valueIfUrlNotInThesaurus;
        },

        // --------------------------------------------------------------------------------------------
        normalizeString(
            value,
            tryCast = true
        ) {
        // --------------------------------------------------------------------------------------------
            if(typeof value === 'string')
                return value.toUpperCase();
            if(tryCast && value && value.toString)
                return value.toString().toUpperCase();
            return value;
        },

        // --------------------------------------------------------------------------------------------
        isEqualIgnoreCase(
            op1,
            op2,
            tryCast = true
        ) {
        // --------------------------------------------------------------------------------------------
            let op = [ op1, op2 ];
            [0, 1].forEach(i => {
                if(typeof op[i] === 'string')
                    op[i] = op[i].toUpperCase();
                else if(tryCast && op[i] && op[i].toString)
                    op[i] = op[i].toString().toUpperCase();
            });
            return op[0] == op[1];
        },

        // --------------------------------------------------------------------------------------------
        containIgnoreCase(
            haystack,
            needle,
            tryCast = true
        ) {
        // --------------------------------------------------------------------------------------------
            let op = [ haystack, needle ];
            [0, 1].forEach(i => {
                if(typeof op[i] === 'string')
                    op[i] = op[i].toUpperCase();
                else if(tryCast && op[i] && op[i].toString)
                    op[i] = op[i].toString().toUpperCase();
            });
            return op[0].indexOf(op[1]) !== -1;
        },

        // --------------------------------------------------------------------------------------------
        valueMatchesFilter: function(
            value,
            filter
        ) {
        // --------------------------------------------------------------------------------------------
            let valueToCompare = value;
            switch(filter.transformation) {
                case 'rows':
                case 'count':
                    valueToCompare = 0;
                    if($.isArray(value))
                        valueToCompare = value.length;
                    break;

                case 'length':
                    if(value === null || value === undefined)
                        valueToCompare = undefined;
                    else if(value.concept_url)
                        valueToCompare = db.getThesaurusLabel(value.concept_url, undefined);
                    if(typeof valueToCompare === 'string')
                        valueToCompare = String(valueToCompare).length;
                    break;

                case null:
                case '':
                    break;

                case 'dimension-b':
                    valueToCompare = valueToCompare !== null && typeof valueToCompare === 'object' ? valueToCompare.B : undefined;
                    break;
                case 'dimension-h':
                    valueToCompare = valueToCompare !== null && typeof valueToCompare === 'object' ? valueToCompare.H : undefined;
                    break;
                case 'dimension-t':
                    valueToCompare = valueToCompare !== null && typeof valueToCompare === 'object' ? valueToCompare.T : undefined;
                    break;
                case 'dimension-bh':
                    valueToCompare = valueToCompare !== null && typeof valueToCompare === 'object' ? valueToCompare.B * valueToCompare.H : undefined;
                    break;
                case 'dimension-bt':
                    valueToCompare = valueToCompare !== null && typeof valueToCompare === 'object' ? valueToCompare.B * valueToCompare.T : undefined;
                    break;
                case 'dimension-ht':
                    valueToCompare = valueToCompare !== null && typeof valueToCompare === 'object' ? valueToCompare.H * valueToCompare.T : undefined;
                    break;
                case 'dimension-bht':
                    valueToCompare = valueToCompare !== null && typeof valueToCompare === 'object' ? valueToCompare.B * valueToCompare.H * valueToCompare.T : undefined;
                    break;
                case 'dimension-unit':
                    valueToCompare = valueToCompare !== null && typeof valueToCompare === 'object' ? valueToCompare.unit : undefined;
                    break;

                case 'epoch-start':
                    if(value !== null && typeof value === 'object') {
                        valueToCompare = value.start;
                        if(typeof valueToCompare === 'number' && db.epochIsBC(value, 'start'))
                            valueToCompare = -valueToCompare;
                    }
                    else
                        valueToCompare = undefined;
                    break;
                case 'epoch-end':
                    if(value !== null && typeof value === 'object') {
                        valueToCompare = value.end;
                        if(typeof valueToCompare === 'number' && db.epochIsBC(value, 'end'))
                            valueToCompare = -valueToCompare;
                    }
                    else
                        valueToCompare = undefined;
                    break;
                case 'epoch-concept':
                    if(value !== null && typeof value === 'object' && typeof value.epoch === 'object' && typeof value.epoch.concept_url === 'string')
                        valueToCompare = db.thesaurus[value.epoch.concept_url].label;
                    else
                        valueToCompare = undefined;
                    break;
                case 'epoch-timespan':
                    if(value !== null && typeof value === 'object' && typeof value.start === 'number' && typeof value.end === 'number') {
                        let start = db.epochIsBC(value, 'start') ? -value.start : value.start;
                        let end = db.epochIsBC(value, 'end') ? -value.end : value.end;
                        valueToCompare = end - start;
                    }
                    else
                        valueToCompare = undefined;
                    break;

                case 'geometry-wkt':
                    if(value !== null && typeof value === 'object')
                        valueToCompare = value.wkt;
                    break;

                case 'geometry-area':
                    if(value !== null && typeof value === 'object')
                        valueToCompare = value.area;
                    break;

                case 'geometry-type':
                    if(value !== null && typeof value === 'object')
                        valueToCompare = value.type;
                    break;

                default:
                    throw l10n.get('errorUnknownFilterTransformation', filter.transformation);
            }

            switch(filter.operator) {
                case 'equal':
                case 'not-equal': {
                    let checkEqual = (filter.operator === 'equal');
                    if(filter.dbAttribute.type === 'string-sc')
                        valueToCompare = this.tryResolveThesaurus(valueToCompare);
                    else if(filter.dbAttribute.isComputed)
                        valueToCompare = this.getThesaurusLabel(valueToCompare, valueToCompare);
                    let isEqual = this.isEqualIgnoreCase(valueToCompare, filter.values[0]);
                    return checkEqual ? isEqual : !isEqual;
                }

                case 'equal-thesaurus':
                case 'not-equal-thesaurus': {
                    let isEqual;
                    if(filter.dbAttribute.type === 'string-sc') {
                        isEqual = valueToCompare && valueToCompare.concept_url === filter.values[0];
                    }
                    else
                        isEqual = this.isEqualIgnoreCase(valueToCompare, this.getThesaurusLabel(filter.values[0], filter.values[0]));
                    return filter.operator === 'equal-thesaurus' ? isEqual : !isEqual;
                }

                case 'greater':
                    return valueToCompare > filter.values[0];

                case 'lower':
                    return valueToCompare < filter.values[0];

                case 'greater-equal':
                    return valueToCompare >= filter.values[0];

                case 'lower-equal':
                    return valueToCompare <= filter.values[0];

                case 'exist':
                    return typeof valueToCompare !== 'undefined';

                case 'not-exist':
                    return typeof valueToCompare === 'undefined';

                case 'empty':
                    return valueToCompare === null;

                case 'not-empty':
                    return typeof valueToCompare !== 'undefined' && valueToCompare !== null;

                case 'contain':
                case 'not-contain': {
                    let contain = (filter.operator === 'contain');
                    if(valueToCompare === null || valueToCompare === undefined)
                        return contain ? false : true;
                    if(filter.dbAttribute.type === 'string-mc') {
                        let found = false;
                        if($.isArray(valueToCompare)) // [{id:24, concept_url:"blah"}, ...]
                            found = valueToCompare.some(v => this.tryResolveThesaurus(v).toString().toLowerCase().indexOf(filter.values[0].toLowerCase()) !== -1);
                        return contain ? found : !found;
                    }
                    else if(filter.dbAttribute.type === 'string-sc')
                        valueToCompare = this.tryResolveThesaurus(valueToCompare);
                    else if(filter.dbAttribute.isComputed)
                        valueToCompare = this.getThesaurusLabel(valueToCompare, valueToCompare);
                    else if(filter.dbAttribute.type === 'list') {
                        let found = false;
                        if($.isArray(valueToCompare))
                            found = valueToCompare.some(v => v.toUpperCase() === filter.values[0].toUpperCase());
                        return contain ? found : !found;
                    }
                    let found = this.containIgnoreCase(valueToCompare, filter.values[0]);
                    return contain ? found : !found;
                }

                case 'not-contain-thesaurus':
                case 'contain-thesaurus': {
                    let contain = (filter.operator === 'contain-thesaurus');
                    if(valueToCompare === null || typeof valueToCompare === 'undefined')
                        return contain ? false : true;
                    let found = false;
                    if(['string', 'stringf', 'relation'].indexOf(filter.dbAttribute.type) !== -1)
                        found = this.containIgnoreCase(valueToCompare, this.getThesaurusLabel(filter.values[0], filter.values[0]));
                    else if($.isArray(valueToCompare)) // string-mc : [{id:24, concept_url:"blah"}, ...]
                        found = valueToCompare.some(v => v.concept_url === filter.values[0]);
                    return contain ? found : !found;
                }

                case 'descendant-thesaurus':
                case 'not-descendant-thesaurus':
                case 'contain-descendant-thesaurus':
                case 'not-contain-descendant-thesaurus': {
                    let descendant = ['descendant-thesaurus', 'contain-descendant-thesaurus'].includes(filter.operator);
                    if(valueToCompare === null || typeof valueToCompare === 'undefined')
                        return descendant ? false : true;
                    if(!$.isArray(valueToCompare)) { // single choice -> fake multiple choice
                        valueToCompare = [{
                            concept_url: valueToCompare.concept_url || valueToCompare
                        }];
                    }
                    let found = db.findDescendantThesaurusConcept(
                        db.thesaurus[filter.values[0]],
                        valueToCompare.map(v => v.concept_url)
                    );
                    return descendant ? found : !found;
                }

                case 'entity-equal':
                    return Number(valueToCompare) === Number(filter.values[0]);

                case 'entity-not-equal':
                    return Number(valueToCompare) !== Number(filter.values[0]);

                case 'entity-name-equal':
                case 'entity-name-not-equal':
                case 'entity-name-contain':
                case 'entity-name-not-contain': {
                    let entity = db.contexts[valueToCompare];
                    if(!entity)
                        return false;
                    let not = filter.operator.includes('-not-');
                    if(filter.operator.endsWith('-contain')) {
                        let contains = this.containIgnoreCase(entity.name, filter.values[0]);
                        return not ? !contains : contains;
                    }
                    let equals = this.isEqualIgnoreCase(entity.name, filter.values[0]);
                    return not? !equals : equals;
                }

                case 'entity-type-equal':
                case 'entity-type-not-equal': {
                    if(filter.values[0] == '')
                        return false;
                    let entity = db.contexts[valueToCompare];
                    if(!entity)
                        return false;
                    let not = filter.operator.includes('-not-');
                    let equals = entity.contextType.id === Number(filter.values[0]);
                    return not ? !equals : equals;
                }

                default: throw l10n.get('errorUnknownFilterOperator', filter.operation);
            }
        },

        // --------------------------------------------------------------------------------------------
        findDescendantThesaurusConcept: function(
            concept,
            descendantCandidateUrls
        ) {
        // --------------------------------------------------------------------------------------------
            return concept && concept.childConcepts.some(childConcept => {
                return descendantCandidateUrls.includes(childConcept.url)
                    || db.findDescendantThesaurusConcept(childConcept, descendantCandidateUrls);
            });
        },

        // --------------------------------------------------------------------------------------------
        isRelevantTableRow(
            context,
            attribute,
            rowIndex
        ) {
        // --------------------------------------------------------------------------------------------
            let ci;
            return !this.query.discardTableRows
                || !(ci = this.query.tableRowMatches[context.id])
                || !ci[attribute.id]
                || ci[attribute.id][rowIndex] === true;
        },

        // --------------------------------------------------------------------------------------------
        getTableRowMatches: function(
            context,
            tableAttributeId
        ) {
        // --------------------------------------------------------------------------------------------
            let contextInfo = this.query.tableRowMatches[context.id];
            if(!contextInfo)
                contextInfo = this.query.tableRowMatches[context.id] = {};
            let tableRowMatches = contextInfo[tableAttributeId];
            if(!tableRowMatches)
                tableRowMatches = contextInfo[tableAttributeId] = [];
            return tableRowMatches;
        },

        // --------------------------------------------------------------------------------------------
        contextMatchesFilter: function (
            context,
            filter,
            isOutputObject
        ) {
        // --------------------------------------------------------------------------------------------
            if(filter.combinedFilters.length > 0) {
                // we look whether a table row exists where this filter and all combinedFilters match
                let table = context.attributes[filter.dbAttribute.parentAttribute.id];
                if(typeof table === 'undefined')
                    return false; // TODO: need to check whether there are combinations of filters that match even though there is no table
                else {
                    let allFilters = filter.combinedFilters.concat(filter);
                    if(isOutputObject && this.query.discardTableRows && this.query.tableFilters.includes(filter.dbAttribute.parentAttribute.id)) {
                        // discard table rows that do not match filter
                        let tableRowMatches = this.getTableRowMatches(context, filter.dbAttribute.parentAttribute.id);
                        let tableMatch = false;
                        table.forEach((row, index) => {
                            if(tableRowMatches[index] === undefined)
                                tableRowMatches[index] = [];
                            let rowMatch = allFilters.every(partialFilter => { // every filter must match within the row
                                let cellValue = row[partialFilter.dbAttribute.id];
                                return db.valueMatchesFilter(db.tryResolveThesaurus(cellValue), partialFilter);
                            });
                            if(rowMatch)
                                tableMatch = true;
                            tableRowMatches[index].push(rowMatch);
                        });
                        return tableMatch;
                    }
                    else {
                        // simply look whether any table row matches
                        return table.some(row => { // at least one row must match
                            return allFilters.every(partialFilter => { // every filter must match within the row
                                let cellValue = row[partialFilter.dbAttribute.id];
                                return db.valueMatchesFilter(db.tryResolveThesaurus(cellValue), partialFilter);
                            });
                        });
                    }
                }
            }
            else if(filter.dbAttribute) {
                let attrValue = this.getAttributeValue(context, filter.dbAttribute, false);
                if(filter.dbAttribute.parentAttribute) {
                    // table attribute
                    if(!$.isArray(attrValue) || attrValue.length === 0)
                        return filter.operator === 'not-exists';

                    if(isOutputObject && this.query.discardTableRows && this.query.tableFilters.includes(filter.dbAttribute.parentAttribute.id)) {
                        // discard table rows that do not match filter
                        let tableRowMatches = this.getTableRowMatches(context, filter.dbAttribute.parentAttribute.id);
                        let tableMatch = false;
                        attrValue.forEach((value, index) => {
                            if(tableRowMatches[index] === undefined)
                                tableRowMatches[index] = [];
                            let rowMatch = this.valueMatchesFilter(value, filter);
                            if(rowMatch)
                                tableMatch = true;
                            tableRowMatches[index].push(rowMatch);
                        });
                        return tableMatch;
                    }
                    else {
                        // simply look whether any table row matches
                        return attrValue.some(value => this.valueMatchesFilter(value, filter));
                    }
                }
                else {
                    // non-table attribute
                    return this.valueMatchesFilter(attrValue, filter);
                }
            }
            else {
                throw l10n.errorContextTypeFilterNotImpl;
            }
        },

        // --------------------------------------------------------------------------------------------
        descendantContextsMatchFilter: function(
            context,
            filter,
            levelsDown
        ) {
        // --------------------------------------------------------------------------------------------
            let childCount = context.childContexts.length;

            if(levelsDown <= 1) {
                // we're at the desired level
                for(let i = 0; i < childCount; i++) {
                    let child = context.childContexts[i];
                    if(child.typePathToRoot.equals(filter.typePathToRoot)) {
                        if(this.contextMatchesFilter(child, filter, false))
                            return true;
                    }
                }
                return false;
            }

            // here we need to go more levels down; if any of the childs match, the current context matches too
            for(let i = 0; i < childCount; i++) {
                if(this.descendantContextsMatchFilter(context.childContexts[i], filter, levelsDown - 1))
                    return true;
            }
            return false;
        },

        // --------------------------------------------------------------------------------------------
        applyFiltersToContext: function(
            context,
            query
        ) {
        // --------------------------------------------------------------------------------------------
            let matches = [];
            query.filters.forEach((filter, index) => {
                if(filter.object.what == 'Attribute')
                    filter.dbAttribute = db.attributes[filter.object.id];
                filter.combinedFilters.forEach(f => f.dbAttribute = db.attributes[f.object.id]);
                let pathRelation = this.getPathToRootRelation(context.typePathToRoot, filter.typePathToRoot);
                if(pathRelation === false) {// this filter is out of scope for the current context; maybe tell the user?
                    matches.push(true);
                }
                else if(pathRelation === 0) {
                    // filter context type at same level as context's type
                    matches.push(this.contextMatchesFilter(context, filter, true));
                }
                else if(pathRelation > 0) {
                    // find all descendant contexts
                    matches.push(this.descendantContextsMatchFilter(context, filter, pathRelation));
                }
                else { // pathRelation < 0
                    // filter ancestor context
                    let stepsUp = 0;
                    let ancestor = context;
                    while(stepsUp++ < -pathRelation)
                        ancestor = ancestor.parentContext;
                    matches.push(this.contextMatchesFilter(ancestor, filter, false));
                }
            });
            if(matches.length === 0)
                return false;
            return matches;
        },

        // --------------------------------------------------------------------------------------------
        applyAnalysisFilters: function(
            query
        ) {
        // --------------------------------------------------------------------------------------------
            this.filteredContexts = {};
            if(!query.filters || query.filters.length === 0)
                return;
            // go through all contexts of the output context type and apply all filters on each, if descendants are concerned
            // if all direct descendants of a context C are filtered out, filter out context C as well (go up recursively)
            let outputContextType = this.getTreeObjectContextType(query.outputObject);
            this.traverseContextsOfType(db.contextTypes[outputContextType.id], outputContextType.typePathToRoot, false, (context) => {
                let matches = this.applyFiltersToContext(context, query);
                if(matches === false)
                    return;
                // matches now contains true or false for each filter
                if(matches.length !== query.filters.length)
                    throw l10n.errorFilteringUnspecific;
                let curResult = matches[0];
                for(let i = 1; i < matches.length; i++) {
                    if(query.filters[i].conjunction === 'and')
                        curResult = curResult && matches[i];
                    else
                        curResult = curResult || matches[i];
                }
                if(!curResult)
                    this.filteredContexts[context.id] = 1; // context is out of the analysis
                else if(query.discardTableRows) {
                    // context is part of analysis - determine which table rows are part of the game and store
                    query.tableFilters.forEach(tableAttrId => {
                        let tableRowMatches = this.getTableRowMatches(context, tableAttrId);
                        tableRowMatches.forEach((rowMatches, rowIndex) => {
                            let completeRowMatch = rowMatches[0];
                            for(let i = 1; i < rowMatches.length; i++) {
                                if(query.filters[i].conjunction === 'and')
                                    completeRowMatch = completeRowMatch && rowMatches[i];
                                else
                                    completeRowMatch = completeRowMatch || rowMatches[i];
                            }
                            tableRowMatches[rowIndex] = completeRowMatch;
                        });
                    });
                }
            });
        },

        // --------------------------------------------------------------------------------------------
        _getAnalysisResults: function (
            query
        ) {
        // --------------------------------------------------------------------------------------------
            if(!query.outputObject || !query.outputDisplay)
                throw 'Invalid query';

            this.setTableFilterMap();
            this.applyAnalysisFilters(query);

            if(query.outputObject.what == 'Attribute') {
                switch(query.outputDisplay.type) {
                    case 'sum':
                    case 'avg':
                    case 'count':
                    case 'min':
                    case 'max':
                        let stats = this.getDescriptiveStatsForAttribute(query.outputObject);
                        return { result: stats[query.outputDisplay.type] };

                    case 'distribution':
                        let table = this.getValueDistributionForAttribute(query.outputObject);
                        return { result: table.body.length > 0 ? table : l10n.dbResultPropertyNoValue };

                    default:
                        throw l10n.errorUnknownOutputDisplayType;
                }
            }
            else { // ContextType
                switch(query.outputDisplay.type) {
                    case 'count':
                        return { result: this.getContextTypeCount(query.outputObject) };

                    case 'map':
                        return { result: this.getListOfResultContexts(query.outputObject) };

                    case 'table':
                        if(!query.grouping)
                            return { result: this.getTableOfContexts(query.outputObject) };
                        else
                            return { result: this.getGroupedResult(query.outputObject) };

                    default:
                        throw l10n.errorUnknownOutputDisplayType;
                }
            }
        },

        // --------------------------------------------------------------------------------------------
        getAnalysisResults: function (
            query
        ) {
        // --------------------------------------------------------------------------------------------
            this.query = query;
            let startTime = debugStartTiming();
            let res = {};
            try {
                res = this._getAnalysisResults(query);
            }
            catch(e) {
                if(typeof e === 'string')
                    res = { error: e.toString() };
                else
                    res = { error: e.message + "\n" + e.stack };
            }
            if(!res.error && typeof res.result === 'undefined')
                res.result = l10n.resultNone;
            res.executionTime = debugGetElapsedSeconds(startTime);
            return res;
        }
    };
}
