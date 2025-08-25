const getStatsBtn = document.getElementById('getStats');

// Get Stats Button Click --------------------------------------------------------------------------
getStatsBtn.addEventListener('click', async () => {
    // Declare Variables
    const username = localStorage.getItem('username');
    const start = document.getElementById('start').value;
    const end = document.getElementById('end').value;

    try {
        // Get Data Endpoint
        const res = await fetch(`http://localhost:3000/api/stats/${username}?start=${start}&end=${end}`);
        const data = await res.json();

        // Populate UI with Data
        document.getElementById('totalMiles').textContent = data.totalMiles.toFixed(2);
        document.getElementById('totalTime').textContent = data.totalTime.toFixed(2);
        document.getElementById('totalFuel').textContent = data.totalFuel.toFixed(2);
        document.getElementById('totalCost').textContent = data.totalCost.toFixed(2);
        document.getElementById('avgMilesPerTank').textContent = data.avgMilesPerTank.toFixed(2);
        document.getElementById('avgMpg').textContent = data.avgMpg.toFixed(2);
        document.getElementById('avgSpeed').textContent = data.avgSpeed.toFixed(2);
        document.getElementById('avgCostPerDay').textContent = data.avgCostPerDay.toFixed(2);
        document.getElementById('avgCostPerMile').textContent = data.avgCostPerMile.toFixed(2);
        document.getElementById('avgFuelPrice').textContent = data.avgFuelPrice.toFixed(2);
        document.getElementById('avgTemp').textContent = data.avgTemp.toFixed(2);
        document.getElementById('avgTimeDriven').textContent = data.avgTimeDriven.toFixed(2);
    } catch (err) {
        console.error("Error fetching stats:", err);
        alert("Failed to load stats");
    }
});
