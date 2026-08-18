// ==========================================================================================================
// -- Boilerplate --
// ==========================================================================================================

import SessionMaintenance from "./sessionMaintenance.js";
import {API_BASE_URL} from "./config.js";

const currency = localStorage.getItem('currency');
const SM = SessionMaintenance;

// DOM Elements --------------------------------------------------------------------------------------
const containers = {
    summaryStats: SM.$("sum-stats"),
    budgetContainer: SM.$("budgetCard")
}

const buttons = {
    btnLogOut: SM.$("btnLogOut"),
}

const elements = {
    budgetSummary: SM.$("budgetSummary"),
    budgetProgress: SM.$("budgetProgress"),
    periodProgress: SM.$("periodProgress"),
    totalMiles: SM.$("totalMiles"),
    totalTime: SM.$("totalTime"),
    totalFuel: SM.$("totalFuel"),
    totalCost: SM.$("totalCost"),
    carbonFootprint: SM.$("carbonFootprint"),
    avgMpg: SM.$("avgMpg"),
    avgLpkm: SM.$("avgLpkm"),
    avgKwh: SM.$("avgKwh"),
    avgKwhTotal: SM.$("avgKwhTotal"),
    avgCarbonFp: SM.$("avgCarbonFp"),
    TwntEtMiles: SM.$("28Miles"),
    TwntEtTime: SM.$("28Time"),
    TwntEtFuel: SM.$("28Fuel"),
    TwntEtCost: SM.$("28Cost"),
    TwntEtMpg: SM.$("28Mpg"),
    TwntEtCarbonFp: SM.$("28CarbonFp"),
    seven: SM.$("seven"),
    fourteen: SM.$("fourteen"),
    twentyEight: SM.$("twentyEight"),
    ninty: SM.$("ninty"),
    sixMonth: SM.$("sixMonth"),
    threeSixFive: SM.$("threeSixFive"),
    aroundWorld: SM.$("aroundWorld"),
    longestDistance: SM.$("longestDistance"),
    moonProgress: SM.$("moonProgress"),
    yearsDriven: SM.$("yearsDriven"),
    longestTime: SM.$("longestTime"),
    bohemPlayed: SM.$("bohemPlayed"),
    bestJourney: SM.$("bestJourney"),
    tanksUsed: SM.$("tanksUsed"),
    olympicPools: SM.$("olympicPools"),
    yearsOffset: SM.$("yearsOffset"),
}

// ==========================================================================================================
// -- Operational Functions --
// ==========================================================================================================

// Load summary --------------------------------------------------------------------------------------
async function loadSummary(username) {
    try {
        SM.showLoader();

        // Get all vehicle stats
        const res = await fetch(
            `${API_BASE_URL}/api/fullStats/${username}`
        );
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const summary = await res.json();
        window.summaryData = summary;
        await SM.logBook(
            "home",
            "loadSummary",
            `Summary Loaded: ${JSON.stringify(summary)}`
        );

        // --------------------------------------------------------------------------
        // Derived Values
        // --------------------------------------------------------------------------

        const formattedTime =
            summary.totalTime > 60
                ? summary.totalTime / 60
                : summary.totalTime;
        const timeUnit =
            summary.totalTime > 60
                ? "Hours"
                : "Minutes";
        const lpkm =
            SM.calculateConsumption(summary.avgMpg);
        const kWh =
            SM.calculateConsumption(
                summary.avgMpg,
                'kwhper100'
            );
        const kWhTotal =
            SM.calculateConsumption(
                summary.avgMpg,
                'kwhper100',
                'Total'
            );

        // --------------------------------------------------------------------------
        // CO2 Calculation
        //
        // Calculate separately for each fuel type because the user may now
        // have both petrol and diesel vehicles.
        // --------------------------------------------------------------------------

        let carbonFoorprint = 0;
        if (summary.fuelBreakdown) {
            Object.entries(summary.fuelBreakdown).forEach(
                ([fuelType, fuelData]) => {

                    const fuel = fuelType.toLowerCase();

                    if (fuel === "petrol") {
                        carbonFoorprint +=
                            fuelData.totalFuel * 2.31;
                    } else if (fuel === "diesel") {
                        carbonFoorprint +=
                            fuelData.totalFuel * 2.68;
                    }
                }
            );
        }
        const avgCarbonFp =
            summary.journeyCount > 0
                ? carbonFoorprint / summary.journeyCount
                : 0;

        // --------------------------------------------------------------------------
        // Total Miles
        // --------------------------------------------------------------------------

        elements.totalMiles.textContent =
            summary.totalMiles.toLocaleString(undefined, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
            });

        // --------------------------------------------------------------------------
        // Total Time
        // --------------------------------------------------------------------------

        elements.totalTime.textContent =
            `${formattedTime.toLocaleString(undefined, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
            })} ${timeUnit}`;

        // --------------------------------------------------------------------------
        // Total Fuel
        // --------------------------------------------------------------------------

        elements.totalFuel.textContent =
            summary.totalFuel.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }) + " L";

        // --------------------------------------------------------------------------
        // Total Cost
        // --------------------------------------------------------------------------

        elements.totalCost.textContent =
            currency +
            summary.totalCost.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });

        // --------------------------------------------------------------------------
        // Average MPG
        // --------------------------------------------------------------------------

        elements.avgMpg.textContent =
            summary.avgMpg.toLocaleString(undefined, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
            });

        // --------------------------------------------------------------------------
        // Average L/100km
        // --------------------------------------------------------------------------

        elements.avgLpkm.textContent =
            lpkm.toLocaleString(undefined, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
            });

        // --------------------------------------------------------------------------
        // Average kWh/100km Useful
        // --------------------------------------------------------------------------

        elements.avgKwh.textContent =
            kWh.toLocaleString(undefined, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
            });

        // --------------------------------------------------------------------------
        // Average kWh/100km Total
        // --------------------------------------------------------------------------

        elements.avgKwhTotal.textContent =
            kWhTotal.toLocaleString(undefined, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
            });

        // --------------------------------------------------------------------------
        // Total CO2
        // --------------------------------------------------------------------------

        elements.carbonFootprint.textContent =
            `${carbonFoorprint.toLocaleString(undefined, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
            })} KG of CO²`;

        // --------------------------------------------------------------------------
        // Average CO2
        // --------------------------------------------------------------------------

        elements.avgCarbonFp.textContent =
            `${avgCarbonFp.toLocaleString(undefined, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
            })} KG of CO²`;

    } catch (err) {
        await SM.cmbError(
            `Error loading summary: ${err}`
        );
        await SM.logBook(
            "home",
            "loadSummary",
            `Error Loading Summary ${err}`,
            true
        );
    } finally {
        SM.hideLoader();
    }
}

// Load Insights -----------------------------------------------------------------------------------------------
async function loadInsights() {
    try {
        SM.showLoader();

        // Get all vehicle data
        const summary = window.summaryData;
        if (!summary) {
            throw new Error("Summary data has not been loaded");
        }

        await SM.logBook(
            "home",
            "loadInsights",
            `Insights Summary Loaded: ${JSON.stringify(summary, null, 2)}`
        );

        // --------------------------------------------------------------------------
        // CO2 Calculation
        //
        // Calculate separately for each fuel type.
        // --------------------------------------------------------------------------

        let carbonFoorprint = 0;
        if (summary.fuelBreakdown) {
            Object.entries(summary.fuelBreakdown).forEach(
                ([fuelType, fuelData]) => {
                    const fuel = fuelType.toLowerCase();
                    if (fuel === "petrol") {
                        carbonFoorprint +=
                            fuelData.totalFuel * 2.31;
                    } else if (fuel === "diesel") {
                        carbonFoorprint +=
                            fuelData.totalFuel * 2.68;
                    }
                }
            );
        }

        const offset =
            carbonFoorprint / 21;

        // --------------------------------------------------------------------------
        // Times Around the World
        // --------------------------------------------------------------------------

        elements.aroundWorld.textContent =
            (summary.totalMiles / 29901).toLocaleString(
                undefined,
                {
                    minimumFractionDigits: 3,
                    maximumFractionDigits: 3
                }
            );

        // --------------------------------------------------------------------------
        // Years Driving
        // --------------------------------------------------------------------------

        elements.yearsDriven.textContent =
            (summary.totalTime / 525600).toLocaleString(
                undefined,
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            );

        // --------------------------------------------------------------------------
        // Longest Distance
        // --------------------------------------------------------------------------

        elements.longestDistance.textContent =
            `${summary.longestDistance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })} Miles`;

        // --------------------------------------------------------------------------
        // Longest Time
        // --------------------------------------------------------------------------

        elements.longestTime.textContent =
            `${summary.longestTime.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            })} Minutes`;

        // --------------------------------------------------------------------------
        // Best Journey
        // --------------------------------------------------------------------------

        elements.bestJourney.textContent =
            `${summary.bestMpg.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})} MPG`;

        // --------------------------------------------------------------------------
        // Tanks Used
        //
        // Calculate separately for each vehicle because vehicles can
        // have different tank sizes.
        // --------------------------------------------------------------------------

        let tanksUsed = 0;
        if (summary.vehicles) {
            summary.vehicles.forEach(vehicle => {
                const tankVolume =
                    Number(vehicle.tankVolume) || 0;
                const totalFuel =
                    Number(vehicle.totalFuel) || 0;
                if (tankVolume > 0) {
                    tanksUsed +=
                        totalFuel / tankVolume;
                }
            });
        }

        elements.tanksUsed.textContent =
            tanksUsed.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });

        // --------------------------------------------------------------------------
        // Progress to the Moon
        // --------------------------------------------------------------------------

        elements.moonProgress.textContent =
            `${(
                (summary.totalMiles / 238855) * 100
            ).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}%`;

        // --------------------------------------------------------------------------
        // Olympic Pools Used
        // --------------------------------------------------------------------------

        elements.olympicPools.textContent =
            `${(
                (summary.totalFuel / 2500000) * 100
            ).toLocaleString(undefined, {
                minimumFractionDigits: 3,
                maximumFractionDigits: 3
            })}%`;

        // --------------------------------------------------------------------------
        // Times Bohemian Rhapsody Could Have Played
        // --------------------------------------------------------------------------

        elements.bohemPlayed.textContent =
            (
                summary.totalTime / 5.916
            ).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });

        // --------------------------------------------------------------------------
        // Years to Offset CO2
        // --------------------------------------------------------------------------

        elements.yearsOffset.textContent =
            offset.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });

    } catch (err) {
        await SM.cmbError(
            `Error loading insights: ${err}`
        );
        await SM.logBook(
            "home",
            "loadInsights",
            `Error loading insights: ${err}`,
            true
        );
    } finally {
        SM.hideLoader();
    }
}

// Load Costs -------------------------------------------------------------------------------------
async function loadCosts(username) {
    try {
        SM.showLoader();
        const res = await fetch(`${API_BASE_URL}/api/costs/${username}`);
        if (!res.ok) throw new Error("Failed to fetch costs");

        const data = await res.json();

        elements.seven.textContent = currency + data.cost.seven.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        elements.fourteen.textContent = currency + data.cost.fourteen.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        elements.twentyEight.textContent = currency + data.cost.twentyEight.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        elements.ninty.textContent = currency + data.cost.ninty.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        elements.sixMonth.textContent = currency + data.cost.sixMonth.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        elements.threeSixFive.textContent = currency + data.cost.threeSixFive.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        await SM.logBook("home", "loadCosts", `Costs Loaded: ${data}`);
    } catch (err) {
        await SM.cmbError(`Error loading Costs:${err}`);
        await SM.logBook("home", "loadCosts", `Error loading Costs: ${err}`, true);
    } finally {
        SM.hideLoader();
    }
}

// Load 28 day summary --------------------------------------------------------------------------------------------------
async function load28DaySum(username) {

    const start = new Date();
    const end = new Date();

    start.setDate(start.getDate() - 28);
    end.setDate(end.getDate());

    try {
        SM.showLoader();

        // Get Data Endpoint
        await SM.logBook(
            "home",
            "load28DaySum",
            `Getting 28 Day sum: (${start}, ${end})`
        );
        const res = await fetch(
            `${API_BASE_URL}/api/fullStats/${username}?start=${start.toISOString()}&end=${end.toISOString()}`
        );
        if (!res.ok) {
            throw new Error(
                `HTTP ${res.status}: ${res.statusText}`
            );
        }
        const data = await res.json();
        await SM.logBook(
            "home",
            "load28DaySum",
            `28 Day Sum retrieved: ${JSON.stringify(data, null, 2)}`
        );

        // --------------------------------------------------------------------------
        // Derived Values
        // --------------------------------------------------------------------------

        const formattedTime =
            data.totalTime > 60
                ? data.totalTime / 60
                : data.totalTime;
        const timeUnit =
            data.totalTime > 60
                ? "Hours"
                : "Minutes";

        // --------------------------------------------------------------------------
        // CO2 Calculation
        //
        // Calculate separately for each fuel type.
        // --------------------------------------------------------------------------

        let carbonFoorprint = 0;
        if (data.fuelBreakdown) {
            Object.entries(data.fuelBreakdown).forEach(
                ([fuelType, fuelData]) => {
                    const fuel = fuelType.toLowerCase();
                    if (fuel === "petrol") {
                        carbonFoorprint +=
                            fuelData.totalFuel * 2.31;
                    } else if (fuel === "diesel") {
                        carbonFoorprint +=
                            fuelData.totalFuel * 2.68;
                    }
                }
            );
        }

        // --------------------------------------------------------------------------
        // Populate UI with Data
        // --------------------------------------------------------------------------

        elements.TwntEtMiles.textContent =
            data.totalMiles.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });

        elements.TwntEtTime.textContent =
            `${formattedTime.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })} ${timeUnit}`;

        elements.TwntEtFuel.textContent =
            data.totalFuel.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });

        elements.TwntEtCost.textContent =
            `${currency}${data.totalCost.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;

        elements.TwntEtMpg.textContent =
            data.avgMpg.toLocaleString(undefined, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
            });

        elements.TwntEtCarbonFp.textContent =
            `${carbonFoorprint.toLocaleString(undefined, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
            })} KG of CO²`;

    } catch (err) {
        await SM.logBook(
            "home",
            "load28DaySum",
            `Error fetching stats: ${err}`,
            true
        );
        await SM.cmbError(
            "Failed to load stats"
        );
    } finally {
        SM.hideLoader();
    }
}

// Get Period Percentage ---------------------------------------------------------------------------
function getPeriodPercentage(period, resetDay) {
    const now = new Date();
    let periodStart, periodEnd;

    switch (period.toLowerCase()) {

        case "daily":
            periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            break;

        case "weekly":
            const today = now.getDay();
            let r = parseInt(resetDay);

            const todayNorm = today === 0 ? 7 : today;
            const resetNorm = r === 0 ? 7 : r;

            // days since reset
            let diff = todayNorm - resetNorm;
            if (diff < 0) diff += 7;

            periodStart = new Date(now);
            periodStart.setDate(now.getDate() - diff);

            periodEnd = new Date(periodStart);
            periodEnd.setDate(periodStart.getDate() + 7);
            break;

        case "monthly":
            const d = parseInt(resetDay);
            const thisMonth = now.getMonth();
            const thisYear = now.getFullYear();

            // Start
            periodStart = new Date(thisYear, thisMonth, d);

            if (now < periodStart) {
                periodStart = new Date(thisYear, thisMonth - 1, d);
            }

            periodEnd = new Date(periodStart);
            periodEnd.setMonth(periodStart.getMonth() + 1);
            break;

        case "yearly":
            const dayOfYear = parseInt(resetDay); // 1–365
            const year = now.getFullYear();

            periodStart = new Date(year, 0, dayOfYear);

            if (now < periodStart) {
                periodStart = new Date(year - 1, 0, dayOfYear);
            }

            periodEnd = new Date(periodStart);
            periodEnd.setFullYear(periodStart.getFullYear() + 1);
            break;
    }

    const elapsed = now - periodStart;
    const total = periodEnd - periodStart;
    return (elapsed / total) * 100;
}

// Load Budget ------------------------------------------------------------------------------------
async function loadBudget(username) {
    try {
        SM.showLoader();
        const res = await fetch(`${API_BASE_URL}/api/budget/${username}`);
        const data = await res.json();

        await SM.logBook("home", "loadBudget", `Budget retrieved: ${JSON.stringify(data, null, 2)}`);

        // Return if budget not enabled
        if (!data.enabled) {
            containers.budgetContainer.style.display = 'none';
            return;
        }

        // show budget card
        const card = containers.budgetContainer;
        card.style.display = 'block';

        // Start budget statement
        const summary = document.getElementById('budgetSummary');
        const budgetProgressText = document.getElementById('budgetProgress');
        const periodProgressText = document.getElementById('periodProgress');
        const budgetStatusText = document.getElementById('budgetStatus');
        const currency = localStorage.getItem('currency') || "£";
        const resetDay = localStorage.getItem('resetDay') || 1;


        // establish over/under
        const diffText =
            data.overUnder >= 0
                ? `${currency}${data.overUnder.toFixed(2)} under budget`
                : `${currency}${Math.abs(data.overUnder).toFixed(2)} over budget`;

        // Get period
        let newPeriod;
        switch (data.period.toLowerCase()) {
            case 'monthly':
                newPeriod = 'month';
                break;
            case 'yearly':
                newPeriod = 'year';
                break;
            case 'weekly':
                newPeriod = 'week';
                break;
            case 'daily':
                newPeriod = 'day';
                break;
        }

        const budgetProgress = (data.cost / data.budget) * 100;
        const periodProgress = getPeriodPercentage(data.period, resetDay);

        // display statement
        summary.textContent = `This ${newPeriod}: ${currency}${data.cost.toFixed(2)} of ${currency}${data.budget.toFixed(2)} → ${diffText}.`;
        budgetProgressText.textContent = `Budget Spent: ${budgetProgress.toFixed(2)}%`;
        periodProgressText.textContent = `${newPeriod[0].toUpperCase() + newPeriod.slice(1)} Progress: ${periodProgress.toFixed(2)}%`;

        if (budgetProgress <= periodProgress) {
            budgetStatusText.textContent = `You are on target 👍`;
        } else {
            budgetStatusText.textContent = `You are off target 👎`;
        }

        let cumulativeCosts = [];
        let labels = [];
        const ctx = document.getElementById('budgetChart').getContext('2d');

        if (data.journeys && data.journeys.length > 0) {
            // Sort journeys just in case
            const sorted = data.journeys.sort((a, b) => new Date(a.date) - new Date(b.date));

            // Prepare labels and cumulative cost
            labels = sorted.map(j => {
                const d = new Date(j.date);
                const day = d.getDate();
                const month = d.getMonth() + 1; // months are 0-indexed
                return `${day}/${month}`;
            });

            let cumulative = 0;
            for (let j of sorted) {
                cumulative += j.cost;
                cumulativeCosts.push(cumulative);
            }
        } else {
            // No journeys yet → show a flat line from 0 to 0
            labels = ['Start', 'Now'];
            cumulativeCosts = [0, 0];
        }

        // Construct chart
        new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        // Plot line for budget
                        label: 'Budget',
                        data: Array(labels.length).fill(data.budget),
                        borderColor: "rgb(0,78,212)",
                        backgroundColor: "rgb(0,78,212)",
                        borderWidth: 1.5,
                        fill: false,
                        pointRadius: 0,
                    },
                    {
                        // Plot line for costs
                        label: 'Cost',
                        data: cumulativeCosts,
                        borderColor: data.overUnder >= 0 ? '#00ff08' : '#ff1200',
                        backgroundColor: data.overUnder >= 0 ? 'rgba(0,255,8,0.6)' : 'rgba(255,18,0,0.6)',
                        borderWidth: 2,
                        pointBackgroundColor: '#b4b4b4',
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        fill: true,
                        fillOpacity: 0.8,
                        fillColor: data.overUnder >= 0 ? '#009f05' : '#8e0b01',

                    }
                ]
            },
            options: {
                responsive: true,
                layout: {padding: 8},
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: '#222',
                            font: {family: 'inherit', size: 12},
                            boxWidth: 14,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: '#ffffff',
                        titleColor: '#000',
                        bodyColor: '#000',
                        borderColor: '#ccc',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#000000',
                            font: {family: 'inherit'},
                            display: data.period.toLowerCase() === 'monthly' // only show labels for monthly
                        },
                        grid: {color: 'rgba(0,0,0,0.05)'}
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {color: '#000000', font: {family: 'inherit'}},
                        grid: {color: 'rgba(0,0,0,0.05)'}
                    }
                }
            }
        });
    } catch (err) {
        await SM.logBook("home", "loadBudget", `Error fetching budget: ${err}`, true);
        await SM.cmbError(`Error loading budget data: ${err}`);
    } finally {
        SM.hideLoader();
    }
}

// ==========================================================================================================
// -- Event Listeners --
// ==========================================================================================================

// window loaded event listener ------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
    await SM.logBook("home", "window.DOMContentLoaded", "Home page loaded");

    const currentPage = window.location.pathname.split("/").pop();
    SM.highlightActivePage(currentPage);

    const username = localStorage.getItem('username').toLowerCase();
    if (!username) {
        await SM.cmbError('Please Login');
        window.location.href = "index.html";
        return;
    }

    // Call load functions
    await loadSummary(username);
    const totalJourneys = window.summaryData.journeyCount;
    if (totalJourneys > 0) {
        await loadCosts(username);
        await load28DaySum(username);
        await loadInsights(username);
        await loadBudget(username);
    }
});

// Log Out Button clicked ---------------------------------------------------------------------------
buttons.btnLogOut.addEventListener('click', async (e) => {
    await SM.logBook("home", "btnLogOut.click", "Log Out button clicked");

    const confirmed = await SM.cmbQuestion('Logout?', `Are you sure you want to log out?`);
    if (confirmed) {
        window.location.href = "index.html";
    }
});