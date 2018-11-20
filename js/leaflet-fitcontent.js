//======================================================================================
L.Control.FitContent = L.Control.extend({
//======================================================================================
    options: {
        feature_group: null,
        position: 'topleft',
        tooltip: ''
    },

    //--------------------------------------------------------------------------------------
    onAdd: function(map) {
    //--------------------------------------------------------------------------------------
        this._div = L.DomUtil.create('div', 'leaflet-control leaflet-bar');
        if(!this.options.feature_group)
            return this._div;
        let button = L.DomUtil.create('a', 'leaflet-fitbounds', this._div);
        button.href = '#';
        button.role = 'button';
        button.title = this.options.tooltip;
        button.innerHTML = '⛶';
        L.DomEvent.addListener(button, 'click', () => {
            map.fitBounds(this.options.feature_group.getBounds().pad(.05), {
                animate: true,
                duration: .5
            });
        });
        return this._div;
    }
});
//--------------------------------------------------------------------------------------
L.control.fitContent = function(options) {
    return new L.Control.FitContent(options);
};
