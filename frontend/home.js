import SessionMaintenance from "./sessionMaintenance.js";
import { API_BASE_URL } from "./config.js";

// window loaded event listener ------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
    await SessionMaintenance.logBook("home", "window.DOMContentLoaded", "Home page loaded");
    const username = localStorage.getItem('username').toLowerCase();
    console.log(username);
    console.log(localStorage.getItem('tankVolume'));
    console.log(localStorage.getItem('fuelCost'));
    if (!username) {
        alert('Please Login');
        window.location.href = "index.html";
        return;
    }
    await loadCosts(username);
    await loadSummary(username);

});

// Load summary --------------------------------------------------------------------------------------
async function loadSummary(username) {
    try {
        SessionMaintenance.showLoader();
        const res = await fetch(`${API_BASE_URL}/api/summary/${username}`);
        const summary = await res.json();

        document.getElementById('totalMiles').textContent = summary.totalMiles.toFixed(1);
        document.getElementById('totalTime').textContent = summary.totalTime.toFixed(1) + " mins";
        document.getElementById('totalFuel').textContent = summary.totalFuel.toFixed(2) + " L";
        document.getElementById('totalCost').textContent = "£" + summary.totalCost.toFixed(2);
        document.getElementById('avgMpg').textContent = summary.avgMpg.toFixed(1);

        await SessionMaintenance.logBook("home", "loadSummary", `Summary Loaded: ${summary}`);
    } catch (err) {
        console.error("error loading summary:", err);
    } finally {
        SessionMaintenance.hideLoader();
    }
}

// Load Costs -------------------------------------------------------------------------------------
async function loadCosts(username) {
    try {
        SessionMaintenance.showLoader();
        const res = await fetch(`${API_BASE_URL}/api/costs/${username}`);
        if (!res.ok) throw new Error("Failed to fetch costs");

        const data = await res.json();

        document.getElementById("seven").textContent = `£${data.seven}`;
        document.getElementById("fourteen").textContent = `£${data.fourteen}`;
        document.getElementById("twentyEight").textContent = `£${data.twentyEight}`;

        await SessionMaintenance.logBook("home", "loadCosts", `Costs Loaded: ${data}`);
    } catch (err) {
        console.error("Error loading Costs:", err);
    } finally {
        SessionMaintenance.hideLoader();
    }
}