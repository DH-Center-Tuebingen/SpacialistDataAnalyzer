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
        users: {},
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
            setDataStatusInfo(db.cacheTimestamp);
            result.attributeValues.forEach(row => {
                let context = db.contexts[row.contextId];
                row.values.forEachValue((attrId, val) => {
                    // determine attribute type, if some value exists at all
                    if(!computedAttrTypes[attrId] && val !== null && val !== undefined) {
                        let typeInfo;
                        switch(typeof val) {
                            // TODO: timestamp (e.g. date)
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
                                    // TODO: how to handle json, array?
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
            // NEWDATATYPE: if attribute type is numeric, include here:
            const numericTypes = ['double', 'integer', 'percentage', 'si-unit'];
            return numericTypes.includes(spacialistType);
        },

        // --------------------------------------------------------------------------------------------
        isAttributeCapableOfLongText: function(attributeType) {
        // --------------------------------------------------------------------------------------------
            // NEWDATATYPE: if attribute type can hold long text, that should be cut in a table cell...
            return ['stringf', 'richtext'].includes(spacialistType);
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
            setDataStatusInfo(this.cacheTimestamp);
            db_stats = '\t%s thesaurus concepts\n\t%s entities of %s types\n\t%s attributes with %s attribute values'.with(
                this.thesaurus.countProperties(), 
                this.contexts.countProperties(), this.contextTypes.countProperties(), 
                this.attributes.countProperties(), this.attributeValues.length
            );
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
                c.datatable = {};
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
                
                // NEWDATATYPE: some attributes are differently represented in tables than in entities;
                // for proper processing later, we need to convert them to the expected format
                if(attr.type === 'string-sc' && typeof value === 'string') { 
                    // make object for consistency with string-sc in tables
                    value = { concept_url: value };
                }                
                else if(attr.type === 'table' 
                    && value !== null // there are some tables in the DB that have a json_val of NULL 
                ) {
                    // there are kaputt table json_vals in the database
                    // e.g. agrigent database, entity 23061, attribute 124 (table "Funde")
                    // in these faulty cases, the table row is not represented as an object with attr_id:value pairs,
                    // but with seemingly random and long arrays of null values. So we simply filter all those faulty
                    // rows out here and console.log some info                    
                    let numFaultyRows = 0;
                    for(let i = value.length-1; i >= 0; i--) {
                        if(Array.isArray(value[i])) {
                            numFaultyRows++;
                            value.splice(i, 1);
                        }
                    }
                    if(numFaultyRows > 0) {
                        console.log('\tFound and ignored %s faulty rows in table attribute %s of entity %s'.with(
                            numFaultyRows, attr.id, av.context
                        ));
                    }
                    // in the json that represents a table, some things need fixing to work later
                    attr.children.forEach(columnAttr => {  // for each column
                        value.forEach(row => { // for each row
                            let cellValue = row[columnAttr.id];
                            // to allow displaying DataTables correctly, each column needs to have a value. In Spacialist
                            // empty cell values are missing altogether, so we fix this by setting these values to null
                            if(cellValue === undefined) {
                                row[columnAttr.id] = null;
                            }
                            // string-sc might be represented as a thesaurus_url, not an object (might be fixed already?)
                            else if(columnAttr.type === 'string-sc' && typeof cellValue === 'string') {
                                row[columnAttr.id] = { concept_url: cellValue };
                            }
                            // it can happen that numeric attribute values are stored as strings in a table's json -> convert to number
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
                            // in tables entity-mc might come as a string representation of an array, e.g. "['12934', '12935']" -> convert to array
                            else if(columnAttr.type === 'entity-mc' && typeof cellValue === 'string') {                            
                                try {
                                    cellValue = JSON.parse(cellValue);
                                    if(Array.isArray(cellValue)) {
                                        row[columnAttr.id] = cellValue;
                                    }
                                    else {
                                        console.log('Unexpected value representation for entity-mc in table', cellValue);
                                        row[columnAttr.id] = null;
                                    }
                                }
                                catch(e) {
                                    // should not get here
                                    console.log('Error parsing entity-mc value in table; string-based but no array', e);
                                    row[columnAttr.id] = null;
                                }                                
                            }
                            // in userlist replace user ids with user objects
                            else if(columnAttr.type === 'userlist' && Array.isArray(cellValue)) {
                                for(let i = cellValue.length - 1; i >= 0 ; i--) {
                                    let user = db.users[cellValue[i]];
                                    if(user) {
                                        cellValue[i] = { id: user.id, name: user.name };
                                    }
                                    else {
                                        console.warn('User with ID %s not found in database'.with(cellValue[i]));
                                        cellValue.splice(i, 1);
                                    }
                                }
                                row[columnAttr.id] = cellValue;
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
            console.log(db_stats);
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
                    v: this.getEntityDetailsLink(entity, entity.name),
                    s: entity.name,
                    e: entity.name
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
                            if(['entity-mc', 'string-mc', 'userlist', 'list'].includes(attribute.type)
                                && Array.isArray(val) 
                            ){
                                rowVals = [];
                                val.forEach(e => {
                                    rowVals.push(resolveThesaurus ? 
                                        this.tryResolveThesaurus(e) 
                                        : e
                                    );
                                });
                                vals.push(rowVals);
                            }
                            else {
                                vals.push(resolveThesaurus ? 
                                    this.tryResolveThesaurus(val) 
                                    : val
                                );
                            }
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
            // in JS null as object key becomes string "null", which cannot be used
            // to check whether the original value was null, since "null" can also
            // be the string value. So remember null values separately:
            let countNulls = 0;

            db.traverseContextsOfType(
                db.contextTypes[attribute.parentContextType.id],
                attribute.parentContextType.typePathToRoot,
                true,
                context => {
                    // TODO: if string-mc in a table, returns array of arrays ?!?!? wtf
                    let values = this.getAttributeValue(context, attribute, true);
                    if(typeof values === 'undefined')
                        values = null;
                    
                    // NEWDATATYPE: if attribute type has array binding in database although it is not a list of values, include here
                    if(!Array.isArray(values)
                        // daterange has array binding in database json_val and should be conisdered as a single date range value, not as separate start/end values
                        || (!attribute.parentAttribute && ['daterange'].indexOf(attribute.type) >= 0)
                    ) {
                        values = [ values ];
                    }
                    
                    // NEWDATATYPE: if attribute type is list-typeish, then we cannot use getValueToDisplay(),
                    // since here we are exploding the list types, which would lead to confusion at
                    // getValueToDisplay, since the funciton expects list-types to come as arrays;
                    // also include here cases that need markup (e.g., entity, url,...) and get marked up later
                    values.forEach((val, index) => {
                        if(val === null) {
                            countNulls++;
                            return;
                        }
                        if(attribute.parentAttribute && !this.isRelevantTableRow(context, attribute.parentAttribute, index))
                            return;
                        
                        switch(attribute.type) {
                            case 'string-mc':
                            case 'string-sc':
                                if(typeof val === 'object' && typeof val.concept_url !== 'undefined')
                                    val = val.concept_url;
                                let thVal = db.thesaurus[val];
                                if(thVal)
                                    val = thVal.label;
                                break;

                            case 'userlist':
                                val = val.name;
                                break;
                            
                            case 'list':
                            case 'entity-mc':
                            case 'entity':
                            case 'url':
                                // take as is, might get pimped later
                                break;
                            
                            default:
                                val = db.getValueToDisplay(val, attribute, context, -1, true);
                                break;
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
            if(this.isNumericSpacialistType(attribute.type)) {
                for(const v in distr) {
                    let c = distr[v];
                    // Object keys are always stored as strings in JS, even though they were originally nubmers.
                    // For correct formatting of the value in the GUI, we need to convert the value back to a number
                    let num = Number(v);
                    result.body.push([v === null || v === undefined || isNaN(num) ? null : num, c]);
                };
            }
            // NEWDATATYPE: if objects as values that need special representation and it has not been done above: do here
            // for example: convert raw url to clickable url
            else if(['entity', 'entity-mc'].includes(attribute.type)) {
                for(const v in distr) {
                    let c = distr[v];
                    let displayObj = db.getEntityDisplayObject(v);
                    if(displayObj)
                        result.body.push([ displayObj, c ]);
                }
            }
            else if('url' == attribute.type) {
                for(const v in distr) {
                    let c = distr[v];
                    result.body.push([{
                        v: '<a href="%s" target="_blank">%s</a>'.with(v, v), 
                        s: v,
                        e: v
                    }, c ]);
                }; 
            }        
            else {
                for(const v in distr) {
                    result.body.push([v, distr[v]]);
                }
            }
            if(countNulls > 0) {
                // insert as first row in table
                result.body.unshift([{ v: l10n.dbNull, s: null, e: '' }, countNulls]);
            }
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
                    if(!Array.isArray(values))
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
        // returns an object with the following properties:
        //   v: value to display in table cell (html string)    
        //   s: sorting value (number, string, ...)
        //   e: export value (string, number, ...)
        // --------------------------------------------------------------------------------------------
        getValueToDisplay: function(
            origValue, // value as it comes from db and is transformed after _handleSqlResult function
            attribute, // attribute object
            context, // context object; if missing, there is no caching of display value
            rowIndex = -1, // index of the row in the parent attribute table, if applicable; else -1
            textOnly = false // boolean whether to return only the text/numeric value (true) or the whole object (false)            
        ) {
        // --------------------------------------------------------------------------------------------        
            if(!attribute) {
                console.log("Somethng is wrong at getValueToDisplay(", 
                    origValue, ",", attribute, ",", context, ",", rowIndex, ",", textOnly, ")");
                return { v: null, s: null, e: '' };
            }    
        
            // check if done before
            // if attribute has parent attribute (=is in a table), the attribute occurs for each row,
            // so we need to consider the parent attribute context for caching
            let parentAttributeId = attribute.parentAttribute ? attribute.parentAttribute.id : 0;
            if(Settings.cacheAttributeValues
                && context
                && typeof context.datatable[parentAttributeId] !== 'undefined'
                && typeof context.datatable[parentAttributeId][attribute.id] !== 'undefined'
                && typeof context.datatable[parentAttributeId][attribute.id][rowIndex] !== 'undefined'
            ) {
                let cachedVal = context.datatable[parentAttributeId][attribute.id][rowIndex];
                // textOnly also requires numbers to be returned as numbers, not locale number strings 
                // (for grouping, value distribution); in this case return the sorting value
                return textOnly 
                    ? (this.isNumericSpacialistType(attribute.type) ? cachedVal.s : cachedVal.v) 
                    : cachedVal;
            }

            let displayValue = origValue;
            if(typeof displayValue === 'undefined' || displayValue === null) {
                displayValue = null;
            }
            // modify or return display value corresponding to db value
            else switch(attribute.type) {
                case 'boolean': 
                    // entity: int_val -> int {1, 0}
                    // table: boolean {true, false}
                    displayValue = {
                        v: (origValue ? Symbols['box-checked'] : Symbols['box-unchecked']),
                        s: origValue,
                        e: origValue ? 1 : 0
                    };
                    break;

                case 'date': 
                    // entity: dt_val -> string "YYYY-MM-DD"
                    // table: string "YYYY-MM-DDT00:00:00.000Z"
                    // always comes as string, never as a JS date
                    let dt = new Date(origValue);
                    displayValue = { 
                        v: dt.toLocaleDateString(), 
                        s: dt.getTime(),
                        e: dt.toISOString().substring(0, 10)
                    };
                    break;

                case 'daterange':
                    // entity: json_val -> array ["YYYY-MM-DD", "YYYY-MM-DD"]
                    // table: array ["YYYY-MM-DDT00:00:00.000Z", "YYYY-MM-DDT00:00:00.000Z"]
                    // always both start and end available
                    let range = origValue.map(dt => new Date(dt));
                    let disp = range[0].toLocaleDateString() + ' ‒ ' + range[1].toLocaleDateString();
                    // sort by start and end date strings concatenated
                    displayValue = { 
                        v: disp, 
                        s: origValue.map(s => s.substring(0,10)).join(""),
                        e: origValue.map(s => s.substring(0,10)).join("-")
                    };
                    break;

                case 'dimension':
                    // entity: json_val -> object {B: double, H: double, T: double, unit?: string}, all except unit required
                    // table: not allowed
                    displayValue = [];
                    ['B', 'H', 'T'].forEach(dim => {
                        if(typeof origValue[dim] !== 'undefined')
                            displayValue.push(origValue[dim].toLocaleString());                                
                    });
                    displayValue = displayValue.join(Settings.dimensionSeparator) + (origValue.unit ? ' ' + origValue.unit : '');
                    displayValue = { 
                        v: displayValue, 
                        s: origValue.B ?? origValue.H ?? origValue.T,
                        e: displayValue
                    };
                    break;
                
                case 'double':
                    // entity: dbl_val -> double
                    // table: double
                    displayValue = { 
                        v: origValue.toLocaleString(), 
                        s: origValue,
                        e: origValue };
                    break;

                case 'entity': 
                    // entity: entity_val, integer with entity id -> clickable entity
                    // table: -"-                    
                    // beware: might reference already delete entity (bug #199)
                    if(typeof this.contexts[origValue] === 'undefined') {
                        displayValue = null;
                    }
                    else {
                        displayValue = {
                            v: this.getEntityDetailsLink(this.contexts[origValue], this.contexts[origValue].name),
                            s: this.contexts[origValue].name,
                            e: this.contexts[origValue].name
                        };
                    }
                    break;

                case 'entity-mc':
                    // entity: json_val, array [entity1_id, entity2_id, ...]
                    // table: array [entity1_id, entity2_id, ...] (actually might come as string, but is preprocessed before)
                    if(Array.isArray(origValue)) {
                        // beware: referenced entity might not exist any more (bug #199), therefore we filter first
                        origValue = origValue.filter(entity_id => typeof this.contexts[entity_id] !== 'undefined');
                        html_list = origValue.map(entity_id => this.getEntityDetailsLink(
                            this.contexts[entity_id], 
                            this.contexts[entity_id].name, 
                            undefined, 
                            'mr-2'
                        ));                    
                        displayValue = { 
                            v: html_list.join(''), 
                            s: html_list.length, 
                            e: origValue.map(entity_id => this.contexts[entity_id].name).join('\r\n')
                        };
                    }
                    else {
                        console.log("Unknown value format for entity-mc attribute:", origValue, typeof origValue);
                        displayValue = null;
                    }
                    break;

                case 'geometry': 
                    // note: geography is also interpreted as geometry
                    // entity: geography_val
                    // table: string
                    if(typeof origValue === 'string') {
                        // in a table, geometries are stored as wkt strings, so fake object:
                        origValue = { wkt: origValue };
                    }
                    if(typeof origValue === 'object' && origValue.wkt) {
                        // origValue.wkt is looks like Point (1.2 2.3)
                        // check if it matches this pattern:
                        let isGeometry = origValue.wkt.trim().match(/^\s*([^(]+)\((.+)\)\s*$/);
                        if(isGeometry) {
                            let geometryType = origValue.wkt.trim().replace(/^\s*([^()]+)\((.+)\)\s*$/, '$1').trim();
                            let coordinates = origValue.wkt.trim().replace(/^\s*([^()]+)\((.+)\)\s*$/, '$2').trim();
                            geometryType = geometryType.charAt(0).toUpperCase() + geometryType.substr(1).toLowerCase();
                            // if too long, display expansion link for coordinates
                            displayValue = '%s (%s)'.with(
                                geometryType,
                                coordinates.length > Settings.geometryCoordinatesMaxChars
                                    ? getShowMoreSpan(coordinates, false, '⋯⋯', true)[0].outerHTML
                                    : coordinates
                            );
                        }
                        else {
                            console.log('Unexpected geometry/geography string:', origValue.wkt);
                            // just display, clipped if too long
                            displayValue = origValue.wkt.length > Settings.geometryCoordinatesMaxChars
                                ? origValue.wkt.substr(0, Settings.geometryCoordinatesMaxChars) 
                                    + getShowMoreSpan(origValue.wkt.substr(Settings.geometryCoordinatesMaxChars), false, '⋯⋯', true)[0].outerHTML
                                : origValue.wkt;
                        }
                    }
                    else {
                        console.log('Unexpected geometry/geography value:', origValue);
                        displayValue = null;
                    }
                    displayValue = { 
                        v: displayValue, 
                        s: origValue ? origValue.wkt : null,
                        e: origValue ? origValue.wkt : null
                    };
                    break;
                
                case 'iconclass':
                case 'richtext':        // not allowed in table 
                case 'rism':            // not allowed in table
                case 'serial':          // not allowed in table
                case 'string':
                case 'stringf':         // not allowed in table
                    // entity: str_val -> string
                    // table: string
                    displayValue = { 
                        v: displayValue, 
                        s: displayValue, 
                        e: displayValue 
                    };
                    break;

                case 'integer':
                    // entity: int_val -> int
                    // table: int
                    displayValue = { 
                        v: origValue.toLocaleString(), 
                        s: origValue,
                        e: origValue
                    };
                    break;

                case 'list': 
                    // entity: json_val, array [string1, string2, ...]
                    // table: not allowed
                    if(Array.isArray(origValue)) {
                        displayValue = origValue.join(Settings.mcSeparator);
                        displayValue = { 
                            v: displayValue, 
                            s: displayValue,
                            e: origValue.join('\r\n')
                        };
                    }
                    else {
                        console.log('Unexpected list format:', typeof origValue, origValue);
                        displayValue = null;
                    }
                    break;

                case 'percentage':
                    // entity: int_val -> int
                    // table: int
                    displayValue = { 
                        v: origValue + ' %',
                        s: origValue,
                        e: origValue
                    };
                    break;

                case 'relation': 
                    console.log('Deprecated attribute type "relation" detected - ignoring');                    
                    displayValue = null;
                    break;

                case 'si-unit': 
                    // exception: if attribute is in a table, the normalized value is not available (TODO:BUG?)
                    if(typeof origValue === 'object') {
                        // apparently attribute in a table comes without normalized value, only {unit:..., value:...}                        
                        if(origValue.normalized !== undefined) {
                            displayValue = origValue.normalized;
                        }
                        else if(origValue.value !== undefined) {
                            displayValue = origValue.value;
                        }
                        else {
                            console.log('Unexpected si-unit value format:', origValue);
                            displayValue = null;
                        }
                    }
                    displayValue = { 
                        v: displayValue.toLocaleString(), 
                        s: displayValue,
                        e: displayValue
                    };
                    break;

                case 'string-mc': 
                    // entity: json_val, array [{id: int, concept_url: string}, ...]
                    // table: array [{id: int, concept_url: string}, ...]
                    let mc = [];
                    origValue.forEach(url => {
                        if(url !== null && typeof url === 'object' && url.concept_url)
                            url = url.concept_url;
                        let th = db.thesaurus[url];
                        mc.push(th ? th.label : url);
                    });
                    displayValue = mc.join(Settings.mcSeparator);                    
                    displayValue = { 
                        v: displayValue, 
                        s: displayValue, 
                        e: mc.join('\r\n')
                    };
                    break;

                case 'string-sc':
                    // entity: thesaurus_val -> string -> object {concept_url: string} after loading db
                    // table: object {id: int, concept_url: string}
                    displayValue = this.tryResolveThesaurus(origValue);
                    displayValue = { v: displayValue, s: displayValue, e: displayValue };
                    break;

                case 'table': 
                    // entity: json_val -> array of ordered row objects [{'attr1_id': value, 'attr2_id': value}, ...]
                    let table = {
                        head: [],
                        body: [],
                        attrs: [],
                        sortTypes: []
                    };
                    let colAttrs = {}; // for quicker access than via db.attributes
                    let i = 0;
                    origValue.forEach(row => {
                        let tblRow = [];
                        row.forEachValue((attr_id, value) => {
                            let attr;
                            if(i == 0) {
                                attr = colAttrs[attr_id] = db.attributes[attr_id];
                                table.head.push(attr ? attr.name : attr_id);
                                table.attrs.push(attr);
                                table.sortTypes.push(attr ? db.getSortTypeFromAttr(attr) : undefined);
                            }
                            else {
                                attr = colAttrs[attr_id];
                            }
                            if(!attr) {
                                console.log('Attribute', attr_id, ' not found in database\n  getValueToDisplay:', origValue, attribute, context, rowIndex, textOnly);
                            }
                            tblRow.push(this.getValueToDisplay(value, attr, context, i, false));
                        });
                        table.body.push(tblRow);
                        i++;
                    });
                    if(i == 0) {
                        displayValue = null;
                    }
                    else {
                        let infoIndex = DataTableElementInfos.add({
                            table: table,
                            target: '#modalTableInCell'
                        }, 'showTableModal');
                        let btn = $('<button/>')
                            .attr({
                                type: 'button',
                                title: l10n.resultShowTableModalTooltip,
                                'data-xinfo': infoIndex
                            })
                            .addClass('xinfo btn btn-outline-dark btn-sm pb-0 pt-0')
                            .text('%s %s'.with(Symbols.table, l10n.resultShowTableModal));
                        displayValue = {
                            v: btn[0].outerHTML,
                            s: table.body.length,
                            e: [table.head].concat(table.body.map(r => r.map(c => c.e))).map( // create csv
                                row => row                                    
                                    .map(s => String(s).replaceAll('"', '""'))  // escape double quotes
                                    .map(s => `"${s}"`)  // quote it
                                    .join(',')  // comma-separated
                                ).join('\r\n')
                        };
                    }
                    break;

                case 'timeperiod': 
                case 'epoch':
                    // entity: json_val, object {start: int, end: int, endLabel: 'AD|BC', startLabel: 'AD|BC'}
                    //          if epoch, object includes epoch: {concept_url: string}
                    // table: not allowed
                    displayValue = '';
                    if(origValue.start !== undefined && origValue.start !== null)
                        displayValue = '%s %s'.with(origValue.start, origValue.startLabel ? origValue.startLabel.toUpperCase() : '');
                    if(origValue.end !== undefined && origValue.end !== null)
                        displayValue += ' ‒ %s %s'.with(origValue.end, origValue.endLabel ? origValue.endLabel.toUpperCase() : '');
                    if(origValue.epoch && typeof origValue.epoch === 'object' && origValue.epoch.concept_url) {
                        if(displayValue.length > 0)
                            displayValue += Settings.epochSeparator;
                        displayValue += db.getThesaurusLabel(origValue.epoch.concept_url, origValue.epoch.concept_url);
                    }
                    displayValue = displayValue.trim();
                    displayValue = {
                        v: displayValue,
                        s: displayValue,
                        e: displayValue
                    };
                    break;

                case 'url': 
                    // entity: str_val
                    // table: string
                    // make clickable url
                    displayValue = { 
                        v: '<a href="%s" target="_blank">%s</a>'.with(origValue, origValue), 
                        s: origValue,
                        e: origValue
                    };
                    break;

                case 'userlist': 
                    // entity: json_val -> array of user objects [{id: int, name: string}, ...]
                    // table: array of user ids [user1_id, user2_id, ...]
                    if(!Array.isArray(origValue) || origValue.length === 0) {
                        displayValue = null;
                    }
                    // build list of user names
                    let userlist = []; 
                    if(typeof origValue[0] === 'number') {
                        // if part of a table, this comes as array of user ids:
                        userlist = origValue.map(user_id => db.users[user_id].name);
                    }
                    else { 
                        // otherwise this comes as an object with user attributes
                        origValue.forEach(s => userlist.push(s.name));
                    }
                    displayValue = userlist.join(Settings.mcSeparator);
                    displayValue = { 
                        v: displayValue, 
                        s: displayValue,
                        e: userlist.join('\r\n') 
                    };
                    break;
            }

            // null values still need objects
            if(displayValue === null) {
                displayValue = { v: null, s: null, e: '' };
            }
            
            // store value so that it doesn't need to be computed again
            if(Settings.cacheAttributeValues 
                && context
            ) {
                if(typeof context.datatable[parentAttributeId] === 'undefined') {
                    context.datatable[parentAttributeId] = {};
                }
                if(typeof context.datatable[parentAttributeId][attribute.id] === 'undefined') {
                    context.datatable[parentAttributeId][attribute.id] = {};
                }
                context.datatable[parentAttributeId][attribute.id][rowIndex] = displayValue;
            }
            return textOnly 
                ? (this.isNumericSpacialistType(attribute.type) ? displayValue.s : displayValue.v)
                : displayValue;
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
                case 'si-unit':
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
                    // NEWDATATYPE: if entity list, need to display as links
                    r.attrs.forEach(attr => {
                        if(attr.pseudoAttributeKey === PseudoAttributes.ID) {
                            row.push({ v: this.getEntityDetailsLink(context), s: context.name, e: context.name });
                        }
                        else {
                            row.push(this.getValueToDisplay(context.attributes[attr.id], attr, context));
                        }
                    });                        
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
            if(attrVal === null || attrVal === undefined) {
                if (aggregateType === 'count')
                    return aggregateInfo.count;
                if (aggregateType === 'count-list')
                    return aggregateInfo.count_list;
                return currentValue;
            }

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

                case 'count-list':
                    if(Array.isArray(attrVal))
                        aggregateInfo.count_list += attrVal.length;
                    return aggregateInfo.count_list;

                case 'list-links': {
                    if(!Array.isArray(currentValue))
                        currentValue = [];
                    let label = context.attributes[attribute.id];
                    currentValue.push({ label, html: db.getSpacialistLink(context, label, 'mr-2') });
                    return currentValue;
                }

                case 'list-entities': {
                    if(!Array.isArray(currentValue))
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
                    return Array.isArray(attrVal) ? currentValue + attrVal.length : currentValue;

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

                case 'min-startdate': { // daterange
                    let date = Array.isArray(attrVal) ? attrVal[0] : undefined;
                    if(date === undefined) return currentValue;
                    return currentValue === undefined || date < currentValue ? date : currentValue;
                }
                case 'max-startdate': { // daterange
                    let date = Array.isArray(attrVal) ? attrVal[0] : undefined;
                    if(date === undefined) return currentValue;
                    return currentValue === undefined || date > currentValue ? date : currentValue;
                }
                case 'min-enddate': { // daterange
                    let date = Array.isArray(attrVal) ? attrVal[1] : undefined;
                    if(date === undefined) return currentValue;
                    return currentValue === undefined || date < currentValue ? date : currentValue;
                }
                case 'max-enddate': { // daterange
                    let date = Array.isArray(attrVal) ? attrVal[1] : undefined;
                    if(date === undefined) return currentValue;
                    return currentValue === undefined || date > currentValue ? date : currentValue;
                }
                case 'min-datespan': { // daterange
                    if (!Array.isArray(attrVal))
                        return currentValue;
                    let days = (new Date(attrVal[1]) - new Date(attrVal[0])) / (1000 * 60 * 60 * 24);
                    return currentValue === undefined || days < currentValue ? days : currentValue;
                }
                case 'max-datespan': { // daterange
                    if (!Array.isArray(attrVal))
                        return currentValue;
                    let days = (new Date(attrVal[1]) - new Date(attrVal[0])) / (1000 * 60 * 60 * 24);
                    return currentValue === undefined || days > currentValue ? days : currentValue;
                }
                case 'avg-datespan': { // daterange
                    if (!Array.isArray(attrVal)) {
                        aggregateInfo.count--;
                        return currentValue;
                    }
                    let days = (new Date(attrVal[1]) - new Date(attrVal[0])) / (1000 * 60 * 60 * 24);
                    return 1. * (aggregateInfo.sum += days) / aggregateInfo.count;
                }                

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
                table.forEach((row, rowIndex) => {
                    if(!this.isRelevantTableRow(context, attribute.parentAttribute, rowIndex))
                        return;
                    // if there are grouped columns in this table, we must consider only those rows where the grouped columns match
                    let doAggregate = groupColumns.every((attr, columnIndex) => {
                        // check if same table
                        if(!attr.parentAttribute || attr.parentAttribute.id != attribute.parentAttribute.id)
                            return true;
                        // same table here
                        return resultRow[columnIndex] === this.getValueToDisplay(row[attr.id], attr, context, rowIndex, true);
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
                let colIndex = r.head.push(
                    "%s%s: %s %s".with(
                        db.attributes[attrId].parentAttribute ? db.attributes[attrId].parentAttribute.name + ': ' : '',
                        db.attributes[attrId].name, 
                        Symbols[aggr], 
                        l10n.attributeDisplayTypeLabels[aggr]
                    )
                ) - 1;
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
                        if(Array.isArray(table) && table.length > 0) { // we now include all distinct values of the column represented by attr
                            let seenValues = [];
                            table.forEach((tableRow, index) => {
                                if(!this.isRelevantTableRow(context, attr.parentAttribute, index))
                                    return;
                                let attrVal = tableRow[attr.id];
                                // NEWDATATYPE: if list-based datatype (array value), then push all list values here
                                // those not converted later might need conversion here
                                if(Array.isArray(attrVal)
                                    && ['entity-mc', 'list', 'userlist', 'string-mc'].includes(attr.type)
                                ) {
                                    attrVal.forEach(val => {
                                        if(attr.type === 'string-mc') {
                                            val = db.getThesaurusLabel(val.concept_url);
                                        }
                                        if(!seenValues.includes(val))
                                            seenValues.push(val);
                                    });
                                }
                                else {
                                    let displayVal = attrVal;                                    
                                    if('entity' !== attr.type) {
                                        // gets converted later on
                                        displayVal = this.getValueToDisplay(attrVal, attr, context, index, true);
                                    }                                    
                                    if(!seenValues.includes(displayVal))
                                        seenValues.push(displayVal);
                                }
                            });
                            groupColumnValues.push(seenValues);
                        }
                        else {
                            groupColumnValues.push([null]);
                        }
                    }
                    else { // simple (non-table) attribute
                        // NEWDATATYPE: if list-based datatype (array value), then push all list values here;
                        // might reuqire special handling of array binding in json_val (see comment below)
                        let attrVal = context.attributes[attr.id];
                        if(attrVal === undefined || attrVal === null) {
                            groupColumnValues.push([null]);
                        }
                        else if(attr.type === 'string-mc') {                            
                            if(Array.isArray(attrVal))
                                groupColumnValues.push(attrVal.map(val => db.getThesaurusLabel(val.concept_url)));
                        }
                        else if(attr.type === 'userlist') {
                            if(Array.isArray(attrVal))
                                groupColumnValues.push(attrVal.map(val => val.name));
                        }
                        else if(['entity-mc', 'list'].includes(attr.type)) {
                            if(Array.isArray(attrVal))
                                groupColumnValues.push(attrVal);
                        }
                        else if(attr.type === 'entity') {                            
                            groupColumnValues.push([attrVal]);
                        }
                        // by default we add the value as an array with one element, since there are attribute types
                        // that have an array binding in json_val (e.g. daterange). The outer array will be exploded
                        // later when computing the distinct values for each group column
                        else {
                            groupColumnValues.push([
                                this.getValueToDisplay(attrVal, attr, context, -1, true)
                            ]);
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
                                count_list: 0,
                                sum: undefined,
                                max: undefined,
                                min: undefined
                            };
                        }
                        row[colIndex] = db.updateAggregateColumn(aggrColumns[i], row[colIndex], rowInfos[rowIndex][i], context, groupColumns, row);
                    }
                });
            });

            // NEWDATATYPE: might need some way to display the values of special data types
            // from the raw value
            r.body.forEach(row => {
                for(let i = 0; i < groupColumns.length; i++) {
                    if(row[i] === null) {
                        row[i] = { v: l10n.dbNull, s: null, e: '' };
                    }
                    else if(colAttrs[i].type === 'entity' || colAttrs[i].type === 'entity-mc') {
                        row[i] = db.getEntityDisplayObject(row[i]);
                    }
                    else if(colAttrs[i].type === 'url' && row[i]) {
                        row[i] = { v: row[i], s: row[i], e: row[i] };
                    }
                    else {
                        let cut = tryCutCellText(row[i], groupColumns[i]);
                        let val = cut.show;
                        if(cut.hide)
                            val += getShowMoreSpan(cut.hide, false, undefined, true)[0].outerHTML;
                        row[i] = { v: val, s: row[i], e: val };
                    }
                }
                linkListColumns.forEach(colIndex => {
                    let linkList = row[colIndex];
                    if(Array.isArray(linkList)) {
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
            // NEWDATATYPE: if new Transformation in Filter tab, extract value to compare from object value here
            let valueToCompare = value;
            switch(filter.transformation) {
                case 'rows':
                case 'count':
                    valueToCompare = 0;
                    if(Array.isArray(value))
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

                case 'date-start':
                    if(Array.isArray(value) && value.length == 2) // daterange must always have [start, end]
                        valueToCompare = value[0];
                    else
                        valueToCompare = undefined;
                    break;
                case 'date-end':
                    if(Array.isArray(value) && value.length == 2) // daterange must always have [start, end]
                        valueToCompare = value[1];
                    else
                        valueToCompare = undefined;
                    break;
                case 'date-span':
                    if(Array.isArray(value) && value.length == 2) // daterange must always have [start, end]
                        // calculate date difference in days
                        valueToCompare = (new Date(value[1]) - new Date(value[0])) / (1000 * 60 * 60 * 24);
                    else
                        valueToCompare = undefined;
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

                // user object for datatype 'userlist'
                case 'user-id':
                    if(value !== null && Array.isArray(value))
                        valueToCompare = value.map(u => u.id);
                    break;
                case 'user-name':
                    if(value !== null && Array.isArray(value))
                        valueToCompare = value.map(u => u.name);
                    break;                    
                case 'user-email':
                    if(value !== null && Array.isArray(value))
                        valueToCompare = value.map(u => u.email);
                    break;
                case 'user-nickname':
                    if(value !== null && Array.isArray(value))
                        valueToCompare = value.map(u => u.nickname);
                    break;

                default:
                    throw l10n.get('errorUnknownFilterTransformation', filter.transformation);
            }

            switch(filter.operator) {
                case 'equal':
                case 'not-equal': {
                    let checkEqual = (filter.operator === 'equal');
                    let isEqual = undefined;
                    if(Array.isArray(valueToCompare)) {
                        isEqual = valueToCompare.some(v => this.isEqualIgnoreCase(v, filter.values[0]));
                    }
                    else {
                        if(filter.dbAttribute.type === 'string-sc')
                            valueToCompare = this.tryResolveThesaurus(valueToCompare);
                        else if(filter.dbAttribute.isComputed)
                            valueToCompare = this.getThesaurusLabel(valueToCompare, valueToCompare);                    
                        isEqual = this.isEqualIgnoreCase(valueToCompare, filter.values[0]);
                    }
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
                    return typeof valueToCompare !== 'undefined' && valueToCompare !== null;

                case 'not-exist':
                    return typeof valueToCompare === 'undefined' || valueToCompare === null;

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
                        if(Array.isArray(valueToCompare)) // [{id:24, concept_url:"blah"}, ...]
                            found = valueToCompare.some(v => this.tryResolveThesaurus(v).toString().toLowerCase().indexOf(filter.values[0].toLowerCase()) !== -1);
                        return contain ? found : !found;
                    }
                    else if(filter.dbAttribute.type === 'string-sc')
                        valueToCompare = this.tryResolveThesaurus(valueToCompare);
                    else if(filter.dbAttribute.isComputed)
                        valueToCompare = this.getThesaurusLabel(valueToCompare, valueToCompare);
                    else if(filter.dbAttribute.type === 'list') {
                        let found = false;
                        if(Array.isArray(valueToCompare))
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
                    // NEWDATATYPE: if string-based (str_val in attribute_values), add here
                    if(['string', 'stringf', 'relation', 'richtext', 'url', 'serial', 'rism', 'iconclass'].indexOf(filter.dbAttribute.type) !== -1)
                        found = this.containIgnoreCase(valueToCompare, this.getThesaurusLabel(filter.values[0], filter.values[0]));
                    else if(Array.isArray(valueToCompare)) // string-mc : [{id:24, concept_url:"blah"}, ...]
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
                    if(!Array.isArray(valueToCompare)) { // single choice -> fake multiple choice
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
                case 'entity-not-equal':
                    if(filter.values[0] == '')
                        return false;
                    if(!Array.isArray(valueToCompare))
                        valueToCompare = [ valueToCompare ];
                    let not = filter.operator.includes('-not-');
                    let equals = valueToCompare.some(entity_id => {
                        return Number(entity_id) === Number(filter.values[0]);
                    });
                    return not ? !equals : equals;

                case 'entity-name-equal':
                case 'entity-name-not-equal':
                case 'entity-name-contain':
                case 'entity-name-not-contain': {
                    if(!Array.isArray(valueToCompare))
                        valueToCompare = [ valueToCompare ];
                    let not = filter.operator.includes('-not-');
                    let equals = valueToCompare.some(entity_id => {
                        let entity = db.contexts[entity_id];
                        if(!entity)
                            return false;                    
                        if(filter.operator.endsWith('-contain')) {
                            let contains = this.containIgnoreCase(entity.name, filter.values[0]);
                            return not ? !contains : contains;
                        }
                        return this.isEqualIgnoreCase(entity.name, filter.values[0]); 
                    });                    
                    return not? !equals : equals;
                }

                case 'entity-type-equal':
                case 'entity-type-not-equal': {
                    if(filter.values[0] == '')
                        return false;
                    if(!Array.isArray(valueToCompare))
                        valueToCompare = [ valueToCompare ];
                    let not = filter.operator.includes('-not-');                    
                    let equals = valueToCompare.some(entity_id => {
                        let entity = db.contexts[entity_id];
                        if(!entity)
                            return false;                    
                        return entity.contextType.id === Number(filter.values[0]);
                    });
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
                    if(!Array.isArray(attrValue) || attrValue.length === 0)
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
