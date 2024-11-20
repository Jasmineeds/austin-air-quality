let airData = []; // Initialize the airData
let chartInstance = null; // Initialize a variable holding a reference to the chart created by chart.js

// Once data is uploaded, parse it
document.getElementById('DataUpload').addEventListener('change', function (event) {
  const file = event.target.files[0];
  if (file) {
    Papa.parse(file, {
      complete: function (results) {
        airData = results.data;
      },
      header: true // First row is headers
    });
  }
});

// Function to process the data and plot it
function processData() {
  const pollutant = document.getElementById('pollutantToPlot').value; // pollutant we're plotting
  const startDate = document.getElementById('startDate').value; // our start date
  const endDate = document.getElementById('endDate').value; // our end date

  // Check if the end date is before the start date
  if (startDate && endDate && endDate < startDate) {
    alert("End date must be after start date");
    return;
  }

  // Filter data based on date range
  const filteredData = airData.filter(row => {
    const timestamp = new Date(row.timestamp);

    if (isNaN(timestamp)) { // There are a few data rows with invalid timestamps; skip them
      console.error("Invalid timestamp:", row.timestamp);
      return false;
    }

    const start = startDate ? new Date(startDate + 'T00:00:00Z') : null; // include as early as midnight of start date
    const end = endDate ? new Date(endDate + 'T23:59:59.999Z') : null; // go through midnight of end date

    if (start && timestamp < start) {
      return false; // skip rows before start date
    }
    if (end && timestamp > end) {
      return false; // skip rows after end date
    }

    return true; // include rows within date range
  });

  if (filteredData.length === 0) { // if start and end dates fall outside of date range
    alert("No data available for the selected date range.");
    return;
  }

  // Finally, get the pollutant of interest in the timestmap rows of interest and push them to datetimes and concentrations
  const datetimes = filteredData.map(row => row.timestamp);
  const concentrations = filteredData.map(row => parseFloat(row[pollutant]));

  // Update plot
  createPlot(datetimes, concentrations);
}

// Function to create or update our scatter plot using chart js library
function createPlot(datetimes, concentrations) {
  const airchart = document.getElementById('scatterPlot').getContext('2d');

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(airchart, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Hourly Pollutant Concentrations',
        data: datetimes.map((timestamp, index) => ({
          x: timestamp,
          y: concentrations[index]
        }))
      }]
    },
    options: {
      scales: {
        x: {
          type: 'category',
          title: {
            display: true,
            text: 'Timestamp'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Pollutant Level'
          }
        }
      }
    }
  });
}

// Finally, ensure process data is called after page loads
document.getElementById('generatePlotButton').onclick = processData;