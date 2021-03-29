    <div class="container-fluid">
        <div class="row">
            <div class="col-md-12 map_wrapper">
                <div class="row">
                    <div class="col-md-4">
                        <div class="toggler toggler-in"><i class="fa fa-arrow-right"></i></div>
                        <div class="left-control" id="control">
                            <div class="toggler toggler-out"><i class="fa fa-arrow-left"></i></div>
                            <div class="accordion" id="accordionExample">
                                <div class="card">
                                    <div class="card-header" id="headingOne">
                                        <h2 class="mb-0">
                                        <a class="leaflet-control-layers-toggle toggle" href="#"></a>
                                        <button class="btn btn-link" id="btn-link" type="button" data-toggle="collapse" data-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                                            BASE MAPS
                                        </button>
                                        </h2>
                                    </div>
                                    <div id="collapseOne" class="collapse show" aria-labelledby="headingOne" data-parent="#accordionExample">
                                        <div class="card-body">
                                            <div class="leaflet-control-layers leaflet-control leaflet-control-layers-expanded" aria-haspopup="true">
                                                <section class="leaflet-control-layers-list">
                                                    <div class="leaflet-control-layers-base">
                                                        <label>
                                                            <div>
                                                                <input type="radio" id="basemaps" value="OpenStreetMap" class="leaflet-control-layers-selector" name="leaflet-base-layers_264" checked="checked">
                                                                <span> Open Street Map</span>
                                                            </div>
                                                        </label>
                                                        <label>
                                                            <div>
                                                                <input type="radio" id="basemaps" value="Maptiler" class="leaflet-control-layers-selector" name="leaflet-base-layers_264">
                                                                <span> Maptiler</span>
                                                            </div>
                                                        </label>
                                                        <label>
                                                            <div>
                                                                <input type="radio" id="basemaps" value="MapBox" class="leaflet-control-layers-selector" name="leaflet-base-layers_264">
                                                                <span> MapBox</span>
                                                            </div>
                                                        </label>
                                                        <label>
                                                            <div>
                                                                <input type="radio" id="basemaps" value="WorldImagery" class="leaflet-control-layers-selector" name="leaflet-base-layers_264">
                                                                <span> World Imagery</span>
                                                            </div>
                                                        </label>
                                                    </div>
                                                </section>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="card">
                                    <div class="card-header" id="headingTwo">
                                        <h2 class="mb-0">
                                            <a class="leaflet-control-layers-toggle toggle" href="#"></a>
                                            <button class="btn btn-link collapsed btn-link-collapsed" id="btn-link-collapsed" type="button" data-toggle="collapse" data-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                                                LAYER MAPS
                                            </button>
                                        </h2>
                                    </div>
                                    <div id="collapseTwo" class="collapse" aria-labelledby="headingTwo" data-parent="#accordionExample">
                                        <div class="card-body">
                                            <div class="leaflet-control-layers leaflet-control leaflet-control-layers-expanded" aria-haspopup="true">
                                                <section class="leaflet-control-layers-list">
                                                    <div class="leaflet-control-layers-overlays">
                                                        <label>
                                                            <div>
                                                                <input type="checkbox" id="vector_layerBuilding" value="Buildings" class="leaflet-control-layers-selector" checked onclick="vector_layerBuilding()">
                                                                <span> Buildings</span>
                                                            </div>
                                                        </label>
                                                        <label>
                                                            <div>
                                                                <input type="checkbox" id="vector_layerRoads" value="Roads" class="leaflet-control-layers-selector" onclick="vector_roads()">
                                                                <span> Roads</span>
                                                            </div>
                                                        </label>
                                                        <label>
                                                            <div>
                                                                <input type="checkbox" id="vector_layerBoundary" value="Boundary" class="leaflet-control-layers-selector" checked onclick="vector_layerBoundary()">
                                                                <span> Boundary</span>
                                                            </div>
                                                        </label>
                                                        <label>
                                                            <div>
                                                                <input type="checkbox" id="vector_layerTrack" value="Track/Oval" class="leaflet-control-layers-selector" onclick="vector_layerTrack()">
                                                                <span> Track/Oval</span>
                                                            </div>
                                                        </label>
                                                        <label>
                                                            <div>
                                                                <input type="checkbox" id="vector_layerField" value="Field" class="leaflet-control-layers-selector" onclick="vector_layerField()">
                                                                <span> Field</span>
                                                            </div>
                                                        </label>
                                                        <label>
                                                            <div>
                                                                <input type="checkbox" id="vector_layerParking" value="Parking Lot" class="leaflet-control-layers-selector" onclick="vector_layerParking()">
                                                                <span> Parking Lot</span>
                                                            </div>
                                                        </label>
                                                        <label>
                                                            <div>
                                                                <input type="checkbox" id="vector_layerBleacher" value="Bleacher" class="leaflet-control-layers-selector" onclick="vector_layerBleacher()">
                                                                <span> Bleacher</span>
                                                            </div>
                                                        </label>
                                                        <label>
                                                            <div>
                                                                <input type="checkbox" id="vector_outdoor" value="Outdoor" class="leaflet-control-layers-selector" onclick="vector_layerOutdoor()">
                                                                <span> Outdoor</span>
                                                            </div>
                                                        </label>
                                                        <label>
                                                            <div>
                                                                <input type="checkbox" id="vector_layerLandMark" value="Land Mark" class="leaflet-control-layers-selector" onclick="vector_layerLandMark()">
                                                                <span> Land Mark</span>
                                                            </div>
                                                        </label>
                                                    </div>
                                                </section>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div id="leaflet_search">

                            </div>
                        </div>
                    </div>
                    <div class="col-md-8 col-sm-12">
                        <div class="row">
                            <div class="col-md-12">
                                <div id="myMAP_id" style="height: 83vh; border-bottom: 1px solid rgba(0,0,0, 0.3);"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <p><a href="https://leafletjs.com/" target="_blank">Leaflet &copy;</a><a href="#" target="_blank"> | Developed by: darksidebug_09 </a></p>
            </div>
        </div>
    </div>