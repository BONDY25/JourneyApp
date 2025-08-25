
// window loaded event listener ------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
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
        const res = await fetch(`http://localhost:3000/api/summary/${username}`);
        const summary = await res.json();

        console.log(summary);

        document.getElementById('totalMiles').textContent = summary.totalMiles.toFixed(1);
        document.getElementById('totalTime').textContent = summary.totalTime.toFixed(1) + " mins";
        document.getElementById('totalFuel').textContent = summary.totalFuel.toFixed(2) + " L";
        document.getElementById('totalCost').textContent = "£" + summary.totalCost.toFixed(2);
        document.getElementById('avgMpg').textContent = summary.avgMpg.toFixed(1);
    } catch (err) {
        console.error("error loading summary:", err);
    }
}

// Load Costs -------------------------------------------------------------------------------------
async function loadCosts(username) {
    try {
        const res = await fetch(`http://localhost:3000/api/costs/${username}`);
        if (!res.ok) throw new Error("Failed to fetch costs");

        const data = await res.json();
        console.log("Cost Breakdown:", data);

        document.getElementById("seven").textContent = `£${data.seven}`;
        document.getElementById("fourteen").textContent = `£${data.fourteen}`;
        document.getElementById("twentyEight").textContent = `£${data.twentyEight}`;
    } catch (err) {
        console.error("Error loading Costs:", err);
    }
}