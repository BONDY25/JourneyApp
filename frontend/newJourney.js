import SessionMaintenance from "./sessionMaintenance.js";
import { API_BASE_URL } from "./config.js";

// window loaded event listener ------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
    await SessionMaintenance.logBook("newJourney", "window.DOMContentLoaded", "New Journey page loaded");
    SessionMaintenance.hideLoader();

    const costField = document.getElementById('cost');
    if (costField) {
        const storedCost = localStorage.getItem('fuelCost');
        costField.value = storedCost !== null ? parseFloat(storedCost) : 0;
    }
    console.log("Fuel cost from localStorage:", localStorage.getItem('fuelCost'));
});

// Check Fields --------------------------------------------------------------
function checkFields(fields) {
    return fields && fields.length > 0;
}

// Get Submit button
const submit = document.getElementById('submit');

// Calculate values-----------------------------------------------
async function calculateValues({timeUnit = 'minutes'} = {}) {
    await SessionMaintenance.logBook("newJourney", "calculateValues", "Calculating Values");

    // Get tank volume from user defaults
    const tankVolume = Number(localStorage.getItem('tankVolume')) || 64;

    // Get Elements safely
    const getValue = (id, type = 'string') => {
        const el = document.getElementById(id);
        if (!el || el.value === '') return type === 'number' ? 0 : '';
        return type === 'number' ? Number(el.value) : String(el.value);
    };

    const description = getValue('description');
    const dateTimeRaw = getValue('datetime');
    const dateTime = dateTimeRaw ? new Date(dateTimeRaw) : new Date();
    const mpg = getValue('mpg', 'number');
    const distance = getValue('distance', 'number');
    const timeDriven = getValue('timeDriven', 'number');
    const temp = getValue('temp', 'number');
    const condition = getValue('condition');
    const costPerLitre = getValue('cost', 'number');

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
        costPl: round(costPerLitre, 2),
        avgSpeed: round(avgSpeed, 2),
        totalCost: round(totalCost, 2),
        costPerMile: round(costPerMile, 2),
        fuelUsedL: round(fuelUsedL, 2),
        percOfTank: round(percOfTank, 4),
    };

    await SessionMaintenance.logBook("newJourney", "calculateValues", `Values Calculated: ${JSON.stringify(output, null, 2)}`);

    return output;
}

// Event Listener to submit form ---------------------------------------------------------------------
submit.addEventListener('click', async (event) => {
    event.preventDefault(); // Stop form reload
    await SessionMaintenance.logBook("newJourney", "submit.click", "Journey Submission attempted.");

    const journeyData = await calculateValues();
    const description = String(document.getElementById('description').value);

    if (!checkFields(description)) {
        alert('Please enter a description');
        return;
    }

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
            alert('Journey Saved!');
            window.location.href = "home.html";
        } else {
            const err = await res.text();
            await SessionMaintenance.logBook("newJourney", "submit.click", `Journey Submission failed. ${err}`);
            alert(`Error: ${err}`);
        }
    } catch (error) {
        await SessionMaintenance.logBook("newJourney", "submit.click", `Network Error: ${error}`, true);
    } finally {
        SessionMaintenance.hideLoader();
    }
});
