require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/TileLayer",
    "esri/Graphic",
    "esri/layers/FeatureLayer",
    "esri/layers/GraphicsLayer",
    "esri/layers/GroupLayer"
  ], (
    Map,
    MapView,
    TileLayer,
    Graphic,
    FeatureLayer,
    GraphicsLayer,
    GroupLayer
  ) => {
    const worldImagery = new TileLayer({
      portalItem: {
        id: "ab8b9f2182ea4391bfd73105efe1e116" // world imagery
      }
    });
    worldImagery.when(() => {
      worldImagery.sublayers.forEach((layer) => {
        if (layer.popupEnabled === true) {
          layer.popupEnabled = false;
        }
      });
    });

    // this layer is only used to query for the intersecting country when the map is clicked
    const countries = new FeatureLayer({
      portalItem: {
        id: "71dceb33d8a94182969a119a5421ffe7"
      }
    });

    // clicked country feature will be added to this layer
    const graphicsLayer = new GraphicsLayer({
      blendMode: "destination-in",
      title: "layer"
    });

    const tileLayer = new TileLayer({
      portalItem: {
        // bottom layer in the group layer
        id: "ab8b9f2182ea4391bfd73105efe1e116" // world imagery
      }
    });
    tileLayer.when(() => {
      tileLayer.sublayers.forEach((layer) => {
        if (layer.popupEnabled === true) {
          layer.popupEnabled = false;
        }
      });
    });

    // this grouplayer has two layers
    // destination-in blendMode set on the graphics layer
    // country from the world imagery layer will show when user clicks on a country
    const groupLayer = new GroupLayer({
      layers: [
        tileLayer,
        // world imagery layer will show where it overlaps with the graphicslayer
        graphicsLayer
      ],
      opacity: 0 // initially this layer will be transparent
    });

    const map = new Map({
      layers: [worldImagery, groupLayer]
    });

    const view = new MapView({
      container: "viewDiv",
      map: map,
      zoom: 5,
      center: [-112, 38],
      popup: null,
      constraints: {
        snapToZoom: false,
        minScale: 147914381
      }
    });

    view.ui.add("messageDiv", "top-right");

    var akView = new MapView({
        container: "akViewDiv",
        map: map,
        zoom: 3,
        center: [184468.20, 6785855.01],
        // extent: {
        //   xmin: 6945681.5,
        //   ymin: 8124,
        //   xmax: 6526280,
        //   ymax: 3457,
        //   spatialReference: {
        //     wkid: 25833
        //   }
        // },
        spatialReference: {
          // WGS_1984_EPSG_Alaska_Polar_Stereographic
          wkid: 25833
        },
        ui: {
          components: []
        }
      });

      view.ui.add("akViewDiv", "bottom-right");

    view.when(() => {
      const query = {
        geometry: view.center,
        returnGeometry: true,
        outFields: ["*"]
      };
      highlightCountry(query, view.center);
    });

    // listen to the view's click event
    view.on("click", async (event) => {
      const query = {
        geometry: view.toMap(event),
        returnGeometry: true,
        outFields: ["*"]
      };
      highlightCountry(query, query.geometry);
    });

    async function highlightCountry(query, zoomGeometry) {
      // country symbol - when user clicks on a country
      // we will query the country from the countries featurelayer
      // add the country feature to the graphics layer.
      const symbol = {
        type: "simple-fill",
        color: "rgba(255, 255, 255, 1)",
        outline: null
      };

      // query the countries layer for a country that intersects the clicked point
      const {
        features: [feature]
      } = await countries.queryFeatures(query);
      // user clicked on a country and the feature is returned
      if (feature) {
        graphicsLayer.graphics.removeAll();
        feature.symbol = symbol;
        // add the country to the graphics layer
        graphicsLayer.graphics.add(feature);
        // zoom to the highlighted country
        view.goTo(
          {
            target: zoomGeometry,
            extent: feature.geometry.extent.clone().expand(1.8)
          },
          { duration: 1000 }
        );
        // blur the world imagery basemap so that the clicked country can be highlighted
        worldImagery.effect = "blur(8px) brightness(1.2) grayscale(0.8)";
        // set the group layer transparency to 1.
        // also increase the layer brightness and add drop-shadow to make the clicked country stand out.
        groupLayer.effect = "brightness(1.5) drop-shadow(0, 0px, 12px)";
        groupLayer.opacity = 1;
      }
      // did not click on a country. remove effects
      else {
        worldImagery.effect = null;
        groupLayer.effect = null;
      }
    }

    
  });