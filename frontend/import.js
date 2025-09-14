import SessionMaintenance from "./sessionMaintenance.js";
import { API_BASE_URL } from "./config.js";
//import Papa from 'papaparse';

const fileInput = document.getElementById("csvFile");
const importBtn = document.getElementById("importBtn");

// window loaded event listener ------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
    await SessionMaintenance.logBook("import", "window.DOMContentLoaded", "Import page loaded");
    SessionMaintenance.hideLoader();
});

// Chunk Array helper method ------------------------------------------------------------------------------
function chunkArray(arr, size) {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size));
    }
    return result;
}

// Import button Clicked -------------------------------------------------------------------
importBtn.addEventListener('click', () => {

    const file = fileInput.files[0];

    if (!file) {
        alert("Please choose a CSV file first.");
        return;
    }

    window.Papa.parse(file, {
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

                // Split data into chunks
                const chunks = chunkArray(journeys, 100);

                for (let i = 0 ; i < chunks.length; i++) {
                    const res = await fetch(`${API_BASE_URL}/api/importJourneys`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(chunks[i])
                    });

                    if (!res.ok) {
                        const err = await res.text();
                        await SessionMaintenance.logBook("import", "importBtn.click", `Error importing batch ${i + 1}: ${err}`);
                        alert(`Error importing batch ${i + 1}: ${err}`);
                        return;
                    }
                }

                alert("All Journeys successfully imported.");
                fileInput.value = "";

            } catch (err) {
                await SessionMaintenance.logBook("import", "importBtn.click", `Network Error: ${err}`, true);
                alert("Network error while importing CSV");
            } finally {
                SessionMaintenance.hideLoader();
            }
        }
    });
});
