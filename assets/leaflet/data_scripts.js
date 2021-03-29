$(document).ready(function(){

var items = [];

var zoom_val = 0;
if(screen.width < 768)
{
    zoom_val = 16;
}
if(screen.width >= 768)
{
    zoom_val = 16.5;
}

var map = new L.map('myMAP_id', {
    fullscreenControl: {
        pseudoFullscreen: false,
        position: 'topright'
    }
}).setView([10.392241, 124.980000], zoom_val);//([10.38800, 124.97300], 16);

// L.marker([10.390931, 124.980418]).addTo(map)
// .bindPopup('<b>SOUTHERN STATE UNIVERSITY</b><br>Main-Campus<br>Sogod, Southern Leyte');
// .openPopup();
// var wrld_map = L.Wrld.map('myMAP_id', "df8920ab942293b8bb0931fbab4cc46e", {
//     center: [37.7950, -122.401],
//     zoom: 15
// });

var layer4 = new L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    title: 'WorldImagery'
});

var layer = new L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    visible: false,
    title: 'OpenStreetMap'
});

var layer1 = new L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery Â© <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 26,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1IjoibWlrZWxzcGF0aWFsOTY2NDMiLCJhIjoiY2pmY2tqZWVvMGV1dzJxcGtjNm5nZzV2ZiJ9.1C78c-18Slhiq4d3Nc-c_A',
    title: 'MapBox'
});

var layer2 = new L.mapboxGL({
    attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">© MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap contributors</a>',
    accessToken: 'not-needed',
    style: 'https://api.maptiler.com/maps/bae16732-881e-4239-9488-db0302d2fdf7/style.json?key=6McJluIRArATG6ePUDKP',
    title: 'Maptiler'
});

var layer3 = new L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3'],
    title: 'Google'
});

map.addLayer(layer);

const baseLayers = document.querySelectorAll("#basemaps");
for(let baseLayer of baseLayers)
{
    baseLayer.addEventListener('change', function(){
        let baseLayerValue = this.value;
        if(baseLayerValue === "Maptiler")
        {
            map.removeLayer(layer);
            map.removeLayer(layer3);
            map.removeLayer(layer4);
            map.removeLayer(layer1);
            map.addLayer(layer2);
        }
        if(baseLayerValue === "OpenStreetMap")
        {
            map.removeLayer(layer2);
            map.removeLayer(layer3);
            map.removeLayer(layer4);
            map.removeLayer(layer1);
            map.addLayer(layer);
        }
        if(baseLayerValue === "MapBox")
        {
            map.removeLayer(layer2);
            map.removeLayer(layer3);
            map.removeLayer(layer4);
            map.removeLayer(layer);
            map.addLayer(layer1);
        }
        if(baseLayerValue === "WorldImagery")
        {
            map.removeLayer(layer2);
            map.removeLayer(layer3);
            map.removeLayer(layer1);
            map.removeLayer(layer);
            map.addLayer(layer4);
        }
        // if(baseLayerValue === "Google")
        // {
        //     map.removeLayer(layer2);
        //     map.removeLayer(layer4);
        //     map.removeLayer(layer1);
        //     map.removeLayer(layer);
        //     map.addLayer(layer3);
        // }
    })
}

// L.control.layers(basemaps, overlayMaps, {position: 'topleft'}).addTo(map);

// var layer4 = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
// }).addTo(map);

// var basemap_Obj_5 = <link href="https://www.openstreetmap.org/" rel="canonical"></link>

// https://poly.google.com/view/ekeNofgrKTi

// end of base maps

// styling

var bldg_style = {
    "color": "darkred",
    "weight": 2,
    "opacity": 1
};

var road_style = {
    "color": "black",
    "weight": 4,
    "opacity": 0.7
};

var boundary_style = {
    "color": "darkblue",
    "weight": 2,
    "opacity": 1
};

var oval_color = {
    "color": "gray",
    "weight": 5,
    "opacity": 1
};

var outdoor = {
    "color": "blue",
    "weight": 2,
    "opacity": 1
};

var field_color = {
    "color": "darkgreen",
    "weight": 4,
    "opacity": 1
};

var parking_color = {
    "color": "green",
    "weight": 1,
    "opacity": 1
};

var landmark_style = {
    "color": "orange",
    "weight": 4,
    "opacity": 1
};

var bleacher_style = {
    "color": "darkorange",
    "weight": 4,
    "opacity": 1
};

// end of styling

// geoJson data
    
function onEachfeature(feature, layer) {
    layer.bindPopup(feature.properties.BLDG_NAME);
}

var boundary = L.geoJson(slsu_boundary, {
    style: function (feature) {
        return boundary_style;
    }
}).addTo(map);

var outdoor = L.geoJson(outdoor_area, {
    style: function (feature) {
        return outdoor;
    }
});

var road = L.geoJson(road_network, {
    style: function () {
        return road_style;
    },
    onEachFeature: function (feature, layer) {
        layer.bindPopup(feature.properties.Name);
    }
});

var bldgs = L.geoJson(slsu_bldg, {
    style: function () {
        return bldg_style;
    },
    onEachFeature: function (feature, layer) {
        layer.bindPopup('<div class="container-fluid"><div class="row"><h7 style="font-weight: bold; font-size: 16px; margin-top: 5px;">SOUTHERN LEYTE STATE UNIVERSITY</h7>'+
        '<div style="width: 45%; margin-right: 10px;"><img src ="'+ feature.properties.IMAGE +
        '" class="img img-thumbnail" style="height: 100px; display: inline-block;"/></div>'+
        '<div style="width: 45%;display: inline-block; margin-top: 5px;"><h7 style="font-size: 15px; font-weight: bold;">'+ 
        feature.properties.BLDG_NAME + '</h7><br>'+
        '<h6 style="font-size: 14px;"> Officer In-Charge: <h7 style="font-size: 13px;"><b>'+ feature.properties.OFFCR_IN + 
        '</h7></h6></h6></div></div></div>');
    }
}).addTo(map);

var field = L.geoJson(field, {
    style: function (feature) {
        return field_color;
    }
});

var oval = L.geoJson(track_oval, {
    style: function (feature) {
        return oval_color;
    }
});

var parking = L.geoJson(parking_lot, {
    style: function (feature) {
        return parking_color;
    }
});

var landmark = L.geoJson(land_mark, {
    style: function (feature) {
        return landmark_style;
    }
});

var bleacher = L.geoJson(bleacher, {
    style: function (feature) {
        return bleacher_style;
    }
});

function vector_roads() {
    var checkBox = document.getElementById("vector_layerRoads");
    if (checkBox.checked == true){
        road.addTo(map);
    } else {
        map.removeLayer(road);
    }
}

function vector_layerBuilding() {
    var checkBox = document.getElementById("vector_layerBuilding");
    if (checkBox.checked == true){
        bldgs.addTo(map);
    } else {
        map.removeLayer(bldgs);
    }
}

function vector_layerBoundary() {
    var checkBox = document.getElementById("vector_layerBoundary");
    if (checkBox.checked == true){
        boundary.addTo(map);
    } else {
        map.removeLayer(boundary);
    }
}

function vector_layerLandMark() {
    var checkBox = document.getElementById("vector_layerLandMark");
    if (checkBox.checked == true){
        landmark.addTo(map);
    } else {
        map.removeLayer(landmark);
    }
}

function vector_layerOutdoor() {
    var checkBox = document.getElementById("vector_outdoor");
    if (checkBox.checked == true){
        outdoor.addTo(map);
    } else {
        map.removeLayer(outdoor);
    }
}

function vector_layerTrack() {
    var checkBox = document.getElementById("vector_layerTrack");
    if (checkBox.checked == true){
        oval.addTo(map);
    } else {
        map.removeLayer(oval);
    }
}

function vector_layerField() {
    var checkBox = document.getElementById("vector_layerField");
    if (checkBox.checked == true){
        field.addTo(map);
    } else {
        map.removeLayer(field);
    }
}

function vector_layerParking() {
    var checkBox = document.getElementById("vector_layerParking");
    if (checkBox.checked == true){
        parking.addTo(map);
    } else {
        map.removeLayer(parking);
    }
}

function vector_layerPath() {
    var checkBox = document.getElementById("vector_layerPath");
    if (checkBox.checked == true){
        foot_path.addTo(map);
    } else {
        map.removeLayer(foot_path);
    }
}

function vector_layerBleacher() {
    var checkBox = document.getElementById("vector_layerBleacher");
    if (checkBox.checked == true){
        bleacher.addTo(map);
    } else {
        map.removeLayer(bleacher);
    }
}


L.control.scale().addTo(map);

var searchControl = new L.Control.Search({
    layer: bldgs,
    zoom: 19,
    initial: false,
    propertyName: 'BLDG_NAME',
    container: 'leaflet_search',
    autoResize: false,				//autoresize on input change
    collapsed: false,
    marker: {				
        icon: false,				
        animate: false,		
        circle: {				
            radius: 10,
            weight: 2,
            color: '#1BC500',
            stroke: false,
            fill: false
        }
    }
});
var marker;
searchControl.on('search:locationfound', function(e) {
    e.layer.openPopup(); 
})

searchControl.addTo(map);

L.control.locate({
    position: 'topright'
}).addTo(map);

// var icons = new L.icon({
//     iconUrl: 'leaflet/images/marker-icon-red.png',
//     iconSize: [17, 26],
//     iconAnchor: [16, 37],
//     popupAnchor: [0, -28]
// });

// north arrow

var north = L.control({position: "topright"});
north.onAdd = function(map) {
    var div = L.DomUtil.create("div", "north star");
    div.innerHTML = '<img style="height: 100px; border: 1px solid #7c7c7c; border-radius: 2px;" src="http://127.0.0.1/GIS-SLSU_AssetMgt/assets/img/http___pluspng.com_img-png_free-png-north-arrow-graphics-by-ruth-dogs-600.png">';
    return div;
}
//north.addTo(map);

/*Legend specific*/
var legend = L.control({ position: "topright" });

legend.onAdd = function(map) {
    var div = L.DomUtil.create("div", "legend");
    div.innerHTML += "<h4>Legends</h4>";
    div.innerHTML += '<i style="background: #477AC2; border-radius: 50%"></i><span style="font-size: 15px">Buildings</span><br>';
    div.innerHTML += '<i style="background: #448D40; border-radius: 50%"></i><span>Forest</span><br>';
    div.innerHTML += '<i style="background: #e2df3d; border-radius: 50%"></i><span>Facilities</span><br>';
    div.innerHTML += '<i style="background: #db2e2e; border-radius: 50%"></i><span>Colleges</span><br>';
    return div;
};
});
//legend.addTo(map);