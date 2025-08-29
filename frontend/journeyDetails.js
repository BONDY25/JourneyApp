import SessionMaintenance from "./sessionMaintenance";

// window loaded event listener ------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
    await SessionMaintenance.logBook("journeyDetails", "window.DOMContentLoaded", "journey page loaded");
    await getJourneys();
});

// Get Journeys -----------------------------------------------------------------------------------------
async function getJourneys() {
    try {
        // Get ID from URL
        const params = new URLSearchParams(window.location.search);
        const journeyId = params.get("id");

        if (!journeyId) {
            await SessionMaintenance.logBook("journeyDetails", "getJourney", `No Journey Found ${journeyId}`, true);
            return;
        }

        // Log action
        await SessionMaintenance.logBook("journeyDetails", "getJourney", `Getting journey ${journeyId}`);

        // Get Journey Details
        const response = await fetch(`http://localhost:3000/api/getJourney/${journeyId}`, {
            method: "GET",
            headers: {"Content-Type": "application/json"}
        });

        if (!response.ok) throw new Error("Failed to get journey details");

        const journey = await response.json();
        await SessionMaintenance.logBook("journeyDetails", "getJourney", `journey Data: ${journey}`);

        // Populate Fields
        document.getElementById("DateTime").textContent = journey.dateTime || "-";
        document.getElementById("description").textContent = journey.description || "-";
        document.getElementById("distance").textContent = journey.distance || "0";
        document.getElementById("timeDriven").textContent = journey.timeDriven || "-";
        document.getElementById("fuelUsedL").textContent = journey.fuelUsedL || "0";
        document.getElementById("cost").textContent = journey.cost || "0";
        document.getElementById("mpg").textContent = journey.mpg || "0";
        document.getElementById("temp").textContent = journey.temp || "0";
        document.getElementById("condition").textContent = journey.condition || "-";
        document.getElementById("avgSpeed").textContent = journey.avgSpeed || "0";
        document.getElementById("costPerMile").textContent = journey.costPerMile || "0";
        document.getElementById("percOfTank").textContent = journey.percOfTank || "0";
    } catch (err) {
        await SessionMaintenance.logBook("journeyDetails", "getJourney", `Error getting journeys ${err}`, true);
    }
}