// ==========================================================================================================
// -- Boilerplate --
// ==========================================================================================================

import {API_BASE_URL} from "./config.js";
import SessionMaintenance from "./sessionMaintenance.js";

const SM = SessionMaintenance;
const params = new URLSearchParams(window.location.search);
const journeyId = params.get("id");
let vehicleDetails = {};

const inputs = {
    vehicleInput: SM.$("vehicle"),
    dateTimeInput: SM.$("datetime"),
    distanceInput: SM.$("distance"),
    mpgInput: SM.$("mpg"),
    timeDrivenInput: SM.$("timeDriven"),
    tempInput: SM.$("temp"),
    conditionInput: SM.$("condition"),
    costInput: SM.$("cost"),
}

const buttons = {
    btnSave: SM.$("btnSave"),
    btnDelete: SM.$("btnDelete"),
}

// ==========================================================================================================
// -- Operational Functions --
// ==========================================================================================================

// Get Vehicles ---------------------------------------------------------------------------------------------
async function getVehicles(username) {
    try {
        SM.showLoader();
        inputs.vehicleInput.innerHTML = "";

        // Default option
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Select Vehicle";
        defaultOption.disabled = true;
        defaultOption.selected = true;

        inputs.vehicleInput.appendChild(defaultOption);

        const res = await fetch(`${API_BASE_URL}/api/getVehicles?username=${username}`, {
            method: "GET",
            headers: {"Content-Type": "application/json"}
        })
        const vehicles = await res.json();

        if (vehicles.length === 0) {
            SM.hideLoader();
            await SM.cmbInfo(`No vehicles`, `You don't have any vehicles, add them in settings.`);
            window.location.href = "home.html";
        }

        // add vehicles as options in drop down
        vehicles.forEach((vehicle) => {
            const option = document.createElement("option");
            option.value = vehicle._id;
            option.text = vehicle.name;

            inputs.vehicleInput.appendChild(option);
        });



    } catch (err) {
        await SM.logBook("editJourney", "getVehicles", `Network Error: ${err}`, true);
        await SM.cmbError(`Error loading vehicles: ${err}`);
    } finally {
        SM.hideLoader();
    }
}

// format date time -----------------------------------------------------------------------------------------
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

//Calculate Values ------------------------------------------------------------------------------------------
async function reCalculateValues({timeUnit = 'minutes'} = {}) {
    await SM.logBook("editJourney", "calculateValues", "Calculating Values");

    const vehicleId = vehicleDetails._id;
    const vehicleName = vehicleDetails.name;
    const fuelType = vehicleDetails.fuelType;
    const tankVolume = vehicleDetails.tankVolume;

    const dateTime = inputs.dateTimeInput.value || "";
    const distance = inputs.distanceInput.value || 0;
    const mpg = inputs.mpgInput.value || 0;
    const timeDriven = SM.parseDuration(inputs.timeDrivenInput.value);
    const costPerLitre = inputs.costInput.value || 0;
    const condition = inputs.conditionInput.value || "Dry";
    const temp = inputs.tempInput.value  || 0;

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
        vehicleId,
        vehicleName,
        fuelType,
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

    await SM.logBook("editJourney", "calculateValues", `Values Calculated: ${JSON.stringify(output, null, 2)}`);

    return output;
}

// Load Journey ---------------------------------------------------------------------------------------------
async function loadJourney() {
    try {
        SM.showLoader();

        const res = await fetch(`${API_BASE_URL}/api/journeys/${journeyId}`);
        if (!res.ok) throw new Error("Failed to fetch journey");

        const journey = await res.json();

        inputs.vehicleInput.value = journey.vehicleId;
        inputs.dateTimeInput.value = formatDatetime(journey.dateTime) || journey.dateTime?.split("T")[0] || ""
        inputs.distanceInput.value = journey.distance || "";
        inputs.mpgInput.value = journey.mpg || "";
        inputs.timeDrivenInput.value = journey.timeDriven || "";
        inputs.tempInput.value = journey.temp || "";
        inputs.conditionInput.value = journey.condition || "";
        inputs.costInput.value = journey.costPl || "";

    } catch (err) {
        await SM.logBook("editJourney", "loadJourney", `Error getting journey ${err}`, true);
    } finally {
        SM.hideLoader();
    }
}

// Save Journey ---------------------------------------------------------------------------------------------
async function saveJourney() {

    const updated = await reCalculateValues();

    try {
        SM.showLoader();
        const res = await fetch(`${API_BASE_URL}/api/journeys/${journeyId}`, {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(updated),
        });

        if (res.ok) {
            await SM.cmbInfo(`Success`,`Journey updated successfully!`);
            await SM.logBook("saveJourney", "saveJourney", `Journey Saved successfully! ${JSON.stringify(updated)}`);
            window.location.href = "your-journeys.html";
        } else {
            throw new Error("Update failed");
        }
    } catch (err) {
        await SM.logBook("editJourney", "saveJourney", `Error saving journey ${err}`, true);
        await SM.cmbError(`Failed to update journey: ${err}`);
    } finally {
        SM.hideLoader();
    }
}

// Delete Journey -------------------------------------------------------------------------------------------
async function deleteJourney() {
    try {
        SM.showLoader();
        const res = await fetch(`${API_BASE_URL}/api/journeys/${journeyId}`, {
            method: "DELETE",
        });

        if (res.ok) {
            await SM.cmbInfo(`Success`,`Journey Deleted successfully!`);
            window.location.href = "your-journeys.html";
        } else {
            throw new Error("Delete failed");
        }
    } catch (err) {
        await SM.logBook("editJourney", "deleteJourney", `Error deleting journey ${err}`, true);
        await SM.cmbError(`failed to delete the journey: ${err}`);
    } finally {
        SM.hideLoader();
    }
}

// ==========================================================================================================
// -- Event Listeners --
// ==========================================================================================================

// Page loaded ----------------------------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
    await SM.logBook("editJourney", "window.DOMContentLoaded", "Edit journey page loaded");
    SM.hideLoader();

    await getVehicles(localStorage.getItem("username"));
    await loadJourney();

    const vehicleId = inputs.vehicleInput.value;
    vehicleDetails = await SM.getVehicleDetails(vehicleId);

});

// Time Driven Field ----------------------------------------------------------------------------------------
inputs.timeDrivenInput.addEventListener('change', async () => {
    try{
        const timeDriven = SM.parseDuration(inputs.timeDrivenInput.value);
        if (!timeDriven) {
            throw new Error("Time driven must be entered.");
        }
    } catch (error) {
        await SM.cmbError(`${error}`);
        inputs.timeDrivenInput.value = "";
        inputs.timeDrivenInput.focus();
    }
});

// Save Button ----------------------------------------------------------------------------------------------
buttons.btnSave.addEventListener("click", async (e) => {
    e.preventDefault();
    await saveJourney();
});

// Delete Button --------------------------------------------------------------------------------------------
buttons.btnDelete.addEventListener("click", async ()=>{
    const confirmed = await SM.cmbQuestion('Delete?', 'Are you sure you want to delete this journey?');
    if (!confirmed) return;
    await deleteJourney();
});