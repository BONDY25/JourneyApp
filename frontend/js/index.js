// ==========================================================================================================
// -- Boilerplate --
// ==========================================================================================================

import SessionMaintenance from "./sessionMaintenance.js";
import { API_BASE_URL } from "./config.js";

const SM = SessionMaintenance;

// ==========================================================================================================
// -- Event Listeners --
// ==========================================================================================================

// window loaded event listener -----------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
    await SM.logBook("welcome", "window.DOMContentLoaded", "Welcome page loaded");
    SM.hideLoader();
});



