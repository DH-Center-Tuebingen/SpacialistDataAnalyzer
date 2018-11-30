const l10n_en = {
    attributeTypeLabels: {
        integer: 'Integer',
        double: 'Number',
        boolean: 'Boolean',
        string: 'Text',
        stringf: 'Text',
        relation: 'Relation',
        date: 'Date',
        'string-sc': 'Single Choice',
        'string-mc': 'Multiple Choice',
        table: 'Table',
        geometry: 'Geometry',
        epoch: 'Epoch',
        dimension: 'Dimension'
    },
    contextTypeDisplayLabels: {
        table: 'Table',
        map: 'Geomap',
        count: 'Count'
    },
    attributeDisplayTypeLabels: {
        table: 'Table',
        count: 'Count',
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
        'avg-bh': 'Average breadth x height area',
        'min-bh': 'Smallest breadth x height area',
        'max-bh': 'Largest breadth x height area',
        'avg-bt': 'Average breadth x depth area',
        'min-bt': 'Smallest breadth x depth area',
        'max-bt': 'Largest breadth x depth area',
        'avg-ht': 'Average height x depth area',
        'min-ht': 'Smallest height x depth area',
        'max-ht': 'Largest height x depth area'
    },
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
        'geometry-type': 'Geometry Type',
        'geometry-area': 'Area',
        'geometry-wkt': 'WKT Representation',
    },
    dbAttributeGeometry: 'Geometry',
    dbAttributeName: 'Name',
    dbAttributeID: 'ID',
    dbSpacialistLinkTitle: 'Click to view this %s entity in Spacialist',
    dbEntityDetailsTitle: 'Click to view details of this %s entity',
    dbResultPropertyNoValue: 'There are no values for this property',
    dbReloadTooltip: 'Refresh copy of the database for analysis',
    dbReloadModalTitle: 'Refresh Database',
    dbReloadModalTimestamp: 'Timestamp of last refresh: %s',
    dbReloadModalInfo: 'The analysis tool works with a cached copy of the database to speed up analysis. By clicking the Proceed button, the tool will refresh the database cache based on current live data. This will take a couple of seconds. After that, some data will be processed in the background, which may take several minutes. However, most of the data will be available for analysis during this background processing. During background processing the status line will read "Processing in background". Your current analysis settings will be lost. Do you want to proceed?',
    dbReloadModalOK: 'Proceed',
    dbReloadModalCancel: 'Cancel',

    treeCaption: 'Database Structure',
    treeHideProperties: 'Hide Properties',
    treeShowProperties: 'Show Properties',
    treeHeadOutput: 'Output',
    treeHeadFilter: 'Filter',
    treeHeadAggregate: 'Aggregate',

    analysisOptionsCaption: 'Analysis Options',
    analysisClearButton: '🞬 Clear',
    analysisSaveButton: '🖫 Save',
    analysisLoadButton: '⮬ Load',
    analysisClearButtonTooltip: 'Clear all analysis settings and the result',
    analysisSaveButtonTooltip: 'Save current analysis to a download file',
    analysisLoadButtonTooltip: 'Load analysis from file',
    analysisTabOutput: 'Output',
    analysisTabFilters: 'Filters',
    analysisTabAggregates: 'Aggregates',

    outputSelectHint: 'Select what kind of information you would like to display by picking an entity or property from the tree.',
    outputSelectedEntityType: 'You have selected entity type <b>%s</b>.',
    outputSelectedProperty: 'You have selected property <b>%s</b>%s of entity type <b>%s</b>.',
    outputSelectedPropertyParent:  ' of composite property <b>%s</b>',
    outputSelectPropertyDisplayType: 'Select what kind of information about this property shall be presented: ',
    outputSelectEntityDisplay: 'Select how the entities of this type shall be presented: ',
    outputHierarchicalAnalysis: 'Perform hierarchical analysis. If this box is checked, the hierarchical level of %s entities will be considered, and only those at the level selected in the tree will be considered for output. If this box is not checked, all %s entities in the database will be considered for output.',

    filterIntro: 'Define filters using the following table to limit the analysis focus on entities with specific property values. You can add, remove and rearrange filters for various properties. To define a filter for the highlighted (yellow) row, select a property from the tree. To highlight another filter row, simply click it. You can rearrange the order of filters by dragging and dropping a table row. Each filter will be interpreted according to the hierarchical position of its property selected from the the tree.',
    filterConjunctionHeading: 'Conjunction',
    filterAndOrCombine: 'Combined With',
    filterRemoveTooltip: 'Remove this filter',
    filterObjectAttrParent: ' in %s',
    filterObjectAttrContextType: ' of %s',
    filterDiscardTableRows: "During the computation of aggregate values (e.g. <i>count</i>, <i>sum</i>, <i>maximum</i>, etc.), reduce <span class='outputObjectName'></span> tables to those rows that match the table's filters. (Note: this checkbox is only enabled if there is at least one filter on any table property of <span class='outputObjectName'></span>)",
    filterDiscardTableRowsOutputObjectNameTable: 'table %s',
    filterDiscardTableRowsOutputObjectNameEntity: 'the selected output entity',
    filterTableCols: {
        what: 'Entity Type / Property',
        transformation: 'Value Transformation',
        operator: 'Filter Operator',
        value: 'Filter Value'
    },
    filterAdd: 'Add A Filter',
    filterRemoveAll: 'Remove All Filters',
    filterNoDescendantConcepts: 'There are no concepts to choose from',

    groupIntro: 'You may define how to group and aggregate the resulting entities of type <b class="outputObjectName"></span> by the values of their properties. For each unique combination of the grouped properties, you can define what kind of aggregate properties (e.g. the mean value or sum of values of a property) you would like to see in the output table. Note that all properties that are selected neither for grouping nor aggregation will be omitted from the output table.',
    groupDropdownPlaceholder: 'No Grouping or Aggregation',
    groupReset: 'Reset',
    groupTableColProperty: 'Property of %s',
    groupTableColSelect: 'Select Grouping or Aggregate',

    resultToggleFullscreen: '◨ Toggle Fullscreen',
    resultDownloadGeoJson: '🖫 GeoJSON',
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

    loginHint: 'Sign in with your Spacialist user account',
    loginEmail: 'Email Address',
    loginPassword: 'Password',
    loginButton: 'Sign In',
    loginInvalid: 'Invalid email address or password!',
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
};