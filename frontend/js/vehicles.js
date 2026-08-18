// ==========================================================================================================
// -- Boilerplate --
// ==========================================================================================================

import SessionMaintenance from "./sessionMaintenance.js";
import {API_BASE_URL} from "./config.js";

const SM = SessionMaintenance;
const username = localStorage.getItem("username");
const tableBody = document.querySelector("#vehicle-table tbody");
let localVehicleId = null;
let mode = 0; // 1 = Update Vehicle, 0 = New Vehicle

// DOM Elements --------------------------------------------------------------------------------------
const containers = {
    vehicleDetailsContainer: SM.$("vehicle-details"),
}

const inputs = {
    vehicleNameInput: SM.$("vehicle-name"),
    tankVolumeInput: SM.$("tankVolume"),
    fuelTypeInput: SM.$("fuelType"),
    makeAndModelInput: SM.$("vehicle-model"),
    lastCostPLInput: SM.$("lastCostPL"),
}

const buttons = {
    btnAdd: SM.$("btnAdd"),
    btnSave: SM.$("btnSave"),
    btnClose: SM.$("btnClose"),
    btnBack: SM.$("btnBack"),
}

// ==========================================================================================================
// -- Operational Functions --
// ==========================================================================================================

// Clear Fields -----------------------------------------------------------------------
function clearFields(){
    inputs.vehicleNameInput.value = "";
    inputs.tankVolumeInput.value = "";
    inputs.fuelTypeInput.value = "";
    inputs.makeAndModelInput.value = "";
    inputs.lastCostPLInput.value = "";
}

// Load Vehicles ----------------------------------------------------------------------
async function loadVehicles(tableBody, username) {
    try {
        SessionMaintenance.showLoader();
        tableBody.innerHTML = "";
        const res = await fetch(`${API_BASE_URL}/api/getVehicles?username=${username}`, {})
        const vehicles = await res.json();

        if (vehicles.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="3">No vehicles were found.</td></tr>`;
            return;
        }

        await SessionMaintenance.logBook("vehicles", "loadVehicles", `Getting Journeys`);
        vehicles.forEach((vehicle) => {
            const row = document.createElement("tr");

            row.innerHTML = `
        <td>${vehicle.name} - ${vehicle.makeAndModel}</td>
      `;

            row.addEventListener("click", async () => {
                localVehicleId = vehicle._id
                const vehicleData = await SessionMaintenance.getVehicleDetails(localVehicleId);

                inputs.vehicleNameInput.value = vehicleData.name;
                inputs.tankVolumeInput.value = vehicleData.tankVolume;
                inputs.fuelTypeInput.value = vehicleData.fuelType;
                inputs.makeAndModelInput.value = vehicleData.makeAndModel;
                inputs.lastCostPLInput.value = vehicleData.lastCostPL;
                localVehicleId = vehicleData._id

                containers.vehicleDetailsContainer.classList.remove('hidden');
                mode = 1;
            });

            tableBody.appendChild(row);
        });
    } catch (err) {
        await SessionMaintenance.logBook("vehicles", "loadVehicles", `Network Error: ${err}`, true);
        tableBody.innerHTML = `<tr><td colspan="3">Error loading vehicles</td></tr>`;
        await SessionMaintenance.cmbError(`Error loading vehicles: ${err}`);
    } finally {
        SessionMaintenance.hideLoader();
    }
}

// Save Vehicle Details -----------------------------------------------------------------
async function addVehicleDetails(vehicleDetails) {
    try {
        SessionMaintenance.showLoader();

        const res = await fetch(`${API_BASE_URL}/api/addVehicle`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(vehicleDetails)
        });

        if (res.ok) {
            await SessionMaintenance.logBook(
                "vehicles",
                "saveVehicleDetails",
                `Vehicle Added ${vehicleDetails.name}`
            );
            await SessionMaintenance.cmbInfo('Success', 'Vehicle Saved!');
            containers.vehicleDetailsContainer.classList.add('hidden');
            await loadVehicles(tableBody, username);
        } else {
            const err = await res.text();
            await SessionMaintenance.logBook("vehicles", "saveVehicleDetails", `Vehicle Submission failed. ${err}`);
            await SessionMaintenance.cmbError(`Error: ${err}`);
        }
    } catch (error) {
        await SessionMaintenance.logBook("vehicles", "saveVehicleDetails", `Network Error: ${error}`, true);
    } finally {
        SessionMaintenance.hideLoader();
    }
}

// Update Vehicle Details -----------------------------------------------------------------
async function saveVehicleDetails(vehicleDetails) {
    try {
        SessionMaintenance.showLoader();

        const url = `${API_BASE_URL}/api/updateVehicle/${vehicleDetails._id}`;

        const res = await fetch(url, {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(vehicleDetails),
        });

        if (res.ok) {
            await SessionMaintenance.cmbInfo(
                `Success`,
                `Vehicle updated successfully!`
            );

            await SessionMaintenance.logBook(
                "vehicles",
                "saveVehicleDetails",
                `Vehicle Saved successfully! ${JSON.stringify(vehicleDetails)}`
            );
            containers.vehicleDetailsContainer.classList.add('hidden');
            clearFields();
            await loadVehicles(tableBody, username);
        } else {
            const errorText = await res.text();
            console.error("Update failed:", errorText);
            throw new Error(errorText);
        }

    } catch (err) {
        await SessionMaintenance.logBook(
            "vehicles",
            "saveVehicleDetails",
            `Error saving vehicle ${err}`,
            true
        );
        await SessionMaintenance.cmbError(
            `Failed to update vehicle: ${err}`
        );
    } finally {
        SessionMaintenance.hideLoader();
    }
}

// ==========================================================================================================
// -- Event Listeners --
// ==========================================================================================================

// window loaded event listener ------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
    await SessionMaintenance.logBook("vehicles", "window.DOMContentLoaded", "Vehicles page loaded");

    containers.vehicleDetailsContainer.classList.add('hidden');

    SessionMaintenance.hideLoader();
    localVehicleId = null;

    if (!username) {
        tableBody.innerHTML = `<tr><td colspan="3">No vehicles found</td></tr>`;
        return;
    }
    await loadVehicles(tableBody, username);
});

// New Vehicle Button click ---------------------------------------------------------
buttons.btnAdd.addEventListener("click", async () => {
    await SessionMaintenance.logBook("vehicles", "btnAdd.click", `Add Button Clicked`);
    clearFields();
    mode = 0;
    localVehicleId = null;
    containers.vehicleDetailsContainer.classList.remove('hidden');
});

// Save Vehicle Button click ---------------------------------------------------------
buttons.btnSave.addEventListener("click", async (e) => {
    e.preventDefault();

    await SessionMaintenance.logBook(
        "vehicles",
        "btnSave.click",
        "Save Button Clicked"
    );

    const vehicleId = inputs.vehicleNameInput.value;
    const fuelType = inputs.fuelTypeInput.value;
    const tankVolume = inputs.tankVolumeInput.value;
    const makeAndModel = inputs.makeAndModelInput.value;
    const lastCostPL = inputs.lastCostPLInput.value;

    // Check vehicle details
    if (!vehicleId || !fuelType || !tankVolume) {
        await SessionMaintenance.cmbError("Please complete all Fields");
        return;
    }

    const vehicleDetails = {
        userId: localStorage.getItem('username') || 'unknown',
        name: vehicleId,
        fuelType,
        tankVolume,
        makeAndModel,
        lastCostPL
    };

    if (mode === 0) {
        await addVehicleDetails(vehicleDetails);
    } else if (mode === 1) {
        vehicleDetails._id = localVehicleId;
        await saveVehicleDetails(vehicleDetails);
    }
});

// Close Button click ---------------------------------------------------------
buttons.btnClose.addEventListener("click", async () => {
    await SessionMaintenance.logBook("vehicles", "btnClose.click", `Close Button Clicked`);
    containers.vehicleDetailsContainer.classList.add('hidden');
    localVehicleId = null;
    mode = 0;
});

// Back Button Clicked -----------------------------------------------------------
buttons.btnBack.addEventListener("click", async () => {
    window.location.href = "settings.html";
});