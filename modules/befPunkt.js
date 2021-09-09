require([
  'esri/Map',
  'esri/views/MapView',
  'esri/layers/TileLayer',
  'esri/Graphic',
  'esri/layers/FeatureLayer',
  'esri/layers/GraphicsLayer',
  'esri/layers/GroupLayer',
  'esri/config',
], (
  Map,
  MapView,
  TileLayer,
  Graphic,
  FeatureLayer,
  GraphicsLayer,
  GroupLayer,
  esriConfig
) => {
  function befTyngdepunkt() {
    const befTyngdepunkt = new FeatureLayer({
      portalItem: {
        id: '9e6938c680ba47eca9718703fd3df961',
      },
    });
  }

  return {
    befTyngdepunkt: () => {
      befTyngdepunkt();
    },
  };
});
