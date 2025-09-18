// ==========================================================================================================
// -- Boilerplate --
// ==========================================================================================================

import {API_BASE_URL} from "./config.js";

export default class SessionMaintenance {

    // Global Variables
    static debugMode = false;
    static currentVersion = "1.0.0";
    static appName = "journeyApp";
    static sessionId = null;
    static username = null;

    // ==========================================================================================================
    // -- Operational Functions --
    // ==========================================================================================================

    // Start Session Function -------------------------------------------
    static startSession(username) {
        this.sessionId = crypto.randomUUID();
        this.username = username;

        // Save Session ID & Username
        localStorage.setItem("username", this.username);
        localStorage.setItem("sessionId", this.sessionId);

        this.logBook("SessionMaintenance", "startSession", `Starting session for ${username}`);
    }

    // LogBook Function ---------------------------------------------------
    static async logBook(source, func, notes, error = false) {
        // Construct Output
        const entry = {
            timestamp: new Date().toISOString(),
            app: this.appName,
            version: this.currentVersion,
            sessionId: this.sessionId ?? localStorage.getItem("sessionId"),
            username: this.username ?? localStorage.getItem("username"),
            source,
            func,
            notes
        };

        if (this.debugMode) {
            // Show as console error if error
            if (error) {
                console.error(entry);
            } else {
                console.log(entry);
            }
        } else {
            console.log(entry);
            try {
                await fetch(`${API_BASE_URL}/api/logBook`, {
                    method: "POST",
                    headers: {"content-type": "application/json"},
                    body: JSON.stringify(entry)
                });
            } catch (err) {
                console.error("Failed to send log", err);
            }
        }
    }

    // show & hide Loader -------------------------------------------------------------------------------------
    static showLoader() {
        document.getElementById("loader").classList.remove("hidden");
    }

    static hideLoader() {
        document.getElementById("loader").classList.add("hidden");
    }

    // Highlight active page on navbar -----------------------------------------------------------------------
    static highlightActivePage(currentPage) {

        // Map of pages
        const pageMap = {
            "home.html": "nav-home",
            "new-journey.html": "nav-add",
            "your-journeys.html": "nav-journeys",
            "full-stats.html": "nav-stats",
            "settings.html": "nav-settings"
        };

        const activeId = pageMap[currentPage];

        if (!activeId) return;

        // Remove class for all items first
        document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));

        // add active class to current page
        const activeEl = document.getElementById(activeId);
        if (activeEl) activeEl.classList.add("active");
    }
}