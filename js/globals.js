var db;
var tree;
var analysis = {};
var masterTree;
var DataTableElementInfos = {
    infos: [],
    count: 0,
    add: function (data, click) {
        this.count++;
        return this.infos.push({ data: data, click: click }) - 1;
    },
    get: function(index) {
        return this.infos[index];
    },
    remove: function(index) {
        delete this.infos[index];
        if(--this.count === 0)
            this.infos = []; // if has grown, we reset it now so it gets zero length
    },
    clear: function () {
        this.infos = [];
        this.count = 0;
    }
};
const Settings = {
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
    dimensionSeparator: ' × '
};
const PseudoAttributes = { // These must match the context's attribute keys!
    ID: 'id',
    Name: 'name',
    GeoData: 'geoData'
};
const ResultTableIcons = {
    excel: '🖫',
    copy: '⎘',
    print: '⎙',
    colvis: '▥'
};
const Symbols = {
    prev: '◁',
    next: '▷',
    add: '＋',
    remove: '🞬',
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
    avg: '𝜇',
    length: '⨪',
    rows: '☰',
    'list-links': '🗗',
    'list-entities': '☷',
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
    'dimension-b': '⭲',
    'dimension-h': '⭱',
    'dimension-t': '⭷',
    'dimension-bh': '⛶',
    'dimension-bt': '⛶',
    'dimension-ht': '⛶',
    'dimension-bht': '㎥',
    'dimension-unit': '⥱',
    'epoch-start': '►',
    'epoch-end': '◄',
    'epoch-concept': '⥈',
    'epoch-timespan': '🡘',
    'geometry-type': '�',
    'geometry-area': '⛶',
    'geometry-wkt': '𝑇',
    group: '☍',
    'count-true': '#',
    'count-false': '#',
    'count-rows-total': '#',
    'count-rows-avg': '#',
    'sum-area': '∑',
    'avg-area': '𝜇',
    'min-area': '⫫',
    'max-area': '⫪',
    'min-start': '⫫',
    'max-start': '⫪',
    'avg-start': '𝜇',
    'min-end': '⫫',
    'max-end': '⫪',
    'avg-end': '𝜇',
    'avg-b': '𝜇',
    'min-b': '⫫',
    'max-b': '⫪',
    'avg-h': '𝜇',
    'min-h': '⫫',
    'max-h': '⫪',
    'avg-t': '𝜇',
    'min-t': '⫫',
    'max-t': '⫪',
    'avg-3d': '𝜇',
    'min-3d': '⫫',
    'max-3d': '⫪',
    'avg-bh': '𝜇',
    'min-bh': '⫫',
    'max-bh': '⫪',
    'avg-bt': '𝜇',
    'min-bt': '⫫',
    'max-bt': '⫪',
    'avg-ht': '𝜇',
    'min-ht': '⫫',
    'max-ht': '⫪'
};
const AttributeDisplayTypeMapping = {
    'integer': [ 'count', 'distribution', 'min', 'max', 'sum', 'avg' ],
    'double': [ 'count', 'distribution', 'min', 'max', 'sum', 'avg' ],
    'boolean': [ 'count', 'distribution' ],
    'string': [ 'count', 'distribution' ],
    'stringf': [ 'count', 'distribution' ],
    'relation': [ 'count', 'distribution' ],
    'date': [ 'count', 'distribution', 'min', 'max' ],
    'string-sc': [ 'count', 'distribution' ],
    'string-mc': [ 'count', 'distribution' ],
    'table': [ 'count' ],
    'geometry': [ 'count' ], // TODO : sum-area, etc. (in db.getDescriptiveStatsForAttribute)
    'epoch': [ 'count', 'distribution' ], 
    'dimension': [ 'count', 'distribution' ]
};
const AttributeGroupMapping = {
    'integer': [ 'group', 'count', 'min', 'max', 'sum', 'avg' ],
    'double': [ 'group', 'count', 'min', 'max', 'sum', 'avg' ],
    'boolean': [ 'group', 'count', 'count-true', 'count-false' ],
    'string': [ 'group', 'count' ],
    'stringf': [ 'group', 'count' ],
    'string-sc': [ 'group', 'count' ],
    'relation': [ 'group', 'count' ],
    'date': [ 'group', 'count', 'min', 'max' ],
    'string-mc': [ 'group', 'count' ],
    'table': [ 'count', 'count-rows-total', 'count-rows-avg' ],
    'geometry': [ 'group', 'count', 'sum-area', 'avg-area', 'min-area', 'max-area' ],
    'epoch': [ 'group', 'count', 'min-start', 'max-start', 'avg-start', 'min-end', 'max-end', 'avg-end' ],
    'dimension': [ 'count', 'avg-b', 'avg-h', 'avg-t', 'max-b', 'max-h', 'max-t', 'min-b', 'min-h', 'min-t',
        'min-bh', 'max-bh', 'avg-bh',
        'min-bt', 'max-bt', 'avg-bt',
        'min-ht', 'max-ht', 'avg-ht',
        'min-3d', 'max-3d', 'avg-3d' ]
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
        'table': {
            rows: 'integer'
        },
        'string-mc': {
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
    'double':       [ 'equal', 'not-equal', 'exist', 'not-exist', 'lower', 'lower-equal', 'greater', 'greater-equal' ],
    'boolean':      [ 'equal', 'not-equal', 'exist', 'not-exist' ],
    'string':       [ 'equal', 'not-equal', 'equal-thesaurus', 'not-equal-thesaurus', 'contain', 'not-contain', 'contain-thesaurus', 'not-contain-thesaurus', 'exist', 'not-exist', 'not-empty' ],
    'stringf':      [ 'equal', 'not-equal', 'equal-thesaurus', 'not-equal-thesaurus', 'contain', 'not-contain', 'contain-thesaurus', 'not-contain-thesaurus', 'exist', 'not-exist', 'not-empty' ],
    'date':         [ 'equal', 'not-equal', 'exist', 'not-exist', 'lower', 'lower-equal', 'greater', 'greater-equal' ],
    'string-mc':    [ 'contain', 'not-contain', 'contain-thesaurus', 'not-contain-thesaurus', 'contain-descendant-thesaurus', 'not-contain-descendant-thesaurus', 'exist', 'not-exist' ],
    'string-sc':    [ 'equal', 'not-equal', 'equal-thesaurus', 'not-equal-thesaurus', 'contain', 'not-contain', 'descendant-thesaurus', 'not-descendant-thesaurus', 'exist', 'not-exist' ],
    'table':        [ 'exist', 'not-exist' ]
};
