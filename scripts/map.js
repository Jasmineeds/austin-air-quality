// Import the necessary Google Maps API key
import { GOOGLE_MAPS_API_KEY } from '../config.js';

// Google Map API dynamic library import
(g => { 
  var h, a, k, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__ib__", m = document, b = window; 
  b = b[c] || (b[c] = {}); 
  var d = b.maps || (b.maps = {}), r = new Set, e = new URLSearchParams, u = () => h || (h = new Promise(async (f, n) => { 
    await (a = m.createElement("script")); 
    e.set("libraries", [...r] + ""); 
    for (k in g) e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]); 
    e.set("callback", c + ".maps." + q); 
    a.src = `https://maps.${c}apis.com/maps/api/js?` + e; 
    d[q] = f; 
    a.onerror = () => h = n(Error(p + " could not load.")); 
    a.nonce = m.querySelector("script[nonce]")?.nonce || ""; 
    m.head.append(a) 
  })); 
  d[l] ? console.warn(p + " only loads once. Ignoring:", g) : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)) 
})({
  key: GOOGLE_MAPS_API_KEY,
  v: "weekly",
});

// Function needed to parse CSV files using PapaParse
async function loadCSV(filePath) {
  return new Promise((resolve, reject) => {
    Papa.parse(filePath, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

// Calc the distance between two coordinates (in meters), treating lat/long as an x-y grid given the small area we're dealing with
function calculateDistance(lat1, lon1, lat2, lon2) {
  const latDifference = Math.abs(lat2 - lat1) * 1.17; // Scale latitude by 1.17 as approximated for Austin
  const lonDifference = Math.abs(lon2 - lon1);
  return Math.sqrt(latDifference ** 2 + lonDifference ** 2);
}

// file paths used for calculating AQI and later for showing markers
const filePaths = [
  '/data/aqi_0.csv',
  '/data/aqi_1.csv',
  '/data/aqi_2.csv',
  '/data/aqi_3.csv',
  '/data/aqi_4.csv',
  '/data/aqi_5.csv',
  '/data/aqi_6.csv',
  '/data/aqi_7.csv',
  '/data/aqi_8.csv',
  '/data/aqi_9.csv'
];

const now = new Date(); // value for today

// AQI color and status depending on EPA ranges
const ranges = [
  { max: 50, status: "Good", color: "green" },
  { max: 100, status: "Moderate", color: "yellow" },
  { max: 150, status: "Unhealthy for Sensitive Groups", color: "orange" },
  { max: 200, status: "Unhealthy", color: "red" },
  { max: 300, status: "Very Unhealthy", color: "darkred" },
  { max: Infinity, status: "Hazardous", color: "purple" },
];

// Function to approximate AQI from three nearest locations using KNN regression weighted inversely by distance
async function getAQI(lat, lng, currentTime) {
  
  // Load all CSV files
  const allDataPromises = filePaths.map(filePath => loadCSV(filePath));
  const allData = await Promise.all(allDataPromises);

  // Flatten all CSV data into one array
  const allDataPoints = allData.flat();

  // Adjust the current time as CSV data is in 2023
  const adjustedTime = new Date(currentTime);
  adjustedTime.setFullYear(2023); // Set year to 2023

  // Round current time to nearest hour
  adjustedTime.setMinutes(0, 0, 0);
  const adjustedTimeString = adjustedTime.toISOString().split('T')[0] + ' ' + adjustedTime.getHours().toString().padStart(2, '0') + ':00:00';

  // Get data from the current (adjusted) time
  const relevantDataPoints = allDataPoints.filter((dataPoint) => {
    const timestamp = new Date(dataPoint.timestamp.replace(/-/g, '/'));
    const timeString = timestamp.toISOString().split('T')[0] + ' ' + timestamp.getHours().toString().padStart(2, '0') + ':00:00';
    return timeString === adjustedTimeString;
  });

  // Calculate distances and select the three nearest monitrs
  const distances = relevantDataPoints.map((dataPoint) => {
    const distance = calculateDistance(lat, lng, parseFloat(dataPoint.lat), parseFloat(dataPoint.lon));
    return { distance, dataPoint };
  });

  // Sort by distance and select the three closest points
  const closestPoints = distances.sort((a, b) => a.distance - b.distance).slice(0, 3);

  // Calculate weighted AQI using inverse distance
  let weightedSum = 0;
  let totalWeight = 0;

  closestPoints.forEach(({ distance, dataPoint }) => {
    if (distance > 0) { // Prevent division by zero
      const weight = 1 / distance; // Inverse distance weighting
      totalWeight += weight;
      // Use the higher of the two AQI indicators (O3 or PM2.5)
      const aqiValue = Math.max(parseFloat(dataPoint.o3), parseFloat(dataPoint.pm25));
      weightedSum += aqiValue * weight;
    }
  });

  // Final weighted AQI calculation
  const aqi = weightedSum / totalWeight;

  for (const range of ranges) {
    if (aqi <= range.max) {
      return { aqi, status: range.status, color: range.color };
    }
  }
}

// Function to determine AQI color based on the AQI value - redundant with prior code but couldn't resolve
function getAQIColor(aqi) {
  if (aqi <= 50) return "green";
  if (aqi <= 100) return "yellow";
  if (aqi <= 150) return "orange";
  if (aqi <= 200) return "red";
  if (aqi <= 300) return "darkred";
  return "purple";
}

// getStaticAQI function should return both AQI value and color based on the row from the csv closest to the current time
async function getStaticAQI(filePath) {
  const data = await loadCSV(filePath);
  now.setFullYear(2023); // Ensure the year is set to 2023
  now.setSeconds(0, 0); // Set seconds and milliseconds to 0 for comparison

  let nearestData = null;
  let nearestTimeDifference = Infinity;

  data.forEach((row) => {
    const timestamp = new Date(row.timestamp.replace(/-/g, '/')); // convert string date to date object
    const timeDifference = Math.abs(now - timestamp); // compare each row's date to now

    if (timeDifference < nearestTimeDifference) { // select the nearest point
      nearestTimeDifference = timeDifference;
      nearestData = row;
    }
  });

  const aqi = Math.max(parseFloat(nearestData.o3), parseFloat(nearestData.pm25)); // get data from nearest point
  const color = getAQIColor(aqi);
  return { aqi, color }
}

class MapHandler {
  constructor(mapContainer, mapOptions) {
    this.mapContainer = mapContainer;
    this.mapOptions = mapOptions;
    this.map = null;
    this.infoWindow = null;
    this.currentMarker = null;
  }

  async initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement: marker } = await google.maps.importLibrary("marker"); // necessary for selecting points on map

    this.map = new Map(document.getElementById(this.mapContainer), this.mapOptions);
    this.infoWindow = new google.maps.InfoWindow();

    // Add static markers as color-coded circles for each CSV file / monitor
    await this.loadStaticMarkers();

    // Add a click event listener for the map
    this.map.addListener("click", async (event) => {
      const { lat, lng } = event.latLng.toJSON();
      const { aqi, status, color } = await getAQI(lat, lng, now);
    
      // Update marker and info window when user clicks
      this.updateMarker({ lat, lng });
      const content = this.createContent(lat, lng, aqi, status, color);
      this.infoWindow.setContent(content);
      this.infoWindow.open(this.map, this.currentMarker);
    });    
  }

  async loadStaticMarkers() { // load static markers at monitoring sites
  
    const siteNames = [ // for visualization purposes
    'Monitor 1 - Glenlake', 
    'Monitor 2 - Barton Creek', 
    'Monitor 3 - UT Austin', 
    'Monitor 4 - South Congress',
    'Monitor 5 - Mueller',
    'Monitor 6 - East Austin',
    'Monitory 7 - Dogs Head',
    'Monitor 8 - Riverside',
    'Monitor 9 - Garden Valley',
    'Monitor 10 - Montopolis'
    ];
  
    for (let i = 0; i < filePaths.length; i++) { // for each site
      const filePath = filePaths[i];
      const siteName = siteNames[i];
  
      const { aqi, color } = await getStaticAQI(filePath);

      if (aqi !== null) {
        // Load the CSV to extract the first data point just for coordinates
        const data = await loadCSV(filePath);
        const firstRow = data[0];
        const lat = parseFloat(firstRow.lat);
        const lng = parseFloat(firstRow.lon);
  
        // Determine the AQI status
        const statusObj = ranges.find(status => aqi <= status.max);
  
        // Create a color-coded circle
        const marker = new google.maps.Circle({
          map: this.map,
          center: { lat, lng },
          radius: 200,
          fillColor: statusObj.color,
          fillOpacity: 0.4,
          strokeColor: statusObj.color,
          strokeOpacity: 0.8,
          strokeWeight: 2, // too thick otherwise
          clickable: true,
        });
  
        const infoWindow = new google.maps.InfoWindow({ // window which appears when site is clicked
          content: `
            <div>
              ${siteName}
            </div>
            <div style="font-size: 14px; font-weight: bold;">
            AQI: ${Math.round(aqi)} (${statusObj.status})
            </div>
          `,
        });
  
        // Add a click event to the marker to show the info window
        google.maps.event.addListener(marker, 'click', function () {
          infoWindow.setPosition({ lat, lng });
          infoWindow.open(this.map);
        });
      }
    }
  }
  

  // function to update marker
  updateMarker(position) {
    this.currentMarker = new google.maps.marker.AdvancedMarkerElement({position});
  }

  // content for window that appears when user selects a location
  createContent(lat, lng, aqi, status, color) {
    return `
      <div>
        <h3>AQI Estimate</h3>
        <p>
          <span class="aqi-circle" style="background-color: ${color};"></span>
          <span class="aqi-text">${Math.round(aqi)} (${status})</span>
        </p>
      </div>
    `;
  }
}

// Call the initMap function to initialize the map
const mapOptions = {
  center: { lat: 30.2672, lng: -97.7431 }, // Austin, TX
  zoom: 12,
  mapId: "DEMO_MAP_ID",
};

const mapHandler = new MapHandler("map-container", mapOptions);
mapHandler.initMap();
