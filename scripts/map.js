import { GOOGLE_MAPS_API_KEY } from '../config.js'

// Google Map API dynamic library import
(g => { var h, a, k, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__ib__", m = document, b = window; b = b[c] || (b[c] = {}); var d = b.maps || (b.maps = {}), r = new Set, e = new URLSearchParams, u = () => h || (h = new Promise(async (f, n) => { await (a = m.createElement("script")); e.set("libraries", [...r] + ""); for (k in g) e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]); e.set("callback", c + ".maps." + q); a.src = `https://maps.${c}apis.com/maps/api/js?` + e; d[q] = f; a.onerror = () => h = n(Error(p + " could not load.")); a.nonce = m.querySelector("script[nonce]")?.nonce || ""; m.head.append(a) })); d[l] ? console.warn(p + " only loads once. Ignoring:", g) : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)) })({
  key: GOOGLE_MAPS_API_KEY,
  v: "weekly",
});


class MapHandler {
  constructor(mapContainer, mapOptions) {
    this.mapContainer = mapContainer;
    this.mapOptions = mapOptions;
    this.map = null;
    this.infoWindow = null;
    this.currentMarker = null;
    this.marker = null;
  }

  async initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement: marker } = await google.maps.importLibrary("marker");

    this.map = new Map(document.getElementById(this.mapContainer), this.mapOptions);
    this.infoWindow = new google.maps.InfoWindow();
    this.marker = marker;

    this.map.addListener("click", (event) => this.handleMapClick(event));
  }

  handleMapClick(event) {
    // get coordinates
    const { lat, lng } = this.getCoordinates(event);

    // get AQI
    const { aqi, status, color } = this.getAQI(lat, lng);

    // update marker
    this.updateMarker({ lat, lng });

    // create infoWindow instance
    const content = this.createContent(lat, lng, aqi, status, color);
    this.infoWindow.setContent(content);
    this.infoWindow.open(this.map, this.currentMarker);
  }

  getCoordinates(event) {
    return {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };
  }

  updateMarker(position) {
    if (this.currentMarker) {
      this.currentMarker.setMap(null); // remove current marker
    }

    this.currentMarker = new this.marker({
      position,
      map: this.map,
      title: `Lat: ${position.lat}, Lng: ${position.lng}`,
    });
  }

  getAQI(lat, lng) {
    // should implement fetch aqi data here
    const aqi = Math.floor(Math.random() * 301); // mock random AQI between 0 and 300
    const ranges = [
      { max: 50, status: "Good", color: "green" },
      { max: 100, status: "Moderate", color: "yellow" },
      { max: 150, status: "Unhealthy for Sensitive Groups", color: "orange" },
      { max: 200, status: "Unhealthy", color: "red" },
      { max: 300, status: "Very Unhealthy", color: "darkred" },
      { max: Infinity, status: "Hazardous", color: "purple" },
    ];

    for (const range of ranges) {
      if (aqi <= range.max) {
        return { aqi, status: range.status, color: range.color };
      }
    }
  }

  createContent(lat, lng, aqi, status, color) {
    return `
      <div>
        <h3>Location</h3>
        <p>Latitude: ${lat}, Longitude: ${lng}</p>
        <p>
          <span class="aqi-circle" style="background-color: ${color};"></span>
          AQI: 
          <span class="aqi-text">${aqi} (${status})</span>
        </p>
        <a href="https://www.example.com/more-info" class="info-window-button" target="_blank">More Information</a>
      </div>
    `;
  }
}

// init
const mapOptions = {
  center: { lat: 30.2672, lng: -97.7431 }, // Austin, TX
  zoom: 12,
  mapId: "DEMO_MAP_ID",
};

const mapHandler = new MapHandler("map-container", mapOptions);
mapHandler.initMap();
