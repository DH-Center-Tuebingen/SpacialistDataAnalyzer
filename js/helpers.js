// ------------------------------------------------------------------------------------
Object.forEach || Object.defineProperty(Object.prototype, 'forEach', {
// ------------------------------------------------------------------------------------
    enumerable: false,
    value: function(callback) {
        let i = 0;
        for(let k in this)
            if(this.hasOwnProperty(k))
                callback(k, i++);
        return this;
    }
});

// ------------------------------------------------------------------------------------
Object.forEachValue || Object.defineProperty(Object.prototype, 'forEachValue', {
// ------------------------------------------------------------------------------------
    enumerable: false,
    value: function(callback, canBreak = false) {
        for(let k in this)
            if(this.hasOwnProperty(k)) {
                let r = callback(k, this[k]);
                if(canBreak && r === false)
                    break;
            }
        return this;
    }
});

// ------------------------------------------------------------------------------------
Object.countProperties || Object.defineProperty(Object.prototype, 'countProperties', {
// ------------------------------------------------------------------------------------
    enumerable: false,
    value: function(callback) {
        if(typeof callback === 'function') {
            callback(Object.keys(this).length);
            return this;
        }
        return Object.keys(this).length;
    }
});

// ------------------------------------------------------------------------------------
String.with || Object.defineProperty(String.prototype, 'with', {
// ------------------------------------------------------------------------------------
    enumerable: false,
    value: function() {
        let s = String(this);
        for(let i = 0; i < arguments.length; i++)
            s = s.replace('%s', arguments[i]);
        return s;
    }
});

// ------------------------------------------------------------------------------------
$.fn.setElementInfo = function(data, click) {
// ------------------------------------------------------------------------------------
    let table = $(this[0]);
    let xinfo = table.data('xinfo');
    if(!xinfo)
        xinfo = table.data('xinfo', []).data('xinfo');
    return xinfo.push({ data, click }) - 1;
}

// ------------------------------------------------------------------------------------
$.fn.getElementInfo = function(index) {
// ------------------------------------------------------------------------------------
    return $(this[0]).data('xinfo')[index];
}

// ------------------------------------------------------------------------------------
function get_checkbox(attr, data, checked, label, change_handler) {
// ------------------------------------------------------------------------------------
    let allAttr = $.extend({}, attr, { type: 'checkbox' });
    let box = $('<input/>').addClass('form-check-input').attr(allAttr).prop('checked', checked).change(change_handler);
    return $('<label/>').append(box).append($('<span/>').text(' ' + label)).addClass('form-check-label');
}


// ------------------------------------------------------------------------------------
function get_select(attr, data, options, change_handler) {
// ------------------------------------------------------------------------------------
    let s = $('<select/>').addClass('form-control');
    if(attr)
        s.attr(attr);
    if(data)
        s.data(data);
    !options || options.forEach((option) => {
        let o = $('<option/>').attr('value', option.value).text(option.label);
        if(option.data)
            o.data(option.data);
        s.append(o);
    });
    if(change_handler)
        s.change(change_handler);
    return s;
}

// ------------------------------------------------------------------------------------
function get_textbox(attr, data) {
// ------------------------------------------------------------------------------------
    let input = $('<input/>').addClass('form-control');
    if(attr) input.attr(attr);
    if(data) input.data(data);
    input.attr('type', 'textbox');
    return input;
}

// ------------------------------------------------------------------------------------
function get_button(label, click, attr) {
// ------------------------------------------------------------------------------------
    let btn = $('<button/>').text(label).addClass('btn').click(click);
    if(attr) btn.attr(attr);
    return btn;
}

// ------------------------------------------------------------------------------------
function get_result_button(label, click, inPara) {
// ------------------------------------------------------------------------------------
    let btn = get_button(label, click).addClass('btn-primary result-button');
    return inPara ? $('<p/>').append(btn) : btn;
}

// ------------------------------------------------------------------------------------
function debugStartTiming() {
// ------------------------------------------------------------------------------------
    return new Date();
}

// ------------------------------------------------------------------------------------
function debugGetElapsedSeconds(start) {
// ------------------------------------------------------------------------------------
    let diff = new Date() - start; // in ms
    return diff / 1000.;
}

// --------------------------------------------------------------------------------- */
Array.equals || Object.defineProperty(Array.prototype, 'equals', {
// ------------------------------------------------------------------------------------
    enumerable: false,
    value: function (other) {
        if(!other || this.length != other.length)
            return false;
        for(let i = this.length - 1; i >= 0; i--)
            if(this[i] !== other[i])
                return false;
        return true;
    }
});

// --------------------------------------------------------------------------------- */
Array.beginsWith || Object.defineProperty(Array.prototype, 'beginsWith', {
// ------------------------------------------------------------------------------------
    enumerable: false,
    value: function (other) {
        if(!other || this.length < other.length)
            return false;
        for(let i = other.length - 1; i >= 0; i--)
            if(this[i] !== other[i])
                return false;
        return true;
    }
});

// --------------------------------------------------------------------------------- */
Array.endsWith || Object.defineProperty(Array.prototype, 'endsWith', {
// ------------------------------------------------------------------------------------
    enumerable: false,
    value: function (other) {
        if(!other || this.length < other.length)
            return false;
        let lengthDiff = this.length - other.length;
        for(let i = other.length - 1; i >= 0; i--)
            if(this[i + lengthDiff] !== other[i])
                return false;
        return true;
    }
});

// ------------------------------------------------------------------------------------
function createDownloadFile(mime, data, filename) {
// ------------------------------------------------------------------------------------
    let uri = 'data:' + mime + ';charset=utf-8,' + encodeURIComponent(data);
    let link = document.createElement('a');
    link.href = uri;
    link.style = "visibility: hidden";
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ------------------------------------------------------------------------------------
function createGeoJSONDownloadFile(data, filename) {
// ------------------------------------------------------------------------------------
    createDownloadFile('application/geo+json', data, filename);
}
