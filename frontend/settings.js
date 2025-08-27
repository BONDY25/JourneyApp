// Content loaded event listener -------------------------------------------------------------
import SessionMaintenance from "./sessionMaintenance.js";

document.addEventListener('DOMContentLoaded', async () => {
    await SessionMaintenance.logBook("settings", "window.DOMContentLoaded", "Settings page loaded");
    const username = localStorage.getItem('username');
    if (!username) {
        alert('No user logged in!');
        return;
    }

    // Fetch current user settings
    try {
        await SessionMaintenance.logBook("settings", "window.DOMContentLoaded", "Getting current user settings");
        const res = await fetch(`http://localhost:3000/api/getUsers/${username}`);

        if (res.ok) {
            const user = await res.json();
            document.getElementById('tankVolume').value = user.tankVolume ?? "";
            document.getElementById('fuelCost').value = user.defFuelCost ?? "";
        } else {
            await SessionMaintenance.logBook("settings", "window.DOMContentLoaded", "Failed fetching user settings", true);
        }
    } catch (err) {
        await SessionMaintenance.logBook("settings", "window.DOMContentLoaded", `Failed fetching user settings: ${err}`, true);
    }

    // Handle save function
    document.getElementById('settingsForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const tankVolume = Number(document.getElementById('tankVolume').value);
        const fuelCost = Number(document.getElementById('fuelCost').value);

        try {
            const res = await fetch(`http://localhost:3000/api/saveUsers/${username}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({tankVolume, defFuelCost: fuelCost}),
            });

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
        }
    });
});