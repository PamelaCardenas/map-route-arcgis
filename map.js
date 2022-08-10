require([
  "esri/config",
  "esri/Map",
  "esri/views/MapView",
  "esri/widgets/Locate",
  "esri/widgets/Search",
  "esri/Graphic",
  "esri/rest/route",
  "esri/rest/support/RouteParameters",
  "esri/rest/support/FeatureSet",

], function (
  esriConfig,
  Map,
  MapView,
  Locate,
  Search,
  Graphic,
  route,
  RouteParameters,
  FeatureSet,
) {

  //ApiKey
  esriConfig.apiKey = "";

  //Tipo de mapa a mostrar
  const map = new Map({
    basemap: "arcgis-navigation"
  });


  //Centrar mapa, coordenadas especificas y zoom
  const view = new MapView({
    container: "myMap",
    map: map,
    center: [-106.0725591, 28.6400205],
    zoom: 13
  });

  //Buscador para ubicaciones
  const search = new Search({  //Add Search widget
    view: view
  });
  view.ui.add(search, "top-right");

  //Geolocalización, encontrar ubicación actual
  const locate = new Locate({
    view: view,
    useHeadingEnabled: false,
    goToOverride: function (view, options) {
      options.target.scale = 1500;
      return view.goTo(options.target);
    }
  });
  view.ui.add(locate, "top-left");


  //Url para generar rutas
  const routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";

  //Función para generar los puntos de origen y destino
  view.on("click", function (event) {
    if (view.graphics.length === 0) {
      addGraphic("origin", event.mapPoint);
    } else if (view.graphics.length === 1) {
      addGraphic("destination", event.mapPoint);

      //Generar ruta
      getRoute();

    } else {
      view.graphics.removeAll();
      addGraphic("origin", event.mapPoint);
    }
  });

  //Función para agregar los gráficos (los puntos de inicio y fin de la ruta)
  function addGraphic(type, point) {
    const graphic = new Graphic({
      symbol: {
        type: "simple-marker",
        color: (type === "origin") ? "white" : "black",
        size: "8px"
      },
      geometry: point
    });
    view.graphics.add(graphic);
  }

  //Obtener la ruta
  function getRoute() {
    const routeParams = new RouteParameters({
      stops: new FeatureSet({
        features: view.graphics.toArray()
      }),

      //Mostrar las indicaciones de la ruta
      returnDirections: true,
      directionsLanguage: "es"

    });

    //Parametros de la línea de la ruta
    route.solve(routeUrl, routeParams)
      .then(function (data) {
        data.routeResults.forEach(function (result) {
          result.route.symbol = {
            type: "simple-line",
            color: [5, 150, 255],
            width: 3
          };
          view.graphics.add(result.route);
        });
        // Mostrar direcciones
        if (data.routeResults.length > 0) {
          const directions = document.createElement("ol");
          directions.classList = "esri-widget esri-widget--panel esri-directions__scroller";
          directions.style.marginTop = "0";
          directions.style.padding = "15px 15px 15px 30px";
          const features = data.routeResults[0].directions.features;

          // Mostrar cada dirección
          features.forEach(function (result, i) {
            const direction = document.createElement("li");
            direction.innerHTML = result.attributes.text + " (" + result.attributes.length.toFixed(2) + " miles)";
            directions.appendChild(direction);
          });

          //Agregar el cuadro de indicaciones al lado derecho
          view.ui.empty("top-right");
          view.ui.add(search, "top-right");
          view.ui.add(directions, "top-right");

        }

      })

      .catch(function (error) {
        console.log(error);
      })

  }

});