import SessionMaintenance from "./sessionMaintenance.js";
import { API_BASE_URL } from "./config.js";

// window loaded event listener ------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
    await SessionMaintenance.logBook("yourJourneys", "window.DOMContentLoaded", "Home page loaded");
    SessionMaintenance.hideLoader();

    const username = localStorage.getItem("username");
    const tableBody = document.querySelector("#journeys-table tbody");

    if (!username) {
        tableBody.innerHTML = `<tr><td colspan="3">No username found</td></tr>`;
        return;
    }

    await getJourneys(tableBody, username);
});

// Get Journeys --------------------------------------------------------------------
async function getJourneys(tableBody, username) {
    try {
        SessionMaintenance.showLoader();
        const res = await fetch(`${API_BASE_URL}/api/getJourneys?username=${username}`, {})
        const journeys = await res.json();

        if (journeys.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="3">No journeys found.</td></tr>`;
            return;
        }

        await SessionMaintenance.logBook("yourJourneys", "getJourneys", `Getting Journeys`);
        journeys.forEach((journey) => {
            const row = document.createElement("tr");

            row.innerHTML = `
        <td>${new Date(journey.dateTime).toLocaleString()}</td>
        <td>${journey.description}</td>
        <td>${journey.distance}</td>
      `;

            row.addEventListener("click", () => {
                window.location.href = `journey-details.html?id=${journey._id}`;
            });

            tableBody.appendChild(row);
        });

    } catch (err) {
        await SessionMaintenance.logBook("yourJourneys", "getJourneys", `Network Error: ${err}`, true);
        tableBody.innerHTML = `<tr><td colspan="3">Error loading journeys</td></tr>`;
    } finally {
        SessionMaintenance.hideLoader();
    }
}