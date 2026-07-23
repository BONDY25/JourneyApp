// ==========================================================================================================
// -- Boilerplate --
// ==========================================================================================================

import SessionMaintenance from "./sessionMaintenance.js";
import {API_BASE_URL} from "./config.js";

// Get Submit button
const distanceUnit = localStorage.getItem('distanceUnit') || "miles";
const speedUnit = localStorage.getItem('speedUnit') || "mph";
const SM = SessionMaintenance;

// DOM Elements --------------------------------------------------------------------------------------
const inputs = {
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

// Check Fields --------------------------------------------------------------------------
function checkFields(fields) {
    return fields && fields.length > 0;
}

// Insert Journey ------------------------------------------------------------------------
async function insertJourney(journeyData){
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
            await SessionMaintenance.cmbInfo('Success','Journey Saved!');
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

    // Get tank volume from user defaults
    const tankVolume = Number(localStorage.getItem('tankVolume')) || 64;

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

    const user = localStorage.getItem('username') || 'unknown';
    const round = (n, dp = 3) => isNaN(n) ? 0 : Number(Number(n).toFixed(dp));

    // Construct Output
    const output = {
        user,
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

    const costField = inputs.costInput;
    if (costField) {
        const storedCost = localStorage.getItem('fuelCost');
        costField.value = storedCost !== null ? parseFloat(storedCost) : 0;
    }

    console.log("Fuel cost from localStorage:", localStorage.getItem('fuelCost'));
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

