import SessionMaintenance from "./sessionMaintenance.js";

// window loaded event listener ------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
    await SessionMaintenance.logBook("newJourney", "window.DOMContentLoaded", "New Journey page loaded");
    const costField = document.getElementById('cost');
    if (costField) {
        const storedCost = localStorage.getItem('fuelCost');
        costField.value = storedCost !== null ? parseFloat(storedCost) : 0;
    }
    console.log("Fuel cost from localStorage:", localStorage.getItem('fuelCost'));
});

// Get Submit button
const submit = document.getElementById('submit');

// Calculate values-----------------------------------------------
async function calculateValues({timeUnit = 'minutes', gallon = 'imperial'} = {}) {
    await SessionMaintenance.logBook("newJourney", "calculateValues", "Calculating Values");

    // Get tank volume from user defaults
    const tankVolume = Number(localStorage.getItem('tankVolume')) ?? 64;

    // Get Elements
    const description = String(document.getElementById('description').value);
    const dateTimeRaw = (document.getElementById('datetime').value);
    const dateTime = dateTimeRaw ? new Date(dateTimeRaw) : null;
    const mpg = Number(document.getElementById('mpg').value);
    const distance = Number(document.getElementById('distance').value);
    const timeDriven = Number(document.getElementById('timeDriven').value);
    const temp = Number(document.getElementById('temp').value);
    const condition = String(document.getElementById('condition').value);
    const costPerLitre = Number(document.getElementById('cost').value);

    // Calculate Helpers
    const hours = timeUnit === 'minutes' ? (timeDriven / 60) : timeDriven;
    const safeHours = hours > 0 ? hours : null;
    const GALLON_L = (gallon === 'us') ? 3.79541 : 4.54609;
    const milesPerLitre = mpg > 0 ? (mpg / GALLON_L) : null;

    // Calculate Values
    const avgSpeed = safeHours ? (distance / safeHours) : 0;
    const fuelUsedL = milesPerLitre ? (distance / milesPerLitre) : 0;
    const costPerMile = milesPerLitre ? (costPerLitre / milesPerLitre) : 0;
    const totalCost = costPerMile * distance;
    const percOfTank = tankVolume > 0 ? (fuelUsedL / tankVolume) : 0;

    const user = localStorage.getItem('username');
    const round = (n, dp = 3) => Number(Number(n).toFixed(dp));

    // Construct Output
    const output = {
        user,
        description,
        dateTime,
        distance: round(distance, 2),
        mpg: round(mpg, 2),
        timeDriven,
        temp,
        condition,
        costPl: round(costPerLitre, 2),
        avgSpeed: round(avgSpeed, 2),
        totalCost: round(totalCost, 2),
        costPerMile: round(costPerMile, 2),
        fuelUsedL: round(fuelUsedL, 2),
        percOfTank: round(percOfTank, 4),
    }
    await SessionMaintenance.logBook("newJourney", "calculateValues", `Values Calculated: ${output}`);
    return output;
}

// Event Listener to submit form ---------------------------------------------------------------------
submit.addEventListener('click', async (event) => {
    event.preventDefault(); // Stop form reload
    await SessionMaintenance.logBook("newJourney", "submit.click", "Journey Submission attempted.");

    const journeyData = calculateValues(64);

    try {
        const res = await fetch('http://localhost:3000/api/journeys', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(journeyData)
        });

        if (res.ok) {
            await SessionMaintenance.logBook("newJourney", "submit.click", "Journey Submission Successful.");
            window.location.href = "home.html";
            alert('Journey Save!');
        } else {
            const err = await res.text();
            await SessionMaintenance.logBook("newJourney", "submit.click", "Journey Submission failed.");
            alert(`Error: ${err}`);
        }
    } catch (error) {
        await SessionMaintenance.logBook("newJourney", "submit.click", `Network Error: ${error}`, true);
    }

});