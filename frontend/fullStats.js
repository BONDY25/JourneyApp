import SessionMaintenance from "./sessionMaintenance.js";
import { API_BASE_URL } from "./config.js";

const getStatsBtn = document.getElementById('getStats');

// window loaded event listener ------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
    await SessionMaintenance.logBook("fullStats", "window.DOMContentLoaded", "Full Stats page loaded");
});

// Get Stats Button Click --------------------------------------------------------------------------
getStatsBtn.addEventListener('click', async () => {
    // Declare Variables
    const username = localStorage.getItem('username');
    const start = document.getElementById('start').value;
    const end = document.getElementById('end').value;

    try {
        // Get Data Endpoint
        await SessionMaintenance.logBook("fullStats", "getStatsBtn.click", `Getting full stats: (${start}, ${end})`);
        const res = await fetch(`${API_BASE_URL}/api/stats/${username}?start=${start}&end=${end}`);
        const data = await res.json();
        await SessionMaintenance.logBook("fullStats", "getStatsBtn.click", `Full Stats retrieved: ${data}`);

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
        await SessionMaintenance.logBook("fullStats", "getStatsBtn.click", `Error fetching stats: ${err}`, true);
        alert("Failed to load stats");
    }
});
