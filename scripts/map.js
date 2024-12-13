// Import personal Google Maps API key as saved in config.js
import {GOOGLE_MAPS_API_KEY} from '../config.js';

// Import the Google Map API dynamic library, copied from Google
(g => {var h, a, k, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__ib__", m = document, b = window; b = b[c] || (b[c] = {}); 
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
  d[l] ? console.warn(p + " only loads once. Ignoring:", g) : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)) })({key: GOOGLE_MAPS_API_KEY, v: "weekly"});

// async function parses CSV with PapaParse
// async is necessary because we're working with dynamic content, network requests, and multiple CSVs
async function loadCSV(path) {
  return new Promise((resolve) => {
    Papa.parse(path, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {resolve(results.data)}
    });
  });
}

// function to get the distance between two coordinates (in meters), treating lat/long as an x-y grid given the small area we're dealing with
function calcDist(lat1, lon1, lat2, lon2) {
  const dlat = Math.abs(lat2 - lat1) * 1.17; // Scale latitude by 1.17 as approximated for Austin
  const dlon = Math.abs(lon2 - lon1);
  return Math.sqrt(dlat ** 2 + dlon ** 2);
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

// function to get AQI status
function AQIstatus(inputAQI) {
  if (inputAQI <= 50) {
    return {status: "Good", color : "green"};
  } else if (inputAQI <= 100) {
    return {status: "Moderate", color: "yellow"};
  } else if (inputAQI <= 150) {
    return {status: "Unhealthy for Sensitive Groups", color: "orange"};
  } else if (inputAQI <= 200) {
    return {status: "Unhealthy", color: "red"};
  } else if (inputAQI <= 300) {
    return {status: "Very Unhealthy", color: "darkred"};
  } else {
    return {status: "Hazardous", color: "purple"};
  }
}

// set up a string with today's date, in hours, translated to 2023 to match CSV
const now = new Date(); // value for today
now.setFullYear(2023); // Ensure the year is set to 2023
now.setSeconds(0, 0); // Set seconds to 0 for comparison
const nowString = now.toISOString().split('T')[0] + ' ' + now.getHours().toString().padStart(2, '0') + ':00:00';

// Function to approximate AQI from three nearest locations using KNN regression weighted inversely by distance
async function approxAQI(lat, lng) {
  
  // Load all CSV files with await promises
  const allDataPromises = filePaths.map(filePath => loadCSV(filePath)); // calling on Papa.parse
  const allData = await Promise.all(allDataPromises);

  // Flatten CSV data into one array
  const allMonitors = allData.flat();

  // Get CSV data from the current (2023) time
  const filteredPoints = allMonitors.filter((dataPoint) => {
    const timestamp = new Date(dataPoint.timestamp.replace(/-/g, '/'));
    const timestring = timestamp.toISOString().split('T')[0] + ' ' + timestamp.getHours().toString().padStart(2, '0') + ':00:00';
    return timestring === nowString;
  });

  // Calculate distances and select the three nearest monitors
  const distances = filteredPoints.map((dataPoint) => {
    const distance = calcDist(lat, lng, parseFloat(dataPoint.lat), parseFloat(dataPoint.lon));
    return {distance, dataPoint};
  });

  // Sort by distance and select the three closest points
  const closestPoints = distances.sort((a, b) => a.distance - b.distance).slice(0, 3);

  // Calculate weighted AQI using inverse distance
  let weightedSum = 0;
  let weightsum = 0;

  closestPoints.forEach(({distance, dataPoint}) => {
    if (distance > 0) { // prevent division by zero
      const distweight = 1 / distance; // weight inverse to distance
      weightsum += distweight;
      // Use the higher of the two AQI indicators (O3 or PM2.5)
      const bigAQI = Math.max(parseFloat(dataPoint.o3), parseFloat(dataPoint.pm25));
      weightedSum += bigAQI * distweight;
    }
  });

  // Final weighted AQI calculation at clicked point
  const clickAQI = weightedSum / weightsum;

  // now return the color and status depending on the aqi
  return {clickAQI, ...AQIstatus(clickAQI)}
}

// getStaticAQI function should return both AQI value and color based on the row from the csv closest to the current time
async function getStaticAQI(path) {
  const data = await loadCSV(path);

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

  const staticAQI = Math.max(parseFloat(nearestData.o3), parseFloat(nearestData.pm25)); // get data from nearest point
  return {staticAQI}
}

// Now begin building the map

const container = "map-container"; // id connects us to index.html
const options = {
  center: { lat: 30.27, lng: -97.74 },
  zoom: 12
};
let map = null;
let infoWindow = null;
let currentMarker = null;

async function startMap() {
  const {Map} = await google.maps.importLibrary("maps");
  const {AdvancedMarkerElement: marker} = await google.maps.importLibrary("marker"); // necessary for selecting points on map

  map = new Map(document.getElementById(container), options);
  infoWindow = new google.maps.InfoWindow();

  // Add static markers as color-coded circles for each CSV file / monitor
  await loadMarkers();

  // Add a click event listener for the map
  map.addListener("click", async (event) => {
    const {lat, lng} = event.latLng.toJSON();
    const {clickAQI, status, color} = await approxAQI(lat, lng);

    // get rid of last marker if there is one
    if (currentMarker) {currentMarker = null};

    // Update marker and info window when user clicks. Needs to be a new marker so a function seems to work best
    function updateMarker(position) {currentMarker = new google.maps.marker.AdvancedMarkerElement({position})};

    function estimate(clickAQI, status, color) {
      return `
        <div>
          <h3> AQI Estimate </h3>
          <p>
            <span class="aqi-circle" style="background-color: ${color};"></span>
            <span class="aqi-text"> ${Math.round(clickAQI)} (${status}) </span>
          </p>
        </div>
      `;
    }

    updateMarker({lat, lng});
    const estimateObj = estimate(clickAQI, status, color);
    infoWindow.setContent(estimateObj);
    infoWindow.open(map, currentMarker);
  });
}

// now load the markers with their site names
async function loadMarkers() {
  const siteNames = [
    'Monitor 1 - Glenlake',
    'Monitor 2 - Barton Creek',
    'Monitor 3 - UT Austin',
    'Monitor 4 - South Congress',
    'Monitor 5 - Mueller',
    'Monitor 6 - East Austin',
    'Monitor 7 - Dogs Head',
    'Monitor 8 - Riverside',
    'Monitor 9 - Garden Valley',
    'Monitor 10 - Montopolis'
  ];

  // align csvs with site names, and load AQI
  for (let i = 0; i < 10; i++) {
    const filePath = filePaths[i];
    const siteName = siteNames[i];

    // get static AQI CSV
    const {staticAQI} = await getStaticAQI(filePath);

    // parse static AQI CSV
    if (staticAQI !== null) {
      const data = await loadCSV(filePath);
      const firstRow = data[0];
      const lat = parseFloat(firstRow.lat);
      const lng = parseFloat(firstRow.lon);

      // get AQI status and color - redundant with prior code but couldn't resolve
      const statusObj = AQIstatus(staticAQI);
      
      // illustrate monitor AQI as a marker
      const marker = new google.maps.Circle({
        map: map,
        center: {lat, lng},
        radius: 200,
        fillColor: statusObj.color,
        fillOpacity: 0.4,
        strokeColor: statusObj.color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        clickable: true,
      });

      // create a window above the marker when the user clicks it
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div>
            ${siteName}
          </div>
          <div style="font-size: 14px; font-weight: bold;">
          AQI: ${Math.round(staticAQI)} (${statusObj.status})
          </div>
        `,
      });

      // initiate window upon click
      google.maps.event.addListener(marker, 'click', function () {
        infoWindow.setPosition({lat, lng});
        infoWindow.open(map);
      });
    }
  }
}

// fire up the map!
startMap();