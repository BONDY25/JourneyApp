// ==========================================================================================================
// -- Boilerplate --
// ==========================================================================================================

import SessionMaintenance from "./sessionMaintenance.js";
import { API_BASE_URL } from "./config.js";
const SM = SessionMaintenance;

const buttons = {
    btnRegister: SM.$('btnRegister'),
    btnLogin: SM.$('submitLogin'),
}

const inputs = {
    usernameInput: SM.$("username"),
    passwordInput: SM.$("password"),
}

// ==========================================================================================================
// -- Operational Functions --
// ==========================================================================================================

// Store defaults -------------------------------------------------------------------------------------------
async function getDefaults(username) {
    const settingsRes = await fetch(`${API_BASE_URL}/api/getUsers/${username}`);
    if (settingsRes.ok) {
        const user = await settingsRes.json();
        console.log("User object:", user);

        localStorage.setItem('tankVolume', user.tankVolume);
        localStorage.setItem('fuelCost', user.defFuelCost);
        localStorage.setItem('gallon', user.gallon);
        localStorage.setItem('fuelType', user.fuelType);
        localStorage.setItem('currency', user.currency );
        localStorage.setItem('distanceUnit', user.distanceUnit || "Miles");
        localStorage.setItem('speedUnit', user.speedUnit || "mph");

    }
}

// Login User -----------------------------------------------------------------------------------------------
async function loginUser(username, password){
    try {
        // Send request to backed
        const loginRes = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: {'content-type': 'application/json'},
            body: JSON.stringify({username, password})
        });

        // Evaluate backend response
        if (!loginRes.ok) {
            const err = await loginRes.text();
            await SM.cmbError(`Login failed: ${err}`);

            return;
        }

        // Store username
        await getDefaults(username);
        SM.startSession(username);
        window.location.href = "home.html";

    } catch (error) {
        console.error('Network Error:', error);
        await SM.cmbError(`Error logging in: ${error}`);
    }
}

// ==========================================================================================================
// -- Event Listeners --
// ==========================================================================================================

// window loaded event listener -----------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
    await SM.logBook("login", "window.DOMContentLoaded", "login page loaded");
    SM.hideLoader();
});

// User Clicks Login Button ---------------------------------------------------------------------------------
buttons.btnLogin.addEventListener('click', async (e) => {
    e.preventDefault();

    // Get username and password form UI
    const username = String(inputs.usernameInput.value).toLowerCase();
    const password = String(inputs.passwordInput.value);

    // login User
    await loginUser(username, password);

});

// Register Button Clicked ----------------------------------------------------------------------------------
buttons.btnRegister.addEventListener('click', async (e) => {
    e.preventDefault();
    window.location.href = "newUser.html";
});
