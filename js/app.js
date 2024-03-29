let labelIndex = 0;
//

const categories = [
	{  // yep
		name: "Smoke Shop",
		codePointIcon: "\ueb4b",
		icon: "radar/radar_bar.png"
	},
	/* {
		name: "Caffeine",
		codePointIcon: "\uea0b",
		icon: "radar/radar_bar.png"
	},
	{
		name: "Medical",
		codePointIcon: "\uf109",
		icon: "radar/radar_hospital.png"
	},
	{
		name: "Surplus",
		codePointIcon: "\ue9e0",
		icon: "radar/radar_bar.png"
	},
	*/
	{
		name: "Electronics",
		codePointIcon: "\ue325",
		icon: "radar/radar_bar.png"
	},
	{
		name: "Hardware & Tools",
		codePointIcon: "\uea3c",
		icon: "radar/radar_bar.png"
	},
	{
		name: "Outdoor & Survival",
		codePointIcon: "\ue50a",
		icon: "radar/radar_bar.png"
	}, 
	{ // yep
		name: "Automotive",
		icon: "radar/radar_bar.png",
		codePointIcon: '\uf100',
	},
	/* {
		name: "Sporting Goods",
		codePointIcon: "\uea2f",
		icon: "radar/radar_bar.png"
	}, */
	{  // yep
		name: "Agriculture",
		icon: "radar/radar_bar.png",
		codePointIcon: '\ueacc'
	},
	/* {
		name: "Event Supplies",
		codePointIcon: "\uea65",
		icon: "radar/radar_bar.png"
	}, */
	{  // yep
		name: "Jewelry",
		codePointIcon: "\uead5",
		icon: "radar/radar_bar.png"
	},
	{ // yep
		name: "Materials",
		icon: "radar/radar_garage.png",
		codePointIcon: '\ue760',
	},
	{
		name: "Dispensary",
		codePointIcon: '\uf205',
		icon: "radar/radar_hospital.png"
	},
	{  // yep
		name: "Restaurant",
		icon: "radar/radar_bar.png",
		codePointIcon: '\ue56c'
	},
	{  // yep
		name: "Coffee Shop",
		codePointIcon: "\ue541",
		icon: "radar/radar_bar.png"
	},
	/* {
		name: "Bar",
		codePointIcon: "\uea60",
		icon: "radar/radar_bar.png"
	}, */
	{  // yep
		name: "General",
		codePointIcon: "\uea12",
		icon: "radar/radar_police_station.png"
	}
];


const MapCategories = categories.map((cat) => ({enabled: true, type: "Storefronts", ...cat})).sort((a, b) => a.name > b.name)

$(function() {
	var showCoordinations = true;
	var $types = $('.types');
	var onResize = function() {
		$types.css({
			maxHeight: $(window).height() - parseInt($types.css('marginTop'), 10) - parseInt($types.css('marginBottom'), 10) - parseInt($('header').height()) + 6,
		});
	};

	onResize();

	$(window).resize(onResize);

	var currentMarker;

	var timestampToSeconds = function(stamp) {
		stamp = stamp.split(':');
		return parseInt(stamp[0], 10) * 60 + parseInt(stamp[1], 10);
	};

	Handlebars.registerHelper('timestampToSeconds', timestampToSeconds);

	var Vent = _.extend({}, Backbone.Events);

	var LocationModel = Backbone.Model.extend({
		initialize: function() {
			var polyCoords = this.get('latlngarray');

			var type = this.get('type');

			var codePointIcon = '\uea12';

			var catInfo = MapCategories.filter((cat) => cat.name === type)[0];
			if(catInfo !== undefined) {
				// A marker can override its icon by setting the codePointIcon. (don't forget the \u before the codepoint)
				codePointIcon = this.get('codePointIcon') ?? catInfo.codePointIcon ?? '\uea12';
			}

			var marker;
			if(polyCoords.length === 1) {
				marker = new google.maps.Marker({
					map: map,
					moveable: false,
					draggable: false,
					position: polyCoords[0],
					label: {
						text: codePointIcon, // codepoint from https://fonts.google.com/icons
						fontFamily: "Material Icons",
						color: '#ffffff',
						fontSize: "18px",
					},
				});
			} else {
				marker = new google.maps.Polygon({
					paths: polyCoords,
					strokeColor: '#' + this.get('strokecolor'),
					strokeOpacity: 0.8,
					strokeWeight: 2,
					fillColor: '#' + this.get('fillcolor'),
					fillOpacity: 0.35,
				});
			}

			var bounds = new google.maps.LatLngBounds();
			polyCoords.forEach(function(element, index) {
				bounds.extend(element);
			});

			var mapLabel = new MapLabel({
				position: bounds.getCenter(),
				text: this.get('title'),
				strokeWeight: 1,
				strokeColor: '#000000',
				fontColor: '#' + this.get('fillcolor'),
				zIndex: 10000,
			});

			_.bindAll(this, 'markerClicked');
			google.maps.event.addListener(marker, 'click', this.markerClicked);
			this.set({ marker: marker, label: mapLabel });
		},

		markerClicked: function() {
			Vent.trigger('location:clicked', this);
		},

		removeHighlight: function() {},

		highlightMarker: function() {
			if (currentMarker == this) {
				Vent.trigger('location:clicked', this);
			} else {
				if (currentMarker) {
					currentMarker.removeHighlight();
				}
				mapView.closePopupLocation();
				currentMarker = this;
			}
		},
	});
	var LocationsCollection = Backbone.Collection.extend({
		model: LocationModel,
		url: 'locations.json',
		parse: function(response) {
			let id = 0;
			const data = response.map((data) => ({...data, id: id++}));
			return data;
		}
	});

	var locations = (window.locations = new LocationsCollection());

	var CategoryModel = Backbone.Model.extend({});
	var CategoriesCollection = Backbone.Collection.extend({
		model: CategoryModel,

		forView: function(type) {
			var g = this.groupBy('type');
			return _(g).map(function(categories, type) {
				return {
					name: type,
					types: _.map(categories, function(category) {
						return category.toJSON();
					}),
				};
			});
		},
	});

	var categories = (window.cats = new CategoriesCollection(MapCategories));

	var showingLabels;
	var CategoriesView = Backbone.View.extend({
		initialize: function() {
			this.template = Handlebars.compile($('#categoriesTemplate').html());
		},

		render: function() {
			this.$el.html(
				this.template({
					categories: categories.forView(),
				})
			);
			$('#typeDetails').hide();
			$('.toggle-visibility').attr('data-state', 'hide');
			return this;
		},

		events: {
			'change input': 'toggleLocations',
			'click .details': 'showDetails',
			'click .toggle-visibility': 'toggleVisibility'
		},

		toggleVisibility: function(e) {
			e.preventDefault();
			var $e = $(e.currentTarget);

			$e.attr('data-state', function(i, attr) {
				return attr == "hide" ? "show" : "hide"
			});

			$e.parent().parent().find("ul").css('display', function(i, visibility) {
				return (visibility == 'none') ? 'block' : 'none';
			});
		},

		toggleLocations: function(e) {
			var $e = $(e.currentTarget),
				type = $e.val(),
				showLocations = $e.is(':checked'),
				models = locations.where({ type: type });
			allLocations = locations.filter(function(loc) {
				return loc.get('marker').visible !== false;
			});

			if (type == 'labels' && showLocations) {
				Vent.trigger('labels:visible', allLocations);
				showingLabels = true;
			} else if (type == 'labels') {
				Vent.trigger('labels:invisible', allLocations);
				showingLabels = false;
			}

			if (showLocations) {
				Vent.trigger('locations:visible', models);
				if (showingLabels) {
					Vent.trigger('labels:visible', models);
				}
			} else {
				Vent.trigger('locations:invisible', models);
				if (showingLabels) {
					Vent.trigger('labels:invisible', models);
				}
			}
		},

		showDetails: function(e) {
			e.preventDefault();
			var typeName = $(e.currentTarget).data('name');
			this.$el
				.find('input[value="' + typeName + '"]')
				.prop('checked', true)
				.trigger('change');

			var type = categories.findWhere({ name: typeName });

			var details = new CategoryDetailsView({
				el: '#typeDetails',
				type: type,
			});
			details.render();
		},
	});

	var CategoryDetailsView = Backbone.View.extend({
		initialize: function() {
			this.template = Handlebars.compile($('#categoryDetailsTemplate').html());
		},

		events: {
			'click a.back': 'goBack',
			'click li': 'showMarker',
		},

		goBack: function(e) {
			e.preventDefault();
			this.$el.empty();
			this.off();
			$('#types').show();
		},

		showMarker: function(e) {
			var location = locations.get($(e.currentTarget).data('id'));
			location.highlightMarker();
			var bounds = new google.maps.LatLngBounds();
			var marker = location.get('marker');
			if(Object.getPrototypeOf(marker).getPath !== undefined)
			{
				marker.getPath()
					.forEach(function(element, index) {
						bounds.extend(element);
					});
			}
			else
			{
				bounds.extend(marker.position);
			}
			map.panTo(bounds.getCenter());
			map.setZoom(7);
		},

		render: function() {
			var name = this.options.type.get('name');
			var locs = locations.where({ type: name });
			this.$el.html(
				this.template({
					type: this.options.type.toJSON(),
					locations: _(locs).map(function(x) {
						var d = x.toJSON();
						return d;
					}),
				})
			);
			$('#types').hide();
			this.$el.show();
			return this;
		},

	});

	var MapView = Backbone.View.extend({
		initialize: function() {
			this.mapType = 'Atlas';
			this.mapDetails = {
				'Atlas':     '#0FA8D2',
				'Satellite': '#143D6B',
				'Road':      '#1862AD',
			};

			this.mapOptions = {
				center: new google.maps.LatLng(0, 0),
				zoom: 2,
				disableDefaultUI: true,
				mapTypeId: this.mapType,
				backgroundColor: 'hsla(0, 0%, 0%, 0)',
			};

			_.bindAll(this, 'getTileImage', 'updateMapBackground');

			this.popupTemplate = Handlebars.compile($('#markerPopupTemplate2').html());

			this.listenTo(Vent, 'locations:visible', this.showLocations);
			this.listenTo(Vent, 'locations:invisible', this.hideLocations);
			this.listenTo(Vent, 'labels:visible', this.showLabels);
			this.listenTo(Vent, 'labels:invisible', this.hideLabels);
			this.listenTo(Vent, 'location:clicked', this.popupLocation);
		},

		render: function() {
			// Function to update coordination info windows
			function updateCoordinationWindow(markerobject) {
				function getContent(evt) {
					return '</p><p>{"lat": ' + evt.latLng.lat().toFixed(3) + ', "lng": ' + evt.latLng.lng().toFixed(3) + '},</p>';
				}

				// Create new info window
				var infoWindow = new google.maps.InfoWindow();

				// onClick listener
				google.maps.event.addListener(markerobject, 'click', function(evt) {
					infoWindow.setOptions({ content: getContent(evt) });

					// Open the info window
					infoWindow.open(map, markerobject);
				});

				// onDrag listener
				google.maps.event.addListener(markerobject, 'drag', function(evt) {
					infoWindow.setOptions({ content: getContent(evt) });
				});
			}

			var map = (this.map = window.map = new google.maps.Map(this.el, this.mapOptions));

			this.initMapTypes(map, _.keys(this.mapDetails));

			google.maps.event.addListener(map, 'maptypeid_changed', this.updateMapBackground);

			google.maps.event.addDomListener(map, 'tilesloaded', function() {
				if ($('#mapControlWrap').length == 0) {
					$('div.gmnoprint').last().wrap('<div id="mapControlWrap" />');
				}
			});

			window.locs = [];
			google.maps.event.addListener(map, 'rightclick', function(e) {
				var marker = new google.maps.Marker({
					map: map,
					moveable: true,
					draggable: true,
					position: e.latLng,
					label: String(labelIndex++),
				});
				window.locs.push(marker);
				// Check if coords mode is enabled
				if (showCoordinations) {
					// Update/create info window
					updateCoordinationWindow(marker);
				}
			});

			return this;
		},

		getMap: function() {
			return this.map;
		},

		initMapTypes: function(map, types) {
			_.each(
				types,
				function(type) {
					var mapTypeOptions = {
						minZoom: 1,
						maxZoom: 7,
						name: type,
						getTileUrl: this.getTileImage,
					};
					map.mapTypes.set(type, new google.maps.ImageMapType(mapTypeOptions));
				},
				this
			);
		},

		updateMapBackground: function() {
			this.mapType = this.map.getMapTypeId();
			this.$el.css({
				backgroundColor: this.mapDetails[this.mapType],
			});
		},

		getTileImage: function(rawCoordinates, zoomLevel) {
			var coord = this.normalizeCoordinates(rawCoordinates, zoomLevel);
			if (!coord) {
				return null;
			}
			return 'tiles/' + this.mapType.toLowerCase() + '/' + zoomLevel + '/' + coord.x + '_' + coord.y + '.png';
		},

		normalizeCoordinates: function(coord, zoom) {
			var y = coord.y;
			var x = coord.x;

			// tile range in one direction range is dependent on zoom level
			// 0 = 1 tile, 1 = 2 tiles, 2 = 4 tiles, 3 = 8 tiles, etc
			var tileRange = 1 << zoom;

			// don't repeat across y-axis (vertically)
			if (y < 0 || y >= tileRange) {
				return null;
			}

			// repeat across x-axis
			if (x < 0 || x >= tileRange) {
				x = ((x % tileRange) + tileRange) % tileRange;
			}

			return {
				x: x,
				y: y,
			};
		},

		showLocations: function(locations) {
			_.each(
				locations,
				function(location) {
					var marker = location.get('marker');
					if (!marker.getMap()) {
						marker.setMap(this.map);
					}
					marker.setVisible(true);
				},
				this
			);
		},

		showLabels: function(locations) {
			_.each(
				locations,
				function(location) {
					var label = location.get('label');
					if (!label.getMap()) {
						label.setMap(this.map);
					}
					label.set('fontSize', 16);
				},
				this
			);
		},

		hideLocations: function(locations) {
			_.each(locations, function(location) {
				location.get('marker').setVisible(false);
			});
		},

		hideLabels: function(locations) {
			_.each(locations, function(location) {
				location.get('label').set('fontSize', 0);
			});
		},

		popupLocation: function(location, panTo) {
			var infoWindow = new google.maps.InfoWindow({
				content: this.popupTemplate(location.toJSON()),
			});

			infoWindow.setOptions({
				maxHeight: 400,
			});

			if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
				infoWindow.setOptions({
					maxWidth: 180,
					maxHeight: 300,
				});
			}
			var bounds = new google.maps.LatLngBounds();
			var marker = location.get('marker');

			// marker could either be a GMap Polygon or a GMap marker.
			// Check to see if the marker object has the getPath function.
			// If it does, use that to extend LatLngBounds for the popup.
			// Otherwise, get the marker's position and extend the bounds with the one position we have.
			if(Object.getPrototypeOf(marker).getPath !== undefined)
			{
				marker.getPath()
					.forEach(function(element, index) {
						bounds.extend(element);
					});
			}
			else
			{
				bounds.extend(marker.position);
			}
			infoWindow.setPosition(bounds.getCenter());
			infoWindow.open(this.map);

			this.closePopupLocation();
			this.currentInfoWindow = infoWindow;
		},

		closePopupLocation: function() {
			if (this.currentInfoWindow) {
				this.currentInfoWindow.close();
			}
		},
	});

	var mapView = new MapView({
		el: '#map',
	});

	var categoriesView = new CategoriesView({
		el: '#types',
		map: mapView.getMap(),
	});

	locations.fetch().done(function() {
		mapView.render();
		categoriesView.render();

		categories
			.chain()
			.filter(function(c) {
				return c.get('enabled');
			})
			.map(function(c) {
				return c.get('name');
			})
			.map(function(name) {
				return locations.where({ type: name });
			})
			.each(function(locs) {
				Vent.trigger('locations:visible', locs);
			})
			.value();
	});
});

function printArray() {
	var msg = 'Submit new regions here:\n'
	+ 'https://github.com/skyrossm/np-gangmap/issues\n\n'
	+ 'Right click the map to add points to the region. You may have to toggle regions off to be able to right click on the bottom layer. Fill in the values marked "<edit here>" and title the new issue using the format: "Add <title> region". Copy and paste everything below this. If your browser does not support selecting the text below press F12 to open the developer console and copy it from there. (scroll down)\n\n';
	msg += '```json\n\t{\n\t\t"type": "Territories",'
	+ '\n\t\t"title": "<edit this>",'
	+ '\n\t\t"notes": "<edit this>",'
	+ '\n\t\t"order": 0,'
	+ '\n\t\t"strokecolor": "FF0000",'
	+ '\n\t\t"fillcolor": "FF0000",'
	+ '\n\t\t"latlngarray": [\n';
	var i;
	for (i = 0; i < window.locs.length; i++) {
		msg += '\t\t\t{"lat": ' + window.locs[i].position.lat().toFixed(3) + ', "lng": ' + window.locs[i].position.lng().toFixed(3) + '}' + (window.locs.length - 1 == i ? '' : ',') + '\n';
	}
	msg += '\t\t]'
	+ '\n\t},\n```';
	alert(msg);
	console.log(msg);
}

// Define the overlay, derived from google.maps.OverlayView
function Label(opt_options) {
	// Initialization
	this.setValues(opt_options);

	// Label specific
	var span = (this.span_ = document.createElement('span'));
	span.style.cssText =
		'position: relative; left: 0%; top: -8px; ' +
		'white-space: nowrap; border: 0px; font-family:arial; font-weight:bold;' +
		'padding: 2px; background-color: #ddd; ' +
		'opacity: 1; ' +
		'filter: alpha(opacity=75); ' +
		'-ms-filter: "alpha(opacity=75)"; ' +
		'-khtml-opacity: 1; ' +
		'z-index:1000';

	var div = (this.div_ = document.createElement('div'));
	div.appendChild(span);
	div.style.cssText = 'position: absolute; display: none';
}
Label.prototype = new google.maps.OverlayView();

// Implement onAdd
Label.prototype.onAdd = function() {
	var pane = this.getPanes().overlayLayer;
	pane.appendChild(this.div_);

	// Ensures the label is redrawn if the text or position is changed.
	var me = this;
	this.listeners_ = [
		google.maps.event.addListener(this, 'position_changed', function() {
			me.draw();
		}),
		google.maps.event.addListener(this, 'text_changed', function() {
			me.draw();
		}),
	];
};

// Implement onRemove
Label.prototype.onRemove = function() {
	this.div_.parentNode.removeChild(this.div_);
	// Label is removed from the map, stop updating its position/text.
	for (var i = 0, I = this.listeners_.length; i < I; ++i) {
		google.maps.event.removeListener(this.listeners_[i]);
	}
};

// Implement draw
Label.prototype.draw = function() {
	var projection = this.getProjection();
	var position = projection.fromLatLngToDivPixel(this.get('position'));

	var div = this.div_;
	div.style.left = position.x + 'px';
	div.style.top = position.y + 'px';
	div.style.display = 'block';

	this.span_.innerHTML = this.get('text').toString();
};
