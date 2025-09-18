import {API_BASE_URL} from "./config.js";
import SessionMaintenance from "./sessionMaintenance.js";

const params = new URLSearchParams(window.location.search);
const journeyId = params.get("id");

// Page loaded -----------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
    await SessionMaintenance.logBook("editJourney", "window.DOMContentLoaded", "Edit journey page loaded");
    SessionMaintenance.hideLoader();

    await loadJourney();

    const form = document.getElementById("editJourneyForm");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        await saveJourney();
    });

    document.getElementById("deleteBtn").addEventListener("click", deleteJourney);
});

// format date time --------------------------------------------------------------------------
function formatDatetime(isoString){
    const date = new Date(isoString);
    const pad = (num) => num.toString().padStart(2,'0');

    const yyyy = date.getFullYear();
    const MM = pad(date.getMonth()+1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());

    return `${yyyy}-${MM}-${dd}T${hh}:${mm}` || "";
}

// Load Journey -----------------------------------------------------------------------------
async function loadJourney() {
    try {
        SessionMaintenance.showLoader();
        const res = await fetch(`${API_BASE_URL}/api/journeys/${journeyId}`);
        if (!res.ok) throw new Error("Failed to fetch journey");

        const journey = await res.json();
        document.getElementById("datetime").value = formatDatetime(journey.dateTime) || journey.dateTime?.split("T")[0] || ""
        document.getElementById("distance").value = journey.distance || "";
        document.getElementById("mpg").value = journey.mpg || "";
        document.getElementById("timedriven").value = journey.timeDriven || "";
    } catch (err) {
        await SessionMaintenance.logBook("editJourney", "loadJourney", `Error getting journey ${err}`, true);
    } finally {
        SessionMaintenance.hideLoader();
    }
}

// Save Journey -----------------------------------------------------------------------------
async function saveJourney() {
    const updated = {
        dateTime: document.getElementById("datetime").value,
        distance: document.getElementById("distance").value,
        mpg: document.getElementById("mpg").value,
        timeDriven: document.getElementById("timedriven").value,
    };

    try {
        SessionMaintenance.showLoader();
        const res = await fetch(`${API_BASE_URL}/api/journeys/${journeyId}`, {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(updated),
        });

        if (res.ok) {
            alert("Journey updated successfully!");
            window.location.href = "your-journeys.html";
        } else {
            throw new Error("Update failed");
        }
    } catch (err) {
        await SessionMaintenance.logBook("editJourney", "saveJourney", `Error saving journey ${err}`, true);
        alert("Failed to save changes.");
    } finally {
        SessionMaintenance.hideLoader();
    }
}

// Delete Journey -----------------------------------------------------------------------------
async function deleteJourney() {
    if (!confirm("Are you sure you want to delete this journey?")) return;

    try {
        SessionMaintenance.showLoader();
        const res = await fetch(`${API_BASE_URL}/api/journeys/${journeyId}`, {
            method: "DELETE",
        });

        if (res.ok) {
            alert("Journey deleted");
            window.location.href = "your-journeys.html";
        } else {
            throw new Error("Delete failed");
        }
    } catch (err) {
        await SessionMaintenance.logBook("editJourney", "deleteJourney", `Error deleting journey ${err}`, true);
        alert("failed to delete the journey");
    } finally {
        SessionMaintenance.hideLoader();
    }
}