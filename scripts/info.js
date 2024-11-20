const pollutantInfo = {
  pm25: {
    name: "Fine Particulate Matter (PM2.5)",
    description: "Very small particles or liquid droplets with a diameter of 2.5 micrometers or less.",
    sources: ["Vehicle emissions", "Industrial processes", "Burning of fossil fuels"],
    healthEffects: ["Respiratory issues", "Cardiovascular problems"]
  },
  pm10: {
    name: "Particulate Matter (PM10)",
    description: "Inhalable particles with diameters generally 10 micrometers and smaller.",
    sources: ["Dust", "Pollen", "Mold", "Industrial emissions"],
    healthEffects: ["Lung irritation", "Reduced lung function"]
  },
  co: {
    name: "Carbon Monoxide",
    description: "Colorless, odorless gas produced by incomplete combustion.",
    sources: ["Vehicle exhaust", "Industrial processes", "Residential heating"],
    healthEffects: ["Reduced oxygen in bloodstream", "Heart problems"]
  },
  no2: {
    name: "Nitrogen Dioxide",
    description: "Reddish-brown gas formed by emissions from cars, trucks, buses, power plants, and off-road equipment.",
    sources: ["Vehicle emissions", "Power plants", "Industrial processes"],
    healthEffects: ["Respiratory inflammation", "Increased asthma risk"]
  },
  o3: {
    name: "Ground-level Ozone",
    description: "A reactive gas composed of oxygen atoms, formed by chemical reactions between nitrogen oxides and volatile organic compounds.",
    sources: ["Vehicle emissions", "Industrial emissions", "Chemical solvents"],
    healthEffects: ["Lung damage", "Respiratory problems"]
  }
};

function displayPollutantInfo(pollutant) {
  const details = pollutantInfo[pollutant];
  const detailsContainer = document.getElementById('pollutant-details');

  detailsContainer.innerHTML = `
        <h2>${details.name}</h2>
        <p><strong>Description:</strong> ${details.description}</p>
        <p><strong>Sources:</strong> ${details.sources.join(", ")}</p>
        <p><strong>Health Effects:</strong> ${details.healthEffects.join(", ")}</p>
    `;
}

// Add event listeners to dynamically update pollutant info
document.getElementById('pollutantToPlot').addEventListener('change', function () {
  displayPollutantInfo(this.value);
});

// Initial display
displayPollutantInfo('pm25');