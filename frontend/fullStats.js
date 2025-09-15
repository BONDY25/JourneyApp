import SessionMaintenance from "./sessionMaintenance.js";
import { API_BASE_URL } from "./config.js";

const currency = localStorage.getItem('currency');
const getStatsBtn = document.getElementById('getStats');

// window loaded event listener ------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
    await SessionMaintenance.logBook("fullStats", "window.DOMContentLoaded", "Full Stats page loaded");
    SessionMaintenance.hideLoader();
});

// Get Stats Button Click --------------------------------------------------------------------------
getStatsBtn.addEventListener('click', async () => {
    // Declare Variables
    const username = localStorage.getItem('username').toLowerCase();
    const start = document.getElementById('start').value;
    const end = document.getElementById('end').value;

    try {
        SessionMaintenance.showLoader();
        // Get Data Endpoint
        await SessionMaintenance.logBook("fullStats", "getStatsBtn.click", `Getting full stats: (${start}, ${end})`);
        const res = await fetch(`${API_BASE_URL}/api/stats/${username}?start=${start}&end=${end}`);
        const data = await res.json();
        await SessionMaintenance.logBook("fullStats", "getStatsBtn.click", `Full Stats retrieved: ${JSON.stringify(data, null, 2)}`);

        // Populate UI with Data
        document.getElementById('totalMiles').textContent = data.totalMiles.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('totalTime').textContent = data.totalTime.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('totalFuel').textContent = data.totalFuel.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('totalCost').textContent = `${currency}${data.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById('avgMilesPerTank').textContent = data.avgMilesPerTank.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('avgMpg').textContent = data.avgMpg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('avgSpeed').textContent = data.avgSpeed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('avgCostPerDay').textContent = `${currency}${data.avgCostPerDay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById('avgCostPerMile').textContent = `${currency}${data.avgCostPerMile.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById('avgFuelPrice').textContent = `${currency}${data.avgFuelPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById('avgTemp').textContent = data.avgTemp.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        document.getElementById('avgTimeDriven').textContent = data.avgTimeDriven.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } catch (err) {
        await SessionMaintenance.logBook("fullStats", "getStatsBtn.click", `Error fetching stats: ${err}`, true);
        alert("Failed to load stats");
    } finally {
        SessionMaintenance.hideLoader();
    }
});
