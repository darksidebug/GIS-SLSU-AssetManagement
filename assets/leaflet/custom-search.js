// refer to the IControl interface
// http://leafletjs.com/reference.html#icontrol
// sample influenced by leaflet-geocoder
// https://github.com/perliedman/leaflet-control-geocoder

function sortBuilding(a, b) {
	var _a = a.feature.properties.BLDG_NAME;
	var _b = b.feature.properties.BLDG_NAME;
	if (_a < _b) {
	  return -1;
	}
	if (_a > _b) {
	  return 1;
	}
	return 0;
  }
  
  L.Control.Search = L.Control.extend({
	options: {
	  // topright, topleft, bottomleft, bottomright
	  position: 'topright',
	  placeholder: 'Search...'
	},
	initialize: function (options /*{ data: {...}  }*/) {
	  // constructor
	  L.Util.setOptions(this, options);
	},
	onRemove: function (map) {
	  // when removed
	  L.DomEvent.removeListener(this._input, 'keyup', this.keyup, this);
	  L.DomEvent.removeListener(form, 'submit', this.submit, this);
	},
	keyup: function(e) {
	  if (e.keyCode === 38 || e.keyCode === 40) {
		// do nothing
	  } else {
		this.results.innerHTML = '';
		if (this.input.value.length > 2) {
		  var value = this.input.value;
		  var results = _.take(_.filter(this.options.data, function(x) {
			return x.feature.properties.BLDG_NAME.toUpperCase().indexOf(value.toUpperCase()) > -1;
		  }).sort(sortBuilding), 10);
		  _.map(results, function(x) {
			var a = L.DomUtil.create('a', 'list-group-item');
			a.href = '';
			a.setAttribute('data-result-name', x.feature.properties.BLDG_NAME);
			a.innerHTML = x.feature.properties.BLDG_NAME;
			this.results.appendChild(a);
			L.DomEvent.addListener(a, 'click', this.itemSelected, this);
			return a;
		  }, this);
		}
	  }
	},
	itemSelected: function(e) {
	  L.DomEvent.preventDefault(e);
	  var elem = e.target;
	  var value = elem.innerHTML;
	  this.input.value = elem.getAttribute('data-result-name');
	  var feature = _.find(this.options.data, function(x) {
		return x.feature.properties.park === this.input.value;
	  }, this);
	  if (feature) {
		this._map.fitBounds(feature.getBounds());
	  }
	  this.results.innerHTML = '';
	},
	submit: function(e) {
	  L.DomEvent.preventDefault(e);
	}
  });
  
  L.control.search = function(id, options) {
	return new L.Control.Search(id, options);
  }
  