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

// Function to parse CSV files using PapaParse
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

// Function to calculate the distance between two coordinates (in km)
// Function to calculate the distance between two coordinates (in meters), treating lat/lng as an x-y grid
function calculateDistance(lat1, lon1, lat2, lon2) {
  const latDifference = Math.abs(lat2 - lat1) * 1.17; // Scale latitude by 1.17
  const lonDifference = Math.abs(lon2 - lon1);
  return Math.sqrt(latDifference ** 2 + lonDifference ** 2);
}


// Function to get the AQI data from CSVs and find the KNN with inverse distance weighting
async function getAQI(lat, lng, currentTime) {
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

  // Load all CSV files
  const allDataPromises = filePaths.map(filePath => loadCSV(filePath));
  const allData = await Promise.all(allDataPromises);

  // Flatten all CSV data into one array
  const allDataPoints = allData.flat();

  // Adjust the current time to consider data from 2023
  const adjustedTime = new Date(currentTime);
  adjustedTime.setFullYear(2023); // Set year to 2023

  // Round adjusted time to the nearest hour
  adjustedTime.setMinutes(0, 0, 0);
  const adjustedTimeString = adjustedTime.toISOString().split('T')[0] + ' ' + adjustedTime.getHours().toString().padStart(2, '0') + ':00:00';

  // Filter data points based on the adjusted time
  const relevantDataPoints = allDataPoints.filter((dataPoint) => {
    const timestamp = new Date(dataPoint.timestamp.replace(/-/g, '/'));
    const timeString = timestamp.toISOString().split('T')[0] + ' ' + timestamp.getHours().toString().padStart(2, '0') + ':00:00';
    return timeString === adjustedTimeString;
  });

  if (relevantDataPoints.length === 0) {
    console.error("No relevant data points found for the given time.");
    return { aqi: NaN, status: "No data", color: "gray" };
  }

  // Calculate distances and select the three nearest data points
  const distances = relevantDataPoints.map((dataPoint) => {
    const distance = calculateDistance(lat, lng, parseFloat(dataPoint.lat), parseFloat(dataPoint.lon));
    return { distance, dataPoint };
  });

  // Sort by distance and take the top 2 points
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

  // Prevent division by zero if totalWeight is 0
  if (totalWeight === 0) {
    console.error("Total weight is zero, cannot calculate AQI.");
    return { aqi: NaN, status: "Error", color: "gray" };
  }

  // Final weighted AQI calculation
  const aqi = weightedSum / totalWeight;

  // AQI color and status ranges
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





// Function to determine AQI color based on the AQI value
function getAQIColor(aqi) {
  if (aqi <= 50) return "green"; // Good
  if (aqi <= 100) return "yellow"; // Moderate
  if (aqi <= 150) return "orange"; // Unhealthy for Sensitive Groups
  if (aqi <= 200) return "red"; // Unhealthy
  if (aqi <= 300) return "darkred"; // Very Unhealthy
  return "purple"; // Hazardous
}

// Modified getStaticAQI function to return both AQI value and color
async function getStaticAQI(filePath) {
  const data = await loadCSV(filePath);
  const now = new Date();
  now.setFullYear(2023); // Ensure the year is set to 2023
  now.setSeconds(0, 0); // Set seconds and milliseconds to 0 for comparison

  let nearestData = null;
  let nearestTimeDifference = Infinity;

  data.forEach((row) => {
    const timestamp = new Date(row.timestamp.replace(/-/g, '/'));
    const timeDifference = Math.abs(now - timestamp);

    if (timeDifference < nearestTimeDifference) {
      nearestTimeDifference = timeDifference;
      nearestData = row;
    }
  });

  if (nearestData) {
    const aqi = Math.max(parseFloat(nearestData.o3), parseFloat(nearestData.pm25));
    const color = getAQIColor(aqi);
    return { aqi, color };
  } else {
    console.warn(`No AQI data found for ${filePath} at ${now}`);
    return null;
  }
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
    const { AdvancedMarkerElement: marker } = await google.maps.importLibrary("marker");

    this.map = new Map(document.getElementById(this.mapContainer), this.mapOptions);
    this.infoWindow = new google.maps.InfoWindow();

    // Add static markers as color-coded circles for each CSV file
    await this.loadStaticMarkers();

    // Add a click event listener for the map
    this.map.addListener("click", async (event) => {
      const { lat, lng } = event.latLng.toJSON();
      const now = new Date();
      const { aqi, status, color } = await getAQI(lat, lng, now);
    
      // Update the marker and info window
      this.updateMarker({ lat, lng });
      const content = this.createContent(lat, lng, aqi, status, color);
      this.infoWindow.setContent(content);
      this.infoWindow.open(this.map, this.currentMarker);
    });    
  }

  async loadStaticMarkers() {
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
  
    for (const filePath of filePaths) {
      const { aqi, color } = await getStaticAQI(filePath);
      if (aqi !== null) {
        // Load the CSV to extract the first data point for coordinates
        const data = await loadCSV(filePath);
        const firstRow = data[0];
        const lat = parseFloat(firstRow.lat);
        const lng = parseFloat(firstRow.lon);
  
        // Create a color-coded circle marker
        const marker = new google.maps.Circle({
          map: this.map,
          center: { lat, lng },
          radius: 200, // Adjust the radius as needed
          fillColor: color,
          fillOpacity: 0.4,
          strokeColor: color,
          strokeOpacity: 0.8,
          strokeWeight: 2,
          clickable: true,
        });
  
        // Create an info window to display AQI text
        const infoWindow = new google.maps.InfoWindow({
          content: `<div style="font-size: 14px; font-weight: bold;">AQI: ${Math.round(aqi)}</div>`,
        });
  
        // Add a click event to the marker to show the info window
        google.maps.event.addListener(marker, 'click', function () {
          infoWindow.setPosition({ lat, lng });
          infoWindow.open(this.map);
        });
      }
    }
  }
  

  updateMarker(position) {
    if (this.currentMarker) {
      this.currentMarker.setMap(null);
    }

    this.currentMarker = new google.maps.marker.AdvancedMarkerElement({
      position,
      map: this.map,
      title: `Lat: ${position.lat}, Lng: ${position.lng}`,
    });
  }

  createContent(lat, lng, aqi, status, color) {
    return `
      <div>
        <h3>Location</h3>
        <p>Latitude: ${lat}, Longitude: ${lng}</p>
        <p>
          <span class="aqi-circle" style="background-color: ${color};"></span>
          AQI: 
          <span class="aqi-text">${Math.round(aqi)} (${status})</span>
        </p>
        <a href="https://www.example.com/more-info" class="info-window-button" target="_blank">More Information</a>
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
