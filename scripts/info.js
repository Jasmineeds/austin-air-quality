// load pollutant data
const pollutantInfo = {
  co: {
    name: "Carbon Monoxide (CO)",
    alias: "carbon monoxide",
    description: "Carbon monoxide gas is a colorless, odorless air pollutant. While it is more of a concern at high levels indoors, it can be a health hazard outdoors as well. ",
    sources: ["For outdoor air, the greatest producers of CO are cars, trucks, vehicles, and machinery that burn fossil fuels.", "Without proper ventilation, kerosene and gas space heaters, chimney and furnace leaks, and gas stoves, can all produce CO as well."],
    healthEffects: ["Carbon monoxide causes adverse health effects because it limits oxygen content in the blood.", "While CO levels are unlikely to reach high concentrations outdoors, an increase can still impact people with heart disease. When someone’s ability to get oxygenated blood to the heart is already limited, CO inhalation can cause chest pain and discomfort."]
  },
  no2: {
    name: "Nitrogen Dioxide (NO2)",
    alias: "nitrogen dioxide",
    description: "Nitrogen dioxide is a nitrous oxide, which is a group of highly reactive gases.",
    sources: ["Cars, trucks, buses, off-road equipment, and power plants can all emit nitrogen dioxide."],
    healthEffects: ["High NO2 concentrations can irritate the airways. Respiratory diseases such as asthma and symptoms like coughing, wheezing, and difficulty breathing can be exacerbated.", "Prolonged exposure to high NO2 levels can cause these diseases to develop.", "Children and the elderly are particularly susceptible to the health effects of NO2."]
  },
  o3: {
    name: "Ozone (O3)",
    alias: "ozone",
    description: "Ozone can be good or bad, depending on where in the atmosphere it is found. In the upper atmosphere, ozone helps protect the earth from the sun’s UV rays. Ground-level ozone, however, is bad, as it makes up smog.",
    sources: ["Emissions from cars, power plants, industrial boilers, refineries, chemical plants, can cause compounds that react to form ground-level ozone to enter the air."],
    healthEffects: ["While unhealthy ozone levels are most likely to occur on sunny days, high levels occur during cold months as well. ", "Effects of ozone exposure include: coughing and sore/scratchy throat; difficulty/pain when breathing; airway damage/inflammation; increased risk of lung infection, trigger asthma, emphysema, bronchitis, and other lung diseases.", "Those with asthma, the elderly, and children are particularly susceptible."]
  },
  pm: {
    name: "Particulate Matter (PM)",
    alias: "particulate matter",
    description: "Particulate matter, also commonly known as PM, is a mix of solid particles and liquid droplets in the air.",
    sources: ["Particulate Matter may come from construction sites, dirt roads, fields, and fires. Others come from reactions between pollutants emitted from power plants, industry, and auto vehicles."],
    healthEffects: ["PM inhalation can cause health issues, especially the PM small enough to enter the lungs and bloodstream. In those with heart or lung disease, particles in the lungs and heart can lead to premature death.", "Nonfatal heart attacks, irregular heartbeat, decreased lung function, and respiratory symptoms like airway irritation, coughing, and difficulty breathing can also occur."]
  }
};

function displayPollutantInfo(pollutant) {
  const details = pollutantInfo[pollutant];
  const detailsContainer = document.getElementById(pollutant);

  detailsContainer.innerHTML = `
    <h2 class="pollutant-title">${details.name}</h2>
    <div class="pollutant-content">
      <!-- Left side: Text content -->
      <div class="pollutant-text">
        <div class="first-paragraph">
          <h3>What is ${details.alias}?</h3>
          <p>${details.description}</p>
        </div>
        <div class="second-paragraph">
          <h3>Sources of ${details.alias}?</h3>
          <ul>
            ${details.sources.map(source => `<li>${source}</li>`).join('')}
          </ul>
        </div>
        <div class="third-paragraph">
          <h3>Health impacts of ${details.alias}?</h3>
          <ul>
            ${details.healthEffects.map(effect => `<li>${effect}</li>`).join('')}
          </ul>
        </div>
      </div>
      <!-- Right side: Image -->
      <div class="pollutant-image">
        <img src="images/${pollutant}.png" alt="${details.name}">
      </div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', function () {
  const navButtons = document.querySelectorAll('.nav-button');
  const sections = document.querySelectorAll('.section');

  navButtons.forEach(button => {
    button.addEventListener('click', function () {
      const sectionId = this.getAttribute('data-section');

      // remove active class from all
      navButtons.forEach(btn => btn.classList.remove('active'));
      sections.forEach(section => section.style.display = 'none');

      // add active class to clicked button
      this.classList.add('active');
      document.getElementById(sectionId).style.display = 'block';

      // display for the selected section
      displayPollutantInfo(sectionId);
    });
  });

  // show CO section as default
  document.querySelector('.nav-button[data-section="co"]').click();
});