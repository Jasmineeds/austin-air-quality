const aqiData = [
  {
    color: 'green',
    level: 'Good',
    range: '0 to 50',
    description: 'Air quality is satisfactory, and air pollution poses little or no risk.'
  },
  {
    color: 'yellow',
    level: 'Moderate',
    range: '51 to 100',
    description: 'Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.'
  },
  {
    color: 'orange',
    level: 'Unhealthy for Sensitive Groups',
    range: '101 to 150',
    description: 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.'
  },
  {
    color: 'red',
    level: 'Unhealthy',
    range: '151 to 200',
    description: 'Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.'
  },
  {
    color: 'purple',
    level: 'Very Unhealthy',
    range: '201 to 300',
    description: 'Health alert: The risk of health effects is increased for everyone.'
  },
  {
    color: 'maroon',
    level: 'Hazardous',
    range: '301 and higher',
    description: 'Health warning of emergency conditions: everyone is more likely to be affected.'
  }
];

const table = document.getElementById('aqiTable');

aqiData.forEach(row => {
  const tr = document.createElement('tr');
  tr.className = row.color;
  tr.innerHTML = `
                <td>${row.color.charAt(0).toUpperCase() + row.color.slice(1)}</td>
                <td>${row.level}</td>
                <td>${row.range}</td>
                <td>${row.description}</td>
            `;
  table.appendChild(tr);
});