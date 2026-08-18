// ==========================================================================================================
// -- Boilerplate --
// ==========================================================================================================

import SessionMaintenance from "./sessionMaintenance.js";
import {API_BASE_URL} from "./config.js";

// Get Submit button
const distanceUnit = localStorage.getItem('distanceUnit') || "miles";
const speedUnit = localStorage.getItem('speedUnit') || "mph";
const SM = SessionMaintenance;
let user;
let vehicleDetails = {};

// DOM Elements --------------------------------------------------------------------------------------
const inputs = {
    vehicleInput: SM.$("vehicle"),
    descriptionInput: SM.$("description"),
    dateInput: SM.$("datetime"),
    distanceInput: SM.$("distance"),
    mpgInput: SM.$("mpg"),
    timeDrivenInput: SM.$("timeDriven"),
    tempInput: SM.$("temp"),
    conditionInput: SM.$("condition"),
    costInput: SM.$("cost"),
}

const buttons = {
    btnSubmit: SM.$('submit'),
}

// ==========================================================================================================
// -- Operational Functions --
// ==========================================================================================================

// Get Vehicles -------------------------------------------------------------------------
async function getVehicles(username) {
    try {
        SessionMaintenance.showLoader();
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
            SessionMaintenance.hideLoader();
            await SessionMaintenance.cmbInfo(`No vehicles`, `You don't have any vehicles, add them in settings.`);
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
        await SessionMaintenance.logBook("newJourney", "getVehicles", `Network Error: ${err}`, true);
        await SessionMaintenance.cmbError(`Error loading vehicles: ${err}`);
    } finally {
        SessionMaintenance.hideLoader();
    }
}

// Check Fields --------------------------------------------------------------------------
function checkFields(fields) {
    return fields && fields.length > 0;
}

// Insert Journey ------------------------------------------------------------------------
async function insertJourney(journeyData) {
    try {
        SessionMaintenance.showLoader();

        const res = await fetch(`${API_BASE_URL}/api/journeys`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(journeyData)
        });

        //Save fuel cost in case of change
        console.log("DEBUG journeyData:", journeyData);
        if (journeyData && journeyData.costPl !== undefined) {
            localStorage.setItem('fuelCost', journeyData.costPl.toString());
        } else {
            console.warn("costPl missing from journeyData:", journeyData);
        }

        if (res.ok) {
            await SessionMaintenance.logBook(
                "newJourney",
                "submit.click",
                `Journey Submission Successful. ${JSON.stringify(journeyData, null, 2)}`
            );
            await SessionMaintenance.cmbInfo('Success', 'Journey Saved!');
            window.location.href = "home.html";
        } else {
            const err = await res.text();
            await SessionMaintenance.logBook("newJourney", "submit.click", `Journey Submission failed. ${err}`);
            await SessionMaintenance.cmbError(`Error: ${err}`);
        }
    } catch (error) {
        await SessionMaintenance.logBook("newJourney", "submit.click", `Network Error: ${error}`, true);
    } finally {
        SessionMaintenance.hideLoader();
    }
}

// Calculate values -----------------------------------------------
async function calculateValues({timeUnit = 'minutes'} = {}) {
    await SessionMaintenance.logBook("newJourney", "calculateValues", "Calculating Values");

    const vehicleId = vehicleDetails._id;
    const vehicleName = vehicleDetails.name;
    const fuelType = vehicleDetails.fuelType;
    const tankVolume = vehicleDetails.tankVolume;

    // Get Elements safely
    const getValue = (el, type = 'string') => {
        if (!el || el.value === '') return type === 'number' ? 0 : '';
        return type === 'number' ? Number(el.value) : String(el.value);
    };

    const description = getValue(inputs.descriptionInput);
    const dateTimeRaw = getValue(inputs.dateInput);
    const dateTime = dateTimeRaw ? new Date(dateTimeRaw) : new Date();
    const mpg = getValue(inputs.mpgInput, 'number');
    const distance = getValue(inputs.distanceInput, 'number');
    const timeDriven = getValue(inputs.timeDrivenInput, 'number');
    const temp = getValue(inputs.tempInput, 'number');
    const condition = getValue(inputs.conditionInput);
    const costPerLitre = getValue(inputs.costInput, 'number');

    // Calculate Helpers
    //const distanceMiles = distanceUnit === 'miles' ? distance : distance / 1.609;
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

    // Construct Output
    const output = {
        user,
        vehicleId,
        vehicleName,
        fuelType,
        description,
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
        distanceUnit,
        speedUnit,
    };

    await SessionMaintenance.logBook("newJourney", "calculateValues", `Values Calculated: ${JSON.stringify(output, null, 2)}`);

    return output;
}

// ==========================================================================================================
// -- Event Listeners --
// ==========================================================================================================

// window loaded event listener ------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
    await SessionMaintenance.logBook("newJourney", "window.DOMContentLoaded", "New Journey page loaded");

    const currentPage = window.location.pathname.split("/").pop();
    SessionMaintenance.highlightActivePage(currentPage);
    SessionMaintenance.hideLoader();
    const username = localStorage.getItem('username').toLowerCase();
    user = localStorage.getItem('username').toLowerCase();
    if (!username) {
        await SessionMaintenance.cmbError('Please Login');
        window.location.href = "index.html";
        return;
    }

    await getVehicles(username);

    /*
    const costField = inputs.costInput;
    if (costField) {
        const storedCost = localStorage.getItem('fuelCost');
        costField.value = storedCost !== null ? parseFloat(storedCost) : 0;
    }
     */

    console.log("Fuel cost from localStorage:", localStorage.getItem('fuelCost'));
});

// Vehicle Chosen -------------------------------------------------------------------------------------------
inputs.vehicleInput.addEventListener('change', async () => {
    const vehicleId = inputs.vehicleInput.value;
    vehicleDetails = await SessionMaintenance.getVehicleDetails(vehicleId);

    const costField = inputs.costInput;
    if (costField) {
        costField.value = Number(vehicleDetails.lastCostPL) || 0;
    }
});

// Event Listener to submit form ---------------------------------------------------------------------
buttons.btnSubmit.addEventListener('click', async (event) => {
    event.preventDefault(); // Stop form reload
    await SessionMaintenance.logBook("newJourney", "submit.click", "Journey Submission attempted.");

    const journeyData = await calculateValues();
    const description = String(inputs.descriptionInput.value);

    // Check if a description has been entered
    if (!checkFields(description)) {
        await SessionMaintenance.cmbError('Please enter a description');
        return;
    }

    // Insert Journey
    await insertJourney(journeyData);

});

