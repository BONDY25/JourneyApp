import Papa from "https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js";

const csvFileInput = document.getElementById("csvFile");
const importBtn = document.getElementById("importBtn");

// Import button Clicked -------------------------------------------------------------------
importBtn.addEventListener("click", () => {
    const file = csvFileInput.files[0];
    if (!file) {
        alert("Please choose a CSV file!");
        return;
    }

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async function (result) {
            console.log("CSV Parsed:", result.data);

            // Format data
            const journeys = result.data.map(j => ({
                user: j.user,
                description: j.description,
                dateTime: new Date(j.dateTime),
                distance: Number(j.distance),
                mpg: Number(j.mpg),
                timeDriven: Number(j.timeDriven),
                temp: Number(j.temp),
                condition: j.condition || "Dry",
                costPl: Number(j.costPl),
                avgSpeed: Number(j.avgSpeed),
                totalCost: Number(j.totalCost),
                costPerMile: Number(j.costPerMile),
                fuelUsedL: Number(j.fuelUsedL),
                percOfTank: Number(j.percOfTank),
            }));

            // Send data to backend
            try {
                const res = await fetch("https://localhost:3000/api/importJourneys", {
                    method: "POST",
                    headers: {"content-type": "application/json"},
                    body: JSON.stringify(journeys),
                });

                if (res.ok) {
                    alert("Successfully imported!");
                } else {
                    const err = await res.text();
                    alert("Failed to import. " + err);
                }
            } catch (err) {
                console.error(err);
                alert("Network error while importing CSV");
            }
        }
    });
});