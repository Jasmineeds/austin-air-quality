// JavaScript for dynamically selecting and plotting AQI data from CSV files in server

let airData = [];
let chartInstance = null;

// Load CSV data based on the selected file from the dropdown
async function loadCSV(selectedFile) {
    const response = await fetch(`/data/${selectedFile}`);
    airData = Papa.parse(await response.text(), { header: true }).data;
}

// Check if a date is within the valid range (2024 up to the present date)
function isValidDateRange(startDate, endDate) {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of the day

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start < new Date('2024-01-01') || end < new Date('2024-01-01')) {
        return false;
    }

    return start <= today && end <= today && start <= end;
}

// Needed for later - to set CSV dates to 2024
function adjustTimestampTo2024(timestamp) {
    const date = new Date(timestamp);
    date.setFullYear(2024);
    return date;
}

// Process user inputs and plot data
function processData() {
    const pollutant = document.getElementById('pollutantToPlot').value; // get pollutant from dropdown
    const startDateInput = document.getElementById('startDate').value; // get startdate from dropdown
    const endDateInput = document.getElementById('endDate').value; // get enddate from dropdown

    // make sure data is in appropriate range, i.e. 2024
    if (!isValidDateRange(startDateInput, endDateInput)) {
        alert("Select a site and an appropriate date range.");
        return;
    }

    // convert input values to dates
    const startDate = new Date(startDateInput);
    let endDate = new Date(endDateInput);

    // Set startDate to the beginning of the day (00:00:00)
    startDate.setHours(0, 0, 0, 0);

    // Offset startdate and enddate by 1 day (otherwise there's a bug in visualizing data)
    if (endDate.toDateString() !== new Date().toDateString()) {
        endDate.setDate(endDate.getDate() + 1);
    }
    startDate.setDate(startDate.getDate() + 1);

    // Set endDate to the end of the new date
    endDate.setHours(23, 59, 59, 999);

    // If endDate is today set it to the current time
    if (endDate.toDateString() == new Date().toDateString()) {
        const currentDate = new Date();
        endDate.setHours(currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds(), currentDate.getMilliseconds());
    }

    // Filter data based on the date range
    const filteredData = airData.filter(row => {
        const originalDate = new Date(row.timestamp);
        const adjustedDate = adjustTimestampTo2024(originalDate); // set year to 2024

        // Check if the adjusted date falls within the specified range
        return adjustedDate >= startDate && adjustedDate <= endDate;
    });

    const datetimes = [];
    const concentrations = [];

    // set up x values of datetimes
    filteredData.forEach(row => {
        const adjustedDate = adjustTimestampTo2024(new Date(row.timestamp));
        datetimes.push(adjustedDate);
        concentrations.push(parseFloat(row[pollutant]) || 0);
    });

    // plot filtered data
    createPlot(datetimes, concentrations, pollutant, startDate, endDate);
}

// Create the plot in the scatterPlot of index.html
function createPlot(datetimes, concentrations, pollutant, startDate, endDate) {
    const ctx = document.getElementById('scatterPlot').getContext('2d');

    // clear existing plot
    if (chartInstance) {
        chartInstance.destroy();
    }

    // If more than a few days, we probably want to just show daily x ticks
    let timeUnit = 'day';
    const timeDifference = endDate - startDate;
    if (timeDifference < 4 * 24 * 60 * 60 * 1000) { // less than 4 days in milliseconds
        timeUnit = 'hour';
    }

    // instantiate and format the chart
    chartInstance = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: `Hourly AQI for ${pollutant.toUpperCase()}`, // match the dropdown format
                data: datetimes.map((x, i) => ({ x, y: concentrations[i] })),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)' // match the website color scheme
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: timeUnit,
                        tooltipFormat: 'yyyy-MM-dd HH:mm',
                        displayFormats: {
                            hour: 'MMM dd, HH:mm',
                            day: 'MMM dd',
                        }
                    },
                    title: {
                        display: true,
                        text: 'Timestamp'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Air Quality Index'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.raw.x}: ${pollutant.toUpperCase()} AQI ${context.raw.y.toFixed(2)}`; // allow the user to hover over a data point for more information
                        }
                    }
                }
            }
        }
    });
}

// Set up dropdown for selecting a CSV with event listeners
function initializeDropdown() {
    const dropdown = document.getElementById('csvDropdown'); // link to index.html item
    
    // Clear any existing options to avoid duplicates
    dropdown.innerHTML = '';

    // Fill the dropdown with labels
    const labels = [
        "Monitor 1 - Glenlake",
        "Monitor 2 - Barton Creek",
        "Monitor 3 - UT Austin",
        "Monitor 4 - South Congress",
        "Monitor 5 - Mueller",
        "Monitor 6 - East Austin",
        "Monitor 7 - Dogs Head",
        "Monitor 8 - Riverside",
        "Monitor 9 - Garden Valley",
        "Monitor 10 - Montopolis"
    ];
    const csvFiles = Array.from({ length: 10 }, (_, i) => `aqi_${i}.csv`); // csv files to pull in
    
    csvFiles.forEach((file, i) => {
        const option = document.createElement('option');
        option.value = file;
        option.textContent = labels[i]; // visual name is from labels
        dropdown.appendChild(option);
    });

    // Event listener is used to select the file
    dropdown.addEventListener('change', async () => {
        const selectedFile = dropdown.value;
        await loadCSV(selectedFile);
    });
}

// Set up the page on load
window.onload = function () {
    initializeDropdown();
    document.getElementById('generatePlotButton').onclick = processData;
};