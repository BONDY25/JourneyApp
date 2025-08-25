const fileInput = document.getElementById("csvFile");
const importBtn = document.getElementById("importBtn");

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
            console.log("Parsed CSV:", results.data); // check in console

            const journeys = results.data;

            if (!Array.isArray(journeys) || journeys.length === 0) {
                alert("No journeys found in CSV");
                return;
            }

            try {
                const res = await fetch("http://localhost:3000/api/importJourneys", {
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
                    alert(`Error importing journeys: ${err}`);
                }
            } catch (err) {
                console.error("Network Error:", err);
                alert("Network error while importing CSV");
            }
        }
    });
});
