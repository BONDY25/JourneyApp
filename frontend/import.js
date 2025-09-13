import SessionMaintenance from "./sessionMaintenance.js";
import { API_BASE_URL } from "./config.js";
import Papa from 'papaparse';

const fileInput = document.getElementById("csvFile");
const importBtn = document.getElementById("importBtn");

// window loaded event listener ------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
    await SessionMaintenance.logBook("import", "window.DOMContentLoaded", "Import page loaded");
    SessionMaintenance.hideLoader();
});

// Import button Clicked -------------------------------------------------------------------
importBtn.addEventListener('click', () => {

    const file = fileInput.files[0];

    if (!file) {
        alert("Please choose a CSV file first.");
        return;
    }

    Papa.parse(file, {
        header: true, // CSV columns become object keys
        dynamicTyping: true, // automatically convert numbers
        skipEmptyLines: true,
        complete: async function (results) {
            await SessionMaintenance.logBook("import", "importBtn.click", `Parsed CSV: ${results.data}`);

            const journeys = results.data;

            if (!Array.isArray(journeys) || journeys.length === 0) {
                await SessionMaintenance.logBook("import", "importBtn.click", "No journeys found in CSV");
                alert("No journeys found in CSV");
                return;
            }

            try {
                SessionMaintenance.showLoader();
                const res = await fetch(`${API_BASE_URL}/api/importJourneys`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(journeys)
                });

                if (res.ok) {
                    alert("Journeys imported successfully!");
                    fileInput.value = "";
                } else {
                    const err = await res.text();
                    await SessionMaintenance.logBook("import", "importBtn.click", `Error importing journeys: ${err}`);
                    alert(`Error importing journeys: ${err}`);
                }
            } catch (err) {
                await SessionMaintenance.logBook("import", "importBtn.click", `Network Error: ${err}`, true);
                alert("Network error while importing CSV");
            } finally {
                SessionMaintenance.hideLoader();
            }
        }
    });
});
