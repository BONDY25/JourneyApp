// ==========================================================================================================
// -- Boilerplate --
// ==========================================================================================================

import SessionMaintenance from "./sessionMaintenance.js";
import {API_BASE_URL} from "./config.js";

const fontSelect = document.getElementById('font-select');
const budgetToggle = document.getElementById('budget-toggle');
const budgetFields = document.getElementById('budgetFields');
const rangeSelect = document.getElementById('budget-range');
const resetDayContainer = document.getElementById('resetDayContainer');
const resetDaySelect = document.getElementById('reset-day');

// ==========================================================================================================
// -- Operational Functions --
// ==========================================================================================================

// Get total number of journeys ----------------------------------------------------------
async function getTotalJourneys(username) {
    const totalElem = document.getElementById('totalJourneys');

    try {
        const res = await fetch(`${API_BASE_URL}/api/getTotalJourneys/${username}`);
        if (!res.ok) throw new Error("Failed to fetch journeys");

        const data = await res.json();
        totalElem.textContent = data.total; // update DOM

        await SessionMaintenance.logBook("settings", "getTotalJourneys", `Journey Total retrieved: ${data.total}`);

        return data.total;
    } catch (err) {
        console.error("Error fetching total journeys:", err);
        await SessionMaintenance.logBook("settings", "getTotalJourneys", `Network Error: ${err}`, true);
        return 0;
    }
}

// Update UI for reset day ----------------------------------------------------------
function updateResetDayOptions() {
    const range = rangeSelect.value;
    resetDaySelect.innerHTML = ''; // Clear previous options

    if (range === 'Weekly') {
        // Weekly: Monday-Sunday
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        days.forEach((day, index) => {
            const option = document.createElement('option');
            option.value = index + 1; // Optional: store as 1–7
            option.textContent = day;
            resetDaySelect.appendChild(option);
        });
        resetDayContainer.style.display = 'block';
    } else if (range === 'Monthly') {
        // Monthly: 1–28
        for (let i = 1; i <= 28; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            resetDaySelect.appendChild(option);
        }
        resetDayContainer.style.display = 'block';
    } else {
        // Hide for other ranges
        resetDayContainer.style.display = 'none';
    }
}

// ==========================================================================================================
// -- Event Listeners --
// ==========================================================================================================

// Font Select -----------------------------------------------------------------------
fontSelect.addEventListener('change', (e) => {
    document.documentElement.style.setProperty(
        '--default-font',
        `${e.target.value}, sans-serif`
    );
});

// Budget Tracking ------------------------------------------------------------
budgetToggle.addEventListener('change', () => {
    budgetFields.style.display = budgetToggle.checked ? 'block' : 'none';
    if (budgetToggle.checked) updateResetDayOptions();
});

// Range Select ---------------------------------------------------------------
rangeSelect.addEventListener('change', () => {
    if (budgetToggle.checked) updateResetDayOptions();
});

// window loaded event listener ------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    await SessionMaintenance.logBook("settings", "window.DOMContentLoaded", "Settings page loaded");

    const currentPage = window.location.pathname.split("/").pop();
    SessionMaintenance.highlightActivePage(currentPage);

    SessionMaintenance.hideLoader();

    const username = localStorage.getItem('username');
    if (!username) {
        alert('No user logged in!');
        return;
    }

    document.getElementById('username').textContent = username;
    if (username) {
        await getTotalJourneys(username);
    }

    // Fetch current user settings
    try {
        SessionMaintenance.showLoader();
        await SessionMaintenance.logBook("settings", "window.DOMContentLoaded", "Getting current user settings");
        const res = await fetch(`${API_BASE_URL}/api/getUsers/${username}`);

        if (res.ok) {
            const user = await res.json();
            document.getElementById('tankVolume').value = user.tankVolume ?? "";
            document.getElementById('fuelCost').value = user.defFuelCost ?? "";
            document.getElementById('gallon-select').value = user.gallon ?? "UK";
            document.getElementById('fuel-select').value = user.fuelType ?? "Petrol"
            document.getElementById('font-select').value = user.userFont ?? "Lexend";
            document.getElementById('currency-select').value = user.currency ?? "£";
            document.getElementById('budget-toggle').checked = user.budgetEnabled ?? false;
            document.getElementById('budget-range').value = user.budgetRange ?? "Monthly";
            document.getElementById('budget-amount').value = user.budgetAmount ?? 0;
            document.getElementById('reset-day').value = user.reset ?? "";

        } else {
            await SessionMaintenance.logBook("settings", "window.DOMContentLoaded", "Failed fetching user settings", true);
        }
    } catch (err) {
        await SessionMaintenance.logBook("settings", "window.DOMContentLoaded", `Failed fetching user settings: ${err}`, true);
    } finally {
        SessionMaintenance.hideLoader();

        budgetFields.style.display = budgetToggle.checked ? 'block' : 'none';
        if (budgetToggle.checked) updateResetDayOptions();

        if (budgetToggle.checked) updateResetDayOptions();
    }

    // Handle save function -----------------------------------------------------------------------------------------
    document.getElementById('settingsForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const tankVolume = Number(document.getElementById('tankVolume').value);
        const fuelCost = Number(document.getElementById('fuelCost').value);
        let gallon = document.getElementById('gallon-select').value.toUpperCase();
        if (!gallon || gallon.trim() === "") gallon = "UK";
        const fuelType = document.getElementById('fuel-select').value || 'Petrol';
        const userFont = document.getElementById('font-select').value || "Lexend";
        const currency = document.getElementById('currency-select').value || "£";
        const newPassword = document.getElementById('new-password').value || "";
        const budgetEnabled = document.getElementById('budget-toggle').checked || false;
        const budgetRange = document.getElementById('budget-range').value || "Monthly";
        const budgetAmount = Number(document.getElementById('budget-amount').value) || 0;
        const resetDay = document.getElementById('reset-day').value || "1";

        // Check if budget amount is valid
        if (budgetEnabled && budgetAmount ?? 0 === 0)
        {
            alert('Budget Amount must be greater than 0');
            return;
        }

        // Build Payload
        const payLoad = {
            tankVolume,
            defFuelCost: fuelCost,
            gallon,
            fuelType: fuelType,
            userFont,
            currency,
            budgetEnabled,
            budgetRange,
            budgetAmount,
            resetDay,
        };

        // Handle password
        if (newPassword && newPassword.trim() !== "") {
            payLoad.newPassword = newPassword;
        }

        try {
            SessionMaintenance.showLoader();
            const res = await fetch(`${API_BASE_URL}/api/saveUsers/${username}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payLoad),
            });

            // Update Local storage
            localStorage.setItem('tankVolume', tankVolume.toString());
            localStorage.setItem('fuelCost', fuelCost.toString());
            localStorage.setItem('gallon', gallon);
            localStorage.setItem('fuelType', fuelType.toString());
            localStorage.setItem('userFont', userFont);
            localStorage.setItem('userFont', userFont);
            localStorage.setItem('currency', currency);
            localStorage.setItem('budgetEnabled', JSON.stringify(budgetEnabled));
            localStorage.setItem('budgetRange', budgetRange);
            localStorage.setItem('budgetAmount', budgetAmount.toString());
            localStorage.setItem('resetDay', resetDay);

            if (res.ok) {
                await SessionMaintenance.logBook("settings", "window.DOMContentLoaded", `Settings saved successfully {${JSON.stringify(payLoad)}}`);
                alert("Settings saved successfully");
            } else {
                const err = await res.text();
                await SessionMaintenance.logBook("settings", "window.DOMContentLoaded", `Failed to save user settings: ${err}`);
                alert(`Failed to save user settings: ${err}`);
            }
        } catch (err) {
            await SessionMaintenance.logBook("settings", "window.DOMContentLoaded", `Network Error: ${err}`, true);
        } finally {
            SessionMaintenance.hideLoader();
        }
    });
});
