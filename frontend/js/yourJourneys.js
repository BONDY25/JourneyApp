// ==========================================================================================================
// -- Boilerplate --
// ==========================================================================================================

import SessionMaintenance from "./sessionMaintenance.js";
import { API_BASE_URL } from "./config.js";

const SM = SessionMaintenance;
const editButton = document.getElementById("btnEdit");
const backbutton = document.getElementById("close-button");
const currency = localStorage.getItem('currency');
let fuelType = localStorage.getItem("fuelType") || 'Petrol';
let journeyId = null;

const journeyDetailsCard= document.getElementById('journey-details');

const fields = {
    description: SM.$("description"),
    vehicle: SM.$("vehicle"),
    distance: SM.$("distance"),
    timeDriven: SM.$("timeDriven"),
    fuelUsedL: SM.$("fuelUsedL"),
    cost: SM.$("cost"),
    mpg: SM.$("mpg"),
    lpkm: SM.$("lpkm"),
    kWh: SM.$("kWh"),
    kWhTotal: SM.$("kWhTotal"),
    temp: SM.$("temp"),
    condition: SM.$("condition"),
    avgSpeed: SM.$("avgSpeed"),
    costPerMile: SM.$("costPerMile"),
    percOfTank: SM.$("percOfTank"),
    carbonFootprint: SM.$("carbonFootprint"),
}

// ==========================================================================================================
// -- Operational Functions --
// ==========================================================================================================

// Get Journeys --------------------------------------------------------------------
async function getJourneys(tableBody, username) {
    try {
        SessionMaintenance.showLoader();
        const res = await fetch(`${API_BASE_URL}/api/getJourneys?username=${username}`, {})
        const journeys = await res.json();

        if (journeys.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="3">No journeys found.</td></tr>`;
            return;
        }

        await SessionMaintenance.logBook("yourJourneys", "getJourneys", `Getting Journeys`);
        journeys.forEach((journey) => {
            const row = document.createElement("tr");

            row.innerHTML = `
        <td>${new Date(journey.dateTime).toLocaleString()}</td>
        <td>${journey.description}</td>
        <td>${journey.distance}</td>
      `;

            row.addEventListener("click", async () => {
                journeyId=journey._id
                await getJourneyDetails();
            });

            tableBody.appendChild(row);
        });

    } catch (err) {
        await SessionMaintenance.logBook("yourJourneys", "getJourneys", `Network Error: ${err}`, true);
        tableBody.innerHTML = `<tr><td colspan="3">Error loading journeys</td></tr>`;
        await SessionMaintenance.cmbError(`Error loading journeys: ${err}`);
    } finally {
        SessionMaintenance.hideLoader();
    }
}

// ==========================================================================================================
// -- Journey Details Functions --
// ==========================================================================================================

// Format Date -----------------------------------------------------------------------------------------
function formatDateTime(value){
    if(!value){
        return "-";
    }
    const date = new Date(value);
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

// Format Number -----------------------------------------------------------------------------------------
function formatNumber(value, decimals = 2){
    if(value==null||value==="") return "-";
    return Number(value).toFixed(decimals);
}

// Get Journeys -----------------------------------------------------------------------------------------
async function getJourneyDetails() {

    try {
        SessionMaintenance.showLoader();
        if (!journeyId) {
            await SessionMaintenance.logBook("journeyDetails", "getJourney", `No Journey Found ${journeyId}`, true);
            return;
        }

        // Log action
        await SessionMaintenance.logBook("journeyDetails", "getJourney", `Getting journey ${journeyId}`);

        // Get Journey Details
        const response = await fetch(`${API_BASE_URL}/api/getJourney/${journeyId}`, {
            method: "GET",
            headers: {"Content-Type": "application/json"}
        });

        if (!response.ok) throw new Error("Failed to get journey details");

        const journey = await response.json();

        const vehicleId = journey.vehicleId;
        const vehicleDetails = await SessionMaintenance.getVehicleDetails(vehicleId);
        fuelType = vehicleDetails.fuelType;
        localStorage.setItem("fuelType", vehicleDetails.fuelType);

        const formattedTime = journey.timeDriven > 60 ? journey.timeDriven / 60 : journey.timeDriven;
        const timeUnit = journey.timeDriven > 60 ? "Hours" : "Minutes";
        const lpkm = SessionMaintenance.calculateConsumption(journey.mpg);
        const kWh = SessionMaintenance.calculateConsumption(journey.mpg, 'kwhper100');
        const kWhTotal = SessionMaintenance.calculateConsumption(journey.mpg, 'kwhper100', 'Total');
        const carbonFoorprint = journey.fuelUsedL * (fuelType === 'petrol' ? 2.31 : 2.68);

        await SessionMaintenance.logBook("journeyDetails", "getJourney", `journey Data: ${JSON.stringify(journey)}`);

        // Populate Fields
        document.getElementById("DateTime").textContent = formatDateTime(journey.dateTime);
        fields.vehicle.textContent = vehicleDetails.name || "vroom vroom";
        fields.description.textContent = journey.description || "-";
        fields.distance.textContent = journey.distance ? `${formatNumber(journey.distance, 1)} mi` : "0 mi";
        fields.timeDriven.textContent = `${formatNumber(formattedTime, (timeUnit === "Minutes" ? 0 : 2))} ${timeUnit}` || "-";
        fields.fuelUsedL.textContent = journey.fuelUsedL ? `${formatNumber(journey.fuelUsedL, 2)} L` : "0 L";
        fields.cost.textContent = journey.totalCost ? `${currency}${formatNumber(journey.totalCost, 2)}` : "£0.00";
        fields.mpg.textContent = journey.mpg ? `${formatNumber(journey.mpg, 1)}` : "0 mpg";
        fields.temp.textContent = journey.temp ? `${formatNumber(journey.temp, 1)} °C` : "0 °C";
        fields.condition.textContent = journey.condition || "-";
        fields.avgSpeed.textContent = journey.avgSpeed ? `${formatNumber(journey.avgSpeed, 1)} mph` : "0 mph";
        fields.costPerMile.textContent = journey.costPerMile ? `${currency}${formatNumber(journey.costPerMile, 2)}/mi` : `${currency}0.00/mi`;
        fields.percOfTank.textContent = journey.percOfTank ? `${formatNumber(journey.percOfTank * 100, 2)} %` : "0 %";
        fields.lpkm.textContent = lpkm ? `${formatNumber(lpkm,2)}` : "0";
        fields.kWh.textContent = kWh ? `${formatNumber(kWh, 2)}` : "0";
        fields.kWhTotal.textContent = kWhTotal ? `${formatNumber(kWhTotal, 2)}` : "0";
        fields.carbonFootprint.textContent = `${formatNumber(carbonFoorprint, 2)} KG of CO²` || "0";

        journeyDetailsCard.classList.remove('hidden');

    } catch (err) {
        await SessionMaintenance.logBook("yourJourneys", "getJourneyDetails", `Error getting journeys ${err}`, true);
        await SessionMaintenance.cmbError(`Error getting journey details: ${err}`);
        journeyDetailsCard.classList.add('hidden');
    } finally {
        SessionMaintenance.hideLoader();

    }
}

// ==========================================================================================================
// -- Event Listeners --
// ==========================================================================================================

// window loaded event listener ------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
    await SessionMaintenance.logBook("yourJourneys", "window.DOMContentLoaded", "Home page loaded");

    const currentPage = window.location.pathname.split("/").pop();
    SessionMaintenance.highlightActivePage(currentPage);

    journeyDetailsCard.classList.add('hidden');
    journeyId = null;

    SessionMaintenance.hideLoader();

    const username = localStorage.getItem("username");
    const tableBody = document.querySelector("#journeys-table tbody");

    if (!username) {
        tableBody.innerHTML = `<tr><td colspan="3">No username found</td></tr>`;
        return;
    }

    await getJourneys(tableBody, username);
});

// Edit button event listener -------------------------------------------------------------------------
editButton.addEventListener("click", async () => {
    if (journeyId) {
        window.location.href = `edit-journey.html?id=${journeyId}`;
    } else {
        journeyDetailsCard.classList.add('hidden');
        await SessionMaintenance.cmbError(`No journey ID available to edit.`);
    }
});

// Back button event listener -------------------------------------------------------------------------
backbutton.addEventListener("click", async () => {
    journeyDetailsCard.classList.add('hidden');
    journeyId = null;
});