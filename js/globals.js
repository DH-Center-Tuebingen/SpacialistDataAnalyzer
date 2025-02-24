var db;
var tree;
var analysis = {};
var masterTree;
var entitiesDropdown;
var EntityDetailsHiddenAttributes = [];
var DataTableElementInfos = {
    infos: [],
    add: function (data, click) {
        return this.infos.push({ data: data, click: click }) - 1;
    },
    get: function(index) {
        return this.infos[index];
    },
    clear: function () {
        this.infos = [];
    }
};
const Settings = {
    forceLiveDb: true, // determines whether database is fetched live upon each session start
    splitScreen: {
        analysisHeight: 35,
        treeCols: 4
    },
    resultTable: {
        textMaxChars: 200,
        entityLinkListMaxItems: 50,
        maxRows: 1000
    },
    mcSeparator: ' ⬥ ',
    epochSeparator: ' ⬥ ',
    dimensionSeparator: ' × ',
    jumpToFilterTabAfterOutputSelection: false,
    skipLoadingComputedAttributes: false,
    thesaurusPickerExpandAllMax: 100
};
const PseudoAttributes = { // These must match the context's attribute keys!
    ID: 'id',
    Name: 'name',
    GeoData: 'geoData'
};
const ResultTableIcons = {
    excel: '▦',
    copy: '⎘',
    print: '⎙',
    colvis: '▥'
};
const Symbols = {
    'box-checked': '☑',
    'box-unchecked': '☐',
    filter: 'Ұ',
    hourglass: '⏳',
    clear: '✕',
    upload: '⇪',
    download: '⇩',
    prev: '◁',
    next: '▷',
    add: '＋',
    remove: '✕',
    delete: '✕',
    longdash: '⸺',
    check: '✓',
    table: '⊞',
    map: '⚐',
    count: '#',
    share: '%',
    distribution: 'ƒ',
    sum: '∑',
    max: '⫪',
    min: '⫫',
    avg: '⌀',
    length: '⨪',
    rows: '▤',
    'list-links': '⇶',
    'list-entities': '☰',
    entity: '⍟',
    'entity-spacialist': '⟴',
    exist: '∃',
    'not-exist': '∄',
    lower: '<',
    'lower-equal': '≤',
    greater: '>',
    'greater-equal': '≥',
    equal: '=',
    'equal-thesaurus': '=',
    'not-equal': '≠',
    'not-equal-thesaurus': '≠',
    'entity-equal': '=',
    'entity-not-equal': '≠',
    'entity-name-equal': '=',
    'entity-name-not-equal': '≠',
    'entity-name-contain': '∋',
    'entity-name-not-contain': '∌',
    'entity-type-equal': '=',
    'entity-type-not-equal': '≠',
    contain: '∋',
    'contain-thesaurus': '∋',
    'not-contain': '∌',
    'not-contain-thesaurus': '∌',
    'descendant-thesaurus': '⇒',
    'not-descendant-thesaurus': '⇏',
    'contain-descendant-thesaurus': '⇒',
    'not-contain-descendant-thesaurus': '⇏',
    empty: '⍻',
    'not-empty': '✓',
    'dimension-b': '⇔',
    'dimension-h': '⇕',
    'dimension-t': '⇗',
    'dimension-bh': '⛶',
    'dimension-bt': '⛶',
    'dimension-ht': '⛶',
    'dimension-bht': '㎥',
    'dimension-unit': '⥱',
    'epoch-start': '►',
    'epoch-end': '◄',
    'epoch-concept': '⥈',
    'epoch-timespan': '⇎',
    'geometry-type': '⏢',
    'geometry-area': '⛶',
    'geometry-wkt': '¶',
    group: '☍',
    'count-true': '#',
    'count-false': '#',
    'count-rows-total': '#',
    'count-rows-avg': '#',
    'sum-area': '∑',
    'avg-area': '⌀',
    'min-area': '⫫',
    'max-area': '⫪',
    'min-start': '⫫',
    'max-start': '⫪',
    'avg-start': '⌀',
    'min-end': '⫫',
    'max-end': '⫪',
    'avg-end': '⌀',
    'min-span': '⫫',
    'max-span': '⫪',
    'avg-span': '⌀',
    'avg-b': '⌀',
    'min-b': '⫫',
    'max-b': '⫪',
    'avg-h': '⌀',
    'min-h': '⫫',
    'max-h': '⫪',
    'avg-t': '⌀',
    'min-t': '⫫',
    'max-t': '⫪',
    'avg-3d': '⌀',
    'min-3d': '⫫',
    'max-3d': '⫪',
    'avg-bh': '⌀',
    'min-bh': '⫫',
    'max-bh': '⫪',
    'avg-bt': '⌀',
    'min-bt': '⫫',
    'max-bt': '⫪',
    'avg-ht': '⌀',
    'min-ht': '⫫',
    'max-ht': '⫪'
};
const AttributeTypeSymbols = {
    'integer': 'ℤ',
    'double': 'ℝ',
    'si-unit': 'Ω',
    'percentage': '%',
    'boolean': '◧',
    'string': '¶',
    'stringf': '¶',
    'richtext': '¶',
    'url': '⟴',
    'relation': '⎌',
    'date': '▣',
    'string-sc': '·',
    'string-mc': '⋮',
    'table': '⊞',
    'geometry': '⏢',
    'epoch': '⥈',
    'timeperiod': '↦',
    'dimension': '⛶',
    'list': '☰',
    'entity': '⍟'    
}
const AttributeDisplayTypeMapping = {
    'integer': [ 'count', 'distribution', 'min', 'max', 'sum', 'avg' ],
    'double': [ 'count', 'distribution', 'min', 'max', 'sum', 'avg' ],
    'si-unit': [ 'count', 'distribution', 'min', 'max', 'sum', 'avg' ],
    'percentage': [ 'count', 'distribution', 'min', 'max', 'sum', 'avg' ],
    'boolean': [ 'count', 'distribution' ],
    'string': [ 'count', 'distribution' ],
    'stringf': [ 'count', 'distribution' ],
    'richtext': [ 'count', 'distribution' ],
    'url': [ 'count', 'distribution' ],
    'relation': [ 'count', 'distribution' ],
    'date': [ 'count', 'distribution', 'min', 'max' ],
    'string-sc': [ 'count', 'distribution' ],
    'string-mc': [ 'count', 'distribution' ],
    'table': [ 'count' ],
    'geometry': [ 'count' ], // TODO : sum-area, etc. (in db.getDescriptiveStatsForAttribute)
    'epoch': [ 'count', 'distribution' ],
    'timeperiod': [ 'count', 'distribution' ],
    'dimension': [ 'count', 'distribution' ],
    'list': [ 'count', 'distribution' ],
    'entity': [ 'count', 'distribution' ]
};
const AttributeGroupMapping = {
    'integer': [ 'group', 'count', 'min', 'max', 'sum', 'avg' ],
    'double': [ 'group', 'count', 'min', 'max', 'sum', 'avg' ],
    'si-unit': [ 'group', 'count', 'min', 'max', 'sum', 'avg' ],
    'percentage': [ 'group', 'count', 'min', 'max', 'sum', 'avg' ],
    'boolean': [ 'group', 'count', 'count-true', 'count-false' ],
    'string': [ 'group', 'count' ],
    'stringf': [ 'group', 'count' ],
    'richtext': [ 'group', 'count' ],
    'url': [ 'group', 'count' ],
    'string-sc': [ 'group', 'count' ],
    'relation': [ 'group', 'count' ],
    'date': [ 'group', 'count', 'min', 'max' ],
    'string-mc': [ 'group', 'count' ],
    'table': [ 'count', 'count-rows-total', 'count-rows-avg' ],
    'geometry': [ 'group', 'count', 'sum-area', 'avg-area', 'min-area', 'max-area' ],
    'epoch': [ 'group', 'count', 'min-start', 'max-start', 'avg-start', 'min-end', 'max-end', 'avg-end', 'min-span', 'max-span', 'avg-span' ],
    'timeperiod': [ 'group', 'count', 'min-start', 'max-start', 'avg-start', 'min-end', 'max-end', 'avg-end', 'min-span', 'max-span', 'avg-span' ],
    'dimension': [ 'count', 'avg-b', 'avg-h', 'avg-t', 'max-b', 'max-h', 'max-t', 'min-b', 'min-h', 'min-t',
        'min-bh', 'max-bh', 'avg-bh',
        'min-bt', 'max-bt', 'avg-bt',
        'min-ht', 'max-ht', 'avg-ht',
        'min-3d', 'max-3d', 'avg-3d' ],
    'list': ['group', 'count'],
    'entity': [ 'group', 'count' ]
};
// map an aggregator to a type that can be used with ObjectFilterOperatorMapping
const ObjectFilterTransformations = {
    Attribute: {
        'string': {
            length: 'integer'
        },
        'stringf': {
            length: 'integer'
        },
        'richtext': {
            length: 'integer'
        },
        'url': {
            length: 'integer'
        },
        'table': {
            rows: 'integer'
        },
        'string-mc': {
            count: 'integer'
        },
        'list': {
            count: 'integer'
        },
        'dimension': {
            'dimension-b': 'double',
            'dimension-h': 'double',
            'dimension-t': 'double',
            'dimension-bh': 'double',
            'dimension-bt': 'double',
            'dimension-ht': 'double',
            'dimension-bht': 'double',
            'dimension-unit': 'string'
        },
        'epoch': {
            'epoch-start': 'integer',
            'epoch-end': 'integer',
            'epoch-concept': 'string',
            'epoch-timespan': 'integer'
        },
        'timeperiod': {
            'epoch-start': 'integer',
            'epoch-end': 'integer',
            'epoch-timespan': 'integer'
        },
        'geometry': {
            'geometry-type': 'string',
            'geometry-area': 'double',
            'geometry-wkt': 'string'
        }
    }
};
// filter types for the different attribute types and context types
const ObjectFilterOperatorMapping = {
    'integer':      [ 'equal', 'not-equal', 'exist', 'not-exist', 'lower', 'lower-equal', 'greater', 'greater-equal' ],
    'percentage':   [ 'equal', 'not-equal', 'exist', 'not-exist', 'lower', 'lower-equal', 'greater', 'greater-equal' ],
    'double':       [ 'equal', 'not-equal', 'exist', 'not-exist', 'lower', 'lower-equal', 'greater', 'greater-equal' ],
    'si-unit':       [ 'equal', 'not-equal', 'exist', 'not-exist', 'lower', 'lower-equal', 'greater', 'greater-equal' ],
    'boolean':      [ 'equal', 'not-equal', 'exist', 'not-exist' ],
    'relation':     [ 'contain', 'not-contain', 'equal', 'not-equal', 'equal-thesaurus', 'not-equal-thesaurus', 'contain-thesaurus', 'not-contain-thesaurus', 'exist', 'not-exist', 'not-empty' ],
    'string':       [ 'contain', 'not-contain', 'equal', 'not-equal', 'equal-thesaurus', 'not-equal-thesaurus', 'contain-thesaurus', 'not-contain-thesaurus', 'exist', 'not-exist', 'not-empty' ],
    'stringf':      [ 'contain', 'not-contain', 'equal', 'not-equal', 'equal-thesaurus', 'not-equal-thesaurus', 'contain-thesaurus', 'not-contain-thesaurus', 'exist', 'not-exist', 'not-empty' ],
    'richtext':     [ 'contain', 'not-contain', 'equal', 'not-equal', 'equal-thesaurus', 'not-equal-thesaurus', 'contain-thesaurus', 'not-contain-thesaurus', 'exist', 'not-exist', 'not-empty' ],
    'url':          [ 'contain', 'not-contain', 'equal', 'not-equal', 'equal-thesaurus', 'not-equal-thesaurus', 'contain-thesaurus', 'not-contain-thesaurus', 'exist', 'not-exist', 'not-empty' ],
    'date':         [ 'equal', 'not-equal', 'exist', 'not-exist', 'lower', 'lower-equal', 'greater', 'greater-equal' ],
    'string-mc':    [ 'contain-thesaurus', 'not-contain-thesaurus', 'contain-descendant-thesaurus', 'not-contain-descendant-thesaurus', 'contain', 'not-contain', 'exist', 'not-exist' ],
    'string-sc':    [ 'equal-thesaurus', 'not-equal-thesaurus', 'descendant-thesaurus', 'not-descendant-thesaurus', 'contain', 'not-contain', 'equal', 'not-equal', 'exist', 'not-exist' ],
    'table':        [ 'exist', 'not-exist' ],
    'list':         [ 'contain', 'not-contain', 'exist', 'not-exist' ],
    'entity':       [ 'exist', 'not-exist', 'entity-equal', 'entity-not-equal', 'entity-name-equal', 'entity-name-not-equal', 'entity-name-contain', 'entity-name-not-contain', 'entity-type-equal', 'entity-type-not-equal' ]
};
