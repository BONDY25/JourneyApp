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

// DOM Elements ---------------------------------------------------------------------------------------------
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
        await SM.logBook("newJourney", "getVehicles", `Network Error: ${err}`, true);
        await SM.cmbError(`Error loading vehicles: ${err}`);
    } finally {
        SM.hideLoader();
    }
}

// Check Fields ---------------------------------------------------------------------------------------------
function checkFields(fields) {
    return fields && fields.length > 0;
}

// Insert Journey -------------------------------------------------------------------------------------------
async function insertJourney(journeyData) {
    try {
        SM.showLoader();

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
            await SM.logBook(
                "newJourney",
                "submit.click",
                `Journey Submission Successful. ${JSON.stringify(journeyData, null, 2)}`
            );
            await SM.cmbInfo('Success', 'Journey Saved!');
            window.location.href = "home.html";
        } else {
            const err = await res.text();
            await SM.logBook("newJourney", "submit.click", `Journey Submission failed. ${err}`);
            await SM.cmbError(`Error: ${err}`);
        }
    } catch (error) {
        await SM.logBook("newJourney", "submit.click", `Network Error: ${error}`, true);
    } finally {
        SM.hideLoader();
    }
}

// Calculate values -----------------------------------------------------------------------------------------
async function calculateValues({timeUnit = 'minutes'} = {}) {
    await SM.logBook("newJourney", "calculateValues", "Calculating Values");

    try {

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
        const timeDriven = parseDuration(inputs.timeDrivenInput.value);
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

        await SM.logBook("newJourney", "calculateValues", `Values Calculated: ${JSON.stringify(output, null, 2)}`);

        return output;

    } catch (error) {
        await SM.logBook("newJourney", "calculateValues", `Error Calculating Values: ${error}`, true);
        await SM.cmbError(`Error Calculating Values: ${error}`);
    }
}

// Parse Duration function ----------------------------------------------------------------------------------
function parseDuration(duration) {
    if (typeof duration !== "string") {
        throw new Error("Time driven must be entered as text.");
    }

    duration = duration.trim().toLowerCase();
    if (!duration) {
        throw new Error("Please enter a journey duration.");
    }

    console.log(duration);

    const match = duration.match(/^(?:(\d+)\s*h)?\s*(?:(\d+)s*m)?$/);
    if (!match || (match[1 === undefined && match[2] === undefined])) {
        throw new Error(`Invalid duration format, please use something like "1h 20m"`);
    }

    const hours = match[1] ? parseInt(match[1], 10) : 0;
    const minutes = match[2] ? parseInt(match[2], 10) : 0;

    console.log(`${hours}:${minutes}`);

    if (match[1] && minutes >= 60) {
        throw new Error(`Minutes must be less that 60 when using hours.`);
    }

    const totalMinutes = (hours * 60) + minutes;
    if (totalMinutes <= 0) {
        throw new Error(`Time driven must be more that zero`);
    }

    console.log(totalMinutes);
    return totalMinutes;
}

// ==========================================================================================================
// -- Event Listeners --
// ==========================================================================================================

// window loaded event listener -----------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
    await SM.logBook("newJourney", "window.DOMContentLoaded", "New Journey page loaded");

    const currentPage = window.location.pathname.split("/").pop();
    SM.highlightActivePage(currentPage);
    SM.hideLoader();
    const username = localStorage.getItem('username').toLowerCase();
    user = localStorage.getItem('username').toLowerCase();
    if (!username) {
        await SM.cmbError('Please Login');
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
    vehicleDetails = await SM.getVehicleDetails(vehicleId);

    const costField = inputs.costInput;
    if (costField) {
        costField.value = Number(vehicleDetails.lastCostPL) || 0;
    }
});

// Time Driven Field ----------------------------------------------------------------------------------------
inputs.timeDrivenInput.addEventListener('change', async () => {
   try{
       const timeDriven = parseDuration(inputs.timeDrivenInput.value);
       if (!timeDriven) {
           throw new Error("Time driven must be entered.");
       }
   } catch (error) {
       await SM.cmbError(`${error}`);
       inputs.timeDrivenInput.value = "";
       inputs.timeDrivenInput.focus();
   }
});

// Event Listener to submit form ----------------------------------------------------------------------------
buttons.btnSubmit.addEventListener('click', async (event) => {
    event.preventDefault(); // Stop form reload
    await SM.logBook("newJourney", "submit.click", "Journey Submission attempted.");

    const journeyData = await calculateValues();
    const description = String(inputs.descriptionInput.value);

    // Check if a description has been entered
    if (!checkFields(description)) {
        await SM.cmbError('Please enter a description');
        return;
    }

    // Insert Journey
    await insertJourney(journeyData);

});

