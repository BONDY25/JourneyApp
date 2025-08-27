export default class SessionMaintenance {

    // Global Variables
    static debugMode = true;
    static currentVersion = "1.0.0";
    static appName = "journeyApp";
    static sessionId = null;
    static username = null;

    // Start Session Function -------------------------------------------
    static startSession(username) {
        this.sessionId = crypto.randomUUID();
        this.username = username;
        this.logBook("SessionMaintenance", "startSession", `Starting session for ${username}`);
    }

    // LogBook Function ---------------------------------------------------
    static async logBook(source, func, notes, error = false) {
        // Construct Output
        const entry = {
            timestamp: new Date().toISOString(),
            app: this.appName,
            version: this.currentVersion,
            sessionId: this.sessionId,
            username: this.username,
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
                await fetch("/api/logBook", {
                    method: "POST",
                    headers: {"content-type": "application/json"},
                    body: JSON.stringify(entry)
                });
            } catch (err) {
                console.error("Failed to send log", err);
            }
        }
    }
}