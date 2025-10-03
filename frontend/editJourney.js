// ==========================================================================================================
// -- Boilerplate --
// ==========================================================================================================

import {API_BASE_URL} from "./config.js";
import SessionMaintenance from "./sessionMaintenance.js";

const params = new URLSearchParams(window.location.search);
const journeyId = params.get("id");

// ==========================================================================================================
// -- Operational Functions --
// ==========================================================================================================

// format date time --------------------------------------------------------------------------
function formatDatetime(isoString){
    const date = new Date(isoString);
    const pad = (num) => num.toString().padStart(2,'0');

    const yyyy = date.getFullYear();
    const MM = pad(date.getMonth()+1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());

    return `${yyyy}-${MM}-${dd}T${hh}:${mm}` || "";
}

//Calculate Values ----------------------------------------------------------------------------
async function reCalculateValues({timeUnit = 'minutes'} = {}) {
    await SessionMaintenance.logBook("editJourney", "calculateValues", "Calculating Values");

    const tankVolume = Number(localStorage.getItem('tankVolume')) || 64;
    const dateTime = document.getElementById("datetime").value || "";
    const distance = document.getElementById("distance").value || 0;
    const mpg = document.getElementById("mpg").value || 0;
    const timeDriven = document.getElementById("timedriven").value || 0;
    const costPerLitre = document.getElementById("cost").value || 0;
    const condition = document.getElementById("condition").value || "Dry";
    const temp = document.getElementById("temp").value  || 0;

    // Calculate Helpers
    const gallon = localStorage.getItem('gallon');
    const hours = timeUnit === 'minutes' ? (timeDriven / 60) : timeDriven;
    const safeHours = hours > 0 ? hours : 1; // avoid division by zero
    const GALLON_L = (gallon === 'US') ? 3.79541 : 4.54609;
    const milesPerLitre = mpg > 0 ? (mpg / GALLON_L) : 1; // avoid division by zero

    // Calculate Values
    const avgSpeed = distance / safeHours;
    const fuelUsedL = distance / milesPerLitre;
    const costPerMile = costPerLitre / milesPerLitre;
    const totalCost = costPerMile * distance;
    const percOfTank = tankVolume > 0 ? (fuelUsedL / tankVolume) : 0;

    const round = (n, dp = 3) => isNaN(n) ? 0 : Number(Number(n).toFixed(dp));

    const output = {
        dateTime,
        distance: round(distance, 2),
        mpg: round(mpg, 2),
        timeDriven: round(timeDriven, 2),
        temp: round(temp, 1),
        condition,
        costPl: round(costPerLitre, 3),
        avgSpeed: round(avgSpeed, 2),
        totalCost: round(totalCost, 2),
        costPerMile: round(costPerMile, 2),
        fuelUsedL: round(fuelUsedL, 2),
        percOfTank: round(percOfTank, 4),
    }

    await SessionMaintenance.logBook("editJourney", "calculateValues", `Values Calculated: ${JSON.stringify(output, null, 2)}`);

    return output;
}

// Load Journey -----------------------------------------------------------------------------
async function loadJourney() {
    try {
        SessionMaintenance.showLoader();
        const res = await fetch(`${API_BASE_URL}/api/journeys/${journeyId}`);
        if (!res.ok) throw new Error("Failed to fetch journey");

        const journey = await res.json();
        document.getElementById("datetime").value = formatDatetime(journey.dateTime) || journey.dateTime?.split("T")[0] || ""
        document.getElementById("distance").value = journey.distance || "";
        document.getElementById("mpg").value = journey.mpg || "";
        document.getElementById("timedriven").value = journey.timeDriven || "";
        document.getElementById("temp").value = journey.temp || "";
        document.getElementById("condition").value = journey.condition || "";
        document.getElementById("cost").value = journey.costPl || "";
    } catch (err) {
        await SessionMaintenance.logBook("editJourney", "loadJourney", `Error getting journey ${err}`, true);
    } finally {
        SessionMaintenance.hideLoader();
    }
}

// Save Journey -----------------------------------------------------------------------------
async function saveJourney() {

    const updated = await reCalculateValues();

    try {
        SessionMaintenance.showLoader();
        const res = await fetch(`${API_BASE_URL}/api/journeys/${journeyId}`, {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(updated),
        });

        if (res.ok) {
            alert("Journey updated successfully!");
            await SessionMaintenance.logBook("saveJourney", "saveJourney", `Journey Saved successfully! ${JSON.stringify(updated)}`);
            window.location.href = "your-journeys.html";
        } else {
            throw new Error("Update failed");
        }
    } catch (err) {
        await SessionMaintenance.logBook("editJourney", "saveJourney", `Error saving journey ${err}`, true);
        alert("Failed to save changes.");
    } finally {
        SessionMaintenance.hideLoader();
    }
}

// Delete Journey -----------------------------------------------------------------------------
async function deleteJourney() {
    if (!confirm("Are you sure you want to delete this journey?")) return;

    try {
        SessionMaintenance.showLoader();
        const res = await fetch(`${API_BASE_URL}/api/journeys/${journeyId}`, {
            method: "DELETE",
        });

        if (res.ok) {
            alert("Journey deleted");
            window.location.href = "your-journeys.html";
        } else {
            throw new Error("Delete failed");
        }
    } catch (err) {
        await SessionMaintenance.logBook("editJourney", "deleteJourney", `Error deleting journey ${err}`, true);
        alert("failed to delete the journey");
    } finally {
        SessionMaintenance.hideLoader();
    }
}

// ==========================================================================================================
// -- Event Listeners --
// ==========================================================================================================

// Page loaded -----------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
    await SessionMaintenance.logBook("editJourney", "window.DOMContentLoaded", "Edit journey page loaded");
    SessionMaintenance.hideLoader();

    await loadJourney();

    const form = document.getElementById("editJourneyForm");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        await saveJourney();
    });

    document.getElementById("deleteBtn").addEventListener("click", deleteJourney);
});