// ==========================================================================================================
// -- Boilerplate --
// ==========================================================================================================

import SessionMaintenance from "./sessionMaintenance.js";
import {API_BASE_URL} from "./config.js";

const SM = SessionMaintenance;

const currency = localStorage.getItem('currency');
const fuelType = localStorage.getItem("fuelType") || 'Petrol';

// DOM Elements --------------------------------------------------------------------------------------
const containers = {
    axisFields: SM.$("axisFields"),
    sumStats: SM.$("sum-stats"),
    graphStats: SM.$("graph-stats"),
}

const elements = {
    totalMiles: SM.$("totalMiles"),
    totalTime: SM.$("totalTime"),
    totalFuel: SM.$("totalFuel"),
    totalCost: SM.$("totalCost"),
    avgMilesPerTank: SM.$("avgMilesPerTank"),
    avgMpg: SM.$("avgMpg"),
    avgSpeed: SM.$("avgSpeed"),
    avgCostPerDay: SM.$("avgCostPerDay"),
    avgCostPerMile: SM.$("avgCostPerMile"),
    avgFuelPrice: SM.$("avgFuelPrice"),
    avgTemp: SM.$("avgTemp"),
    avgTimeDriven: SM.$("avgTimeDriven"),
    avgKwhTotal: SM.$("avgKwhTotal"),
    avgLpkm: SM.$("avgLpkm"),
    avgKwh: SM.$("avgKwh"),
    carbonFootprint: SM.$("carbonFootprint"),
    graphTitle: SM.$('graph-title'),
    ctx: SM.$('statsGraph'),
}

const inputs = {
    displayType: SM.$('display-type'),
    startInput: SM.$('start'),
    endInput: SM.$('end'),
    xAxis: SM.$('x-axis'),
    yAxis: SM.$('y-axis'),
}

const buttons = {
    btnGetStats: SM.$('getStats')
}

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
        const carbonFoorprint = data.totalFuel * (fuelType === 'petrol' ? 2.31 : 2.68);

        await SessionMaintenance.logBook("fullStats", "getStats", `Full Stats retrieved: ${JSON.stringify(data, null, 2)}`);

        // Populate UI with Data
        elements.totalMiles.textContent = data.totalMiles.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        elements.totalTime.textContent = `${formattedTime.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })} ${timeUnit}`;
        elements.totalFuel.textContent = data.totalFuel.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        elements.totalCost.textContent = `${currency}${data.totalCost.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
        elements.avgMilesPerTank.textContent = data.avgMilesPerTank.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        elements.avgMpg.textContent = data.avgMpg.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        elements.avgSpeed.textContent = data.avgSpeed.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        elements.avgCostPerDay.textContent = `${currency}${data.avgCostPerDay.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
        elements.avgCostPerMile.textContent = `${currency}${data.avgCostPerMile.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
        elements.avgFuelPrice.textContent = `${currency}${data.avgFuelPrice.toLocaleString(undefined, {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3
        })}`;
        elements.avgTemp.textContent = data.avgTemp.toLocaleString(undefined, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        });
        elements.avgTimeDriven.textContent = data.avgTimeDriven.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        elements.avgLpkm.textContent = lpkm.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        elements.avgKwh.textContent = kWh.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        elements.avgKwhTotal.textContent = kWhTotal.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        // Total CO2
        elements.carbonFootprint.textContent = `${carbonFoorprint.toLocaleString(undefined, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        })} KG of CO²`;

        containers.sumStats.style.display = 'block';
    } catch (err) {
        await SessionMaintenance.logBook("fullStats", "getStats", `Error fetching stats: ${err}`, true);
        await SessionMaintenance.cmbError(`Failed to load stats: ${err}`);
    } finally {
        SessionMaintenance.hideLoader();
    }
}

// Calculate Trend Line --------------------------------------------------------------------------------
function calculateAveragedTrendline(data) {
    const grouped = {};

    // Group values by X
    data.forEach(({x, y}) => {
        if (!grouped[x]) grouped[x] = [];
        grouped[x].push(y);
    });

    // Create average Y for each X
    const averaged = Object.keys(grouped).map(xVal => {
        const arr = grouped[xVal];
        const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
        return {x: Number(xVal), y: avg};
    });

    // Sort by X in case
    return averaged.sort((a, b) => a.x - b.x);
}

// Get Graph --------------------------------------------------------------------------------
async function getGraph(username, start, end, xAxis, yAxis) {
    try {
        SessionMaintenance.showLoader();

        await SessionMaintenance.logBook("fullStats", "getGraph", `Getting graph: (${start}, ${end}, ${xAxis}, ${yAxis})`);

        // Fetch data
        const res = await fetch(
            `${API_BASE_URL}/api/graph/${username}?start=${start}&end=${end}&xAxis=${xAxis}&yAxis=${yAxis}`
        );

        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const {data} = await res.json();

        await SessionMaintenance.logBook(
            "fullStats",
            "getGraph",
            `Graph data retrieved: ${JSON.stringify(data, null, 2)})`
        );

        containers.graphStats.style.display = "block";

        const ctx = elements.ctx.getContext("2d");

        // If a chart already exists, destroy it to avoid overlap
        if (window.currentGraph) {
            window.currentGraph.destroy();
        }

        // Sort data just in case backend doesn’t
        const sorted = data.sort((a, b) => (a.x > b.x ? 1 : -1));

        // Map front-end fields to db fields
        const fieldMap = {
            date: "Date",
            distance: "Distance",
            timeDriven: "Duration",
            avgSpeed: "Average Speed",
            mpg: "MPG",
            cost: "Cost",
            temp: "Temperature",
            costPerMile: "Cost Per Mile",
            fuelUsedL: "Fuel Used (L)",
        };

        if (xAxis !== "date") {
            // Create Scatter Graph
            const trendlineData = calculateAveragedTrendline(sorted);


            elements.graphTitle.textContent = `${fieldMap[yAxis]} vs ${fieldMap[xAxis]}`;

            window.currentGraph = new Chart(ctx, {
                type: "scatter",
                data: {
                    datasets: [
                        {
                            label: "",
                            type: "line",
                            data: trendlineData,
                            borderColor: "rgb(0,78,212)",
                            backgroundColor: "rgb(0,78,212)",
                            borderWidth: 2,
                            pointRadius: 0,
                            tension: 0.3,
                        },
                        {
                            label: "",
                            data: sorted.map(d => ({x: d.x, y: d.y})),
                            borderColor: '#d95000',
                            backgroundColor: '#d95000',
                            opacity: 0.5,
                            pointRadius: 0.5,
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            type: isNaN(sorted[0].x) ? "category" : "linear",
                            ticks: {color: "#000000", font: {family: "inherit"}},
                            title: {text: fieldMap[xAxis], display: true},
                        },
                        y: {
                            title: {text: fieldMap[yAxis], display: true},
                            ticks: {color: "#000000", font: {family: "inherit"}},
                            beginAtZero: true,
                        }
                    }
                }
            });

        } else {
            // Build cumulative graph points
            const cumulativePoints = [];
            let cumulative = 0;

            for (let j of sorted) {
                cumulative += j.y; // <-- add the Y value for cumulative
                cumulativePoints.push({x: j.x, y: cumulative});
            }

            window.currentGraph = new Chart(ctx, {
                type: "line",
                data: {
                    datasets: [
                        {
                            label: `${fieldMap[yAxis]} cumulative`,
                            data: cumulativePoints,
                            borderColor: 'rgba(0,255,234,0.75)',
                            tension: 0.3,
                            borderWidth: 2,
                            pointRadius: 0,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    layout: {padding: 8},
                    scales: {
                        x: {
                            type: "category",  // because x is a date string
                            title: {text: fieldMap[xAxis], display: true},
                            ticks: {color: "#000000", font: {family: "inherit"}, display: false},
                            grid: {color: "rgba(0,0,0,0.05)"},
                        },
                        y: {
                            title: {text: fieldMap[yAxis], display: true},
                            ticks: {color: "#000000", font: {family: "inherit"}},
                            grid: {color: "rgba(0,0,0,0.05)"},
                            beginAtZero: true,
                        },
                    },
                },
            });
        }

    } catch (err) {
        await SessionMaintenance.logBook("fullStats", "getGraph", `Error fetching graph: ${err}`, true);
        await SessionMaintenance.cmbError(`Failed to load graph data: ${err}`);
        console.error(err);
    } finally {
        SessionMaintenance.hideLoader();
    }
}

// Export the data ------------------------------------------------------------------------
async function exportData(username, start, end) {
    SessionMaintenance.showLoader();
    await SessionMaintenance.logBook("fullStats", "exportData", `Exporting full stats: (${start}, ${end})`);

    try {
        // Fetch the data
        const res = await fetch(`${API_BASE_URL}/api/export/${username}?start=${start}&end=${end}`);
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();

        if (!data || !Array.isArray(data) || data.length === 0) {
            await SessionMaintenance.cmbError(`No data found.`);
            return;
        }

        // Convert JSON to CSV
        const headers = Object.keys(data[0]);
        const csvRows = [];

        // Header Row
        csvRows.push(headers.join(","));

        // Data Rows
        for (const row of data) {
            const values = headers.map(h => {
                let val = row[h] ?? "";
                if (typeof val === "object") {
                    val = `"${val.replace(/"/g, '""')}`; // Escape quotes
                }
                return val;
            });
            csvRows.push(values.join(","));
        }

        const csvText = csvRows.join("\n");

        // Create Blob and trigger download
        const blob = new Blob([csvText], {type: "text/csv;charset=utf-8;"});
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        const timestamp = new Date().toISOString().split("T")[0];
        a.href = url;
        a.download = `journey_stats_${username}_${timestamp}.csv`;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        await SessionMaintenance.logBook("fullStats", "exportData", `Exported ${data.length} rows to CSV`);
        await SessionMaintenance.cmbInfo(`Success`, `Exported ${data.length} rows to CSV`);

    } catch (err) {
        console.error("Error exporting data:", err);
        await SessionMaintenance.logBook("fullStats", "exportData", `Export failed: ${err}`, true);
        await SessionMaintenance.cmbError(`Failed to export data: ${err}`);
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
buttons.btnGetStats.addEventListener('click', async () => {
    await SessionMaintenance.logBook("fullStats", "getStatsBtn.click", `Get Stats button clicked (${inputs.displayType.value})`);

    // Declare Variables
    const username = localStorage.getItem('username').toLowerCase();
    const start = inputs.startInput.value;
    const end = inputs.endInput.value;

    containers.graphStats.style.display = "none";
    containers.sumStats.style.display = 'none';

    if (inputs.displayType.value === 'figures') {
        // Figures
        if (!start || !end) {
            await SessionMaintenance.cmbError(`Please select a start & end date.`);
            return;
        }
        await getStats(username, start, end);

    } else if (inputs.displayType.value === 'graph') {
        // Graph
        const xAxis = inputs.xAxis.value;
        const yAxis = inputs.yAxis.value;

        if (!start || !end) {
            await SessionMaintenance.cmbError(`Please select a start & end date.`);
            return;
        } else if (!xAxis || !yAxis) {
            await SessionMaintenance.cmbError(`Please select a X & Y axis values`);
            return;
        }

        await getGraph(username, start, end, xAxis, yAxis);

    } else if (inputs.displayType.value === 'export') {
        // Export
        await exportData(username, start, end);
    }
});

// Display type changed --------------------------------------------------------------------------
inputs.displayType.addEventListener('change', () => {
    if (inputs.displayType.value === 'figures') {
        containers.axisFields.style.display = 'none';
    } else if (inputs.displayType.value === 'graph') {
        containers.axisFields.style.display = 'block';
    }
})