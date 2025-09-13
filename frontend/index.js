import SessionMaintenance from "./sessionMaintenance.js";
import { API_BASE_URL } from "./config.js";

const submitLogin = document.getElementById('submitLogin');
//const submitReg = document.getElementById('submitRegister');

// window loaded event listener ------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
    await SessionMaintenance.logBook("login", "window.DOMContentLoaded", "login page loaded");
    SessionMaintenance.hideLoader();
});

// Store defaults ---------------------------------------------------------------------
async function getDefaults(username) {
    const settingsRes = await fetch(`${API_BASE_URL}/api/getUsers/${username}`);
    if (settingsRes.ok) {
        const user = await settingsRes.json();
        console.log("User object:", user);

        localStorage.setItem('tankVolume', user.tankVolume);
        localStorage.setItem('fuelCost', user.defFuelCost);
        localStorage.setItem('gallon', user.gallon);
        localStorage.setItem('currency', user.currency );
    }
}

// User Clicks Login Button -------------------------------------------------------------
submitLogin.addEventListener('click', async (e) => {
    e.preventDefault();

    // Get username and password form UI
    const username = String(document.getElementById('username').value).toLowerCase();
    const password = String(document.getElementById('password').value);

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
            alert(`Login failed: ${err}`);
            return;
        }

        // Store username
        await getDefaults(username);
        SessionMaintenance.startSession(username);
        window.location.href = "home.html";

    } catch (error) {
        console.error('Network Error:', error);
        alert(`Network Error: ${error}`);
    }
});

// User Clicks Register button ------------------------------------------------------------
submitReg.addEventListener('click', async (e) => {
    e.preventDefault();

    // Get username and password form UI
    const username = String(document.getElementById('username').value).toLowerCase();
    const password = String(document.getElementById('password').value);

    try {
        SessionMaintenance.showLoader();
        // send request to backend
        const res = await fetch(`${API_BASE_URL}/api/users`, {
            method: 'POST',
            headers: {'content-type': 'application/json'},
            body: JSON.stringify({username, password})
        });

        // evaluate backend response
        if (res.ok) {
            alert('User Registered!');

            // save username and open home page
            localStorage.setItem('username', username);
            localStorage.setItem('tankVolume', '64');
            localStorage.setItem('fuelCost', '1.4');
            localStorage.setItem('gallon', 'UK');
            localStorage.setItem('userFont', 'Lexend');
            localStorage.setItem('currency', '£');


            SessionMaintenance.startSession(username);

            window.location.href = "home.html";
        } else {
            const err = await res.text();
            alert(`Registration Failed: ${err}`);
        }
    } catch (error) {
        console.error('Network Error:', error);
        alert(`Network Error: ${error}`);
    } finally {
        SessionMaintenance.hideLoader();
    }
});


