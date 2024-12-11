# Austin Air Quality
Explore Austin, Texas's air quality through interactive maps and plot generation.  
This project is a submission for the JavaScript Programming course taught by Prof. Luis Francisco Revilla.

## Features

This website offers the following functionalities:

- **Air Monitor Map:**  
  Interact with color-coded markers on a Google Map of the Austin area to view real-time air quality data from monitors. Clicking a random point on the map displays an estimated Air Quality Index (AQI) based on the three nearest devices, weighted inversely by distance.

- **Air Quality Index Data Plotter:**  
  Select a monitor in the Austin area, choose a pollutant (PM2.5, PM10, CO, NO2, O3), and specify a past date range in 2024. Click the "Generate Plot" button to display hourly AQI data.

- **Air Quality Information:**  
  Access detailed information about the Air Quality Index and common pollutants.

## Getting Started

Follow these steps to set up the website:

1. **Download the Files:**  
   Clone this repository or download its contents.

2. **Set Up the Environment:**  
   Install the XAMPP web server and place the project files in the `htdocs` directory.

3. **Configure Your API Key:**  
   Obtain a Google Maps API Key from the [Google Maps Platform](https://developers.google.com/maps/documentation/javascript/get-api-key).  
   Open the `config.js` file and replace the placeholder with your API key.

   ```js
   export const GOOGLE_MAPS_API_KEY = "";  // Add your API key here
   ```

- **Start Server:**  
  Star Apache Web Server in XAMPP.

- **Run Website:**  
  Open browser and enter:
  ```
  http://localhost
  ```

## Demo

Check out how the website works!

![Air Monitor Map](/images/demo/demo-1.png)
![Air Quality Index Data Plotter](/images/demo/demo-2.png)
 
