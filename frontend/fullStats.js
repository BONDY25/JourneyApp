// ==========================================================================================================
// -- Boilerplate --
// ==========================================================================================================

import SessionMaintenance from "./sessionMaintenance.js";
import { API_BASE_URL } from "./config.js";
import {Chart} from "chart.js";

const currency = localStorage.getItem('currency');
const getStatsBtn = document.getElementById('getStats');

const displayType = document.getElementById('display-type');
const axisFields = document.getElementById('axisFields');
const sumStats = document.getElementById('sum-stats');

// ==========================================================================================================
// -- Operational Functions --
// ==========================================================================================================

// Get Stats -------------------------------------------------------------------------------------------
async function getStats(username, start, end) {
    try {
        SessionMaintenance.showLoader();
        // Get Data Endpoint
        await SessionMaintenance.logBook("fullStats", "getStats", `Getting full stats: (${start}, ${end})`);
        const res = await fetch(`${API_BASE_URL}/api/stats/${username}?start=${start}&end=${end}`);
        const data = await res.json();
        const formattedTime = data.totalTime > 60 ? data.totalTime / 60 : data.totalTime;
        const timeUnit = data.totalTime > 60 ? "Hours" : "Minutes";
        const lpkm = SessionMaintenance.calculateConsumption(data.avgMpg);
        const kWh = SessionMaintenance.calculateConsumption(data.avgMpg, 'kwhper100');
        const kWhTotal = SessionMaintenance.calculateConsumption(data.avgMpg, 'kwhper100', 'Total');

        await SessionMaintenance.logBook("fullStats", "getStats", `Full Stats retrieved: ${JSON.stringify(data, null, 2)}`);

        // Populate UI with Data
        document.getElementById('totalMiles').textContent = data.totalMiles.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('totalTime').textContent = `${formattedTime.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${timeUnit}`;
        document.getElementById('totalFuel').textContent = data.totalFuel.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('totalCost').textContent = `${currency}${data.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById('avgMilesPerTank').textContent = data.avgMilesPerTank.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('avgMpg').textContent = data.avgMpg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('avgSpeed').textContent = data.avgSpeed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('avgCostPerDay').textContent = `${currency}${data.avgCostPerDay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById('avgCostPerMile').textContent = `${currency}${data.avgCostPerMile.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById('avgFuelPrice').textContent = `${currency}${data.avgFuelPrice.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`;
        document.getElementById('avgTemp').textContent = data.avgTemp.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        document.getElementById('avgTimeDriven').textContent = data.avgTimeDriven.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('avgLpkm').textContent = lpkm.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('avgKwh').textContent = kWh.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('avgKwhTotal').textContent = kWhTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        sumStats.style.display = 'block';
    } catch (err) {
        await SessionMaintenance.logBook("fullStats", "getStats", `Error fetching stats: ${err}`, true);
        alert("Failed to load stats");
    } finally {
        SessionMaintenance.hideLoader();
    }
}

// Get Graph --------------------------------------------------------------------------------
async function getGraph(username, start, end, xAxis, yAxis) {
    try {
        SessionMaintenance.showLoader();

        // Fetch data
        const res = await fetch(
            `${API_BASE_URL}/api/graph/${username}?start=${start}&end=${end}&xAxis=${xAxis}&yAxis=${yAxis}`
        );

        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const { data } = await res.json();

        await SessionMaintenance.logBook(
            "fullStats",
            "getGraph",
            `Graph data retrieved (${start}, ${end}, ${xAxis}, ${yAxis})`
        );

        const graphStats = document.getElementById("graph-stats");
        graphStats.style.display = "block";

        const ctx = document.getElementById("statsGraph").getContext("2d");

        // If a chart already exists, destroy it to avoid overlap
        if (window.currentGraph) {
            window.currentGraph.destroy();
        }

        // Sort data just in case backend doesn’t
        const sorted = data.sort((a, b) => (a.x > b.x ? 1 : -1));

        // Create new chart
        window.currentGraph = new Chart(ctx, {
            type: "line",
            data: {
                datasets: [
                    {
                        label: `${yAxis} vs ${xAxis}`,
                        data: sorted.map(d => ({ x: d.x, y: d.y })),
                        borderColor: "#0d84e8",
                        backgroundColor: "#0d84e820",
                        tension: 0.3,
                        borderWidth: 2,
                        pointRadius: 0,
                    },
                ],
            },
            options: {
                responsive: true,
                layout: { padding: 8 },
                scales: {
                    x: {
                        type: typeof sorted[0]?.x === "string" ? "category" : "linear",
                        title: { text: xAxis, display: true },
                        ticks: { color: "#333", font: { family: "inherit" } },
                        grid: { color: "rgba(0,0,0,0.05)" },
                    },
                    y: {
                        title: { text: yAxis, display: true },
                        ticks: { color: "#333", font: { family: "inherit" } },
                        grid: { color: "rgba(0,0,0,0.05)" },
                        beginAtZero: true,
                    },
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: "#222",
                            font: { family: "inherit", size: 12 },
                            boxWidth: 14,
                        },
                    },
                    tooltip: {
                        backgroundColor: "#fff",
                        titleColor: "#000",
                        bodyColor: "#000",
                        borderColor: "#ccc",
                        borderWidth: 1,
                    },
                },
            },
        });
    } catch (err) {
        await SessionMaintenance.logBook("fullStats", "getGraph", `Error fetching graph: ${err}`, true);
        alert("Failed to load graph data.");
        console.error(err);
    } finally {
        SessionMaintenance.hideLoader();
    }
}

// ==========================================================================================================
// -- Event Listeners --
// ==========================================================================================================

// window loaded event listener ------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
    await SessionMaintenance.logBook("fullStats", "window.DOMContentLoaded", "Full Stats page loaded");

    const currentPage = window.location.pathname.split("/").pop();
    SessionMaintenance.highlightActivePage(currentPage);

    SessionMaintenance.hideLoader();
});

// Get Stats Button Click --------------------------------------------------------------------------
getStatsBtn.addEventListener('click', async () => {
    await SessionMaintenance.logBook("fullStats", "getStatsBtn.click", `Get Stats button clicked ${displayType.value}`);

    // Declare Variables
    const username = localStorage.getItem('username').toLowerCase();
    const start = document.getElementById('start').value;
    const end = document.getElementById('end').value;

    if (displayType.value === 'figures') {
        await getStats(username, start, end);
    }
    else if (displayType.value === 'graph') {
        const xAxis = document.getElementById('x-axis').value;
        const yAxis = document.getElementById('y-axis').value;
        await getGraph(username, start, end, xAxis, yAxis);
    }

});

// Display type changed --------------------------------------------------------------------------
displayType.addEventListener('change', () => {
    if (displayType.value === 'figures') {
        axisFields.style.display = 'none';
    }
    else if (displayType.value === 'graph') {
        axisFields.style.display = 'block';
    }
})