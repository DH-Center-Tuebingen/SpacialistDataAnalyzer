const l10n_en = {
    // NEWDATATYPE: add human readable English datatype label
    attributeTypeLabels: {
        'integer': 'Integer',
        'percentage': 'Percentage',
        'double': 'Number',
        'si-unit': 'SI Unit',
        'boolean': 'Boolean',
        'string': 'Text',
        'stringf': 'Text',
        'richtext': 'Rich Text',
        'url': 'URL',
        'relation': 'Relation',
        'date': 'Date',
        'string-sc': 'Single Choice',
        'string-mc': 'Multiple Choice',
        'table': 'Table',
        'geometry': 'Geodata',
        'epoch': 'Epoch',
        'timeperiod': 'Timespan',
        'daterange': 'Date Range',
        'dimension': 'Dimension',
        'list': 'List',
        'entity': 'Entity',
        'serial': 'Serial ID',
        'userlist': 'User List',
        'entity-mc': 'Entity List'
    },
    contextTypeDisplayLabels: {
        table: 'Table',
        map: 'Geomap',
        count: 'Count'
    },
    attributeDisplayTypeLabels: {
        table: 'Table',
        count: 'Count',
        'count-list': 'Count of list entries',
        share: 'Share of occurrences',
        distribution: 'Distribution of values',
        sum: 'Sum of values',
        max: 'Maximum value',
        min: 'Minimum value',
        avg: 'Mean value',
        group: 'Group by this property',
        'list-links': 'List of links to entities',
        'list-entities': 'List of entities',
        'count-true': 'Count true values',
        'count-false': 'Count false values',
        'count-rows-total': 'Count total rows',
        'count-rows-avg': 'Count average number of rows',
        'sum-area': 'Sum of areas',
        'avg-area': 'Average area',
        'min-area': 'Lowest area',
        'max-area': 'Greatest area',
        'min-start': 'Earliest start time',
        'max-start': 'Latest start time',
        'avg-start': 'Average start time',
        'min-end': 'Earliest end time',
        'max-end': 'Latest end time',
        'avg-end': 'Average end time',
        'min-span': 'Shortest time span',
        'max-span': 'Longest time span',
        'avg-span': 'Average time span',
        'min-startdate': 'Earliest start date',
        'max-startdate': 'Latest start date',
        'min-enddate': 'Earliest end date',
        'max-enddate': 'Latest end date',
        'min-datespan': 'Smallest date range (days)',
        'max-datespan': 'Largest date range (days)',
        'avg-datespan': 'Average date range (days)',
        'avg-b': 'Average breadth',
        'min-b': 'Shortest breadth',
        'max-b': 'Longest breadth',
        'avg-h': 'Average height',
        'min-h': 'Shortest height',
        'max-h': 'Tallest height',
        'avg-t': 'Average depth',
        'min-t': 'Lowest depth',
        'max-t': 'Highest depth',
        'avg-3d': 'Average volume',
        'min-3d': 'Lowest volume',
        'max-3d': 'Highest volume',
        'avg-bh': 'Average breadth × height area',
        'min-bh': 'Smallest breadth × height area',
        'max-bh': 'Largest breadth × height area',
        'avg-bt': 'Average breadth × depth area',
        'min-bt': 'Smallest breadth × depth area',
        'max-bt': 'Largest breadth × depth area',
        'avg-ht': 'Average height × depth area',
        'min-ht': 'Smallest height × depth area',
        'max-ht': 'Largest height × depth area'
    },
    // NEWDATATYPE: if Transformation option in Filter tab available, add human readable English transformation label
    objectFilterLabels: {
        length: 'Number of characters',
        count: 'Count',
        rows: 'Number of rows',
        exist: 'Value exists',
        'not-exist': 'Value not exists',
        lower: 'Less than',
        'lower-equal': 'Less-than or equal',
        greater: 'Greater than',
        'greater-equal': 'Greater-than or equal',
        equal: 'Equals',
        'equal-thesaurus': 'Equals thesaurus concept',
        'not-equal': 'Not equals',
        'not-equal-thesaurus': 'Not equals thesaurus concept',
        contain: 'Contains',
        'contain-thesaurus': 'Contains thesaurus concept',
        'not-contain': 'Not contains',
        'not-contain-thesaurus': 'Not contains thesaurus concept',
        'descendant-thesaurus': 'Descendant of thesaurus concept',
        'not-descendant-thesaurus': 'Not descendant of thesaurus concept',
        'contain-descendant-thesaurus': 'Contains descendant of thesaurus concept',
        'not-contain-descendant-thesaurus': 'Not contains descendant of thesaurus concept',
        empty: 'Is empty',
        'not-empty': 'Is not empty',
        'dimension-b': 'Breadth',
        'dimension-h': 'Height',
        'dimension-t': 'Depth',
        'dimension-bh': 'Area: Breadth × Height',
        'dimension-bt': 'Area: Breadth × Depth',
        'dimension-ht': 'Area: Height × Depth',
        'dimension-bht': 'Volume',
        'dimension-unit': 'Unit (cm, m, …)',
        'epoch-start': 'Start time',
        'epoch-end': 'End time',
        'epoch-concept': 'Named Period',
        'epoch-timespan': 'Timespan',
        'date-start': 'Start date',
        'date-end': 'End date',        
        'date-span': 'Date span (days)',
        'geometry-type': 'Geometry Type',
        'geometry-area': 'Area',
        'geometry-wkt': 'WKT Representation',
        'entity-equal': 'Equals entity',
        'entity-not-equal': 'Not equals entity',
        'entity-name-equal': 'Entity name equals',
        'entity-name-not-equal': 'Entity name not equals',
        'entity-name-contain': 'Entity name contains',
        'entity-name-not-contain': 'Entity name not contains',
        'entity-type-equal': 'Has entity type',
        'entity-type-not-equal': 'Not has entity type',
        'user-id': 'ID',
        'user-name': 'Name',
        'user-email': 'Email Address',
        'user-nickname': 'Nickname'        
    },
    dbAttributeGeometry: 'Geometry',
    dbAttributeName: 'Name',
    dbAttributeID: 'ID',
    dbAttributeAncestry: 'Ancestor Entities',
    dbAttributeAncestryDegree: 'Degree',
    dbAttributeAncestryEntity: 'Entity',
    dbSpacialistLinkTitle: 'Click to view this %s entity in Spacialist',
    dbEntityDetailsTitle: 'Click to view details of this %s entity',
    dbResultPropertyNoValue: 'There are no values for this property',
    dbReloadTooltip: 'Refresh copy of the database for analysis',
    dbReloadModalTitle: 'Refresh Database',
    dbReloadModalTimestamp: 'Timestamp of last refresh: %s',
    dbReloadModalInfo: 'The analysis tool works with a cached copy of the database to speed up analysis. By clicking the Proceed button, the tool will refresh the database cache based on current live data. This will take a couple of seconds. After that, some data will be processed in the background, which may take several minutes. However, most of the data will be available for analysis during this background processing. During background processing the status line will read "Processing in background". Your current analysis settings will be lost. Do you want to proceed?',
    dbReloadModalOK: 'Proceed',
    dbReloadModalCancel: 'Cancel',
    dbEmptyHeading: 'Database is empty ☝',
    dbEmptyMessage: 'The database does not contain any entities, so there is nothing to analyze ☹',

    treeCaption: 'Database Structure <sup><a title="Help" target="_help" href="https://github.com/eScienceCenter/SpacialistDataAnalyzer/wiki/Database-Structure-Pane"></a></sup>',
    treeHideProperties: 'Hide Properties',
    treeShowProperties: 'Show Properties',
    treeHeadStructure: '',
    treeHeadOutput: 'Output',
    treeHeadFilter: 'Filter',
    treeHeadAggregate: 'Aggregate',

    analysisOptionsCaption: 'Analysis Options <sup><a title="Help" target="_help" href="https://github.com/eScienceCenter/SpacialistDataAnalyzer/wiki/Analysis-Options-Pane"></a></sup>',
    analysisClearButton: '✕ Clear',
    analysisSaveButton: '⇩ Save',
    analysisLoadButton: '⇪ Load',
    analysisClearButtonTooltip: 'Clear all analysis settings and the result',
    analysisSaveButtonTooltip: 'Save current analysis to a download file',
    analysisLoadButtonTooltip: 'Load analysis from file',
    analysisTabOutput: 'Output',
    analysisTabFilters: 'Filters',
    analysisTabAggregates: 'Aggregates',

    outputSelectHint: 'Select what kind of information you would like to display by picking an entity or property from the tree <a title="Help" target="_help" href="https://github.com/eScienceCenter/SpacialistDataAnalyzer/wiki/Analysis-Options-Pane#output-tab"></a>.',
    outputSelectedEntityType: 'You have selected entity type <b>%s</b> <a title="Help" target="_help" href="https://github.com/eScienceCenter/SpacialistDataAnalyzer/wiki/User-Manual#picking-an-output-object"></a>.',
    outputSelectedProperty: 'You have selected property <b>%s</b>%s of entity type <b>%s</b> <a title="Help" target="_help" href="https://github.com/eScienceCenter/SpacialistDataAnalyzer/wiki/User-Manual#picking-an-output-object"></a>.',
    outputSelectedPropertyParent:  ' of composite property <b>%s</b>',
    outputSelectPropertyDisplayType: 'Select what kind of information about this property shall be presented: ',
    outputSelectEntityDisplay: 'Select how the entities of this type shall be presented: ',
    outputHierarchicalAnalysis: 'Perform hierarchical analysis. If this box is checked, the hierarchical level of %s entities will be considered, and only those at the level selected in the tree will be considered for output. If this box is not checked, all %s entities in the database will be considered for output.',

    filterIntro: 'Define filters using the following table to limit the analysis focus on entities with specific property values <a title="Help" target="_help" href="https://github.com/eScienceCenter/SpacialistDataAnalyzer/wiki/Analysis-Options-Pane#filters-tab"></a>.',
    filterConjunctionHeading: 'Conjunction',
    filterAnd: 'And',
    filterOr: 'Or',
    filterAndOrCombine: 'Combined With',
    filterRemoveTooltip: 'Remove this filter',
    filterObjectSelectFromTree: 'Select from tree',
    filterObjectAttrParent: ' in %s',
    filterObjectAttrContextType: ' of %s',
    filterDiscardTableRows: "During the computation of aggregate values (e.g. <i>count</i>, <i>sum</i>, <i>maximum</i>, etc.), reduce <span class='outputObjectName'></span> tables to those rows that match the table's filters. (Note: this checkbox is only enabled if there is at least one filter on any table property of <span class='outputObjectName'></span>)",
    filterDiscardTableRowsOutputObjectNameTable: 'table %s',
    filterDiscardTableRowsOutputObjectNameEntity: 'the selected output entity',
    filterTableCols: {
        what: 'Property',
        transformation: 'Value Transformation',
        operator: 'Filter Operator',
        value: 'Filter Value'
    },
    filterAdd: 'Add A Filter',
    filterRemoveAll: 'Remove All Filters',
    filterNoDescendantConcepts: 'There are no concepts to choose from',

    groupIntro: 'You may define how to group and aggregate the resulting entities of type <b class="outputObjectName"></b> by the values of their properties <a title="Help" target="_help" href="https://github.com/eScienceCenter/SpacialistDataAnalyzer/wiki/Analysis-Options-Pane#aggregates-tab"></a>.',
    groupDropdownPlaceholder: 'No Grouping or Aggregation',
    groupReset: 'Reset',
    groupTableColProperty: 'Property of %s',
    groupTableColSelect: 'Select Grouping or Aggregate',

    resultToggleFullscreen: '◨ Toggle Fullscreen',
    resultDownloadGeoJson: '⏢ GeoJSON',
    resultToggleFullscreenTooltip: 'Toggle full screen display for result box',
    resultDownloadGeoJsonTooltip: 'Download result as GeoJSON file',
    resultShowTableModal: 'Show',
    resultShowTableModalTooltip: 'Show data table of this property',
    resultNone: 'Empty result',
    resultNoValue: 'No Value',
    resultNoCoordinates: 'The result contains %s entities, but none of them has geo coordinates.',
    resultGeoJsonNone: 'The table contains no entities with geo coordinates. Aborting GeoJSON download.',
    resultMapFitToContentTooltip: 'Fit map extent to displayed shapes',
    resultTableButtons: {
        excel: 'Excel',
        copy: 'Copy',
        print: 'Print',
        colvis: 'Columns'
    },
    resultTableButtonTooltips: {
        excel: 'Download table as Excel file',
        copy: 'Copy table to clipboard',
        print: 'Prepare table for printing',
        colvis: 'Select visible columns'
    },
    resultTableLimit: 'Limiting the table to the first %s of %s total entries. Please define filters or aggregates to reduce the number of results.',
    resultButtonLabel: 'Get Result',
    resultTableShowMore: '[show more]',
    resultTableShowMoreListItems: '[show remaining %s items]',
    resultTableHeadValue: 'Value',
    resultTableHeadCount: 'Count',

    statusAnalysisLoading: 'Loading analysis...',
    statusAnalysisReadFromFile: 'Loading Analysis from File...',
    statusAnalysisLoaded: 'Analysis loaded.',
    statusDownloadComplete: 'Download complete.',
    statusInitUI: 'Initializing User Interface',
    statusFetchDB: 'Fetching Database',
    statusLoadComputedProperties: 'Processing in background...',

    labelNone: 'None',
    labelLogout: 'Logout',
    labelLoading: 'Loading...',
    labelClickToSelect: 'Click to select',

    loginHint: 'Sign in with your Spacialist user account',
    loginEmail: 'Email Address or Nickname',
    loginPassword: 'Password',
    loginButton: 'Sign In',
    loginInvalid: 'Invalid email address, nickname or password!',
    loginLangTooltip: 'Select a language for this login page',

    entityDetailsChildEntities: 'Children: %s',
    entityDetailsHierarchyLabel: 'Hierarchy',
    entityDetailsHierarchyTopLevel: 'This is a top-level entity',
    entityDetailsShowInSpacialist: 'View this %s entity in Spacialist',
    entityDetailsHistoryPrev: 'Go back to previous entity in browsing history',
    entityDetailsHistoryNext: 'Go forward to next entity in browsing history',

    errorHeading: 'Error',
    errorContactWithInfo: 'Please contact the Spacialist guys with the following information: %s',
    errorLoadComputedProperties: 'There was an error loading computed properties. Please contact the Spacialist guys with the following information:\n\n%s',
    errorAnalysisLoadInvalid: 'Error: The specified file is not a valid Spacialist Data Analysis file!',
    errorAnalysisLoadOther: 'Error loading analysis.',
    errorContextTypeFilterNotImpl: 'Context type filtering not implemented',
    errorFilteringUnspecific: 'There is something wrong with the filtering; please contact your admin',
    errorUnknownOutputDisplayType: 'Unknown output display type',
    errorNotImpl: 'Not implemented yet',
    errorUnknownParentAttributeType: 'getAttributeValue encoutered unknown parent attribute type',
    errorUnknownFilterTransformation: 'Unknown filter transformation: %s',
    errorUnknownFilterOperator: 'Unknown filter operator: %s',
    errorMissingFilterOperators: 'One or more filter operators are not defined. These are mandatory!',

    thesaurusPickerHead: 'Thesaurus Picker: %s',
    thesaurusPickerSearchPlaceholder: 'Filter the thesaurus',
    thesaurusPickerOK: 'Pick',
    thesaurusPickerCancel: 'Cancel'
};
