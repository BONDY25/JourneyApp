import SessionMaintenance from "./sessionMaintenance.js";
import { API_BASE_URL } from "./config.js";

const fontSelect = document.getElementById('font-select');

// Font Select -----------------------------------------------------------------------
fontSelect.addEventListener('change', (e) => {
    document.documentElement.style.setProperty(
        '--default-font',
        `${e.target.value}, sans-serif`
    );
});

// window loaded event listener ------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    await SessionMaintenance.logBook("settings", "window.DOMContentLoaded", "Settings page loaded");
    SessionMaintenance.hideLoader();

    const username = localStorage.getItem('username');
    if (!username) {
        alert('No user logged in!');
        return;
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
            document.getElementById('font-select').value = user.userFont ?? "Lexend";

        } else {
            await SessionMaintenance.logBook("settings", "window.DOMContentLoaded", "Failed fetching user settings", true);
        }
    } catch (err) {
        await SessionMaintenance.logBook("settings", "window.DOMContentLoaded", `Failed fetching user settings: ${err}`, true);
    } finally {
        SessionMaintenance.hideLoader();
    }

    // Handle save function
    document.getElementById('settingsForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const tankVolume = Number(document.getElementById('tankVolume').value);
        const fuelCost = Number(document.getElementById('fuelCost').value);
        let gallon = document.getElementById('gallon-select').value.toUpperCase();
        if (!gallon || gallon.trim() === "") gallon = "UK";
        const userFont = document.getElementById('font-select').value || "Lexend";

        console.log("Saving settings:", {tankVolume, defFuelCost: fuelCost, gallon, userFont});

        try {
            SessionMaintenance.showLoader();
            const res = await fetch(`${API_BASE_URL}/api/saveUsers/${username}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({tankVolume, defFuelCost: fuelCost, gallon, userFont}),
            });

            // Update Local storage
            localStorage.setItem('tankVolume', tankVolume.toString());
            localStorage.setItem('fuelCost', fuelCost.toString());
            localStorage.setItem('gallon', gallon);
            localStorage.setItem('userFont', userFont);

            if (res.ok) {
                await SessionMaintenance.logBook("settings", "window.DOMContentLoaded", "Settings saved successfully");
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