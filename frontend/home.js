// ==========================================================================================================
// -- Boilerplate --
// ==========================================================================================================

import SessionMaintenance from "./sessionMaintenance.js";

import {API_BASE_URL} from "./config.js";

const currency = localStorage.getItem('currency');

// ==========================================================================================================
// -- Operational Functions --
// ==========================================================================================================

// Load summary --------------------------------------------------------------------------------------
async function loadSummary(username) {
    try {
        SessionMaintenance.showLoader();
        const res = await fetch(`${API_BASE_URL}/api/summary/${username}`);
        const summary = await res.json();
        const formattedTime = summary.totalTime > 60 ? summary.totalTime / 60 : summary.totalTime;
        const timeUnit = summary.totalTime > 60 ? "Hours" : "Minutes";
        const lpkm = SessionMaintenance.calculateConsumption(summary.avgMpg);
        const kWh = SessionMaintenance.calculateConsumption(summary.avgMpg, 'kwhper100');
        const kWhTotal = SessionMaintenance.calculateConsumption(summary.avgMpg, 'kwhper100', 'Total');

        // Total Miles
        document.getElementById('totalMiles').textContent = summary.totalMiles.toLocaleString(undefined, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        });
        // Total Time
        document.getElementById('totalTime').textContent = `${formattedTime.toLocaleString(undefined, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        })} ${timeUnit}`;
        // Total Fuel
        document.getElementById('totalFuel').textContent = summary.totalFuel.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + " L";
        // Total Cost
        document.getElementById('totalCost').textContent = currency + summary.totalCost.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        // Average MPG
        document.getElementById('avgMpg').textContent = summary.avgMpg.toLocaleString(undefined, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        });

        // Average L/100km
        document.getElementById('avgLpkm').textContent = lpkm.toLocaleString(undefined, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        });

        // Average kWh/100km Useful
        document.getElementById('avgKwh').textContent = kWh.toLocaleString(undefined, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        });

        // Average kWh/100km Total
        document.getElementById('avgKwhTotal').textContent = kWhTotal.toLocaleString(undefined, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        });

        await SessionMaintenance.logBook("home", "loadSummary", `Summary Loaded: ${summary}`);
    } catch (err) {
        console.error("error loading summary:", err);
    } finally {
        SessionMaintenance.hideLoader();
    }
}

// Load Insights -----------------------------------------------------------------------------------------------
async function loadInsights(username) {
    try {
        SessionMaintenance.showLoader();

        // get summary for totals
        const res = await fetch(`${API_BASE_URL}/api/summary/${username}`);
        if (!res.ok) throw new Error("Failed to fetch summary");
        const summary = await res.json();

        const tankVolume = localStorage.getItem('tankVolume') || 63;

        // Times around the world
        document.getElementById('aroundWorld').textContent = (summary.totalMiles / 29901).toLocaleString(undefined, {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3
        });

        // Years Driving
        document.getElementById('yearsDriven').textContent = (summary.totalTime / 525600).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        // Longest Distance
        document.getElementById('longestDistance').textContent = `${summary.longestDistance.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })} Miles`;

        // Longest Time
        document.getElementById('longestTime').textContent = `${summary.longestTime.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        })} Minutes`;

        // Best Journey
        document.getElementById('bestJourney').textContent = `${summary.bestMpg.toLocaleString(undefined, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        })} MPG`;


        // Tanks Used
        document.getElementById('tanksUsed').textContent = (summary.totalFuel / tankVolume).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        // Progress to the moon
        document.getElementById('moonProgress').textContent = `${((summary.totalMiles / 238855) * 100).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}%`;

        // Olympic Pools Used
        document.getElementById('olympicPools').textContent = `${((summary.totalFuel / 2500000) * 100).toLocaleString(undefined, {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3
        })}%`;

        // Times Bohemian Rhapsody could have played whilst driving
        document.getElementById('bohemPlayed').textContent = (summary.totalTime / 5.916).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });

        await SessionMaintenance.logBook("home", "loadInsights", `Summary Loaded: ${summary}`);
    } catch (err) {
        console.error("error loading insights:", err);
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

        document.getElementById("seven").textContent = currency + data.cost.seven.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        document.getElementById("fourteen").textContent = currency + data.cost.fourteen.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        document.getElementById("twentyEight").textContent = currency + data.cost.twentyEight.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        document.getElementById("ninty").textContent = currency + data.cost.ninty.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        document.getElementById("sixMonth").textContent = currency + data.cost.sixMonth.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        document.getElementById("threeSixFive").textContent = currency + data.cost.threeSixFive.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        await SessionMaintenance.logBook("home", "loadCosts", `Costs Loaded: ${data}`);
    } catch (err) {
        console.error("Error loading Costs:", err);
    } finally {
        SessionMaintenance.hideLoader();
    }
}

// Load 28 day summary --------------------------------------------------------------------------------------------------
async function load28DaySum(username) {
    const start = new Date();
    const end = new Date();
    start.setDate(start.getDate() - 28);
    end.setDate(end.getDate());

    try {
        SessionMaintenance.showLoader();
        // Get Data Endpoint
        await SessionMaintenance.logBook("home", "load28DaySum", `Getting 28 Day sum: (${start}, ${end})`);
        const res = await fetch(`${API_BASE_URL}/api/stats/${username}?start=${start}&end=${end}`);
        const data = await res.json();
        const formattedTime = data.totalTime > 60 ? data.totalTime / 60 : data.totalTime;
        const timeUnit = data.totalTime > 60 ? "Hours" : "Minutes";

        await SessionMaintenance.logBook("home", "load28DaySum", `28 Day Sum retrieved: ${JSON.stringify(data, null, 2)}`);

        // Populate UI with Data
        document.getElementById('28Miles').textContent = data.totalMiles.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        document.getElementById('28Time').textContent = `${formattedTime.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })} ${timeUnit}`;
        document.getElementById('28Fuel').textContent = data.totalFuel.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        document.getElementById('28Cost').textContent = `${currency}${data.totalCost.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
        document.getElementById('28Mpg').textContent = data.avgMpg.toLocaleString(undefined, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        });

    } catch (err) {
        await SessionMaintenance.logBook("home", "load28DaySum", `Error fetching stats: ${err}`, true);
        alert("Failed to load stats");
    } finally {
        SessionMaintenance.hideLoader();
    }
}

// Load Budget ------------------------------------------------------------------------------------
async function loadBudget(username) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/budget/${username}`);
        const data = await res.json();

        await SessionMaintenance.logBook("home", "loadBudget", `Budget retrieved: ${JSON.stringify(data, null, 2)}`);

        if (!data.enabled) {
            document.getElementById('budgetCard').style.display = 'none';
            return;
        }

        const card = document.getElementById('budgetCard');
        card.style.display = 'block';

        const summary = document.getElementById('budgetSummary');
        const currency = localStorage.getItem('currency') || "£";

        const diffText =
            data.overUnder >= 0
                ? `${currency}${data.overUnder.toFixed(2)} under budget`
                : `${currency}${Math.abs(data.overUnder).toFixed(2)} over budget`;

        let newPeriod

        switch(data.period.toLowerCase()){
            case 'monthly': newPeriod = 'month'; break;
            case 'yearly': newPeriod = 'year'; break;
            case 'weekly': newPeriod = 'week'; break;
            case 'daily': newPeriod = 'day'; break;
        }

        summary.textContent = `This ${newPeriod}: ${currency}${data.cost.toFixed(2)} of ${currency}${data.budget.toFixed(2)} → ${diffText}.`;

        // Render chart (simple line for now)
        const ctx = document.getElementById('budgetChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Start', 'Now'],
                datasets: [
                    {
                        label: 'Budget',
                        data: [data.budget, data.budget],
                        borderColor: '#999',
                        borderDash: [5, 5],
                        borderWidth: 1.5,
                        fill: false
                    },
                    {
                        label: 'Cost',
                        data: [0, data.cost],
                        borderColor: data.overUnder >= 0 ? '#4caf50' : '#f44336',
                        borderWidth: 2,
                        pointBackgroundColor: '#fff',
                        pointRadius: 4,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                layout: {
                    padding: 8
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: '#222',
                            font: {
                                family: 'inherit',
                                size: 12
                            },
                            boxWidth: 14,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: '#fff',
                        titleColor: '#000',
                        bodyColor: '#000',
                        borderColor: '#ccc',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#333',
                            font: { family: 'inherit' }
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#333',
                            font: { family: 'inherit' }
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        }
                    }
                }
            }
        });

    } catch
        (err)
        {
            await SessionMaintenance.logBook("home", "loadBudget", `Error fetching budget: ${err}`, true);
            console.error("Error loading budget data:", err);
        }
}

// ==========================================================================================================
// -- Event Listeners --
// ==========================================================================================================

// window loaded event listener ------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
    await SessionMaintenance.logBook("home", "window.DOMContentLoaded", "Home page loaded");

    const currentPage = window.location.pathname.split("/").pop();
    SessionMaintenance.highlightActivePage(currentPage);

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
    await load28DaySum(username);
    await loadInsights(username);
    await loadBudget(username);

});