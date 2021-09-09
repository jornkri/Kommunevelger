require([
  'esri/Map',
  'esri/views/MapView',
  'esri/layers/TileLayer',
  'esri/Graphic',
  'esri/layers/FeatureLayer',
  'esri/layers/GraphicsLayer',
  'esri/layers/GroupLayer',
  'esri/config',
  'modules/befPunkt.js',
], (
  Map,
  MapView,
  TileLayer,
  Graphic,
  FeatureLayer,
  GraphicsLayer,
  GroupLayer,
  esriConfig,
  befPunkt
) => {
  const worldImagery = new TileLayer({
    portalItem: {
      id: 'ab8b9f2182ea4391bfd73105efe1e116', // world imagery
    },
  });
  worldImagery.when(() => {
    worldImagery.sublayers.forEach((layer) => {
      if (layer.popupEnabled === true) {
        layer.popupEnabled = false;
      }
    });
  });

  esriConfig.apiKey =
    'AAPK05caf543863d4758892193ca94909fe1Fn1LxMtHFzrKv6sBffqhvhS1CaLR3AOvUXDTKsNBI_LCCfwrkbFdymWXoCjjdADJ';
  // this layer is only used to query for the intersecting country when the map is clicked
  const countries = new FeatureLayer({
    portalItem: {
      id: 'a5a70437912941e3aae6bdf253e72280',
    },
  });

  // clicked country feature will be added to this layer
  const graphicsLayer = new GraphicsLayer({
    blendMode: 'destination-in',
    title: 'layer',
  });

  const tileLayer = new TileLayer({
    portalItem: {
      // bottom layer in the group layer
      id: 'ab8b9f2182ea4391bfd73105efe1e116', // world imagery
    },
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
      graphicsLayer,
    ],
    opacity: 0, // initially this layer will be transparent
  });

  const map = new Map({
    layers: [worldImagery, groupLayer],
  });

  const view = new MapView({
    container: 'viewDiv',
    map: map,
    zoom: 4,
    center: [10, 57],
    popup: null,
    constraints: {
      snapToZoom: false,
      minScale: 147914381,
    },
  });

  view.ui.add('messageDiv', 'top-right');

  var akView = new MapView({
    container: 'akViewDiv',
    map: map,
    zoom: 3,
    center: [184468.2, 6785855.01],
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
      wkid: 25833,
    },
    ui: {
      components: [],
    },
  });

  view.ui.add('akViewDiv', 'bottom-right');

  view.when(() => {
    const query = {
      geometry: view.center,
      returnGeometry: true,
      outFields: ['*'],
    };
    highlightCountry(query, view.center);
  });

  // listen to the view's click event
  view.on('click', async (event) => {
    const query = {
      geometry: view.toMap(event),
      returnGeometry: true,
      outFields: ['*'],
    };
    highlightCountry(query, query.geometry);
  });

  const card = document.getElementById('card_container');

  async function highlightCountry(query, zoomGeometry) {
    // country symbol - when user clicks on a country
    // we will query the country from the countries featurelayer
    // add the country feature to the graphics layer.
    const symbol = {
      type: 'simple-fill',
      color: 'rgba(255, 255, 255, 1)',
      outline: null,
    };

    // query the countries layer for a country that intersects the clicked point
    const {
      features: [feature],
    } = await countries.queryFeatures(query);
    // user clicked on a country and the feature is returned
    if (feature) {
      const komnvn = (document.getElementById('kommunenavn').innerHTML =
        feature.attributes.kommunenavn);

      const komid = (document.getElementById('kommune_id').innerHTML =
        feature.attributes.kommune_id);
      document.getElementById(
        'image'
      ).src = `https://tjenestekatalog.blob.core.windows.net/logo/${komid}.png`;

      const Fp20_t = (document.getElementById('cardDemografi').innerHTML =
        feature.attributes.p20_t);

      const Fp15_t = (document.getElementById('cardDemografi').innerHTML =
        feature.attributes.p15_t);

      const Fp10_t = (document.getElementById('cardDemografi').innerHTML =
        feature.attributes.p10_t);

      const Fp05_t = (document.getElementById('cardDemografi').innerHTML =
        feature.attributes.p05_t);

      var befchart = new Chart(document.getElementById('bar-chart'), {
        type: 'line',
        data: {
          labels: ['5 år', '10 år', '15 år', '20 år'],
          datasets: [
            {
              label: 'Befolknigsfremskriving',
              backgroundColor: ['#8e5ea2', '#3cba9f', '#e8c3b9', '#c45850'],
              data: [Fp05_t, Fp10_t, Fp15_t, Fp20_t],
            },
          ],
        },

        options: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Predicted world population (millions) in 2050',
          },
        },
      });

      // befchart.destroy();

      console.log(image);
      console.log(komnvn, typeof komnvn);

      document.querySelector('#card_title').textContent = komnvn;
      document.querySelector(
        '#cardDemografi'
      ).textContent = `Befolkningsfremskriving om 20 år: ${Fp20_t}`;

      graphicsLayer.graphics.removeAll();
      feature.symbol = symbol;
      // add the country to the graphics layer
      graphicsLayer.graphics.add(feature);
      // zoom to the highlighted country
      view.goTo(
        {
          target: zoomGeometry,
          extent: feature.geometry.extent.clone().expand(1.8),
        },
        { duration: 1000 }
      );
      // blur the world imagery basemap so that the clicked country can be highlighted
      worldImagery.effect = 'blur(8px) brightness(1.2) grayscale(0.8)';
      // set the group layer transparency to 1.
      // also increase the layer brightness and add drop-shadow to make the clicked country stand out.
      groupLayer.effect = 'brightness(1.5) drop-shadow(0, 0px, 12px)';
      groupLayer.opacity = 1;
    }
    // did not click on a country. remove effects
    else {
      worldImagery.effect = null;
      groupLayer.effect = null;
    }
  }
});
