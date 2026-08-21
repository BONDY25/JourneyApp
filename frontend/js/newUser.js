// ==========================================================================================================
// -- Boilerplate --
// ==========================================================================================================

import SessionMaintenance from "./sessionMaintenance.js";
import { API_BASE_URL } from "./config.js";
const SM = SessionMaintenance;

const inputs = {
    usernameInput: SM.$('username'),
    passwordInput: SM.$('password'),
    passwordConfirmInput: SM.$('password-confirm'),
    robotInput: SM.$('robot'),
}

const buttons = {
    btnCreate: SM.$('btnCreate'),
    btnBack: SM.$('btnBack'),
}

// ==========================================================================================================
// -- Operational Functions --
// ==========================================================================================================

// Register new user ----------------------------------------------------------------------------------------
async function registerUser(username, password){
    try {
        SM.showLoader();
        // send request to backend
        const res = await fetch(`${API_BASE_URL}/api/users`, {
            method: 'POST',
            headers: {'content-type': 'application/json'},
            body: JSON.stringify({username, password})
        });

        // evaluate backend response
        if (res.ok) {
            await SM.cmbInfo(`Success`,`User Registered successfully.`);


            // save username and open home page
            localStorage.setItem('username', username);
            localStorage.setItem('tankVolume', '63');
            localStorage.setItem('fuelCost', '1.4');
            localStorage.setItem('gallon', 'UK');
            localStorage.setItem('fuelType', 'Petrol');
            localStorage.setItem('userFont', 'Lexend');
            localStorage.setItem('currency', '£');
            localStorage.setItem('distanceUnit', "Miles");
            localStorage.setItem('speedUnit', "mph");

            SM.startSession(username);

            window.location.href = "home.html";
        } else {
            const err = await res.text();
            await SM.cmbError(`Registration Failed: ${err}`);
        }
    } catch (error) {
        console.error('Network Error:', error);
        await SM.cmbError(`Error registering user: ${error}`);
    } finally {
        SM.hideLoader();
    }
}

// ==========================================================================================================
// -- Event Listeners --
// ==========================================================================================================

// Window loaded event listener -----------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
    await SM.logBook("newUser", "window.DOMContentLoaded", "New user page loaded");
    SM.hideLoader();
});

// Register Button ------------------------------------------------------------------------------------------
buttons.btnCreate.addEventListener('click', async (e) => {
    e.preventDefault();

    const username = String(inputs.usernameInput.value).toLowerCase();
    const password = String(inputs.passwordInput.value);
    const passwordConfirm = String(inputs.passwordConfirmInput.value);
    const robot = String(inputs.robotInput.value);

    if (!username || !password) {
        await SM.cmbError(`Please enter username and password`);
    } else if (password !== passwordConfirm) {
        await SM.cmbError(`Passwords do not match`);
    } else if (robot !== "I am not a robot.") {
        await SM.cmbError(`Hmm I think you are a robot...`);
    } else {
        await registerUser(username, password);
    }
});

// Back Button ----------------------------------------------------------------------------------------------
buttons.btnBack.addEventListener('click', async (e) => {
    e.preventDefault();
    window.location.href = "login.html";
});