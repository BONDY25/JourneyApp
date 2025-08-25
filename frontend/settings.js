// Content loaded event listener -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    const username = localStorage.getItem('username');
    if (!username) {
        alert('No user logged in!');
        return;
    }

    // Fetch current user settings
    try {
        const res = await fetch(`http://localhost:3000/api/getUsers/${username}`);

        if (res.ok) {
            const user = await res.json();
            document.getElementById('tankVolume').value = user.tankVolume ?? "";
            document.getElementById('fuelCost').value = user.defFuelCost ?? "";
        } else {
            console.error("Failed fetching user settings");
        }
    } catch (err) {
        console.error("Error fetching user settings", err);
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

            if (res.ok){
                alert("Settings saved successfully");
            } else {
                const err = await res.text();
                alert(`Failed to save user settings: ${err}`);
            }
        } catch (err) {
            console.error("Network Error: ", err);
        }
    });
});