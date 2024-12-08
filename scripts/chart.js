// JavaScript for dynamically selecting and plotting AQI data from multiple CSV files

let airData = [];
let chartInstance = null;

// Load CSV data based on the selected file from the dropdown
async function loadCSV(selectedFile) {
    try {
        const response = await fetch(`/data/${selectedFile}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const csvText = await response.text();
        const results = Papa.parse(csvText, { header: true });
        airData = results.data;
    } catch (error) {
        console.error("Error loading CSV:", error);
        alert("Failed to load CSV file.");
    }
}

// Check if a date is within the valid range (up to 2024 or the present date)
function isValidDateRange(startDate, endDate) {
    const maxDate = new Date();
    const endOf2024 = new Date('2024-12-31T23:59:59Z');
    const finalMaxDate = maxDate < endOf2024 ? maxDate : endOf2024;

    const start = new Date(startDate);
    const end = new Date(endDate);

    return start <= finalMaxDate && end <= finalMaxDate && start <= end;
}

// Adjust 2023 timestamps to 2024 for plotting
function adjustTimestampTo2024(timestamp) {
    const date = new Date(timestamp);
    const adjustedDate = new Date(date);
    adjustedDate.setFullYear(2024);
    return adjustedDate;
}

// Process the data for the selected pollutant and date range
function processData() {
    const pollutant = document.getElementById('pollutantToPlot').value;
    const startDateInput = document.getElementById('startDate').value;
    const endDateInput = document.getElementById('endDate').value;

    if (!startDateInput || !endDateInput) {
        alert("Please select both start and end dates.");
        return;
    }

    if (!isValidDateRange(startDateInput, endDateInput)) {
        alert("No data exists for the selected date range.");
        return;
    }

    const filteredData = airData.filter(row => {
        const originalDate = new Date(row.timestamp);
        const adjustedDate = adjustTimestampTo2024(originalDate);
        return adjustedDate >= new Date(startDateInput) && adjustedDate <= new Date(endDateInput);
    });

    if (filteredData.length === 0) {
        alert("No data available for the selected date range.");
        return;
    }

    const datetimes = [];
    const concentrations = [];

    filteredData.forEach(row => {
        const adjustedDate = adjustTimestampTo2024(new Date(row.timestamp));
        datetimes.push(adjustedDate);
        concentrations.push(parseFloat(row[pollutant]) || 0);
    });

    createPlot(datetimes, concentrations, pollutant);
}

// Create the Chart.js plot
function createPlot(datetimes, concentrations, pollutant) {
    const ctx = document.getElementById('scatterPlot').getContext('2d');

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: `Hourly ${pollutant.toUpperCase()} AQI`,
                data: datetimes.map((x, i) => ({ x, y: concentrations[i] })),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                pointRadius: 3
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
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
                            return `${context.raw.x}: ${context.raw.y.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
}

// Initialize the dropdown with CSV file options and set up event listeners
function initializeDropdown() {
    const dropdown = document.getElementById('csvDropdown');
    
    // Clear any existing options to avoid duplicates
    dropdown.innerHTML = '';

    // Generate CSV file names and populate the dropdown
    const csvFiles = Array.from({ length: 10 }, (_, i) => `aqi_${i}.csv`);
    csvFiles.forEach(file => {
        const option = document.createElement('option');
        option.value = file;
        option.textContent = file;
        dropdown.appendChild(option);
    });

    // Add an event listener for file selection
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
