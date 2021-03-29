























$(document).ready(function () {
    var querystring = require("querystring-component");
  
    var loaderTimeout;
  
    var map = new L.OSM.Map("map", {
      zoomControl: false,
      layerControl: false,
      contextmenu: true
    });
  
    OSM.loadSidebarContent = function (path, callback) {
      var content_path = path;
  
      map.setSidebarOverlaid(false);
  
      clearTimeout(loaderTimeout);
  
      loaderTimeout = setTimeout(function () {
        $("#sidebar_loader").show();
      }, 200);
  
      // IE<10 doesn't respect Vary: X-Requested-With header, so
      // prevent caching the XHR response as a full-page URL.
      if (content_path.indexOf("?") >= 0) {
        content_path += "&xhr=1";
      } else {
        content_path += "?xhr=1";
      }
  
      $("#sidebar_content")
        .empty();
  
      $.ajax({
        url: content_path,
        dataType: "html",
        complete: function (xhr) {
          clearTimeout(loaderTimeout);
          $("#flash").empty();
          $("#sidebar_loader").hide();
  
          var content = $(xhr.responseText);
  
          if (xhr.getResponseHeader("X-Page-Title")) {
            var title = xhr.getResponseHeader("X-Page-Title");
            document.title = decodeURIComponent(title);
          }
  
          $("head")
            .find("link[type=\"application/atom+xml\"]")
            .remove();
  
          $("head")
            .append(content.filter("link[type=\"application/atom+xml\"]"));
  
          $("#sidebar_content").html(content.not("link[type=\"application/atom+xml\"]"));
  
          if (callback) {
            callback();
          }
        }
      });
    };
  
    var params = OSM.mapParams();
  
    map.attributionControl.setPrefix("");
  
    map.updateLayers(params.layers);
  
    map.on("baselayerchange", function (e) {
      if (map.getZoom() > e.layer.options.maxZoom) {
        map.setView(map.getCenter(), e.layer.options.maxZoom, { reset: true });
      }
    });
  
    var position = $("html").attr("dir") === "rtl" ? "topleft" : "topright";
  
    L.OSM.zoom({ position: position })
      .addTo(map);
  
    var locate = L.control.locate({
      position: position,
      icon: "icon geolocate",
      iconLoading: "icon geolocate",
      strings: {
        title: I18n.t("javascripts.map.locate.title"),
        popup: I18n.t("javascripts.map.locate.popup")
      }
    }).addTo(map);
  
    var locateContainer = locate.getContainer();
  
    $(locateContainer)
      .removeClass("leaflet-control-locate leaflet-bar")
      .addClass("control-locate")
      .children("a")
      .attr("href", "#")
      .removeClass("leaflet-bar-part leaflet-bar-part-single")
      .addClass("control-button");
  
    var sidebar = L.OSM.sidebar("#map-ui")
      .addTo(map);
  
    L.OSM.layers({
      position: position,
      layers: map.baseLayers,
      sidebar: sidebar
    }).addTo(map);
  
    L.OSM.key({
      position: position,
      sidebar: sidebar
    }).addTo(map);
  
    L.OSM.share({
      "position": position,
      "sidebar": sidebar,
      "short": true
    }).addTo(map);
  
    L.OSM.note({
      position: position,
      sidebar: sidebar
    }).addTo(map);
  
    L.OSM.query({
      position: position,
      sidebar: sidebar
    }).addTo(map);
  
    L.control.scale()
      .addTo(map);
  
    OSM.initializeContextMenu(map);
  
    if (OSM.STATUS !== "api_offline" && OSM.STATUS !== "database_offline") {
      OSM.initializeNotes(map);
      if (params.layers.indexOf(map.noteLayer.options.code) >= 0) {
        map.addLayer(map.noteLayer);
      }
  
      OSM.initializeBrowse(map);
      if (params.layers.indexOf(map.dataLayer.options.code) >= 0) {
        map.addLayer(map.dataLayer);
      }
  
      if (params.layers.indexOf(map.gpsLayer.options.code) >= 0) {
        map.addLayer(map.gpsLayer);
      }
    }
  
    var placement = $("html").attr("dir") === "rtl" ? "right" : "left";
    $(".leaflet-control .control-button").tooltip({ placement: placement, container: "body" });
  
    var expiry = new Date();
    expiry.setYear(expiry.getFullYear() + 10);
  
    map.on("moveend layeradd layerremove", function () {
      updateLinks(
        map.getCenter().wrap(),
        map.getZoom(),
        map.getLayersCode(),
        map._object);
  
      $.removeCookie("_osm_location");
      $.cookie("_osm_location", OSM.locationCookie(map), { expires: expiry, path: "/" });
    });
  
    if ($.cookie("_osm_welcome") !== "hide") {
      $(".welcome").addClass("visible");
    }
  
    $(".welcome .close-wrap").on("click", function () {
      $(".welcome").removeClass("visible");
      $.cookie("_osm_welcome", "hide", { expires: expiry, path: "/" });
    });
  
    var bannerExpiry = new Date();
    bannerExpiry.setYear(bannerExpiry.getFullYear() + 1);
  
    $("#banner .close-wrap").on("click", function (e) {
      var cookieId = e.target.id;
      $("#banner").hide();
      e.preventDefault();
      if (cookieId) {
        $.cookie(cookieId, "hide", { expires: bannerExpiry, path: "/" });
      }
    });
  
    if (OSM.PIWIK) {
      map.on("layeradd", function (e) {
        if (e.layer.options) {
          var goal = OSM.PIWIK.goals[e.layer.options.keyid];
  
          if (goal) {
            $("body").trigger("piwikgoal", goal);
          }
        }
      });
    }
  
    if (params.bounds) {
      map.fitBounds(params.bounds);
    } else {
      map.setView([params.lat, params.lon], params.zoom);
    }
  
    if (params.marker) {
      L.marker([params.mlat, params.mlon]).addTo(map);
    }
  
    $("#homeanchor").on("click", function (e) {
      e.preventDefault();
  
      var data = $(this).data(),
          center = L.latLng(data.lat, data.lon);
  
      map.setView(center, data.zoom);
      L.marker(center, { icon: OSM.getUserIcon() }).addTo(map);
    });
  
    function remoteEditHandler(bbox, object) {
      var loaded = false,
          url,
          query = {
            left: bbox.getWest() - 0.0001,
            top: bbox.getNorth() + 0.0001,
            right: bbox.getEast() + 0.0001,
            bottom: bbox.getSouth() - 0.0001
          };
  
      url = "http://127.0.0.1:8111/load_and_zoom?";
  
      if (object) query.select = object.type + object.id;
  
      var iframe = $("<iframe>")
        .hide()
        .appendTo("body")
        .attr("src", url + querystring.stringify(query))
        .on("load", function () {
          $(this).remove();
          loaded = true;
        });
  
      setTimeout(function () {
        if (!loaded) {
          alert(I18n.t("site.index.remote_failed"));
          iframe.remove();
        }
      }, 1000);
  
      return false;
    }
  
    $("a[data-editor=remote]").click(function (e) {
      var params = OSM.mapParams(this.search);
      remoteEditHandler(map.getBounds(), params.object);
      e.preventDefault();
    });
  
    if (OSM.params().edit_help) {
      $("#editanchor")
        .removeAttr("title")
        .tooltip({
          placement: "bottom",
          title: I18n.t("javascripts.edit_help")
        })
        .tooltip("show");
  
      $("body").one("click", function () {
        $("#editanchor").tooltip("hide");
      });
    }
  
    OSM.Index = function (map) {
      var page = {};
  
      page.pushstate = page.popstate = function () {
        map.setSidebarOverlaid(true);
        document.title = I18n.t("layouts.project_name.title");
      };
  
      page.load = function () {
        var params = querystring.parse(location.search.substring(1));
        if (params.query) {
          $("#sidebar .search_form input[name=query]").value(params.query);
        }
        if (!("autofocus" in document.createElement("input"))) {
          $("#sidebar .search_form input[name=query]").focus();
        }
        return map.getState();
      };
  
      return page;
    };
  
    OSM.Browse = function (map, type) {
      var page = {};
  
      page.pushstate = page.popstate = function (path, id) {
        OSM.loadSidebarContent(path, function () {
          addObject(type, id);
        });
      };
  
      page.load = function (path, id) {
        addObject(type, id, true);
      };
  
      function addObject(type, id, center) {
        map.addObject({ type: type, id: parseInt(id, 10) }, function (bounds) {
          if (!window.location.hash && bounds.isValid() &&
              (center || !map.getBounds().contains(bounds))) {
            OSM.router.withoutMoveListener(function () {
              map.fitBounds(bounds);
            });
          }
        });
  
        $(".colour-preview-box").each(function () {
          $(this).css("background-color", $(this).data("colour"));
        });
      }
  
      page.unload = function () {
        map.removeObject();
      };
  
      return page;
    };
  
    var history = OSM.History(map);
  
    OSM.router = OSM.Router(map, {
      "/": OSM.Index(map),
      "/search": OSM.Search(map),
      "/directions": OSM.Directions(map),
      "/export": OSM.Export(map),
      "/note/new": OSM.NewNote(map),
      "/history/friends": history,
      "/history/nearby": history,
      "/history": history,
      "/user/:display_name/history": history,
      "/note/:id": OSM.Note(map),
      "/node/:id(/history)": OSM.Browse(map, "node"),
      "/way/:id(/history)": OSM.Browse(map, "way"),
      "/relation/:id(/history)": OSM.Browse(map, "relation"),
      "/changeset/:id": OSM.Changeset(map),
      "/query": OSM.Query(map)
    });
  
    if (OSM.preferred_editor === "remote" && document.location.pathname === "/edit") {
      remoteEditHandler(map.getBounds(), params.object);
      OSM.router.setCurrentPath("/");
    }
  
    OSM.router.load();
  
    $(document).on("click", "a", function (e) {
      if (e.isDefaultPrevented() || e.isPropagationStopped()) {
        return;
      }
  
      // Open links in a new tab as normal.
      if (e.which > 1 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
  
      // Ignore cross-protocol and cross-origin links.
      if (location.protocol !== this.protocol || location.host !== this.host) {
        return;
      }
  
      if (OSM.router.route(this.pathname + this.search + this.hash)) {
        e.preventDefault();
      }
    });
  });
  L.OSM.sidebar = function (selector) {
    var control = {},
        sidebar = $(selector),
        current = $(),
        currentButton = $(),
        map;
  
    control.addTo = function (_) {
      map = _;
      return control;
    };
  
    control.addPane = function (pane) {
      pane
        .hide()
        .appendTo(sidebar);
    };
  
    control.togglePane = function (pane, button) {
      current
        .hide()
        .trigger("hide");
  
      currentButton
        .removeClass("active");
  
      if (current === pane) {
        $(sidebar).hide();
        current = currentButton = $();
      } else {
        $(sidebar).show();
        current = pane;
        currentButton = button || $();
      }
  
      map.invalidateSize({ pan: false, animate: false });
  
      current
        .show()
        .trigger("show");
  
      currentButton
        .addClass("active");
    };
  
    return control;
  };
  /*!
  Copyright (c) 2016 Dominik Moritz
  
  This file is part of the leaflet locate control. It is licensed under the MIT license.
  You can find the project at: https://github.com/domoritz/leaflet-locatecontrol
  */
  (function (factory, window) {
       // see https://github.com/Leaflet/Leaflet/blob/master/PLUGIN-GUIDE.md#module-loaders
       // for details on how to structure a leaflet plugin.
  
      // define an AMD module that relies on 'leaflet'
      if (typeof define === 'function' && define.amd) {
          define(['leaflet'], factory);
  
      // define a Common JS module that relies on 'leaflet'
      } else if (typeof exports === 'object') {
          if (typeof window !== 'undefined' && window.L) {
              module.exports = factory(L);
          } else {
              module.exports = factory(require('leaflet'));
          }
      }
  
      // attach your plugin to the global 'L' variable
      if (typeof window !== 'undefined' && window.L){
          window.L.Control.Locate = factory(L);
      }
  } (function (L) {
      var LDomUtilApplyClassesMethod = function(method, element, classNames) {
          classNames = classNames.split(' ');
          classNames.forEach(function(className) {
              L.DomUtil[method].call(this, element, className);
          });
      };
  
      var addClasses = function(el, names) { LDomUtilApplyClassesMethod('addClass', el, names); };
      var removeClasses = function(el, names) { LDomUtilApplyClassesMethod('removeClass', el, names); };
  
      /**
       * Compatible with L.Circle but a true marker instead of a path
       */
      var LocationMarker = L.Marker.extend({
          initialize: function (latlng, options) {
              L.Util.setOptions(this, options);
              this._latlng = latlng;
              this.createIcon();
          },
  
          /**
           * Create a styled circle location marker
           */
          createIcon: function() {
              var opt = this.options;
  
              var style = '';
  
              if (opt.color !== undefined) {
                  style += 'stroke:'+opt.color+';';
              }
              if (opt.weight !== undefined) {
                  style += 'stroke-width:'+opt.weight+';';
              }
              if (opt.fillColor !== undefined) {
                  style += 'fill:'+opt.fillColor+';';
              }
              if (opt.fillOpacity !== undefined) {
                  style += 'fill-opacity:'+opt.fillOpacity+';';
              }
              if (opt.opacity !== undefined) {
                  style += 'opacity:'+opt.opacity+';';
              }
  
              var icon = this._getIconSVG(opt, style);
  
              this._locationIcon = L.divIcon({
                  className: icon.className,
                  html: icon.svg,
                  iconSize: [icon.w,icon.h],
              });
  
              this.setIcon(this._locationIcon);
          },
  
          /**
           * Return the raw svg for the shape
           *
           * Split so can be easily overridden
           */
          _getIconSVG: function(options, style) {
              var r = options.radius;
              var w = options.weight;
              var s = r + w;
              var s2 = s * 2;
              var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="'+s2+'" height="'+s2+'" version="1.1" viewBox="-'+s+' -'+s+' '+s2+' '+s2+'">' +
              '<circle r="'+r+'" style="'+style+'" />' +
              '</svg>';
              return {
                  className: 'leaflet-control-locate-location',
                  svg: svg,
                  w: s2,
                  h: s2
              };
          },
  
          setStyle: function(style) {
              L.Util.setOptions(this, style);
              this.createIcon();
          }
      });
  
      var CompassMarker = LocationMarker.extend({
          initialize: function (latlng, heading, options) {
              L.Util.setOptions(this, options);
              this._latlng = latlng;
              this._heading = heading;
              this.createIcon();
          },
  
          setHeading: function(heading) {
              this._heading = heading;
          },
  
          /**
           * Create a styled arrow compass marker
           */
          _getIconSVG: function(options, style) {
              var r = options.radius;
              var w = (options.width + options.weight);
              var h = (r+options.depth + options.weight)*2;
              var path = 'M0,0 l'+(options.width/2)+','+options.depth+' l-'+(w)+',0 z';
              var svgstyle = 'transform: rotate('+this._heading+'deg)';
              var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="'+(w)+'" height="'+h+'" version="1.1" viewBox="-'+(w/2)+' 0 '+w+' '+h+'" style="'+svgstyle+'">'+
              '<path d="'+path+'" style="'+style+'" />'+
              '</svg>';
              return {
                  className: 'leafet-control-locate-heading',
                  svg: svg,
                  w: w,
                  h: h
              };
          },
      });
  
  
      var LocateControl = L.Control.extend({
          options: {
              /** Position of the control */
              position: 'topleft',
              /** The layer that the user's location should be drawn on. By default creates a new layer. */
              layer: undefined,
              /**
               * Automatically sets the map view (zoom and pan) to the user's location as it updates.
               * While the map is following the user's location, the control is in the `following` state,
               * which changes the style of the control and the circle marker.
               *
               * Possible values:
               *  - false: never updates the map view when location changes.
               *  - 'once': set the view when the location is first determined
               *  - 'always': always updates the map view when location changes.
               *              The map view follows the user's location.
               *  - 'untilPan': like 'always', except stops updating the
               *                view if the user has manually panned the map.
               *                The map view follows the user's location until she pans.
               *  - 'untilPanOrZoom': (default) like 'always', except stops updating the
               *                view if the user has manually panned the map.
               *                The map view follows the user's location until she pans.
               */
              setView: 'untilPanOrZoom',
              /** Keep the current map zoom level when setting the view and only pan. */
              keepCurrentZoomLevel: false,
              /**
               * This callback can be used to override the viewport tracking
               * This function should return a LatLngBounds object.
               *
               * For example to extend the viewport to ensure that a particular LatLng is visible:
               *
               * getLocationBounds: function(locationEvent) {
               *    return locationEvent.bounds.extend([-33.873085, 151.219273]);
               * },
               */
              getLocationBounds: function (locationEvent) {
                  return locationEvent.bounds;
              },
              /** Smooth pan and zoom to the location of the marker. Only works in Leaflet 1.0+. */
              flyTo: false,
              /**
               * The user location can be inside and outside the current view when the user clicks on the
               * control that is already active. Both cases can be configures separately.
               * Possible values are:
               *  - 'setView': zoom and pan to the current location
               *  - 'stop': stop locating and remove the location marker
               */
              clickBehavior: {
                  /** What should happen if the user clicks on the control while the location is within the current view. */
                  inView: 'stop',
                  /** What should happen if the user clicks on the control while the location is outside the current view. */
                  outOfView: 'setView',
                  /**
                   * What should happen if the user clicks on the control while the location is within the current view
                   * and we could be following but are not. Defaults to a special value which inherits from 'inView';
                   */
                  inViewNotFollowing: 'inView',
              },
              /**
               * If set, save the map bounds just before centering to the user's
               * location. When control is disabled, set the view back to the
               * bounds that were saved.
               */
              returnToPrevBounds: false,
              /**
               * Keep a cache of the location after the user deactivates the control. If set to false, the user has to wait
               * until the locate API returns a new location before they see where they are again.
               */
              cacheLocation: true,
              /** If set, a circle that shows the location accuracy is drawn. */
              drawCircle: true,
              /** If set, the marker at the users' location is drawn. */
              drawMarker: true,
              /** If set and supported then show the compass heading */
              showCompass: true,
              /** The class to be used to create the marker. For example L.CircleMarker or L.Marker */
              markerClass: LocationMarker,
              /** The class us be used to create the compass bearing arrow */
              compassClass: CompassMarker,
              /** Accuracy circle style properties. NOTE these styles should match the css animations styles */
              circleStyle: {
                  className:   'leaflet-control-locate-circle',
                  color:       '#136AEC',
                  fillColor:   '#136AEC',
                  fillOpacity: 0.15,
                  weight:      0
              },
              /** Inner marker style properties. Only works if your marker class supports `setStyle`. */
              markerStyle: {
                  className:   'leaflet-control-locate-marker',
                  color:       '#fff',
                  fillColor:   '#2A93EE',
                  fillOpacity: 1,
                  weight:      3,
                  opacity:     1,
                  radius:      9
              },
              /** Compass */
              compassStyle: {
                  fillColor:   '#2A93EE',
                  fillOpacity: 1,
                  weight:      0,
                  color:       '#fff',
                  opacity:     1,
                  radius:      9, // How far is the arrow is from the center of of the marker
                  width:       9, // Width of the arrow
                  depth:       6  // Length of the arrow
              },
              /**
               * Changes to accuracy circle and inner marker while following.
               * It is only necessary to provide the properties that should change.
               */
              followCircleStyle: {},
              followMarkerStyle: {
                  // color: '#FFA500',
                  // fillColor: '#FFB000'
              },
              followCompassStyle: {},
              /** The CSS class for the icon. For example fa-location-arrow or fa-map-marker */
              icon: 'fa fa-map-marker',
              iconLoading: 'fa fa-spinner fa-spin',
              /** The element to be created for icons. For example span or i */
              iconElementTag: 'span',
              /** Padding around the accuracy circle. */
              circlePadding: [0, 0],
              /** Use metric units. */
              metric: true,
              /**
               * This callback can be used in case you would like to override button creation behavior.
               * This is useful for DOM manipulation frameworks such as angular etc.
               * This function should return an object with HtmlElement for the button (link property) and the icon (icon property).
               */
              createButtonCallback: function (container, options) {
                  var link = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single', container);
                  link.title = options.strings.title;
                  var icon = L.DomUtil.create(options.iconElementTag, options.icon, link);
                  return { link: link, icon: icon };
              },
              /** This event is called in case of any location error that is not a time out error. */
              onLocationError: function(err, control) {
                  alert(err.message);
              },
              /**
               * This event is called when the user's location is outside the bounds set on the map.
               * The event is called repeatedly when the location changes.
               */
              onLocationOutsideMapBounds: function(control) {
                  control.stop();
                  alert(control.options.strings.outsideMapBoundsMsg);
              },
              /** Display a pop-up when the user click on the inner marker. */
              showPopup: true,
              strings: {
                  title: "Show me where I am",
                  metersUnit: "meters",
                  feetUnit: "feet",
                  popup: "You are within {distance} {unit} from this point",
                  outsideMapBoundsMsg: "You seem located outside the boundaries of the map"
              },
              /** The default options passed to leaflets locate method. */
              locateOptions: {
                  maxZoom: Infinity,
                  watch: true,  // if you overwrite this, visualization cannot be updated
                  setView: false // have to set this to false because we have to
                                 // do setView manually
              }
          },
  
          initialize: function (options) {
              // set default options if nothing is set (merge one step deep)
              for (var i in options) {
                  if (typeof this.options[i] === 'object') {
                      L.extend(this.options[i], options[i]);
                  } else {
                      this.options[i] = options[i];
                  }
              }
  
              // extend the follow marker style and circle from the normal style
              this.options.followMarkerStyle = L.extend({}, this.options.markerStyle, this.options.followMarkerStyle);
              this.options.followCircleStyle = L.extend({}, this.options.circleStyle, this.options.followCircleStyle);
              this.options.followCompassStyle = L.extend({}, this.options.compassStyle, this.options.followCompassStyle);
          },
  
          /**
           * Add control to map. Returns the container for the control.
           */
          onAdd: function (map) {
              var container = L.DomUtil.create('div',
                  'leaflet-control-locate leaflet-bar leaflet-control');
  
              this._layer = this.options.layer || new L.LayerGroup();
              this._layer.addTo(map);
              this._event = undefined;
              this._compassHeading = null;
              this._prevBounds = null;
  
              var linkAndIcon = this.options.createButtonCallback(container, this.options);
              this._link = linkAndIcon.link;
              this._icon = linkAndIcon.icon;
  
              L.DomEvent
                  .on(this._link, 'click', L.DomEvent.stopPropagation)
                  .on(this._link, 'click', L.DomEvent.preventDefault)
                  .on(this._link, 'click', this._onClick, this)
                  .on(this._link, 'dblclick', L.DomEvent.stopPropagation);
  
              this._resetVariables();
  
              this._map.on('unload', this._unload, this);
  
              return container;
          },
  
          /**
           * This method is called when the user clicks on the control.
           */
          _onClick: function() {
              this._justClicked = true;
              var wasFollowing =  this._isFollowing();
              this._userPanned = false;
              this._userZoomed = false;
  
              if (this._active && !this._event) {
                  // click while requesting
                  this.stop();
              } else if (this._active && this._event !== undefined) {
                  var behaviors = this.options.clickBehavior;
                  var behavior = behaviors.outOfView;
                  if (this._map.getBounds().contains(this._event.latlng)) {
                      behavior = wasFollowing ? behaviors.inView : behaviors.inViewNotFollowing;
                  }
  
                  // Allow inheriting from another behavior
                  if (behaviors[behavior]) {
                      behavior = behaviors[behavior];
                  }
  
                  switch (behavior) {
                      case 'setView':
                          this.setView();
                          break;
                      case 'stop':
                          this.stop();
                          if (this.options.returnToPrevBounds) {
                              var f = this.options.flyTo ? this._map.flyToBounds : this._map.fitBounds;
                              f.bind(this._map)(this._prevBounds);
                          }
                          break;
                  }
              } else {
                  if (this.options.returnToPrevBounds) {
                    this._prevBounds = this._map.getBounds();
                  }
                  this.start();
              }
  
              this._updateContainerStyle();
          },
  
          /**
           * Starts the plugin:
           * - activates the engine
           * - draws the marker (if coordinates available)
           */
          start: function() {
              this._activate();
  
              if (this._event) {
                  this._drawMarker(this._map);
  
                  // if we already have a location but the user clicked on the control
                  if (this.options.setView) {
                      this.setView();
                  }
              }
              this._updateContainerStyle();
          },
  
          /**
           * Stops the plugin:
           * - deactivates the engine
           * - reinitializes the button
           * - removes the marker
           */
          stop: function() {
              this._deactivate();
  
              this._cleanClasses();
              this._resetVariables();
  
              this._removeMarker();
          },
  
          /**
           * Keep the control active but stop following the location
           */
          stopFollowing: function() {
              this._userPanned = true;
              this._updateContainerStyle();
              this._drawMarker();
          },
  
          /**
           * This method launches the location engine.
           * It is called before the marker is updated,
           * event if it does not mean that the event will be ready.
           *
           * Override it if you want to add more functionalities.
           * It should set the this._active to true and do nothing if
           * this._active is true.
           */
          _activate: function() {
              if (!this._active) {
                  this._map.locate(this.options.locateOptions);
                  this._active = true;
  
                  // bind event listeners
                  this._map.on('locationfound', this._onLocationFound, this);
                  this._map.on('locationerror', this._onLocationError, this);
                  this._map.on('dragstart', this._onDrag, this);
                  this._map.on('zoomstart', this._onZoom, this);
                  this._map.on('zoomend', this._onZoomEnd, this);
                  if (this.options.showCompass) {
                      if ('ondeviceorientationabsolute' in window) {
                          L.DomEvent.on(window, 'deviceorientationabsolute', this._onDeviceOrientation, this);
                      } else if ('ondeviceorientation' in window) {
                          L.DomEvent.on(window, 'deviceorientation', this._onDeviceOrientation, this);
                      }
                  }
              }
          },
  
          /**
           * Called to stop the location engine.
           *
           * Override it to shutdown any functionalities you added on start.
           */
          _deactivate: function() {
              this._map.stopLocate();
              this._active = false;
  
              if (!this.options.cacheLocation) {
                  this._event = undefined;
              }
  
              // unbind event listeners
              this._map.off('locationfound', this._onLocationFound, this);
              this._map.off('locationerror', this._onLocationError, this);
              this._map.off('dragstart', this._onDrag, this);
              this._map.off('zoomstart', this._onZoom, this);
              this._map.off('zoomend', this._onZoomEnd, this);
              if (this.options.showCompass) {
                  this._compassHeading = null;
                  if ('ondeviceorientationabsolute' in window) {
                      L.DomEvent.off(window, 'deviceorientationabsolute', this._onDeviceOrientation, this);
                  } else if ('ondeviceorientation' in window) {
                      L.DomEvent.off(window, 'deviceorientation', this._onDeviceOrientation, this);
                  }
              }
          },
  
          /**
           * Zoom (unless we should keep the zoom level) and an to the current view.
           */
          setView: function() {
              this._drawMarker();
              if (this._isOutsideMapBounds()) {
                  this._event = undefined;  // clear the current location so we can get back into the bounds
                  this.options.onLocationOutsideMapBounds(this);
              } else {
                  if (this.options.keepCurrentZoomLevel) {
                      var f = this.options.flyTo ? this._map.flyTo : this._map.panTo;
                      f.bind(this._map)([this._event.latitude, this._event.longitude]);
                  } else {
                      var f = this.options.flyTo ? this._map.flyToBounds : this._map.fitBounds;
                      // Ignore zoom events while setting the viewport as these would stop following
                      this._ignoreEvent = true;
                      f.bind(this._map)(this.options.getLocationBounds(this._event), {
                          padding: this.options.circlePadding,
                          maxZoom: this.options.locateOptions.maxZoom
                      });
                      L.Util.requestAnimFrame(function(){
                          // Wait until after the next animFrame because the flyTo can be async
                          this._ignoreEvent = false;
                      }, this);
  
                  }
              }
          },
  
          /**
           *
           */
          _drawCompass: function() {
              var latlng = this._event.latlng;
  
              if (this.options.showCompass && latlng && this._compassHeading !== null) {
                  var cStyle = this._isFollowing() ? this.options.followCompassStyle : this.options.compassStyle;
                  if (!this._compass) {
                      this._compass = new this.options.compassClass(latlng, this._compassHeading, cStyle).addTo(this._layer);
                  } else {
                      this._compass.setLatLng(latlng);
                      this._compass.setHeading(this._compassHeading);
                      // If the compassClass can be updated with setStyle, update it.
                      if (this._compass.setStyle) {
                          this._compass.setStyle(cStyle);
                      }
                  }
                  // 
              }
              if (this._compass && (!this.options.showCompass || this._compassHeading === null)) {
                  this._compass.removeFrom(this._layer);
                  this._compass = null;
              }
          },
  
          /**
           * Draw the marker and accuracy circle on the map.
           *
           * Uses the event retrieved from onLocationFound from the map.
           */
          _drawMarker: function() {
              if (this._event.accuracy === undefined) {
                  this._event.accuracy = 0;
              }
  
              var radius = this._event.accuracy;
              var latlng = this._event.latlng;
  
              // circle with the radius of the location's accuracy
              if (this.options.drawCircle) {
                  var style = this._isFollowing() ? this.options.followCircleStyle : this.options.circleStyle;
  
                  if (!this._circle) {
                      this._circle = L.circle(latlng, radius, style).addTo(this._layer);
                  } else {
                      this._circle.setLatLng(latlng).setRadius(radius).setStyle(style);
                  }
              }
  
              var distance, unit;
              if (this.options.metric) {
                  distance = radius.toFixed(0);
                  unit =  this.options.strings.metersUnit;
              } else {
                  distance = (radius * 3.2808399).toFixed(0);
                  unit = this.options.strings.feetUnit;
              }
  
              // small inner marker
              if (this.options.drawMarker) {
                  var mStyle = this._isFollowing() ? this.options.followMarkerStyle : this.options.markerStyle;
                  if (!this._marker) {
                      this._marker = new this.options.markerClass(latlng, mStyle).addTo(this._layer);
                  } else {
                      this._marker.setLatLng(latlng);
                      // If the markerClass can be updated with setStyle, update it.
                      if (this._marker.setStyle) {
                          this._marker.setStyle(mStyle);
                      }
                  }
              }
  
              this._drawCompass();
  
              var t = this.options.strings.popup;
              if (this.options.showPopup && t && this._marker) {
                  this._marker
                      .bindPopup(L.Util.template(t, {distance: distance, unit: unit}))
                      ._popup.setLatLng(latlng);
              }
              if (this.options.showPopup && t && this._compass) {
                  this._compass
                      .bindPopup(L.Util.template(t, {distance: distance, unit: unit}))
                      ._popup.setLatLng(latlng);
              }
          },
  
          /**
           * Remove the marker from map.
           */
          _removeMarker: function() {
              this._layer.clearLayers();
              this._marker = undefined;
              this._circle = undefined;
          },
  
          /**
           * Unload the plugin and all event listeners.
           * Kind of the opposite of onAdd.
           */
          _unload: function() {
              this.stop();
              this._map.off('unload', this._unload, this);
          },
  
          /**
           * Sets the compass heading
           */
          _setCompassHeading: function(angle) {
              if (!isNaN(parseFloat(angle)) && isFinite(angle)) {
                  angle = Math.round(angle);
  
                  this._compassHeading = angle;
                  L.Util.requestAnimFrame(this._drawCompass, this);
              } else {
                  this._compassHeading = null;
              }
          },
  
          /**
           * If the compass fails calibration just fail safely and remove the compass
           */
          _onCompassNeedsCalibration: function() {
              this._setCompassHeading();
          },
  
          /**
           * Process and normalise compass events
           */
          _onDeviceOrientation: function(e) {
              if (!this._active) {
                  return;
              }
  
              if (e.webkitCompassHeading) {
                  // iOS
                  this._setCompassHeading(e.webkitCompassHeading);
              } else if (e.absolute && e.alpha) {
                  // Android
                  this._setCompassHeading(360 - e.alpha)
              }
          },
  
          /**
           * Calls deactivate and dispatches an error.
           */
          _onLocationError: function(err) {
              // ignore time out error if the location is watched
              if (err.code == 3 && this.options.locateOptions.watch) {
                  return;
              }
  
              this.stop();
              this.options.onLocationError(err, this);
          },
  
          /**
           * Stores the received event and updates the marker.
           */
          _onLocationFound: function(e) {
              // no need to do anything if the location has not changed
              if (this._event &&
                  (this._event.latlng.lat === e.latlng.lat &&
                   this._event.latlng.lng === e.latlng.lng &&
                       this._event.accuracy === e.accuracy)) {
                  return;
              }
  
              if (!this._active) {
                  // we may have a stray event
                  return;
              }
  
              this._event = e;
  
              this._drawMarker();
              this._updateContainerStyle();
  
              switch (this.options.setView) {
                  case 'once':
                      if (this._justClicked) {
                          this.setView();
                      }
                      break;
                  case 'untilPan':
                      if (!this._userPanned) {
                          this.setView();
                      }
                      break;
                  case 'untilPanOrZoom':
                      if (!this._userPanned && !this._userZoomed) {
                          this.setView();
                      }
                      break;
                  case 'always':
                      this.setView();
                      break;
                  case false:
                      // don't set the view
                      break;
              }
  
              this._justClicked = false;
          },
  
          /**
           * When the user drags. Need a separate event so we can bind and unbind event listeners.
           */
          _onDrag: function() {
              // only react to drags once we have a location
              if (this._event && !this._ignoreEvent) {
                  this._userPanned = true;
                  this._updateContainerStyle();
                  this._drawMarker();
              }
          },
  
          /**
           * When the user zooms. Need a separate event so we can bind and unbind event listeners.
           */
          _onZoom: function() {
              // only react to drags once we have a location
              if (this._event && !this._ignoreEvent) {
                  this._userZoomed = true;
                  this._updateContainerStyle();
                  this._drawMarker();
              }
          },
  
          /**
           * After a zoom ends update the compass and handle sideways zooms
           */
          _onZoomEnd: function() {
              if (this._event) {
                  this._drawCompass();
              }
  
              if (this._event && !this._ignoreEvent) {
                  // If we have zoomed in and out and ended up sideways treat it as a pan
                  if (!this._map.getBounds().pad(-.3).contains(this._marker.getLatLng())) {
                      this._userPanned = true;
                      this._updateContainerStyle();
                      this._drawMarker();
                  }
              }
          },
  
          /**
           * Compute whether the map is following the user location with pan and zoom.
           */
          _isFollowing: function() {
              if (!this._active) {
                  return false;
              }
  
              if (this.options.setView === 'always') {
                  return true;
              } else if (this.options.setView === 'untilPan') {
                  return !this._userPanned;
              } else if (this.options.setView === 'untilPanOrZoom') {
                  return !this._userPanned && !this._userZoomed;
              }
          },
  
          /**
           * Check if location is in map bounds
           */
          _isOutsideMapBounds: function() {
              if (this._event === undefined) {
                  return false;
              }
              return this._map.options.maxBounds &&
                  !this._map.options.maxBounds.contains(this._event.latlng);
          },
  
          /**
           * Toggles button class between following and active.
           */
          _updateContainerStyle: function() {
              if (!this._container) {
                  return;
              }
  
              if (this._active && !this._event) {
                  // active but don't have a location yet
                  this._setClasses('requesting');
              } else if (this._isFollowing()) {
                  this._setClasses('following');
              } else if (this._active) {
                  this._setClasses('active');
              } else {
                  this._cleanClasses();
              }
          },
  
          /**
           * Sets the CSS classes for the state.
           */
          _setClasses: function(state) {
              if (state == 'requesting') {
                  removeClasses(this._container, "active following");
                  addClasses(this._container, "requesting");
  
                  removeClasses(this._icon, this.options.icon);
                  addClasses(this._icon, this.options.iconLoading);
              } else if (state == 'active') {
                  removeClasses(this._container, "requesting following");
                  addClasses(this._container, "active");
  
                  removeClasses(this._icon, this.options.iconLoading);
                  addClasses(this._icon, this.options.icon);
              } else if (state == 'following') {
                  removeClasses(this._container, "requesting");
                  addClasses(this._container, "active following");
  
                  removeClasses(this._icon, this.options.iconLoading);
                  addClasses(this._icon, this.options.icon);
              }
          },
  
          /**
           * Removes all classes from button.
           */
          _cleanClasses: function() {
              L.DomUtil.removeClass(this._container, "requesting");
              L.DomUtil.removeClass(this._container, "active");
              L.DomUtil.removeClass(this._container, "following");
  
              removeClasses(this._icon, this.options.iconLoading);
              addClasses(this._icon, this.options.icon);
          },
  
          /**
           * Reinitializes state variables.
           */
          _resetVariables: function() {
              // whether locate is active or not
              this._active = false;
  
              // true if the control was clicked for the first time
              // we need this so we can pan and zoom once we have the location
              this._justClicked = false;
  
              // true if the user has panned the map after clicking the control
              this._userPanned = false;
  
              // true if the user has zoomed the map after clicking the control
              this._userZoomed = false;
          }
      });
  
      L.control.locate = function (options) {
          return new L.Control.Locate(options);
      };
  
      return LocateControl;
  }, window));
  L.OSM.layers = function (options) {
    var control = L.control(options);
  
    control.onAdd = function (map) {
      var layers = options.layers;
  
      var $container = $("<div>")
        .attr("class", "control-layers");
  
      var button = $("<a>")
        .attr("class", "control-button")
        .attr("href", "#")
        .attr("title", I18n.t("javascripts.map.layers.title"))
        .html("<span class=\"icon layers\"></span>")
        .on("click", toggle)
        .appendTo($container);
  
      var $ui = $("<div>")
        .attr("class", "layers-ui");
  
      $("<div>")
        .attr("class", "sidebar_heading")
        .appendTo($ui)
        .append(
          $("<span>")
            .text(I18n.t("javascripts.close"))
            .attr("class", "icon close")
            .bind("click", toggle))
        .append(
          $("<h4>")
            .text(I18n.t("javascripts.map.layers.header")));
  
      var baseSection = $("<div>")
        .attr("class", "section base-layers")
        .appendTo($ui);
  
      var baseLayers = $("<ul>")
        .appendTo(baseSection);
  
      layers.forEach(function (layer) {
        var item = $("<li>")
          .appendTo(baseLayers);
  
        if (map.hasLayer(layer)) {
          item.addClass("active");
        }
  
        var div = $("<div>")
          .appendTo(item);
  
        map.whenReady(function () {
          var miniMap = L.map(div[0], { attributionControl: false, zoomControl: false, keyboard: false })
            .addLayer(new layer.constructor({ apikey: layer.options.apikey }));
  
          miniMap.dragging.disable();
          miniMap.touchZoom.disable();
          miniMap.doubleClickZoom.disable();
          miniMap.scrollWheelZoom.disable();
  
          $ui
            .on("show", shown)
            .on("hide", hide);
  
          function shown() {
            miniMap.invalidateSize();
            setView({ animate: false });
            map.on("moveend", moved);
          }
  
          function hide() {
            map.off("moveend", moved);
          }
  
          function moved() {
            setView();
          }
  
          function setView(options) {
            miniMap.setView(map.getCenter(), Math.max(map.getZoom() - 2, 0), options);
          }
        });
  
        var label = $("<label>")
          .appendTo(item);
  
        var input = $("<input>")
          .attr("type", "radio")
          .prop("checked", map.hasLayer(layer))
          .appendTo(label);
  
        label.append(layer.options.name);
  
        item.on("click", function () {
          layers.forEach(function (other) {
            if (other === layer) {
              map.addLayer(other);
            } else {
              map.removeLayer(other);
            }
          });
          map.fire("baselayerchange", { layer: layer });
        });
  
        item.on("dblclick", toggle);
  
        map.on("layeradd layerremove", function () {
          item.toggleClass("active", map.hasLayer(layer));
          input.prop("checked", map.hasLayer(layer));
        });
      });
  
      if (OSM.STATUS !== "api_offline" && OSM.STATUS !== "database_offline") {
        var overlaySection = $("<div>")
          .attr("class", "section overlay-layers")
          .appendTo($ui);
  
        $("<p>")
          .text(I18n.t("javascripts.map.layers.overlays"))
          .attr("class", "deemphasize")
          .appendTo(overlaySection);
  
        var overlays = $("<ul>")
          .appendTo(overlaySection);
  
        var addOverlay = function (layer, name, maxArea) {
          var item = $("<li>")
            .tooltip({
              placement: "top"
            })
            .appendTo(overlays);
  
          var label = $("<label>")
            .appendTo(item);
  
          var checked = map.hasLayer(layer);
  
          var input = $("<input>")
            .attr("type", "checkbox")
            .prop("checked", checked)
            .appendTo(label);
  
          label.append(I18n.t("javascripts.map.layers." + name));
  
          input.on("change", function () {
            checked = input.is(":checked");
            if (checked) {
              map.addLayer(layer);
            } else {
              map.removeLayer(layer);
            }
            map.fire("overlaylayerchange", { layer: layer });
          });
  
          map.on("layeradd layerremove", function () {
            input.prop("checked", map.hasLayer(layer));
          });
  
          map.on("zoomend", function () {
            var disabled = map.getBounds().getSize() >= maxArea;
            $(input).prop("disabled", disabled);
  
            if (disabled && $(input).is(":checked")) {
              $(input).prop("checked", false)
                .trigger("change");
              checked = true;
            } else if (!disabled && !$(input).is(":checked") && checked) {
              $(input).prop("checked", true)
                .trigger("change");
            }
  
            $(item).attr("class", disabled ? "disabled" : "");
            item.attr("data-original-title", disabled ?
              I18n.t("javascripts.site.map_" + name + "_zoom_in_tooltip") : "");
          });
        };
  
        addOverlay(map.noteLayer, "notes", OSM.MAX_NOTE_REQUEST_AREA);
        addOverlay(map.dataLayer, "data", OSM.MAX_REQUEST_AREA);
        addOverlay(map.gpsLayer, "gps", Number.POSITIVE_INFINITY);
      }
  
      options.sidebar.addPane($ui);
  
      function toggle(e) {
        e.stopPropagation();
        e.preventDefault();
        options.sidebar.togglePane($ui, button);
        $(".leaflet-control .control-button").tooltip("hide");
      }
  
      return $container[0];
    };
  
    return control;
  };
  L.OSM.key = function (options) {
    var control = L.control(options);
  
    control.onAdd = function (map) {
      var $container = $("<div>")
        .attr("class", "control-key");
  
      var button = $("<a>")
        .attr("class", "control-button")
        .attr("href", "#")
        .html("<span class=\"icon key\"></span>")
        .on("click", toggle)
        .appendTo($container);
  
      var $ui = $("<div>")
        .attr("class", "key-ui");
  
      $("<div>")
        .attr("class", "sidebar_heading")
        .appendTo($ui)
        .append(
          $("<span>")
            .text(I18n.t("javascripts.close"))
            .attr("class", "icon close")
            .bind("click", toggle))
        .append(
          $("<h4>")
            .text(I18n.t("javascripts.key.title")));
  
      var $section = $("<div>")
        .attr("class", "section")
        .appendTo($ui);
  
      options.sidebar.addPane($ui);
  
      $ui
        .on("show", shown)
        .on("hide", hidden);
  
      map.on("baselayerchange", updateButton);
  
      updateButton();
  
      function shown() {
        map.on("zoomend baselayerchange", update);
        $section.load("/key", update);
      }
  
      function hidden() {
        map.off("zoomend baselayerchange", update);
      }
  
      function toggle(e) {
        e.stopPropagation();
        e.preventDefault();
        if (!button.hasClass("disabled")) {
          options.sidebar.togglePane($ui, button);
        }
        $(".leaflet-control .control-button").tooltip("hide");
      }
  
      function updateButton() {
        var disabled = ["mapnik", "cyclemap"].indexOf(map.getMapBaseLayerId()) === -1;
        button
          .toggleClass("disabled", disabled)
          .attr("data-original-title",
                I18n.t(disabled ?
                  "javascripts.key.tooltip_disabled" :
                  "javascripts.key.tooltip"));
      }
  
      function update() {
        var layer = map.getMapBaseLayerId(),
            zoom = map.getZoom();
  
        $(".mapkey-table-entry").each(function () {
          var data = $(this).data();
          if (layer === data.layer && zoom >= data.zoomMin && zoom <= data.zoomMax) {
            $(this).show();
          } else {
            $(this).hide();
          }
        });
      }
  
      return $container[0];
    };
  
    return control;
  };
  L.OSM.note = function (options) {
    var control = L.control(options);
  
    control.onAdd = function (map) {
      var $container = $("<div>")
        .attr("class", "control-note");
  
      var link = $("<a>")
        .attr("class", "control-button")
        .attr("href", "#")
        .html("<span class=\"icon note\"></span>")
        .appendTo($container);
  
      map.on("zoomend", update);
  
      function update() {
        var disabled = OSM.STATUS === "database_offline" || map.getZoom() < 12;
        link
          .toggleClass("disabled", disabled)
          .attr("data-original-title", I18n.t(disabled ?
            "javascripts.site.createnote_disabled_tooltip" :
            "javascripts.site.createnote_tooltip"));
      }
  
      update();
  
      return $container[0];
    };
  
    return control;
  };
  L.OSM.share = function (options) {
    var control = L.control(options),
        marker = L.marker([0, 0], { draggable: true }),
        locationFilter = new L.LocationFilter({
          enableButton: false,
          adjustButton: false
        });
  
    control.onAdd = function (map) {
      var $container = $("<div>")
        .attr("class", "control-share");
  
      var button = $("<a>")
        .attr("class", "control-button")
        .attr("href", "#")
        .attr("title", I18n.t("javascripts.share.title"))
        .html("<span class=\"icon share\"></span>")
        .on("click", toggle)
        .appendTo($container);
  
      var $ui = $("<div>")
        .attr("class", "share-ui");
  
      $("<div>")
        .attr("class", "sidebar_heading")
        .appendTo($ui)
        .append(
          $("<span>")
            .text(I18n.t("javascripts.close"))
            .attr("class", "icon close")
            .bind("click", toggle))
        .append(
          $("<h4>")
            .text(I18n.t("javascripts.share.title")));
  
      // Link / Embed
  
      var $linkSection = $("<div>")
        .attr("class", "section share-link")
        .appendTo($ui);
  
      $("<h4>")
        .text(I18n.t("javascripts.share.link"))
        .appendTo($linkSection);
  
      var $form = $("<form>")
        .attr("class", "standard-form")
        .appendTo($linkSection);
  
      $("<div>")
        .attr("class", "form-row")
        .appendTo($form)
        .append(
          $("<label>")
            .attr("for", "link_marker")
            .append(
              $("<input>")
                .attr("id", "link_marker")
                .attr("type", "checkbox")
                .bind("change", toggleMarker))
            .append(I18n.t("javascripts.share.include_marker")));
  
      $("<div>")
        .attr("class", "share-tabs")
        .appendTo($form)
        .append($("<a>")
          .attr("class", "active")
          .attr("for", "long_input")
          .attr("id", "long_link")
          .text(I18n.t("javascripts.share.long_link")))
        .append($("<a>")
          .attr("for", "short_input")
          .attr("id", "short_link")
          .text(I18n.t("javascripts.share.short_link")))
        .append($("<a>")
          .attr("for", "embed_html")
          .attr("href", "#")
          .text(I18n.t("javascripts.share.embed")))
        .on("click", "a", function (e) {
          e.preventDefault();
          var id = "#" + $(this).attr("for");
          $linkSection.find(".share-tabs a")
            .removeClass("active");
          $(this).addClass("active");
          $linkSection.find(".share-tab")
            .hide();
          $linkSection.find(".share-tab:has(" + id + ")")
            .show()
            .find("input, textarea")
            .select();
        });
  
      $("<div>")
        .attr("class", "form-row share-tab")
        .css("display", "block")
        .appendTo($form)
        .append($("<input>")
          .attr("id", "long_input")
          .attr("type", "text")
          .on("click", select));
  
      $("<div>")
        .attr("class", "form-row share-tab")
        .appendTo($form)
        .append($("<input>")
          .attr("id", "short_input")
          .attr("type", "text")
          .on("click", select));
  
      $("<div>")
        .attr("class", "form-row share-tab")
        .appendTo($form)
        .append(
          $("<textarea>")
            .attr("id", "embed_html")
            .on("click", select))
        .append(
          $("<p>")
            .attr("class", "deemphasize")
            .text(I18n.t("javascripts.share.paste_html"))
            .appendTo($linkSection));
  
      // Geo URI
  
      var $geoUriSection = $("<div>")
        .attr("class", "section share-geo-uri")
        .appendTo($ui);
  
      $("<h4>")
        .text(I18n.t("javascripts.share.geo_uri"))
        .appendTo($geoUriSection);
  
      $("<div>")
        .appendTo($geoUriSection)
        .append($("<a>")
          .attr("id", "geo_uri"));
  
      // Image
  
      var $imageSection = $("<div>")
        .attr("class", "section share-image")
        .appendTo($ui);
  
      $("<h4>")
        .text(I18n.t("javascripts.share.image"))
        .appendTo($imageSection);
  
      $("<div>")
        .attr("id", "export-warning")
        .attr("class", "deemphasize")
        .text(I18n.t("javascripts.share.only_standard_layer"))
        .appendTo($imageSection);
  
      $form = $("<form>")
        .attr("id", "export-image")
        .attr("class", "standard-form")
        .attr("action", "/export/finish")
        .attr("method", "post")
        .appendTo($imageSection);
  
      $("<div>")
        .attr("class", "form-row")
        .appendTo($form)
        .append(
          $("<label>")
            .attr("for", "image_filter")
            .append(
              $("<input>")
                .attr("id", "image_filter")
                .attr("type", "checkbox")
                .bind("change", toggleFilter))
            .append(I18n.t("javascripts.share.custom_dimensions")));
  
      $("<div>")
        .attr("class", "form-row")
        .appendTo($form)
        .append(
          $("<label>")
            .attr("for", "mapnik_format")
            .text(I18n.t("javascripts.share.format")))
        .append($("<select>")
          .attr("name", "mapnik_format")
          .attr("id", "mapnik_format")
          .append($("<option>").val("png").text("PNG").prop("selected", true))
          .append($("<option>").val("jpeg").text("JPEG"))
          .append($("<option>").val("svg").text("SVG"))
          .append($("<option>").val("pdf").text("PDF")));
  
      $("<div>")
        .attr("class", "form-row")
        .appendTo($form)
        .append($("<label>")
          .attr("for", "mapnik_scale")
          .text(I18n.t("javascripts.share.scale")))
        .append("1 : ")
        .append($("<input>")
          .attr("name", "mapnik_scale")
          .attr("id", "mapnik_scale")
          .attr("type", "text")
          .on("change", update));
  
      ["minlon", "minlat", "maxlon", "maxlat"].forEach(function (name) {
        $("<input>")
          .attr("id", "mapnik_" + name)
          .attr("name", name)
          .attr("type", "hidden")
          .appendTo($form);
      });
  
      $("<input>")
        .attr("name", "format")
        .attr("value", "mapnik")
        .attr("type", "hidden")
        .appendTo($form);
  
      var csrf_param = $("meta[name=csrf-param]").attr("content"),
          csrf_token = $("meta[name=csrf-token]").attr("content");
  
      $("<input>")
        .attr("name", csrf_param)
        .attr("value", csrf_token)
        .attr("type", "hidden")
        .appendTo($form);
  
      $("<p>")
        .attr("class", "deemphasize")
        .html(I18n.t("javascripts.share.image_size") + " <span id=\"mapnik_image_width\"></span> x <span id=\"mapnik_image_height\"></span>")
        .appendTo($form);
  
      $("<input>")
        .attr("type", "submit")
        .attr("value", I18n.t("javascripts.share.download"))
        .appendTo($form);
  
      locationFilter
        .on("change", update)
        .addTo(map);
  
      marker.on("dragend", movedMarker);
      map.on("move", movedMap);
      map.on("moveend layeradd layerremove", update);
  
      options.sidebar.addPane($ui);
  
      $ui
        .on("hide", hidden);
  
      function hidden() {
        map.removeLayer(marker);
        map.options.scrollWheelZoom = map.options.doubleClickZoom = true;
        locationFilter.disable();
        update();
      }
  
      function toggle(e) {
        e.stopPropagation();
        e.preventDefault();
  
        $("#mapnik_scale").val(getScale());
        marker.setLatLng(map.getCenter());
  
        update();
        options.sidebar.togglePane($ui, button);
        $(".leaflet-control .control-button").tooltip("hide");
      }
  
      function toggleMarker() {
        if ($(this).is(":checked")) {
          marker.setLatLng(map.getCenter());
          map.addLayer(marker);
          map.options.scrollWheelZoom = map.options.doubleClickZoom = "center";
        } else {
          map.removeLayer(marker);
          map.options.scrollWheelZoom = map.options.doubleClickZoom = true;
        }
        update();
      }
  
      function toggleFilter() {
        if ($(this).is(":checked")) {
          locationFilter.setBounds(map.getBounds().pad(-0.2));
          locationFilter.enable();
        } else {
          locationFilter.disable();
        }
        update();
      }
  
      function movedMap() {
        marker.setLatLng(map.getCenter());
        update();
      }
  
      function movedMarker() {
        if (map.hasLayer(marker)) {
          map.off("move", movedMap);
          map.on("moveend", updateOnce);
          map.panTo(marker.getLatLng());
        }
      }
  
      function updateOnce() {
        map.off("moveend", updateOnce);
        map.on("move", movedMap);
        update();
      }
  
      function escapeHTML(string) {
        var htmlEscapes = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "\"": "&quot;",
          "'": "&#x27;"
        };
        return string === null ? "" : String(string).replace(/[&<>"']/g, function (match) {
          return htmlEscapes[match];
        });
      }
  
      function update() {
        var bounds = map.getBounds();
  
        $("#link_marker")
          .prop("checked", map.hasLayer(marker));
  
        $("#image_filter")
          .prop("checked", locationFilter.isEnabled());
  
        // Link / Embed
  
        $("#short_input").val(map.getShortUrl(marker));
        $("#long_input").val(map.getUrl(marker));
        $("#short_link").attr("href", map.getShortUrl(marker));
        $("#long_link").attr("href", map.getUrl(marker));
  
        var params = {
          bbox: bounds.toBBoxString(),
          layer: map.getMapBaseLayerId()
        };
  
        if (map.hasLayer(marker)) {
          var latLng = marker.getLatLng().wrap();
          params.marker = latLng.lat + "," + latLng.lng;
        }
  
        $("#embed_html").val(
          "<iframe width=\"425\" height=\"350\" frameborder=\"0\" scrolling=\"no\" marginheight=\"0\" marginwidth=\"0\" src=\"" +
            escapeHTML(OSM.SERVER_PROTOCOL + "://" + OSM.SERVER_URL + "/export/embed.html?" + $.param(params)) +
            "\" style=\"border: 1px solid black\"></iframe><br/>" +
            "<small><a href=\"" + escapeHTML(map.getUrl(marker)) + "\">" +
            escapeHTML(I18n.t("javascripts.share.view_larger_map")) + "</a></small>");
  
        // Geo URI
  
        $("#geo_uri")
          .attr("href", map.getGeoUri(marker))
          .html(map.getGeoUri(marker));
  
        // Image
  
        if (locationFilter.isEnabled()) {
          bounds = locationFilter.getBounds();
        }
  
        var scale = $("#mapnik_scale").val(),
            size = L.bounds(L.CRS.EPSG3857.project(bounds.getSouthWest()),
                            L.CRS.EPSG3857.project(bounds.getNorthEast())).getSize(),
            maxScale = Math.floor(Math.sqrt(size.x * size.y / 0.3136));
  
        $("#mapnik_minlon").val(bounds.getWest());
        $("#mapnik_minlat").val(bounds.getSouth());
        $("#mapnik_maxlon").val(bounds.getEast());
        $("#mapnik_maxlat").val(bounds.getNorth());
  
        if (scale < maxScale) {
          scale = roundScale(maxScale);
          $("#mapnik_scale").val(scale);
        }
  
        $("#mapnik_image_width").text(Math.round(size.x / scale / 0.00028));
        $("#mapnik_image_height").text(Math.round(size.y / scale / 0.00028));
  
        if (map.getMapBaseLayerId() === "mapnik") {
          $("#export-image").show();
          $("#export-warning").hide();
        } else {
          $("#export-image").hide();
          $("#export-warning").show();
        }
      }
  
      function select() {
        $(this).select();
      }
  
      function getScale() {
        var bounds = map.getBounds(),
            centerLat = bounds.getCenter().lat,
            halfWorldMeters = 6378137 * Math.PI * Math.cos(centerLat * Math.PI / 180),
            meters = halfWorldMeters * (bounds.getEast() - bounds.getWest()) / 180,
            pixelsPerMeter = map.getSize().x / meters,
            metersPerPixel = 1 / (92 * 39.3701);
        return Math.round(1 / (pixelsPerMeter * metersPerPixel));
      }
  
      function roundScale(scale) {
        var precision = 5 * Math.pow(10, Math.floor(Math.LOG10E * Math.log(scale)) - 2);
        return precision * Math.ceil(scale / precision);
      }
  
      return $container[0];
    };
  
    return control;
  };
  /*
   * Utility functions to decode/encode numbers and array's of numbers
   * to/from strings (Google maps polyline encoding)
   *
   * Extends the L.Polyline and L.Polygon object with methods to convert
   * to and create from these strings.
   *
   * Jan Pieter Waagmeester <jieter@jieter.nl>
   *
   * Original code from:
   * http://facstaff.unca.edu/mcmcclur/GoogleMaps/EncodePolyline/
   * (which is down as of december 2014)
   */
  
  (function () {
      'use strict';
  
      var defaultOptions = function (options) {
          if (typeof options === 'number') {
              // Legacy
              options = {
                  precision: options
              };
          } else {
              options = options || {};
          }
  
          options.precision = options.precision || 5;
          options.factor = options.factor || Math.pow(10, options.precision);
          options.dimension = options.dimension || 2;
          return options;
      };
  
      var PolylineUtil = {
          encode: function (points, options) {
              options = defaultOptions(options);
  
              var flatPoints = [];
              for (var i = 0, len = points.length; i < len; ++i) {
                  var point = points[i];
  
                  if (options.dimension === 2) {
                      flatPoints.push(point.lat || point[0]);
                      flatPoints.push(point.lng || point[1]);
                  } else {
                      for (var dim = 0; dim < options.dimension; ++dim) {
                          flatPoints.push(point[dim]);
                      }
                  }
              }
  
              return this.encodeDeltas(flatPoints, options);
          },
  
          decode: function (encoded, options) {
              options = defaultOptions(options);
  
              var flatPoints = this.decodeDeltas(encoded, options);
  
              var points = [];
              for (var i = 0, len = flatPoints.length; i + (options.dimension - 1) < len;) {
                  var point = [];
  
                  for (var dim = 0; dim < options.dimension; ++dim) {
                      point.push(flatPoints[i++]);
                  }
  
                  points.push(point);
              }
  
              return points;
          },
  
          encodeDeltas: function (numbers, options) {
              options = defaultOptions(options);
  
              var lastNumbers = [];
  
              for (var i = 0, len = numbers.length; i < len;) {
                  for (var d = 0; d < options.dimension; ++d, ++i) {
                      var num = numbers[i];
                      var delta = num - (lastNumbers[d] || 0);
                      lastNumbers[d] = num;
  
                      numbers[i] = delta;
                  }
              }
  
              return this.encodeFloats(numbers, options);
          },
  
          decodeDeltas: function (encoded, options) {
              options = defaultOptions(options);
  
              var lastNumbers = [];
  
              var numbers = this.decodeFloats(encoded, options);
              for (var i = 0, len = numbers.length; i < len;) {
                  for (var d = 0; d < options.dimension; ++d, ++i) {
                      numbers[i] = Math.round((lastNumbers[d] = numbers[i] + (lastNumbers[d] || 0)) * options.factor) / options.factor;
                  }
              }
  
              return numbers;
          },
  
          encodeFloats: function (numbers, options) {
              options = defaultOptions(options);
  
              for (var i = 0, len = numbers.length; i < len; ++i) {
                  numbers[i] = Math.round(numbers[i] * options.factor);
              }
  
              return this.encodeSignedIntegers(numbers);
          },
  
          decodeFloats: function (encoded, options) {
              options = defaultOptions(options);
  
              var numbers = this.decodeSignedIntegers(encoded);
              for (var i = 0, len = numbers.length; i < len; ++i) {
                  numbers[i] /= options.factor;
              }
  
              return numbers;
          },
  
          encodeSignedIntegers: function (numbers) {
              for (var i = 0, len = numbers.length; i < len; ++i) {
                  var num = numbers[i];
                  numbers[i] = (num < 0) ? ~(num << 1) : (num << 1);
              }
  
              return this.encodeUnsignedIntegers(numbers);
          },
  
          decodeSignedIntegers: function (encoded) {
              var numbers = this.decodeUnsignedIntegers(encoded);
  
              for (var i = 0, len = numbers.length; i < len; ++i) {
                  var num = numbers[i];
                  numbers[i] = (num & 1) ? ~(num >> 1) : (num >> 1);
              }
  
              return numbers;
          },
  
          encodeUnsignedIntegers: function (numbers) {
              var encoded = '';
              for (var i = 0, len = numbers.length; i < len; ++i) {
                  encoded += this.encodeUnsignedInteger(numbers[i]);
              }
              return encoded;
          },
  
          decodeUnsignedIntegers: function (encoded) {
              var numbers = [];
  
              var current = 0;
              var shift = 0;
  
              for (var i = 0, len = encoded.length; i < len; ++i) {
                  var b = encoded.charCodeAt(i) - 63;
  
                  current |= (b & 0x1f) << shift;
  
                  if (b < 0x20) {
                      numbers.push(current);
                      current = 0;
                      shift = 0;
                  } else {
                      shift += 5;
                  }
              }
  
              return numbers;
          },
  
          encodeSignedInteger: function (num) {
              num = (num < 0) ? ~(num << 1) : (num << 1);
              return this.encodeUnsignedInteger(num);
          },
  
          // This function is very similar to Google's, but I added
          // some stuff to deal with the double slash issue.
          encodeUnsignedInteger: function (num) {
              var value, encoded = '';
              while (num >= 0x20) {
                  value = (0x20 | (num & 0x1f)) + 63;
                  encoded += (String.fromCharCode(value));
                  num >>= 5;
              }
              value = num + 63;
              encoded += (String.fromCharCode(value));
  
              return encoded;
          }
      };
  
      // Export Node module
      if (typeof module === 'object' && typeof module.exports === 'object') {
          module.exports = PolylineUtil;
      }
  
      // Inject functionality into Leaflet
      if (typeof L === 'object') {
          if (!(L.Polyline.prototype.fromEncoded)) {
              L.Polyline.fromEncoded = function (encoded, options) {
                  return L.polyline(PolylineUtil.decode(encoded), options);
              };
          }
          if (!(L.Polygon.prototype.fromEncoded)) {
              L.Polygon.fromEncoded = function (encoded, options) {
                  return L.polygon(PolylineUtil.decode(encoded), options);
              };
          }
  
          var encodeMixin = {
              encodePath: function () {
                  return PolylineUtil.encode(this.getLatLngs());
              }
          };
  
          if (!L.Polyline.prototype.encodePath) {
              L.Polyline.include(encodeMixin);
          }
          if (!L.Polygon.prototype.encodePath) {
              L.Polygon.include(encodeMixin);
          }
  
          L.PolylineUtil = PolylineUtil;
      }
  })();
  L.OSM.query = function (options) {
    var control = L.control(options);
  
    control.onAdd = function (map) {
      var $container = $("<div>")
        .attr("class", "control-query");
  
      var link = $("<a>")
        .attr("class", "control-button")
        .attr("href", "#")
        .html("<span class=\"icon query\"></span>")
        .appendTo($container);
  
      map.on("zoomend", update);
  
      update();
  
      function update() {
        var wasDisabled = link.hasClass("disabled"),
            isDisabled = map.getZoom() < 14;
        link
          .toggleClass("disabled", isDisabled)
          .attr("data-original-title", I18n.t(isDisabled ?
            "javascripts.site.queryfeature_disabled_tooltip" :
            "javascripts.site.queryfeature_tooltip"));
  
        if (isDisabled && !wasDisabled) {
          link.trigger("disabled");
        } else if (wasDisabled && !isDisabled) {
          link.trigger("enabled");
        }
      }
  
      return $container[0];
    };
  
    return control;
  };
  /*
      Leaflet.contextmenu, a context menu for Leaflet.
      (c) 2015, Adam Ratcliffe, GeoSmart Maps Limited
  
      @preserve
  */
  
  (function(factory) {
      // Packaging/modules magic dance
      var L;
      if (typeof define === 'function' && define.amd) {
          // AMD
          define(['leaflet'], factory);
      } else if (typeof module === 'object' && typeof module.exports === 'object') {
          // Node/CommonJS
          L = require('leaflet');
          module.exports = factory(L);
      } else {
          // Browser globals
          if (typeof window.L === 'undefined') {
              throw new Error('Leaflet must be loaded first');
          }
          factory(window.L);
      }
  })(function(L) {
  L.Map.mergeOptions({
      contextmenuItems: []
  });
  
  L.Map.ContextMenu = L.Handler.extend({
      _touchstart: L.Browser.msPointer ? 'MSPointerDown' : L.Browser.pointer ? 'pointerdown' : 'touchstart',
      
      statics: {
          BASE_CLS: 'leaflet-contextmenu'
      },
      
      initialize: function (map) {
          L.Handler.prototype.initialize.call(this, map);
          
          this._items = [];
          this._visible = false;
  
          var container = this._container = L.DomUtil.create('div', L.Map.ContextMenu.BASE_CLS, map._container);
          container.style.zIndex = 10000;
          container.style.position = 'absolute';
  
          if (map.options.contextmenuWidth) {
              container.style.width = map.options.contextmenuWidth + 'px';
          }
  
          this._createItems();
  
          L.DomEvent
              .on(container, 'click', L.DomEvent.stop)
              .on(container, 'mousedown', L.DomEvent.stop)
              .on(container, 'dblclick', L.DomEvent.stop)
              .on(container, 'contextmenu', L.DomEvent.stop);
      },
  
      addHooks: function () {
          var container = this._map.getContainer();
  
          L.DomEvent
              .on(container, 'mouseleave', this._hide, this)
              .on(document, 'keydown', this._onKeyDown, this);
  
          if (L.Browser.touch) {
              L.DomEvent.on(document, this._touchstart, this._hide, this);
          }
  
          this._map.on({
              contextmenu: this._show,
              mousedown: this._hide,
              movestart: this._hide,
              zoomstart: this._hide
          }, this);
      },
  
      removeHooks: function () {
          var container = this._map.getContainer();
  
          L.DomEvent
              .off(container, 'mouseleave', this._hide, this)
              .off(document, 'keydown', this._onKeyDown, this);
  
          if (L.Browser.touch) {
              L.DomEvent.off(document, this._touchstart, this._hide, this);
          }
  
          this._map.off({
              contextmenu: this._show,
              mousedown: this._hide,
              movestart: this._hide,
              zoomstart: this._hide
          }, this);
      },
  
      showAt: function (point, data) {
          if (point instanceof L.LatLng) {
              point = this._map.latLngToContainerPoint(point);
          }
          this._showAtPoint(point, data);
      },
  
      hide: function () {
          this._hide();
      },
  
      addItem: function (options) {
          return this.insertItem(options);
      },
  
      insertItem: function (options, index) {
          index = index !== undefined ? index: this._items.length;
  
          var item = this._createItem(this._container, options, index);
  
          this._items.push(item);
  
          this._sizeChanged = true;
  
          this._map.fire('contextmenu.additem', {
              contextmenu: this,
              el: item.el,
              index: index
          });
  
          return item.el;
      },
  
      removeItem: function (item) {
          var container = this._container;
  
          if (!isNaN(item)) {
              item = container.children[item];
          }
  
          if (item) {
              this._removeItem(L.Util.stamp(item));
  
              this._sizeChanged = true;
  
              this._map.fire('contextmenu.removeitem', {
                  contextmenu: this,
                  el: item
              });
  
              return item;
          }
  
          return null;
      },
  
      removeAllItems: function () {
          var items = this._container.children,
              item;
  
          while (items.length) {
              item = items[0];
              this._removeItem(L.Util.stamp(item));
          }
          return items;
      },
  
      hideAllItems: function () {
          var item, i, l;
  
          for (i = 0, l = this._items.length; i < l; i++) {
              item = this._items[i];
              item.el.style.display = 'none';
          }
      },
  
      showAllItems: function () {
          var item, i, l;
  
          for (i = 0, l = this._items.length; i < l; i++) {
              item = this._items[i];
              item.el.style.display = '';
          }
      },
  
      setDisabled: function (item, disabled) {
          var container = this._container,
          itemCls = L.Map.ContextMenu.BASE_CLS + '-item';
  
          if (!isNaN(item)) {
              item = container.children[item];
          }
  
          if (item && L.DomUtil.hasClass(item, itemCls)) {
              if (disabled) {
                  L.DomUtil.addClass(item, itemCls + '-disabled');
                  this._map.fire('contextmenu.disableitem', {
                      contextmenu: this,
                      el: item
                  });
              } else {
                  L.DomUtil.removeClass(item, itemCls + '-disabled');
                  this._map.fire('contextmenu.enableitem', {
                      contextmenu: this,
                      el: item
                  });
              }
          }
      },
  
      isVisible: function () {
          return this._visible;
      },
  
      _createItems: function () {
          var itemOptions = this._map.options.contextmenuItems,
              item,
              i, l;
  
          for (i = 0, l = itemOptions.length; i < l; i++) {
              this._items.push(this._createItem(this._container, itemOptions[i]));
          }
      },
  
      _createItem: function (container, options, index) {
          if (options.separator || options === '-') {
              return this._createSeparator(container, index);
          }
  
          var itemCls = L.Map.ContextMenu.BASE_CLS + '-item',
              cls = options.disabled ? (itemCls + ' ' + itemCls + '-disabled') : itemCls,
              el = this._insertElementAt('a', cls, container, index),
              callback = this._createEventHandler(el, options.callback, options.context, options.hideOnSelect),
              icon = this._getIcon(options),
              iconCls = this._getIconCls(options),
              html = '';
  
          if (icon) {
              html = '<img class="' + L.Map.ContextMenu.BASE_CLS + '-icon" src="' + icon + '"/>';
          } else if (iconCls) {
              html = '<span class="' + L.Map.ContextMenu.BASE_CLS + '-icon ' + iconCls + '"></span>';
          }
  
          el.innerHTML = html + options.text;
          el.href = '#';
  
          L.DomEvent
              .on(el, 'mouseover', this._onItemMouseOver, this)
              .on(el, 'mouseout', this._onItemMouseOut, this)
              .on(el, 'mousedown', L.DomEvent.stopPropagation)
              .on(el, 'click', callback);
  
          if (L.Browser.touch) {
              L.DomEvent.on(el, this._touchstart, L.DomEvent.stopPropagation);
          }
  
          // Devices without a mouse fire "mouseover" on tap, but never â€œmouseout"
          if (!L.Browser.pointer) {
              L.DomEvent.on(el, 'click', this._onItemMouseOut, this);
          }
  
          return {
              id: L.Util.stamp(el),
              el: el,
              callback: callback
          };
      },
  
      _removeItem: function (id) {
          var item,
              el,
              i, l, callback;
  
          for (i = 0, l = this._items.length; i < l; i++) {
              item = this._items[i];
  
              if (item.id === id) {
                  el = item.el;
                  callback = item.callback;
  
                  if (callback) {
                      L.DomEvent
                          .off(el, 'mouseover', this._onItemMouseOver, this)
                          .off(el, 'mouseover', this._onItemMouseOut, this)
                          .off(el, 'mousedown', L.DomEvent.stopPropagation)
                          .off(el, 'click', callback);
  
                      if (L.Browser.touch) {
                          L.DomEvent.off(el, this._touchstart, L.DomEvent.stopPropagation);
                      }
  
                      if (!L.Browser.pointer) {
                          L.DomEvent.on(el, 'click', this._onItemMouseOut, this);
                      }
                  }
  
                  this._container.removeChild(el);
                  this._items.splice(i, 1);
  
                  return item;
              }
          }
          return null;
      },
  
      _createSeparator: function (container, index) {
          var el = this._insertElementAt('div', L.Map.ContextMenu.BASE_CLS + '-separator', container, index);
  
          return {
              id: L.Util.stamp(el),
              el: el
          };
      },
  
      _createEventHandler: function (el, func, context, hideOnSelect) {
          var me = this,
              map = this._map,
              disabledCls = L.Map.ContextMenu.BASE_CLS + '-item-disabled',
              hideOnSelect = (hideOnSelect !== undefined) ? hideOnSelect : true;
  
          return function (e) {
              if (L.DomUtil.hasClass(el, disabledCls)) {
                  return;
              }
  
              if (hideOnSelect) {
                  me._hide();
              }
  
              if (func) {
                  func.call(context || map, me._showLocation);
              }
  
              me._map.fire('contextmenu.select', {
                  contextmenu: me,
                  el: el
              });
          };
      },
  
      _insertElementAt: function (tagName, className, container, index) {
          var refEl,
              el = document.createElement(tagName);
  
          el.className = className;
  
          if (index !== undefined) {
              refEl = container.children[index];
          }
  
          if (refEl) {
              container.insertBefore(el, refEl);
          } else {
              container.appendChild(el);
          }
  
          return el;
      },
  
      _show: function (e) {
          this._showAtPoint(e.containerPoint, e);
      },
  
      _showAtPoint: function (pt, data) {
          if (this._items.length) {
              var map = this._map,
              layerPoint = map.containerPointToLayerPoint(pt),
              latlng = map.layerPointToLatLng(layerPoint),
              event = L.extend(data || {}, {contextmenu: this});
  
              this._showLocation = {
                  latlng: latlng,
                  layerPoint: layerPoint,
                  containerPoint: pt
              };
  
              if (data && data.relatedTarget){
                  this._showLocation.relatedTarget = data.relatedTarget;
              }
  
              this._setPosition(pt);
  
              if (!this._visible) {
                  this._container.style.display = 'block';
                  this._visible = true;
              }
  
              this._map.fire('contextmenu.show', event);
          }
      },
  
      _hide: function () {
          if (this._visible) {
              this._visible = false;
              this._container.style.display = 'none';
              this._map.fire('contextmenu.hide', {contextmenu: this});
          }
      },
  
      _getIcon: function (options) {
          return L.Browser.retina && options.retinaIcon || options.icon;
      },
  
      _getIconCls: function (options) {
          return L.Browser.retina && options.retinaIconCls || options.iconCls;
      },
  
      _setPosition: function (pt) {
          var mapSize = this._map.getSize(),
              container = this._container,
              containerSize = this._getElementSize(container),
              anchor;
  
          if (this._map.options.contextmenuAnchor) {
              anchor = L.point(this._map.options.contextmenuAnchor);
              pt = pt.add(anchor);
          }
  
          container._leaflet_pos = pt;
  
          if (pt.x + containerSize.x > mapSize.x) {
              container.style.left = 'auto';
              container.style.right = Math.min(Math.max(mapSize.x - pt.x, 0), mapSize.x - containerSize.x - 1) + 'px';
          } else {
              container.style.left = Math.max(pt.x, 0) + 'px';
              container.style.right = 'auto';
          }
  
          if (pt.y + containerSize.y > mapSize.y) {
              container.style.top = 'auto';
              container.style.bottom = Math.min(Math.max(mapSize.y - pt.y, 0), mapSize.y - containerSize.y - 1) + 'px';
          } else {
              container.style.top = Math.max(pt.y, 0) + 'px';
              container.style.bottom = 'auto';
          }
      },
  
      _getElementSize: function (el) {
          var size = this._size,
              initialDisplay = el.style.display;
  
          if (!size || this._sizeChanged) {
              size = {};
  
              el.style.left = '-999999px';
              el.style.right = 'auto';
              el.style.display = 'block';
  
              size.x = el.offsetWidth;
              size.y = el.offsetHeight;
  
              el.style.left = 'auto';
              el.style.display = initialDisplay;
  
              this._sizeChanged = false;
          }
  
          return size;
      },
  
      _onKeyDown: function (e) {
          var key = e.keyCode;
  
          // If ESC pressed and context menu is visible hide it
          if (key === 27) {
              this._hide();
          }
      },
  
      _onItemMouseOver: function (e) {
          L.DomUtil.addClass(e.target || e.srcElement, 'over');
      },
  
      _onItemMouseOut: function (e) {
          L.DomUtil.removeClass(e.target || e.srcElement, 'over');
      }
  });
  
  L.Map.addInitHook('addHandler', 'contextmenu', L.Map.ContextMenu);
  L.Mixin.ContextMenu = {
      bindContextMenu: function (options) {
          L.setOptions(this, options);
          this._initContextMenu();
  
          return this;
      },
  
      unbindContextMenu: function (){
          this.off('contextmenu', this._showContextMenu, this);
  
          return this;
      },
  
      addContextMenuItem: function (item) {
              this.options.contextmenuItems.push(item);
      },
  
      removeContextMenuItemWithIndex: function (index) {
          var items = [];
          for (var i = 0; i < this.options.contextmenuItems.length; i++) {
              if (this.options.contextmenuItems[i].index == index){
                  items.push(i);
              }
          }
          var elem = items.pop();
          while (elem !== undefined) {
              this.options.contextmenuItems.splice(elem,1);
              elem = items.pop();
          }
      },
  
      replaceContextMenuItem: function (item) {
          this.removeContextMenuItemWithIndex(item.index);
          this.addContextMenuItem(item);
      },
  
      _initContextMenu: function () {
          this._items = [];
  
          this.on('contextmenu', this._showContextMenu, this);
      },
  
      _showContextMenu: function (e) {
          var itemOptions,
              data, pt, i, l;
  
          if (this._map.contextmenu) {
              data = L.extend({relatedTarget: this}, e);
  
              pt = this._map.mouseEventToContainerPoint(e.originalEvent);
  
              if (!this.options.contextmenuInheritItems) {
                  this._map.contextmenu.hideAllItems();
              }
  
              for (i = 0, l = this.options.contextmenuItems.length; i < l; i++) {
                  itemOptions = this.options.contextmenuItems[i];
                  this._items.push(this._map.contextmenu.insertItem(itemOptions, itemOptions.index));
              }
  
              this._map.once('contextmenu.hide', this._hideContextMenu, this);
  
              this._map.contextmenu.showAt(pt, data);
          }
      },
  
      _hideContextMenu: function () {
          var i, l;
  
          for (i = 0, l = this._items.length; i < l; i++) {
              this._map.contextmenu.removeItem(this._items[i]);
          }
          this._items.length = 0;
  
          if (!this.options.contextmenuInheritItems) {
              this._map.contextmenu.showAllItems();
          }
      }
  };
  
  var classes = [L.Marker, L.Path],
      defaultOptions = {
          contextmenu: false,
          contextmenuItems: [],
          contextmenuInheritItems: true
      },
      cls, i, l;
  
  for (i = 0, l = classes.length; i < l; i++) {
      cls = classes[i];
  
      // L.Class should probably provide an empty options hash, as it does not test
      // for it here and add if needed
      if (!cls.prototype.options) {
          cls.prototype.options = defaultOptions;
      } else {
          cls.mergeOptions(defaultOptions);
      }
  
      cls.addInitHook(function () {
          if (this.options.contextmenu) {
              this._initContextMenu();
          }
      });
  
      cls.include(L.Mixin.ContextMenu);
  }
  return L.Map.ContextMenu;
  });
  require=(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({"querystring-component":[function(require,module,exports){
  module.exports=require('Xr2wId');
  },{}],"Xr2wId":[function(require,module,exports){
  
  /**
   * Module dependencies.
   */
  
  var trim = require('trim');
  
  /**
   * Parse the given query `str`.
   *
   * @param {String} str
   * @return {Object}
   * @api public
   */
  
  exports.parse = function(str){
    if ('string' !== typeof str) return {};
  
    str = trim(str);
    if ('' === str) return {};
  
    var obj = {};
    var pairs = str.split('&');
    for (var i = 0; i < pairs.length; i++) {
      var parts = pairs[i].split('=');
      obj[parts[0]] = null === parts[1]
        ? ''
        : decodeURIComponent(parts[1]);
    }
  
    return obj;
  };
  
  /**
   * Stringify the given `obj`.
   *
   * @param {Object} obj
   * @return {String}
   * @api public
   */
  
  exports.stringify = function(obj){
    if (!obj) return '';
    var pairs = [];
    for (var key in obj) {
      pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
    }
    return pairs.join('&');
  };
  
  },{"trim":1}],1:[function(require,module,exports){
  
  exports = module.exports = trim;
  
  function trim(str){
    return str.replace(/^\s*|\s*$/g, '');
  }
  
  exports.left = function(str){
    return str.replace(/^\s*/, '');
  };
  
  exports.right = function(str){
    return str.replace(/\s*$/, '');
  };
  
  },{}]},{},[])
  ;
  
  OSM.initializeContextMenu = function (map) {
    var querystring = require("querystring-component");
  
    map.contextmenu.addItem({
      text: I18n.t("javascripts.context.directions_from"),
      callback: function directionsFromHere(e) {
        var precision = OSM.zoomPrecision(map.getZoom()),
            latlng = e.latlng.wrap(),
            lat = latlng.lat.toFixed(precision),
            lng = latlng.lng.toFixed(precision);
  
        OSM.router.route("/directions?" + querystring.stringify({
          from: lat + "," + lng,
          to: $("#route_to").val()
        }));
      }
    });
  
    map.contextmenu.addItem({
      text: I18n.t("javascripts.context.directions_to"),
      callback: function directionsToHere(e) {
        var precision = OSM.zoomPrecision(map.getZoom()),
            latlng = e.latlng.wrap(),
            lat = latlng.lat.toFixed(precision),
            lng = latlng.lng.toFixed(precision);
  
        OSM.router.route("/directions?" + querystring.stringify({
          from: $("#route_from").val(),
          to: lat + "," + lng
        }));
      }
    });
  
    map.contextmenu.addItem({
      text: I18n.t("javascripts.context.add_note"),
      callback: function addNoteHere(e) {
        var precision = OSM.zoomPrecision(map.getZoom()),
            latlng = e.latlng.wrap(),
            lat = latlng.lat.toFixed(precision),
            lng = latlng.lng.toFixed(precision);
  
        OSM.router.route("/note/new?lat=" + lat + "&lon=" + lng);
      }
    });
  
    map.contextmenu.addItem({
      text: I18n.t("javascripts.context.show_address"),
      callback: function describeLocation(e) {
        var precision = OSM.zoomPrecision(map.getZoom()),
            latlng = e.latlng.wrap(),
            lat = latlng.lat.toFixed(precision),
            lng = latlng.lng.toFixed(precision);
  
        OSM.router.route("/search?whereami=1&query=" + encodeURIComponent(lat + "," + lng));
      }
    });
  
    map.contextmenu.addItem({
      text: I18n.t("javascripts.context.query_features"),
      callback: function queryFeatures(e) {
        var precision = OSM.zoomPrecision(map.getZoom()),
            latlng = e.latlng.wrap(),
            lat = latlng.lat.toFixed(precision),
            lng = latlng.lng.toFixed(precision);
  
        OSM.router.route("/query?lat=" + lat + "&lon=" + lng);
      }
    });
  
    map.contextmenu.addItem({
      text: I18n.t("javascripts.context.centre_map"),
      callback: function centreMap(e) {
        map.panTo(e.latlng);
      }
    });
  
    map.on("mousedown", function (e) {
      if (e.originalEvent.shiftKey) map.contextmenu.disable();
      else map.contextmenu.enable();
    });
  
    var updateMenu = function updateMenu() {
      map.contextmenu.setDisabled(2, map.getZoom() < 12);
      map.contextmenu.setDisabled(4, map.getZoom() < 14);
    };
  
    map.on("zoomend", updateMenu);
    updateMenu();
  };
   /*!
   * jQuery Simulate v1.0.0 - simulate browser mouse and keyboard events
   * https://github.com/jquery/jquery-simulate
   *
   * Copyright 2012 jQuery Foundation and other contributors
   * Released under the MIT license.
   * http://jquery.org/license
   *
   * Date: 2014-08-22
   */
  
  ;(function( $, undefined ) {
  
  var rkeyEvent = /^key/,
      rmouseEvent = /^(?:mouse|contextmenu)|click/;
  
  $.fn.simulate = function( type, options ) {
      return this.each(function() {
          new $.simulate( this, type, options );
      });
  };
  
  $.simulate = function( elem, type, options ) {
      var method = $.camelCase( "simulate-" + type );
  
      this.target = elem;
      this.options = options;
  
      if ( this[ method ] ) {
          this[ method ]();
      } else {
          this.simulateEvent( elem, type, options );
      }
  };
  
  $.extend( $.simulate, {
  
      keyCode: {
          BACKSPACE: 8,
          COMMA: 188,
          DELETE: 46,
          DOWN: 40,
          END: 35,
          ENTER: 13,
          ESCAPE: 27,
          HOME: 36,
          LEFT: 37,
          NUMPAD_ADD: 107,
          NUMPAD_DECIMAL: 110,
          NUMPAD_DIVIDE: 111,
          NUMPAD_ENTER: 108,
          NUMPAD_MULTIPLY: 106,
          NUMPAD_SUBTRACT: 109,
          PAGE_DOWN: 34,
          PAGE_UP: 33,
          PERIOD: 190,
          RIGHT: 39,
          SPACE: 32,
          TAB: 9,
          UP: 38
      },
  
      buttonCode: {
          LEFT: 0,
          MIDDLE: 1,
          RIGHT: 2
      }
  });
  
  $.extend( $.simulate.prototype, {
  
      simulateEvent: function( elem, type, options ) {
          var event = this.createEvent( type, options );
          this.dispatchEvent( elem, type, event, options );
      },
  
      createEvent: function( type, options ) {
          if ( rkeyEvent.test( type ) ) {
              return this.keyEvent( type, options );
          }
  
          if ( rmouseEvent.test( type ) ) {
              return this.mouseEvent( type, options );
          }
      },
  
      mouseEvent: function( type, options ) {
          var event, eventDoc, doc, body;
          options = $.extend({
              bubbles: true,
              cancelable: (type !== "mousemove"),
              view: window,
              detail: 0,
              screenX: 0,
              screenY: 0,
              clientX: 1,
              clientY: 1,
              ctrlKey: false,
              altKey: false,
              shiftKey: false,
              metaKey: false,
              button: 0,
              relatedTarget: undefined
          }, options );
  
          if ( document.createEvent ) {
              event = document.createEvent( "MouseEvents" );
              event.initMouseEvent( type, options.bubbles, options.cancelable,
                  options.view, options.detail,
                  options.screenX, options.screenY, options.clientX, options.clientY,
                  options.ctrlKey, options.altKey, options.shiftKey, options.metaKey,
                  options.button, options.relatedTarget || document.body.parentNode );
  
              // IE 9+ creates events with pageX and pageY set to 0.
              // Trying to modify the properties throws an error,
              // so we define getters to return the correct values.
              if ( event.pageX === 0 && event.pageY === 0 && Object.defineProperty ) {
                  eventDoc = event.relatedTarget.ownerDocument || document;
                  doc = eventDoc.documentElement;
                  body = eventDoc.body;
  
                  Object.defineProperty( event, "pageX", {
                      get: function() {
                          return options.clientX +
                              ( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) -
                              ( doc && doc.clientLeft || body && body.clientLeft || 0 );
                      }
                  });
                  Object.defineProperty( event, "pageY", {
                      get: function() {
                          return options.clientY +
                              ( doc && doc.scrollTop || body && body.scrollTop || 0 ) -
                              ( doc && doc.clientTop || body && body.clientTop || 0 );
                      }
                  });
              }
          } else if ( document.createEventObject ) {
              event = document.createEventObject();
              $.extend( event, options );
              // standards event.button uses constants defined here: http://msdn.microsoft.com/en-us/library/ie/ff974877(v=vs.85).aspx
              // old IE event.button uses constants defined here: http://msdn.microsoft.com/en-us/library/ie/ms533544(v=vs.85).aspx
              // so we actually need to map the standard back to oldIE
              event.button = {
                  0: 1,
                  1: 4,
                  2: 2
              }[ event.button ] || ( event.button === -1 ? 0 : event.button );
          }
  
          return event;
      },
  
      keyEvent: function( type, options ) {
          var event;
          options = $.extend({
              bubbles: true,
              cancelable: true,
              view: window,
              ctrlKey: false,
              altKey: false,
              shiftKey: false,
              metaKey: false,
              keyCode: 0,
              charCode: undefined
          }, options );
  
          if ( document.createEvent ) {
              try {
                  event = document.createEvent( "KeyEvents" );
                  event.initKeyEvent( type, options.bubbles, options.cancelable, options.view,
                      options.ctrlKey, options.altKey, options.shiftKey, options.metaKey,
                      options.keyCode, options.charCode );
              // initKeyEvent throws an exception in WebKit
              // see: http://stackoverflow.com/questions/6406784/initkeyevent-keypress-only-works-in-firefox-need-a-cross-browser-solution
              // and also https://bugs.webkit.org/show_bug.cgi?id=13368
              // fall back to a generic event until we decide to implement initKeyboardEvent
              } catch( err ) {
                  event = document.createEvent( "Events" );
                  event.initEvent( type, options.bubbles, options.cancelable );
                  $.extend( event, {
                      view: options.view,
                      ctrlKey: options.ctrlKey,
                      altKey: options.altKey,
                      shiftKey: options.shiftKey,
                      metaKey: options.metaKey,
                      keyCode: options.keyCode,
                      charCode: options.charCode
                  });
              }
          } else if ( document.createEventObject ) {
              event = document.createEventObject();
              $.extend( event, options );
          }
  
          if ( !!/msie [\w.]+/.exec( navigator.userAgent.toLowerCase() ) || (({}).toString.call( window.opera ) === "[object Opera]") ) {
              event.keyCode = (options.charCode > 0) ? options.charCode : options.keyCode;
              event.charCode = undefined;
          }
  
          return event;
      },
  
      dispatchEvent: function( elem, type, event ) {
          if ( elem[ type ] ) {
              elem[ type ]();
          } else if ( elem.dispatchEvent ) {
              elem.dispatchEvent( event );
          } else if ( elem.fireEvent ) {
              elem.fireEvent( "on" + type, event );
          }
      },
  
      simulateFocus: function() {
          var focusinEvent,
              triggered = false,
              element = $( this.target );
  
          function trigger() {
              triggered = true;
          }
  
          element.bind( "focus", trigger );
          element[ 0 ].focus();
  
          if ( !triggered ) {
              focusinEvent = $.Event( "focusin" );
              focusinEvent.preventDefault();
              element.trigger( focusinEvent );
              element.triggerHandler( "focus" );
          }
          element.unbind( "focus", trigger );
      },
  
      simulateBlur: function() {
          var focusoutEvent,
              triggered = false,
              element = $( this.target );
  
          function trigger() {
              triggered = true;
          }
  
          element.bind( "blur", trigger );
          element[ 0 ].blur();
  
          // blur events are async in IE
          setTimeout(function() {
              // IE won't let the blur occur if the window is inactive
              if ( element[ 0 ].ownerDocument.activeElement === element[ 0 ] ) {
                  element[ 0 ].ownerDocument.body.focus();
              }
  
              // Firefox won't trigger events if the window is inactive
              // IE doesn't trigger events if we had to manually focus the body
              if ( !triggered ) {
                  focusoutEvent = $.Event( "focusout" );
                  focusoutEvent.preventDefault();
                  element.trigger( focusoutEvent );
                  element.triggerHandler( "blur" );
              }
              element.unbind( "blur", trigger );
          }, 1 );
      }
  });
  
  
  
  /** complex events **/
  
  function findCenter( elem ) {
      var offset,
          document = $( elem.ownerDocument );
      elem = $( elem );
      offset = elem.offset();
  
      return {
          x: offset.left + elem.outerWidth() / 2 - document.scrollLeft(),
          y: offset.top + elem.outerHeight() / 2 - document.scrollTop()
      };
  }
  
  function findCorner( elem ) {
      var offset,
          document = $( elem.ownerDocument );
      elem = $( elem );
      offset = elem.offset();
  
      return {
          x: offset.left - document.scrollLeft(),
          y: offset.top - document.scrollTop()
      };
  }
  
  $.extend( $.simulate.prototype, {
      simulateDrag: function() {
          var i = 0,
              target = this.target,
              options = this.options,
              center = options.handle === "corner" ? findCorner( target ) : findCenter( target ),
              x = Math.floor( center.x ),
              y = Math.floor( center.y ),
              coord = { clientX: x, clientY: y },
              dx = options.dx || ( options.x !== undefined ? options.x - x : 0 ),
              dy = options.dy || ( options.y !== undefined ? options.y - y : 0 ),
              moves = options.moves || 3;
  
          this.simulateEvent( target, "mousedown", coord );
  
          for ( ; i < moves ; i++ ) {
              x += dx / moves;
              y += dy / moves;
  
              coord = {
                  clientX: Math.round( x ),
                  clientY: Math.round( y )
              };
  
              this.simulateEvent( target.ownerDocument, "mousemove", coord );
          }
  
          if ( $.contains( document, target ) ) {
              this.simulateEvent( target, "mouseup", coord );
              this.simulateEvent( target, "click", coord );
          } else {
              this.simulateEvent( document, "mouseup", coord );
          }
      }
  });
  
  })( jQuery );
  
  
  
  OSM.Search = function (map) {
    var querystring = require("querystring-component");
  
    $(".search_form input[name=query]").on("input", function (e) {
      if ($(e.target).val() === "") {
        $(".describe_location").fadeIn(100);
      } else {
        $(".describe_location").fadeOut(100);
      }
    });
  
    $(".search_form a.button.switch_link").on("click", function (e) {
      e.preventDefault();
      var query = $(e.target).parent().parent().find("input[name=query]").val();
      if (query) {
        OSM.router.route("/directions?from=" + encodeURIComponent(query) + OSM.formatHash(map));
      } else {
        OSM.router.route("/directions" + OSM.formatHash(map));
      }
    });
  
    $(".search_form").on("submit", function (e) {
      e.preventDefault();
      $("header").addClass("closed");
      var query = $(this).find("input[name=query]").val();
      if (query) {
        OSM.router.route("/search?query=" + encodeURIComponent(query) + OSM.formatHash(map));
      } else {
        OSM.router.route("/" + OSM.formatHash(map));
      }
    });
  
    $(".describe_location").on("click", function (e) {
      e.preventDefault();
      var center = map.getCenter().wrap(),
          precision = OSM.zoomPrecision(map.getZoom());
      OSM.router.route("/search?whereami=1&query=" + encodeURIComponent(
        center.lat.toFixed(precision) + "," + center.lng.toFixed(precision)
      ));
    });
  
    $("#sidebar_content")
      .on("click", ".search_more a", clickSearchMore)
      .on("click", ".search_results_entry a.set_position", clickSearchResult)
      .on("mouseover", "p.search_results_entry:has(a.set_position)", showSearchResult)
      .on("mouseout", "p.search_results_entry:has(a.set_position)", hideSearchResult)
      .on("mousedown", "p.search_results_entry:has(a.set_position)", function () {
        var moved = false;
        $(this).one("click", function (e) {
          if (!moved && !$(e.target).is("a")) {
            $(this).find("a.set_position").simulate("click", e);
          }
        }).one("mousemove", function () {
          moved = true;
        });
      });
  
    var markers = L.layerGroup().addTo(map);
  
    function clickSearchMore(e) {
      e.preventDefault();
      e.stopPropagation();
  
      var div = $(this).parents(".search_more");
  
      $(this).hide();
      div.find(".loader").show();
  
      $.get($(this).attr("href"), function (data) {
        div.replaceWith(data);
      });
    }
  
    function showSearchResult() {
      var marker = $(this).data("marker");
  
      if (!marker) {
        var data = $(this).find("a.set_position").data();
  
        marker = L.marker([data.lat, data.lon], { icon: OSM.getUserIcon() });
  
        $(this).data("marker", marker);
      }
  
      markers.addLayer(marker);
  
      $(this).closest("li").addClass("selected");
    }
  
    function hideSearchResult() {
      var marker = $(this).data("marker");
  
      if (marker) {
        markers.removeLayer(marker);
      }
  
      $(this).closest("li").removeClass("selected");
    }
  
    function panToSearchResult(data) {
      if (data.minLon && data.minLat && data.maxLon && data.maxLat) {
        map.fitBounds([[data.minLat, data.minLon], [data.maxLat, data.maxLon]]);
      } else {
        map.setView([data.lat, data.lon], data.zoom);
      }
    }
  
    function clickSearchResult(e) {
      var data = $(this).data();
  
      panToSearchResult(data);
  
      // Let clicks to object browser links propagate.
      if (data.type && data.id) return;
  
      e.preventDefault();
      e.stopPropagation();
    }
  
    var page = {};
  
    page.pushstate = page.popstate = function (path) {
      var params = querystring.parse(path.substring(path.indexOf("?") + 1));
      $(".search_form input[name=query]").val(params.query);
      $(".describe_location").hide();
      OSM.loadSidebarContent(path, page.load);
    };
  
    page.load = function () {
      $(".search_results_entry").each(function (index) {
        var entry = $(this);
        $.ajax({
          url: entry.data("href"),
          method: "GET",
          data: {
            zoom: map.getZoom(),
            minlon: map.getBounds().getWest(),
            minlat: map.getBounds().getSouth(),
            maxlon: map.getBounds().getEast(),
            maxlat: map.getBounds().getNorth()
          },
          success: function (html) {
            entry.html(html);
            // go to first result of first geocoder
            if (index === 0) {
              var firstResult = entry.find("*[data-lat][data-lon]:first").first();
              if (firstResult.length) {
                panToSearchResult(firstResult.data());
              }
            }
          }
        });
      });
  
      return map.getState();
    };
  
    page.unload = function () {
      markers.clearLayers();
      $(".search_form input[name=query]").val("");
      $(".describe_location").fadeIn(100);
    };
  
    return page;
  };
  OSM.initializeBrowse = function (map) {
    var browseBounds;
    var selectedLayer;
    var dataLayer = map.dataLayer;
  
    dataLayer.setStyle({
      way: {
        weight: 3,
        color: "#000000",
        opacity: 0.4
      },
      area: {
        weight: 3,
        color: "#ff0000"
      },
      node: {
        color: "#00ff00"
      }
    });
  
    dataLayer.isWayArea = function () {
      return false;
    };
  
    dataLayer.on("click", function (e) {
      onSelect(e.layer);
    });
  
    map.on("layeradd", function (e) {
      if (e.layer === dataLayer) {
        map.on("moveend", updateData);
        updateData();
      }
    });
  
    map.on("layerremove", function (e) {
      if (e.layer === dataLayer) {
        map.off("moveend", updateData);
        $("#browse_status").empty();
      }
    });
  
    function updateData() {
      var bounds = map.getBounds();
      if (!browseBounds || !browseBounds.contains(bounds)) {
        getData();
      }
    }
  
    function displayFeatureWarning(count, limit, add, cancel) {
      $("#browse_status").html(
        $("<p class='warning'></p>")
          .text(I18n.t("browse.start_rjs.feature_warning", { num_features: count, max_features: limit }))
          .prepend(
            $("<span class='icon close'></span>")
              .click(cancel))
          .append(
            $("<input type='submit'>")
              .val(I18n.t("browse.start_rjs.load_data"))
              .click(add)));
    }
  
    var dataLoader;
  
    function getData() {
      var bounds = map.getBounds();
      var url = "/api/" + OSM.API_VERSION + "/map?bbox=" + bounds.toBBoxString();
  
      /*
       * Modern browsers are quite happy showing far more than 100 features in
       * the data browser, so increase the limit to 2000 by default, but keep
       * it restricted to 500 for IE8 and 100 for older IEs.
       */
      var maxFeatures = 2000;
  
      /*@cc_on
        if (navigator.appVersion < 8) {
          maxFeatures = 100;
        } else if (navigator.appVersion < 9) {
          maxFeatures = 500;
        }
      @*/
  
      if (dataLoader) dataLoader.abort();
  
      dataLoader = $.ajax({
        url: url,
        success: function (xml) {
          dataLayer.clearLayers();
          selectedLayer = null;
  
          var features = dataLayer.buildFeatures(xml);
  
          function addFeatures() {
            $("#browse_status").empty();
            dataLayer.addData(features);
            browseBounds = bounds;
          }
  
          function cancelAddFeatures() {
            $("#browse_status").empty();
          }
  
          if (features.length < maxFeatures) {
            addFeatures();
          } else {
            displayFeatureWarning(features.length, maxFeatures, addFeatures, cancelAddFeatures);
          }
  
          dataLoader = null;
        }
      });
    }
  
    function onSelect(layer) {
      // Unselect previously selected feature
      if (selectedLayer) {
        selectedLayer.setStyle(selectedLayer.originalStyle);
      }
  
      // Redraw in selected style
      layer.originalStyle = layer.options;
      layer.setStyle({ color: "#0000ff", weight: 8 });
  
      OSM.router.route("/" + layer.feature.type + "/" + layer.feature.id);
  
      // Stash the currently drawn feature
      selectedLayer = layer;
    }
  };
  OSM.Export = function (map) {
    var page = {};
  
    var locationFilter = new L.LocationFilter({
      enableButton: false,
      adjustButton: false
    }).on("change", update);
  
    function getBounds() {
      return L.latLngBounds(
        L.latLng($("#minlat").val(), $("#minlon").val()),
        L.latLng($("#maxlat").val(), $("#maxlon").val()));
    }
  
    function boundsChanged() {
      var bounds = getBounds();
      map.fitBounds(bounds);
      locationFilter.setBounds(bounds);
      locationFilter.enable();
      validateControls();
    }
  
    function enableFilter(e) {
      e.preventDefault();
  
      $("#drag_box").hide();
  
      locationFilter.setBounds(map.getBounds().pad(-0.2));
      locationFilter.enable();
      validateControls();
    }
  
    function update() {
      setBounds(locationFilter.isEnabled() ? locationFilter.getBounds() : map.getBounds());
      validateControls();
    }
  
    function setBounds(bounds) {
      var precision = OSM.zoomPrecision(map.getZoom());
      $("#minlon").val(bounds.getWest().toFixed(precision));
      $("#minlat").val(bounds.getSouth().toFixed(precision));
      $("#maxlon").val(bounds.getEast().toFixed(precision));
      $("#maxlat").val(bounds.getNorth().toFixed(precision));
  
      $("#export_overpass").attr("href",
                                 "https://overpass-api.de/api/map?bbox=" +
                                 $("#minlon").val() + "," + $("#minlat").val() + "," +
                                 $("#maxlon").val() + "," + $("#maxlat").val());
    }
  
    function validateControls() {
      $("#export_osm_too_large").toggle(getBounds().getSize() > OSM.MAX_REQUEST_AREA);
      $("#export_commit").toggle(getBounds().getSize() < OSM.MAX_REQUEST_AREA);
    }
  
    function checkSubmit(e) {
      if (getBounds().getSize() > OSM.MAX_REQUEST_AREA) e.preventDefault();
    }
  
    page.pushstate = page.popstate = function (path) {
      $("#export_tab").addClass("current");
      OSM.loadSidebarContent(path, page.load);
    };
  
    page.load = function () {
      map
        .addLayer(locationFilter)
        .on("moveend", update);
  
      $("#maxlat, #minlon, #maxlon, #minlat").change(boundsChanged);
      $("#drag_box").click(enableFilter);
      $(".export_form").on("submit", checkSubmit);
  
      update();
      return map.getState();
    };
  
    page.unload = function () {
      map
        .removeLayer(locationFilter)
        .off("moveend", update);
  
      $("#export_tab").removeClass("current");
    };
  
    return page;
  };
  OSM.initializeNotes = function (map) {
    var noteLayer = map.noteLayer,
        notes = {};
  
    var noteIcons = {
      "new": L.icon({
        iconUrl: OSM.NEW_NOTE_MARKER,
        iconSize: [25, 40],
        iconAnchor: [12, 40]
      }),
      "open": L.icon({
        iconUrl: OSM.OPEN_NOTE_MARKER,
        iconSize: [25, 40],
        iconAnchor: [12, 40]
      }),
      "closed": L.icon({
        iconUrl: OSM.CLOSED_NOTE_MARKER,
        iconSize: [25, 40],
        iconAnchor: [12, 40]
      })
    };
  
    map.on("layeradd", function (e) {
      if (e.layer === noteLayer) {
        loadNotes();
        map.on("moveend", loadNotes);
      }
    }).on("layerremove", function (e) {
      if (e.layer === noteLayer) {
        map.off("moveend", loadNotes);
        noteLayer.clearLayers();
        notes = {};
      }
    });
  
    noteLayer.on("click", function (e) {
      if (e.layer.id) {
        OSM.router.route("/note/" + e.layer.id);
      }
    });
  
    function updateMarker(old_marker, feature) {
      var marker = old_marker;
      if (marker) {
        marker.setIcon(noteIcons[feature.properties.status]);
      } else {
        marker = L.marker(feature.geometry.coordinates.reverse(), {
          icon: noteIcons[feature.properties.status],
          title: feature.properties.comments[0].text,
          opacity: 0.8,
          interactive: true
        });
        marker.id = feature.properties.id;
        marker.addTo(noteLayer);
      }
      return marker;
    }
  
    noteLayer.getLayerId = function (marker) {
      return marker.id;
    };
  
    var noteLoader;
  
    function loadNotes() {
      var bounds = map.getBounds();
      var size = bounds.getSize();
  
      if (size <= OSM.MAX_NOTE_REQUEST_AREA) {
        var url = "/api/" + OSM.API_VERSION + "/notes.json?bbox=" + bounds.toBBoxString();
  
        if (noteLoader) noteLoader.abort();
  
        noteLoader = $.ajax({
          url: url,
          success: success
        });
      }
  
      function success(json) {
        var oldNotes = notes;
        notes = {};
        json.features.forEach(updateMarkers);
  
        function updateMarkers(feature) {
          var marker = oldNotes[feature.properties.id];
          delete oldNotes[feature.properties.id];
          notes[feature.properties.id] = updateMarker(marker, feature);
        }
  
        for (var id in oldNotes) {
          noteLayer.removeLayer(oldNotes[id]);
        }
  
        noteLoader = null;
      }
    }
  };
  
  OSM.History = function (map) {
    var page = {};
  
    $("#sidebar_content")
      .on("click", ".changeset_more a", loadMore)
      .on("mouseover", "[data-changeset]", function () {
        highlightChangeset($(this).data("changeset").id);
      })
      .on("mouseout", "[data-changeset]", function () {
        unHighlightChangeset($(this).data("changeset").id);
      })
      .on("mousedown", "[data-changeset]", function () {
        var moved = false;
        $(this)
          .one("click", function (e) {
            if (!moved && !$(e.target).is("a")) {
              clickChangeset($(this).data("changeset").id, e);
            }
          })
          .one("mousemove", function () {
            moved = true;
          });
      });
  
    var group = L.featureGroup()
      .on("mouseover", function (e) {
        highlightChangeset(e.layer.id);
      })
      .on("mouseout", function (e) {
        unHighlightChangeset(e.layer.id);
      })
      .on("click", function (e) {
        clickChangeset(e.layer.id, e);
      });
  
    group.getLayerId = function (layer) {
      return layer.id;
    };
  
    function highlightChangeset(id) {
      group.getLayer(id).setStyle({ fillOpacity: 0.3, color: "#FF6600", weight: 3 });
      $("#changeset_" + id).addClass("selected");
    }
  
    function unHighlightChangeset(id) {
      group.getLayer(id).setStyle({ fillOpacity: 0, color: "#FF9500", weight: 2 });
      $("#changeset_" + id).removeClass("selected");
    }
  
    function clickChangeset(id, e) {
      $("#changeset_" + id).find("a.changeset_id").simulate("click", e);
    }
  
    function update() {
      var data = { list: "1" };
  
      if (window.location.pathname === "/history") {
        data.bbox = map.getBounds().wrap().toBBoxString();
      }
  
      $.ajax({
        url: window.location.pathname,
        method: "GET",
        data: data,
        success: function (html) {
          $("#sidebar_content .changesets").html(html);
          updateMap();
        }
      });
  
      var feedLink = $("link[type=\"application/atom+xml\"]"),
          feedHref = feedLink.attr("href").split("?")[0];
  
      feedLink.attr("href", feedHref + "?bbox=" + data.bbox);
    }
  
    function loadMore(e) {
      e.preventDefault();
      e.stopPropagation();
  
      var div = $(this).parents(".changeset_more");
  
      $(this).hide();
      div.find(".loader").show();
  
      $.get($(this).attr("href"), function (data) {
        div.replaceWith(data);
        updateMap();
      });
    }
  
    var changesets = [];
  
    function updateBounds() {
      group.clearLayers();
  
      changesets.forEach(function (changeset) {
        var bottomLeft = map.project(L.latLng(changeset.bbox.minlat, changeset.bbox.minlon)),
            topRight = map.project(L.latLng(changeset.bbox.maxlat, changeset.bbox.maxlon)),
            width = topRight.x - bottomLeft.x,
            height = bottomLeft.y - topRight.y,
            minSize = 20; // Min width/height of changeset in pixels
  
        if (width < minSize) {
          bottomLeft.x -= ((minSize - width) / 2);
          topRight.x += ((minSize - width) / 2);
        }
  
        if (height < minSize) {
          bottomLeft.y += ((minSize - height) / 2);
          topRight.y -= ((minSize - height) / 2);
        }
  
        changeset.bounds = L.latLngBounds(map.unproject(bottomLeft),
                                          map.unproject(topRight));
      });
  
      changesets.sort(function (a, b) {
        return b.bounds.getSize() - a.bounds.getSize();
      });
  
      for (var i = 0; i < changesets.length; ++i) {
        var changeset = changesets[i],
            rect = L.rectangle(changeset.bounds,
                               { weight: 2, color: "#FF9500", opacity: 1, fillColor: "#FFFFAF", fillOpacity: 0 });
        rect.id = changeset.id;
        rect.addTo(group);
      }
    }
  
    function updateMap() {
      changesets = $("[data-changeset]").map(function (index, element) {
        return $(element).data("changeset");
      }).get().filter(function (changeset) {
        return changeset.bbox;
      });
  
      updateBounds();
  
      if (window.location.pathname !== "/history") {
        var bounds = group.getBounds();
        if (bounds.isValid()) map.fitBounds(bounds);
      }
    }
  
    page.pushstate = page.popstate = function (path) {
      $("#history_tab").addClass("current");
      OSM.loadSidebarContent(path, page.load);
    };
  
    page.load = function () {
      map.addLayer(group);
  
      if (window.location.pathname === "/history") {
        map.on("moveend", update);
      }
  
      map.on("zoomend", updateBounds);
  
      update();
    };
  
    page.unload = function () {
      map.removeLayer(group);
      map.off("moveend", update);
  
      $("#history_tab").removeClass("current");
    };
  
    return page;
  };
  OSM.Note = function (map) {
    var content = $("#sidebar_content"),
        page = {},
        halo, currentNote;
  
    var noteIcons = {
      "new": L.icon({
        iconUrl: OSM.NEW_NOTE_MARKER,
        iconSize: [25, 40],
        iconAnchor: [12, 40]
      }),
      "open": L.icon({
        iconUrl: OSM.OPEN_NOTE_MARKER,
        iconSize: [25, 40],
        iconAnchor: [12, 40]
      }),
      "closed": L.icon({
        iconUrl: OSM.CLOSED_NOTE_MARKER,
        iconSize: [25, 40],
        iconAnchor: [12, 40]
      })
    };
  
    function updateNote(form, method, url) {
      $(form).find("input[type=submit]").prop("disabled", true);
  
      $.ajax({
        url: url,
        type: method,
        oauth: true,
        data: { text: $(form.text).val() },
        success: function () {
          OSM.loadSidebarContent(window.location.pathname, page.load);
        }
      });
    }
  
    page.pushstate = page.popstate = function (path) {
      OSM.loadSidebarContent(path, function () {
        initialize(function () {
          var data = $(".details").data(),
              latLng = L.latLng(data.coordinates.split(","));
          if (!map.getBounds().contains(latLng)) moveToNote();
        });
      });
    };
  
    page.load = function () {
      initialize(moveToNote);
    };
  
    function initialize(callback) {
      content.find("input[type=submit]").on("click", function (e) {
        e.preventDefault();
        var data = $(e.target).data();
        updateNote(e.target.form, data.method, data.url);
      });
  
      content.find("textarea").on("input", function (e) {
        var form = e.target.form;
  
        if ($(e.target).val() === "") {
          $(form.close).val(I18n.t("javascripts.notes.show.resolve"));
          $(form.comment).prop("disabled", true);
        } else {
          $(form.close).val(I18n.t("javascripts.notes.show.comment_and_resolve"));
          $(form.comment).prop("disabled", false);
        }
      });
  
      content.find("textarea").val("").trigger("input");
  
      var data = $(".details").data(),
          latLng = L.latLng(data.coordinates.split(","));
  
      if (!map.hasLayer(halo)) {
        halo = L.circleMarker(latLng, {
          weight: 2.5,
          radius: 20,
          fillOpacity: 0.5,
          color: "#FF6200"
        });
        map.addLayer(halo);
      }
  
      if (map.hasLayer(currentNote)) map.removeLayer(currentNote);
      currentNote = L.marker(latLng, {
        icon: noteIcons[data.status],
        opacity: 1,
        interactive: true
      });
  
      map.addLayer(currentNote);
  
      if (callback) callback();
    }
  
    function moveToNote() {
      var data = $(".details").data(),
          latLng = L.latLng(data.coordinates.split(","));
  
      if (!window.location.hash || window.location.hash.match(/^#?c[0-9]+$/)) {
        OSM.router.withoutMoveListener(function () {
          map.setView(latLng, 15, { reset: true });
        });
      }
    }
  
    page.unload = function () {
      if (map.hasLayer(halo)) map.removeLayer(halo);
      if (map.hasLayer(currentNote)) map.removeLayer(currentNote);
    };
  
    return page;
  };
  
  OSM.NewNote = function (map) {
    var querystring = require("querystring-component");
  
    var noteLayer = map.noteLayer,
        content = $("#sidebar_content"),
        page = {},
        addNoteButton = $(".control-note .control-button"),
        newNote,
        halo;
  
    var noteIcons = {
      "new": L.icon({
        iconUrl: OSM.NEW_NOTE_MARKER,
        iconSize: [25, 40],
        iconAnchor: [12, 40]
      }),
      "open": L.icon({
        iconUrl: OSM.OPEN_NOTE_MARKER,
        iconSize: [25, 40],
        iconAnchor: [12, 40]
      }),
      "closed": L.icon({
        iconUrl: OSM.CLOSED_NOTE_MARKER,
        iconSize: [25, 40],
        iconAnchor: [12, 40]
      })
    };
  
    addNoteButton.on("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
  
      if ($(this).hasClass("disabled")) return;
  
      OSM.router.route("/note/new");
    });
  
    function createNote(marker, form, url) {
      var location = marker.getLatLng().wrap();
  
      marker.options.draggable = false;
      marker.dragging.disable();
  
      $(form).find("input[type=submit]").prop("disabled", true);
  
      $.ajax({
        url: url,
        type: "POST",
        oauth: true,
        data: {
          lat: location.lat,
          lon: location.lng,
          text: $(form.text).val()
        },
        success: function (feature) {
          noteCreated(feature, marker);
        }
      });
  
      function noteCreated(feature, marker) {
        content.find("textarea").val("");
        updateMarker(feature);
        newNote = null;
        noteLayer.removeLayer(marker);
        addNoteButton.removeClass("active");
        OSM.router.route("/note/" + feature.properties.id);
      }
    }
  
    function updateMarker(feature) {
      var marker = L.marker(feature.geometry.coordinates.reverse(), {
        icon: noteIcons[feature.properties.status],
        opacity: 0.9,
        interactive: true
      });
      marker.id = feature.properties.id;
      marker.addTo(noteLayer);
      return marker;
    }
  
    page.pushstate = page.popstate = function (path) {
      OSM.loadSidebarContent(path, function () {
        page.load(path);
      });
    };
  
    function newHalo(loc, a) {
      if (a === "dragstart" && map.hasLayer(halo)) {
        map.removeLayer(halo);
      } else {
        if (map.hasLayer(halo)) map.removeLayer(halo);
  
        halo = L.circleMarker(loc, {
          weight: 2.5,
          radius: 20,
          fillOpacity: 0.5,
          color: "#FF6200"
        });
  
        map.addLayer(halo);
      }
    }
  
    page.load = function (path) {
      if (addNoteButton.hasClass("disabled")) return;
      if (addNoteButton.hasClass("active")) return;
  
      addNoteButton.addClass("active");
  
      map.addLayer(noteLayer);
  
      var params = querystring.parse(path.substring(path.indexOf("?") + 1));
      var markerLatlng;
  
      if (params.lat && params.lon) {
        markerLatlng = L.latLng(params.lat, params.lon);
      } else {
        markerLatlng = map.getCenter();
      }
  
      map.panInside(markerLatlng, {
        padding: [50, 50]
      });
  
      newNote = L.marker(markerLatlng, {
        icon: noteIcons.new,
        opacity: 0.9,
        draggable: true
      });
  
      newNote.on("dragstart dragend", function (a) {
        newHalo(newNote.getLatLng(), a.type);
      });
  
      newNote.addTo(noteLayer);
      newHalo(newNote.getLatLng());
  
      newNote.on("remove", function () {
        addNoteButton.removeClass("active");
      }).on("dragstart", function () {
        $(newNote).stopTime("removenote");
      }).on("dragend", function () {
        content.find("textarea").focus();
      });
  
      content.find("textarea")
        .on("input", disableWhenBlank)
        .focus();
  
      function disableWhenBlank(e) {
        $(e.target.form.add).prop("disabled", $(e.target).val() === "");
      }
  
      content.find("input[type=submit]").on("click", function (e) {
        e.preventDefault();
        createNote(newNote, e.target.form, "/api/0.6/notes.json");
      });
  
      return map.getState();
    };
  
    page.unload = function () {
      noteLayer.removeLayer(newNote);
      map.removeLayer(halo);
      addNoteButton.removeClass("active");
    };
  
    return page;
  };
  
  
  
  
  OSM.Directions = function (map) {
    var querystring = require("querystring-component");
  
    var awaitingGeocode; // true if the user has requested a route, but we're waiting on a geocode result
    var awaitingRoute; // true if we've asked the engine for a route and are waiting to hear back
    var chosenEngine;
  
    var popup = L.popup({ autoPanPadding: [100, 100] });
  
    var polyline = L.polyline([], {
      color: "#03f",
      opacity: 0.3,
      weight: 10
    });
  
    var highlight = L.polyline([], {
      color: "#ff0",
      opacity: 0.5,
      weight: 12
    });
  
    var endpoints = [
      Endpoint($("input[name='route_from']"), OSM.MARKER_GREEN),
      Endpoint($("input[name='route_to']"), OSM.MARKER_RED)
    ];
  
    var expiry = new Date();
    expiry.setYear(expiry.getFullYear() + 10);
  
    var engines = OSM.Directions.engines;
  
    engines.sort(function (a, b) {
      var localised_a = I18n.t("javascripts.directions.engines." + a.id),
          localised_b = I18n.t("javascripts.directions.engines." + b.id);
      return localised_a.localeCompare(localised_b);
    });
  
    var select = $("select.routing_engines");
  
    engines.forEach(function (engine, i) {
      select.append("<option value='" + i + "'>" + I18n.t("javascripts.directions.engines." + engine.id) + "</option>");
    });
  
    function Endpoint(input, iconUrl) {
      var endpoint = {};
  
      endpoint.marker = L.marker([0, 0], {
        icon: L.icon({
          iconUrl: iconUrl,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowUrl: OSM.MARKER_SHADOW,
          shadowSize: [41, 41]
        }),
        draggable: true,
        autoPan: true
      });
  
      endpoint.marker.on("drag dragend", function (e) {
        var dragging = (e.type === "drag");
        if (dragging && !chosenEngine.draggable) return;
        if (dragging && awaitingRoute) return;
        endpoint.setLatLng(e.target.getLatLng());
        if (map.hasLayer(polyline)) {
          getRoute(false, !dragging);
        }
      });
  
      input.on("keydown", function () {
        input.removeClass("error");
      });
  
      input.on("change", function (e) {
        awaitingGeocode = true;
  
        // make text the same in both text boxes
        var value = e.target.value;
        endpoint.setValue(value);
      });
  
      endpoint.setValue = function (value, latlng) {
        endpoint.value = value;
        delete endpoint.latlng;
        input.removeClass("error");
        input.val(value);
  
        if (latlng) {
          endpoint.setLatLng(latlng);
        } else {
          endpoint.getGeocode();
        }
      };
  
      endpoint.getGeocode = function () {
        // if no one has entered a value yet, then we can't geocode, so don't
        // even try.
        if (!endpoint.value) {
          return;
        }
  
        endpoint.awaitingGeocode = true;
  
        var viewbox = map.getBounds().toBBoxString(); // <sw lon>,<sw lat>,<ne lon>,<ne lat>
  
        $.getJSON(OSM.NOMINATIM_URL + "search?q=" + encodeURIComponent(endpoint.value) + "&format=json&viewbox=" + viewbox, function (json) {
          endpoint.awaitingGeocode = false;
          endpoint.hasGeocode = true;
          if (json.length === 0) {
            input.addClass("error");
            alert(I18n.t("javascripts.directions.errors.no_place", { place: endpoint.value }));
            return;
          }
  
          endpoint.setLatLng(L.latLng(json[0]));
  
          input.val(json[0].display_name);
  
          if (awaitingGeocode) {
            awaitingGeocode = false;
            getRoute(true, true);
          }
        });
      };
  
      endpoint.setLatLng = function (ll) {
        var precision = OSM.zoomPrecision(map.getZoom());
        input.val(ll.lat.toFixed(precision) + ", " + ll.lng.toFixed(precision));
        endpoint.hasGeocode = true;
        endpoint.latlng = ll;
        endpoint.marker
          .setLatLng(ll)
          .addTo(map);
      };
  
      return endpoint;
    }
  
    $(".directions_form .reverse_directions").on("click", function () {
      var from = endpoints[0].latlng,
          to = endpoints[1].latlng;
  
      OSM.router.route("/directions?" + querystring.stringify({
        from: $("#route_to").val(),
        to: $("#route_from").val(),
        route: to.lat + "," + to.lng + ";" + from.lat + "," + from.lng
      }));
    });
  
    $(".directions_form .close").on("click", function (e) {
      e.preventDefault();
      var route_from = endpoints[0].value;
      if (route_from) {
        OSM.router.route("/?query=" + encodeURIComponent(route_from) + OSM.formatHash(map));
      } else {
        OSM.router.route("/" + OSM.formatHash(map));
      }
    });
  
    function formatDistance(m) {
      if (m < 1000) {
        return Math.round(m) + "m";
      } else if (m < 10000) {
        return (m / 1000.0).toFixed(1) + "km";
      } else {
        return Math.round(m / 1000) + "km";
      }
    }
  
    function formatTime(s) {
      var m = Math.round(s / 60);
      var h = Math.floor(m / 60);
      m -= h * 60;
      return h + ":" + (m < 10 ? "0" : "") + m;
    }
  
    function findEngine(id) {
      return engines.findIndex(function (engine) {
        return engine.id === id;
      });
    }
  
    function setEngine(index) {
      chosenEngine = engines[index];
      select.val(index);
    }
  
    function getRoute(fitRoute, reportErrors) {
      // Cancel any route that is already in progress
      if (awaitingRoute) awaitingRoute.abort();
  
      // go fetch geocodes for any endpoints which have not already
      // been geocoded.
      for (var ep_i = 0; ep_i < 2; ++ep_i) {
        var endpoint = endpoints[ep_i];
        if (!endpoint.hasGeocode && !endpoint.awaitingGeocode) {
          endpoint.getGeocode();
          awaitingGeocode = true;
        }
      }
      if (endpoints[0].awaitingGeocode || endpoints[1].awaitingGeocode) {
        awaitingGeocode = true;
        return;
      }
  
      var o = endpoints[0].latlng,
          d = endpoints[1].latlng;
  
      if (!o || !d) return;
      $("header").addClass("closed");
  
      var precision = OSM.zoomPrecision(map.getZoom());
  
      OSM.router.replace("/directions?" + querystring.stringify({
        engine: chosenEngine.id,
        route: o.lat.toFixed(precision) + "," + o.lng.toFixed(precision) + ";" +
               d.lat.toFixed(precision) + "," + d.lng.toFixed(precision)
      }));
  
      // copy loading item to sidebar and display it. we copy it, rather than
      // just using it in-place and replacing it in case it has to be used
      // again.
      $("#sidebar_content").html($(".directions_form .loader_copy").html());
      map.setSidebarOverlaid(false);
  
      awaitingRoute = chosenEngine.getRoute([o, d], function (err, route) {
        awaitingRoute = null;
  
        if (err) {
          map.removeLayer(polyline);
  
          if (reportErrors) {
            $("#sidebar_content").html("<p class=\"search_results_error\">" + I18n.t("javascripts.directions.errors.no_route") + "</p>");
          }
  
          return;
        }
  
        polyline
          .setLatLngs(route.line)
          .addTo(map);
  
        if (fitRoute) {
          map.fitBounds(polyline.getBounds().pad(0.05));
        }
  
        var html = "<h2><a class=\"geolink\" href=\"#\">" +
          "<span class=\"icon close\"></span></a>" + I18n.t("javascripts.directions.directions") +
          "</h2><p id=\"routing_summary\">" +
          I18n.t("javascripts.directions.distance") + ": " + formatDistance(route.distance) + ". " +
          I18n.t("javascripts.directions.time") + ": " + formatTime(route.time) + ".";
        if (typeof route.ascend !== "undefined" && typeof route.descend !== "undefined") {
          html += "<br />" +
            I18n.t("javascripts.directions.ascend") + ": " + Math.round(route.ascend) + "m. " +
            I18n.t("javascripts.directions.descend") + ": " + Math.round(route.descend) + "m.";
        }
        html += "</p><table id=\"turnbyturn\" />";
  
        $("#sidebar_content")
          .html(html);
  
        // Add each row
        route.steps.forEach(function (step) {
          var ll = step[0],
              direction = step[1],
              instruction = step[2],
              dist = step[3],
              lineseg = step[4];
  
          if (dist < 5) {
            dist = "";
          } else if (dist < 200) {
            dist = String(Math.round(dist / 10) * 10) + "m";
          } else if (dist < 1500) {
            dist = String(Math.round(dist / 100) * 100) + "m";
          } else if (dist < 5000) {
            dist = String(Math.round(dist / 100) / 10) + "km";
          } else {
            dist = String(Math.round(dist / 1000)) + "km";
          }
  
          var row = $("<tr class='turn'/>");
          row.append("<td><div class='direction i" + direction + "'/></td> ");
          row.append("<td class='instruction'>" + instruction);
          row.append("<td class='distance'>" + dist);
  
          row.on("click", function () {
            popup
              .setLatLng(ll)
              .setContent("<p>" + instruction + "</p>")
              .openOn(map);
          });
  
          row.hover(function () {
            highlight
              .setLatLngs(lineseg)
              .addTo(map);
          }, function () {
            map.removeLayer(highlight);
          });
  
          $("#turnbyturn").append(row);
        });
  
        $("#sidebar_content").append("<p id=\"routing_credit\">" +
          I18n.t("javascripts.directions.instructions.courtesy", { link: chosenEngine.creditline }) +
          "</p>");
  
        $("#sidebar_content a.geolink").on("click", function (e) {
          e.preventDefault();
          map.removeLayer(polyline);
          $("#sidebar_content").html("");
          map.setSidebarOverlaid(true);
          // TODO: collapse width of sidebar back to previous
        });
      });
    }
  
    var chosenEngineIndex = findEngine("fossgis_osrm_car");
    if ($.cookie("_osm_directions_engine")) {
      chosenEngineIndex = findEngine($.cookie("_osm_directions_engine"));
    }
    setEngine(chosenEngineIndex);
  
    select.on("change", function (e) {
      chosenEngine = engines[e.target.selectedIndex];
      $.cookie("_osm_directions_engine", chosenEngine.id, { expires: expiry, path: "/" });
      if (map.hasLayer(polyline)) {
        getRoute(true, true);
      }
    });
  
    $(".directions_form").on("submit", function (e) {
      e.preventDefault();
      getRoute(true, true);
    });
  
    $(".routing_marker").on("dragstart", function (e) {
      var dt = e.originalEvent.dataTransfer;
      dt.effectAllowed = "move";
      var dragData = { type: $(this).data("type") };
      dt.setData("text", JSON.stringify(dragData));
      if (dt.setDragImage) {
        var img = $("<img>").attr("src", $(e.originalEvent.target).attr("src"));
        dt.setDragImage(img.get(0), 12, 21);
      }
    });
  
    var page = {};
  
    page.pushstate = page.popstate = function () {
      $(".search_form").hide();
      $(".directions_form").show();
  
      $("#map").on("dragend dragover", function (e) {
        e.preventDefault();
      });
  
      $("#map").on("drop", function (e) {
        e.preventDefault();
        var oe = e.originalEvent;
        var dragData = JSON.parse(oe.dataTransfer.getData("text"));
        var type = dragData.type;
        var pt = L.DomEvent.getMousePosition(oe, map.getContainer()); // co-ordinates of the mouse pointer at present
        pt.y += 20;
        var ll = map.containerPointToLatLng(pt);
        endpoints[type === "from" ? 0 : 1].setLatLng(ll);
        getRoute(true, true);
      });
  
      var params = querystring.parse(location.search.substring(1)),
          route = (params.route || "").split(";"),
          from = route[0] && L.latLng(route[0].split(",")),
          to = route[1] && L.latLng(route[1].split(","));
  
      if (params.engine) {
        var engineIndex = findEngine(params.engine);
  
        if (engineIndex >= 0) {
          setEngine(engineIndex);
        }
      }
  
      endpoints[0].setValue(params.from || "", from);
      endpoints[1].setValue(params.to || "", to);
  
      map.setSidebarOverlaid(!from || !to);
  
      getRoute(true, true);
    };
  
    page.load = function () {
      page.pushstate();
    };
  
    page.unload = function () {
      $(".search_form").show();
      $(".directions_form").hide();
      $("#map").off("dragend dragover drop");
  
      map
        .removeLayer(popup)
        .removeLayer(polyline)
        .removeLayer(endpoints[0].marker)
        .removeLayer(endpoints[1].marker);
    };
  
    return page;
  };
  
  OSM.Directions.engines = [];
  
  OSM.Directions.addEngine = function (engine, supportsHTTPS) {
    if (document.location.protocol === "http:" || supportsHTTPS) {
      OSM.Directions.engines.push(engine);
    }
  };
  // FOSSGIS engine (OSRM based)
  // Doesn't yet support hints
  
  function FOSSGISEngine(id, vehicleType) {
    var cachedHints = [];
  
    return {
      id: id,
      creditline: "<a href=\"https://routing.openstreetmap.de/about.html\" target=\"_blank\">FOSSGIS Routing Service</a>",
      draggable: true,
  
      _transformSteps: function (input_steps, line) {
        var INSTRUCTION_TEMPLATE = {
          "continue": "javascripts.directions.instructions.continue",
          "merge right": "javascripts.directions.instructions.merge_right",
          "merge left": "javascripts.directions.instructions.merge_left",
          "off ramp right": "javascripts.directions.instructions.offramp_right",
          "off ramp left": "javascripts.directions.instructions.offramp_left",
          "on ramp right": "javascripts.directions.instructions.onramp_right",
          "on ramp left": "javascripts.directions.instructions.onramp_left",
          "fork right": "javascripts.directions.instructions.fork_right",
          "fork left": "javascripts.directions.instructions.fork_left",
          "end of road right": "javascripts.directions.instructions.endofroad_right",
          "end of road left": "javascripts.directions.instructions.endofroad_left",
          "turn straight": "javascripts.directions.instructions.continue",
          "turn slight right": "javascripts.directions.instructions.slight_right",
          "turn right": "javascripts.directions.instructions.turn_right",
          "turn sharp right": "javascripts.directions.instructions.sharp_right",
          "turn uturn": "javascripts.directions.instructions.uturn",
          "turn sharp left": "javascripts.directions.instructions.sharp_left",
          "turn left": "javascripts.directions.instructions.turn_left",
          "turn slight left": "javascripts.directions.instructions.slight_left",
          "roundabout": "javascripts.directions.instructions.roundabout",
          "rotary": "javascripts.directions.instructions.roundabout",
          "exit roundabout": "javascripts.directions.instructions.exit_roundabout",
          "exit rotary": "javascripts.directions.instructions.exit_roundabout",
          "depart": "javascripts.directions.instructions.start",
          "arrive": "javascripts.directions.instructions.destination"
        };
        var ICON_MAP = {
          "continue": 0,
          "merge right": 21,
          "merge left": 20,
          "off ramp right": 24,
          "off ramp left": 25,
          "on ramp right": 2,
          "on ramp left": 6,
          "fork right": 18,
          "fork left": 19,
          "end of road right": 22,
          "end of road left": 23,
          "turn straight": 0,
          "turn slight right": 1,
          "turn right": 2,
          "turn sharp right": 3,
          "turn uturn": 4,
          "turn slight left": 5,
          "turn left": 6,
          "turn sharp left": 7,
          "roundabout": 10,
          "rotary": 10,
          "exit roundabout": 10,
          "exit rotary": 10,
          "depart": 8,
          "arrive": 14
        };
        var numToWord = function (num) {
          return ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"][num - 1];
        };
        var transformed_steps = input_steps.map(function (step, idx) {
          var maneuver_id;
  
          // special case handling
          switch (step.maneuver.type) {
            case "on ramp":
            case "off ramp":
            case "merge":
            case "end of road":
            case "fork":
              maneuver_id = step.maneuver.type + " " + (step.maneuver.modifier.indexOf("left") >= 0 ? "left" : "right");
              break;
            case "depart":
            case "arrive":
            case "roundabout":
            case "rotary":
            case "exit roundabout":
            case "exit rotary":
              maneuver_id = step.maneuver.type;
              break;
            case "roundabout turn":
            case "turn":
              maneuver_id = "turn " + step.maneuver.modifier;
              break;
            // for unknown types the fallback is turn
            default:
              maneuver_id = "turn " + step.maneuver.modifier;
              break;
          }
          var template = INSTRUCTION_TEMPLATE[maneuver_id];
  
          // convert lat,lng pairs to LatLng objects
          var step_geometry = L.PolylineUtil.decode(step.geometry, { precision: 5 }).map(function (a) { return L.latLng(a); });
          // append step_geometry on line
          Array.prototype.push.apply(line, step_geometry);
  
          var instText = "<b>" + (idx + 1) + ".</b> ";
          var destinations = "<b>" + step.destinations + "</b>";
          var namedRoad = true;
          var name;
  
          if (step.name && step.ref) {
            name = "<b>" + step.name + " (" + step.ref + ")</b>";
          } else if (step.name) {
            name = "<b>" + step.name + "</b>";
          } else if (step.ref) {
            name = "<b>" + step.ref + "</b>";
          } else {
            name = I18n.t("javascripts.directions.instructions.unnamed");
            namedRoad = false;
          }
  
          if (step.maneuver.type.match(/^exit (rotary|roundabout)$/)) {
            instText += I18n.t(template, { name: name });
          } else if (step.maneuver.type.match(/^(rotary|roundabout)$/)) {
            if (step.maneuver.exit) {
              if (step.maneuver.exit <= 10) {
                instText += I18n.t(template + "_with_exit_ordinal", { exit: I18n.t("javascripts.directions.instructions.exit_counts." + numToWord(step.maneuver.exit)), name: name });
              } else {
                instText += I18n.t(template + "_with_exit", { exit: step.maneuver.exit, name: name });
              }
            } else {
              instText += I18n.t(template + "_without_exit", { name: name });
            }
          } else if (step.maneuver.type.match(/^(on ramp|off ramp)$/)) {
            var params = {};
            if (step.exits && step.maneuver.type.match(/^(off ramp)$/)) params.exit = step.exits;
            if (step.destinations) params.directions = destinations;
            if (namedRoad) params.directions = name;
            if (Object.keys(params).length > 0) {
              template = template + "_with_" + Object.keys(params).join("_");
            }
            instText += I18n.t(template, params);
          } else {
            instText += I18n.t(template + "_without_exit", { name: name });
          }
          return [[step.maneuver.location[1], step.maneuver.location[0]], ICON_MAP[maneuver_id], instText, step.distance, step_geometry];
        });
  
        return transformed_steps;
      },
  
      getRoute: function (points, callback) {
        var params = [
          { name: "overview", value: "false" },
          { name: "geometries", value: "polyline" },
          { name: "steps", value: true }
        ];
  
  
        if (cachedHints.length === points.length) {
          params.push({ name: "hints", value: cachedHints.join(";") });
        } else {
          // invalidate cache
          cachedHints = [];
        }
  
        var encoded_coords = points.map(function (p) {
          return p.lng + "," + p.lat;
        }).join(";");
  
        var req_url = OSM.FOSSGIS_OSRM_URL + "routed-" + vehicleType + "/route/v1/driving/" + encoded_coords;
  
        var onResponse = function (data) {
          if (data.code !== "Ok") {
            return callback(true);
          }
  
          cachedHints = data.waypoints.map(function (wp) {
            return wp.hint;
          });
  
          var line = [];
          var transformLeg = function (leg) {
            return this._transformSteps(leg.steps, line);
          };
  
          var steps = [].concat.apply([], data.routes[0].legs.map(transformLeg.bind(this)));
  
          callback(false, {
            line: line,
            steps: steps,
            distance: data.routes[0].distance,
            time: data.routes[0].duration
          });
        };
  
        return $.ajax({
          url: req_url,
          data: params,
          dataType: "json",
          success: onResponse.bind(this),
          error: function () {
            callback(true);
          }
        });
      }
    };
  }
  
  OSM.Directions.addEngine(new FOSSGISEngine("fossgis_osrm_car", "car"), true);
  OSM.Directions.addEngine(new FOSSGISEngine("fossgis_osrm_bike", "bike"), true);
  OSM.Directions.addEngine(new FOSSGISEngine("fossgis_osrm_foot", "foot"), true);
  
  function GraphHopperEngine(id, vehicleType) {
    var GH_INSTR_MAP = {
      "-3": 7, // sharp left
      "-2": 6, // left
      "-1": 5, // slight left
      "0": 0, // straight
      "1": 1, // slight right
      "2": 2, // right
      "3": 3, // sharp right
      "4": 14, // finish reached
      "5": 14, // via reached
      "6": 10 // roundabout
    };
  
    return {
      id: id,
      creditline: "<a href=\"https://www.graphhopper.com/\" target=\"_blank\">Graphhopper</a>",
      draggable: false,
  
      getRoute: function (points, callback) {
        // GraphHopper Directions API documentation
        // https://graphhopper.com/api/1/docs/routing/
        return $.ajax({
          url: OSM.GRAPHHOPPER_URL,
          data: {
            "vehicle": vehicleType,
            "locale": I18n.currentLocale(),
            "key": "LijBPDQGfu7Iiq80w3HzwB4RUDJbMbhs6BU0dEnn",
            "ch.disable": vehicleType === "car",
            "elevation": false,
            "instructions": true,
            "point": points.map(function (p) { return p.lat + "," + p.lng; })
          },
          traditional: true,
          dataType: "json",
          success: function (data) {
            if (!data.paths || data.paths.length === 0) {
              return callback(true);
            }
  
            var path = data.paths[0];
            var line = L.PolylineUtil.decode(path.points);
  
            var steps = [];
            var len = path.instructions.length;
            for (var i = 0; i < len; i++) {
              var instr = path.instructions[i];
              var instrCode = (i === len - 1) ? 14 : GH_INSTR_MAP[instr.sign];
              var instrText = "<b>" + (i + 1) + ".</b> ";
              instrText += instr.text;
              var latLng = line[instr.interval[0]];
              var distInMeter = instr.distance;
              var lineseg = [];
              for (var j = instr.interval[0]; j <= instr.interval[1]; j++) {
                lineseg.push({ lat: line[j][0], lng: line[j][1] });
              }
              steps.push([
                { lat: latLng[0], lng: latLng[1] },
                instrCode,
                instrText,
                distInMeter,
                lineseg
              ]); // TODO does graphhopper map instructions onto line indices?
            }
  
            callback(false, {
              line: line,
              steps: steps,
              distance: path.distance,
              time: path.time / 1000,
              ascend: path.ascend,
              descend: path.descend
            });
          },
          error: function () {
            callback(true);
          }
        });
      }
    };
  }
  
  OSM.Directions.addEngine(new GraphHopperEngine("graphhopper_car", "car"), true);
  OSM.Directions.addEngine(new GraphHopperEngine("graphhopper_bicycle", "bike"), true);
  OSM.Directions.addEngine(new GraphHopperEngine("graphhopper_foot", "foot"), true);
  OSM.Changeset = function (map) {
    var page = {},
        content = $("#sidebar_content"),
        currentChangesetId;
  
    page.pushstate = page.popstate = function (path, id) {
      OSM.loadSidebarContent(path, function () {
        page.load(path, id);
      });
    };
  
    page.load = function (path, id) {
      if (id) currentChangesetId = id;
      initialize();
      addChangeset(currentChangesetId, true);
    };
  
    function addChangeset(id, center) {
      map.addObject({ type: "changeset", id: parseInt(id, 10) }, function (bounds) {
        if (!window.location.hash && bounds.isValid() &&
            (center || !map.getBounds().contains(bounds))) {
          OSM.router.withoutMoveListener(function () {
            map.fitBounds(bounds);
          });
        }
      });
    }
  
    function updateChangeset(form, method, url, include_data) {
      var data;
  
      $(form).find("input[type=submit]").prop("disabled", true);
  
      if (include_data) {
        data = { text: $(form.text).val() };
      } else {
        data = {};
      }
  
      $.ajax({
        url: url,
        type: method,
        oauth: true,
        data: data,
        success: function () {
          OSM.loadSidebarContent(window.location.pathname, page.load);
        }
      });
    }
  
    function initialize() {
      content.find("input[name=comment]").on("click", function (e) {
        e.preventDefault();
        var data = $(e.target).data();
        updateChangeset(e.target.form, data.method, data.url, true);
      });
  
      content.find(".action-button").on("click", function (e) {
        e.preventDefault();
        var data = $(e.target).data();
        updateChangeset(e.target.form, data.method, data.url);
      });
  
      content.find("textarea").on("input", function (e) {
        var form = e.target.form;
  
        if ($(e.target).val() === "") {
          $(form.comment).prop("disabled", true);
        } else {
          $(form.comment).prop("disabled", false);
        }
      });
  
      content.find("textarea").val("").trigger("input");
    }
  
    page.unload = function () {
      map.removeObject();
    };
  
    return page;
  };
  
  
  
  OSM.Query = function (map) {
    var querystring = require("querystring-component");
  
    var url = OSM.OVERPASS_URL,
        queryButton = $(".control-query .control-button"),
        uninterestingTags = ["source", "source_ref", "source:ref", "history", "attribution", "created_by", "tiger:county", "tiger:tlid", "tiger:upload_uuid", "KSJ2:curve_id", "KSJ2:lat", "KSJ2:lon", "KSJ2:coordinate", "KSJ2:filename", "note:ja"],
        marker;
  
    var featureStyle = {
      color: "#FF6200",
      weight: 4,
      opacity: 1,
      fillOpacity: 0.5,
      interactive: false
    };
  
    queryButton.on("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
  
      if (queryButton.hasClass("active")) {
        disableQueryMode();
      } else if (!queryButton.hasClass("disabled")) {
        enableQueryMode();
      }
    }).on("disabled", function () {
      if (queryButton.hasClass("active")) {
        map.off("click", clickHandler);
        $(map.getContainer()).removeClass("query-active").addClass("query-disabled");
        $(this).tooltip("show");
      }
    }).on("enabled", function () {
      if (queryButton.hasClass("active")) {
        map.on("click", clickHandler);
        $(map.getContainer()).removeClass("query-disabled").addClass("query-active");
        $(this).tooltip("hide");
      }
    });
  
    $("#sidebar_content")
      .on("mouseover", ".query-results li.query-result", function () {
        var geometry = $(this).data("geometry");
        if (geometry) map.addLayer(geometry);
        $(this).addClass("selected");
      })
      .on("mouseout", ".query-results li.query-result", function () {
        var geometry = $(this).data("geometry");
        if (geometry) map.removeLayer(geometry);
        $(this).removeClass("selected");
      })
      .on("mousedown", ".query-results li.query-result", function () {
        var moved = false;
        $(this).one("click", function (e) {
          if (!moved) {
            var geometry = $(this).data("geometry");
            if (geometry) map.removeLayer(geometry);
  
            if (!$(e.target).is("a")) {
              $(this).find("a").simulate("click", e);
            }
          }
        }).one("mousemove", function () {
          moved = true;
        });
      });
  
    function interestingFeature(feature) {
      if (feature.tags) {
        for (var key in feature.tags) {
          if (uninterestingTags.indexOf(key) < 0) {
            return true;
          }
        }
      }
  
      return false;
    }
  
    function featurePrefix(feature) {
      var tags = feature.tags;
      var prefix = "";
  
      if (tags.boundary === "administrative" && tags.admin_level) {
        prefix = I18n.t("geocoder.search_osm_nominatim.admin_levels.level" + tags.admin_level, {
          defaultValue: I18n.t("geocoder.search_osm_nominatim.prefix.boundary.administrative")
        });
      } else {
        var prefixes = I18n.t("geocoder.search_osm_nominatim.prefix");
        var key, value;
  
        for (key in tags) {
          value = tags[key];
  
          if (prefixes[key]) {
            if (prefixes[key][value]) {
              return prefixes[key][value];
            }
          }
        }
  
        for (key in tags) {
          value = tags[key];
  
          if (prefixes[key]) {
            var first = value.substr(0, 1).toUpperCase(),
                rest = value.substr(1).replace(/_/g, " ");
  
            return first + rest;
          }
        }
      }
  
      if (!prefix) {
        prefix = I18n.t("javascripts.query." + feature.type);
      }
  
      return prefix;
    }
  
    function featureName(feature) {
      var tags = feature.tags,
          locales = I18n.locales.get();
  
      for (var i = 0; i < locales.length; i++) {
        if (tags["name:" + locales[i]]) {
          return tags["name:" + locales[i]];
        }
      }
  
      if (tags.name) {
        return tags.name;
      } else if (tags.ref) {
        return tags.ref;
      } else if (tags["addr:housename"]) {
        return tags["addr:housename"];
      } else if (tags["addr:housenumber"] && tags["addr:street"]) {
        return tags["addr:housenumber"] + " " + tags["addr:street"];
      } else {
        return "#" + feature.id;
      }
    }
  
    function featureGeometry(feature) {
      var geometry;
  
      if (feature.type === "node" && feature.lat && feature.lon) {
        geometry = L.circleMarker([feature.lat, feature.lon], featureStyle);
      } else if (feature.type === "way" && feature.geometry && feature.geometry.length > 0) {
        geometry = L.polyline(feature.geometry.filter(function (point) {
          return point !== null;
        }).map(function (point) {
          return [point.lat, point.lon];
        }), featureStyle);
      } else if (feature.type === "relation" && feature.members) {
        geometry = L.featureGroup(feature.members.map(featureGeometry).filter(function (geometry) {
          return typeof geometry !== "undefined";
        }));
      }
  
      return geometry;
    }
  
    function runQuery(latlng, radius, query, $section, merge, compare) {
      var $ul = $section.find("ul");
  
      $ul.empty();
      $section.show();
  
      $section.find(".loader").oneTime(1000, "loading", function () {
        $(this).show();
      });
  
      if ($section.data("ajax")) {
        $section.data("ajax").abort();
      }
  
      $section.data("ajax", $.ajax({
        url: url,
        method: "POST",
        data: {
          data: "[timeout:10][out:json];" + query
        },
        success: function (results) {
          var elements;
  
          $section.find(".loader").stopTime("loading").hide();
  
          if (merge) {
            elements = results.elements.reduce(function (hash, element) {
              var key = element.type + element.id;
              if ("geometry" in element) {
                delete element.bounds;
              }
              hash[key] = $.extend({}, hash[key], element);
              return hash;
            }, {});
  
            elements = Object.keys(elements).map(function (key) {
              return elements[key];
            });
          } else {
            elements = results.elements;
          }
  
          if (compare) {
            elements = elements.sort(compare);
          }
  
          for (var i = 0; i < elements.length; i++) {
            var element = elements[i];
  
            if (interestingFeature(element)) {
              var $li = $("<li>")
                .addClass("query-result")
                .data("geometry", featureGeometry(element))
                .appendTo($ul);
              var $p = $("<p>")
                .text(featurePrefix(element) + " ")
                .appendTo($li);
  
              $("<a>")
                .attr("href", "/" + element.type + "/" + element.id)
                .text(featureName(element))
                .appendTo($p);
            }
          }
  
          if (results.remark) {
            $("<li>")
              .text(I18n.t("javascripts.query.error", { server: url, error: results.remark }))
              .appendTo($ul);
          }
  
          if ($ul.find("li").length === 0) {
            $("<li>")
              .text(I18n.t("javascripts.query.nothing_found"))
              .appendTo($ul);
          }
        },
        error: function (xhr, status, error) {
          $section.find(".loader").stopTime("loading").hide();
  
          $("<li>")
            .text(I18n.t("javascripts.query." + status, { server: url, error: error }))
            .appendTo($ul);
        }
      }));
    }
  
    function compareSize(feature1, feature2) {
      var width1 = feature1.bounds.maxlon - feature1.bounds.minlon,
          height1 = feature1.bounds.maxlat - feature1.bounds.minlat,
          area1 = width1 * height1,
          width2 = feature2.bounds.maxlat - feature2.bounds.minlat,
          height2 = feature2.bounds.maxlat - feature2.bounds.minlat,
          area2 = width2 * height2;
  
      return area1 - area2;
    }
  
    /*
     * To find nearby objects we ask overpass for the union of the
     * following sets:
     *
     *   node(around:<radius>,<lat>,lng>)
     *   way(around:<radius>,<lat>,lng>)
     *   relation(around:<radius>,<lat>,lng>)
     *
     * to find enclosing objects we first find all the enclosing areas:
     *
     *   is_in(<lat>,<lng>)->.a
     *
     * and then return the union of the following sets:
     *
     *   relation(pivot.a)
     *   way(pivot.a)
     *
     * In both cases we then ask to retrieve tags and the geometry
     * for each object.
     */
    function queryOverpass(lat, lng) {
      var latlng = L.latLng(lat, lng).wrap(),
          bounds = map.getBounds().wrap(),
          precision = OSM.zoomPrecision(map.getZoom()),
          bbox = bounds.getSouth().toFixed(precision) + "," +
                 bounds.getWest().toFixed(precision) + "," +
                 bounds.getNorth().toFixed(precision) + "," +
                 bounds.getEast().toFixed(precision),
          radius = 10 * Math.pow(1.5, 19 - map.getZoom()),
          around = "around:" + radius + "," + lat + "," + lng,
          nodes = "node(" + around + ")",
          ways = "way(" + around + ")",
          relations = "relation(" + around + ")",
          nearby = "(" + nodes + ";" + ways + ";);out tags geom(" + bbox + ");" + relations + ";out geom(" + bbox + ");",
          isin = "is_in(" + lat + "," + lng + ")->.a;way(pivot.a);out tags bb;out ids geom(" + bbox + ");relation(pivot.a);out tags bb;";
  
      $("#sidebar_content .query-intro")
        .hide();
  
      if (marker) map.removeLayer(marker);
      marker = L.circle(latlng, radius, featureStyle).addTo(map);
  
      $(document).everyTime(75, "fadeQueryMarker", function (i) {
        if (i === 10) {
          map.removeLayer(marker);
        } else {
          marker.setStyle({
            opacity: 1 - (i * 0.1),
            fillOpacity: 0.5 - (i * 0.05)
          });
        }
      }, 10);
  
      runQuery(latlng, radius, nearby, $("#query-nearby"), false);
      runQuery(latlng, radius, isin, $("#query-isin"), true, compareSize);
    }
  
    function clickHandler(e) {
      var precision = OSM.zoomPrecision(map.getZoom()),
          latlng = e.latlng.wrap(),
          lat = latlng.lat.toFixed(precision),
          lng = latlng.lng.toFixed(precision);
  
      OSM.router.route("/query?lat=" + lat + "&lon=" + lng);
    }
  
    function enableQueryMode() {
      queryButton.addClass("active");
      map.on("click", clickHandler);
      $(map.getContainer()).addClass("query-active");
    }
  
    function disableQueryMode() {
      if (marker) map.removeLayer(marker);
      $(map.getContainer()).removeClass("query-active").removeClass("query-disabled");
      map.off("click", clickHandler);
      queryButton.removeClass("active");
    }
  
    var page = {};
  
    page.pushstate = page.popstate = function (path) {
      OSM.loadSidebarContent(path, function () {
        page.load(path, true);
      });
    };
  
    page.load = function (path, noCentre) {
      var params = querystring.parse(path.substring(path.indexOf("?") + 1)),
          latlng = L.latLng(params.lat, params.lon);
  
      if (!window.location.hash && !noCentre && !map.getBounds().contains(latlng)) {
        OSM.router.withoutMoveListener(function () {
          map.setView(latlng, 15);
        });
      }
  
      queryOverpass(params.lat, params.lon);
    };
  
    page.unload = function (sameController) {
      if (!sameController) {
        disableQueryMode();
      }
    };
  
    return page;
  };
  /*
    OSM.Router implements pushState-based navigation for the main page and
    other pages that use a sidebar+map based layout (export, search results,
    history, and browse pages).
  
    For browsers without pushState, it falls back to full page loads, which all
    of the above pages support.
  
    The router is initialized with a set of routes: a mapping of URL path templates
    to route controller objects. Path templates can contain placeholders
    (`/note/:id`) and optional segments (`/:type/:id(/history)`).
  
    Route controller objects can define four methods that are called at defined
    times during routing:
  
       * The `load` method is called by the router when a path which matches the
         route's path template is loaded via a normal full page load. It is passed
         as arguments the URL path plus any matching arguments for placeholders
         in the path template.
  
       * The `pushstate` method is called when a page which matches the route's path
         template is loaded via pushState. It is passed the same arguments as `load`.
  
       * The `popstate` method is called when returning to a previously
         pushState-loaded page via popstate (i.e. browser back/forward buttons).
  
       * The `unload` method is called on the exiting route controller when navigating
         via pushState or popstate to another route.
  
     Note that while `load` is not called by the router for pushState-based loads,
     it's frequently useful for route controllers to call it manually inside their
     definition of the `pushstate` and `popstate` methods.
  
     An instance of OSM.Router is assigned to `OSM.router`. To navigate to a new page
     via pushState (with automatic full-page load fallback), call `OSM.router.route`:
  
         OSM.router.route('/way/1234');
  
     If `route` is passed a path that matches one of the path templates, it performs
     the appropriate actions and returns true. Otherwise it returns false.
  
     OSM.Router also handles updating the hash portion of the URL containing transient
     map state such as the position and zoom level. Some route controllers may wish to
     temporarily suppress updating the hash (for example, to omit the hash on pages
     such as `/way/1234` unless the map is moved). This can be done by using
     `OSM.router.withoutMoveListener` to run a block of code that may update
     move the map without the hash changing.
   */
  OSM.Router = function (map, rts) {
    var escapeRegExp = /[-{}[\]+?.,\\^$|#\s]/g;
    var optionalParam = /\((.*?)\)/g;
    var namedParam = /(\(\?)?:\w+/g;
    var splatParam = /\*\w+/g;
  
    function Route(path, controller) {
      var regexp = new RegExp("^" +
        path.replace(escapeRegExp, "\\$&")
          .replace(optionalParam, "(?:$1)?")
          .replace(namedParam, function (match, optional) {
            return optional ? match : "([^/]+)";
          })
          .replace(splatParam, "(.*?)") + "(?:\\?.*)?$");
  
      var route = {};
  
      route.match = function (path) {
        return regexp.test(path);
      };
  
      route.run = function (action, path) {
        var params = [];
  
        if (path) {
          params = regexp.exec(path).map(function (param, i) {
            return (i > 0 && param) ? decodeURIComponent(param) : param;
          });
        }
  
        params = params.concat(Array.prototype.slice.call(arguments, 2));
  
        return (controller[action] || $.noop).apply(controller, params);
      };
  
      return route;
    }
  
    var routes = [];
    for (var r in rts) {
      routes.push(new Route(r, rts[r]));
    }
  
    routes.recognize = function (path) {
      for (var i = 0; i < this.length; i++) {
        if (this[i].match(path)) return this[i];
      }
    };
  
    var currentPath = window.location.pathname.replace(/(.)\/$/, "$1") + window.location.search,
        currentRoute = routes.recognize(currentPath),
        currentHash = location.hash || OSM.formatHash(map);
  
    var router = {};
  
    if (window.history && window.history.pushState) {
      $(window).on("popstate", function (e) {
        if (!e.originalEvent.state) return; // Is it a real popstate event or just a hash change?
        var path = window.location.pathname + window.location.search,
            route = routes.recognize(path);
        if (path === currentPath) return;
        currentRoute.run("unload", null, route === currentRoute);
        currentPath = path;
        currentRoute = route;
        currentRoute.run("popstate", currentPath);
        map.setState(e.originalEvent.state, { animate: false });
      });
  
      router.route = function (url) {
        var path = url.replace(/#.*/, ""),
            route = routes.recognize(path);
        if (!route) return false;
        currentRoute.run("unload", null, route === currentRoute);
        var state = OSM.parseHash(url);
        map.setState(state);
        window.history.pushState(state, document.title, url);
        currentPath = path;
        currentRoute = route;
        currentRoute.run("pushstate", currentPath);
        return true;
      };
  
      router.replace = function (url) {
        window.history.replaceState(OSM.parseHash(url), document.title, url);
      };
  
      router.stateChange = function (state) {
        if (state.center) {
          window.history.replaceState(state, document.title, OSM.formatHash(state));
        } else {
          window.history.replaceState(state, document.title, window.location);
        }
      };
    } else {
      router.route = router.replace = function (url) {
        window.location.assign(url);
      };
  
      router.stateChange = function (state) {
        if (state.center) window.location.replace(OSM.formatHash(state));
      };
    }
  
    router.updateHash = function () {
      var hash = OSM.formatHash(map);
      if (hash === currentHash) return;
      currentHash = hash;
      router.stateChange(OSM.parseHash(hash));
    };
  
    router.hashUpdated = function () {
      var hash = location.hash;
      if (hash === currentHash) return;
      currentHash = hash;
      var state = OSM.parseHash(hash);
      map.setState(state);
      router.stateChange(state, hash);
    };
  
    router.withoutMoveListener = function (callback) {
      function disableMoveListener() {
        map.off("moveend", router.updateHash);
        map.once("moveend", function () {
          map.on("moveend", router.updateHash);
        });
      }
  
      map.once("movestart", disableMoveListener);
      callback();
      map.off("movestart", disableMoveListener);
    };
  
    router.load = function () {
      var loadState = currentRoute.run("load", currentPath);
      router.stateChange(loadState || {});
    };
  
    router.setCurrentPath = function (path) {
      currentPath = path;
      currentRoute = routes.recognize(currentPath);
    };
  
    map.on("moveend baselayerchange overlaylayerchange", router.updateHash);
    $(window).on("hashchange", router.hashUpdated);
  
    return router;
  };