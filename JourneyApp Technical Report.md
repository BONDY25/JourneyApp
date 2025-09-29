# Journey App

#### Aiden Bond \- 24/09/2025

The Journey App is designed to replace a manual Google Sheet previously used to track fuel consumption, fuel costs, and journey details. The application provides a more efficient and user-friendly way to record driving data, calculate expenses, and visualise journey statistics. By leveraging a web-based interface integrated into an Android WebView, the app allows users to input journey details directly, automatically calculate metrics such as fuel used, cost per mile, and average fuel efficiency, and view summarized statistics over time. The app uses a MongoDB Atlas cloud database to securely store user and journey data, while an Express.js backend provides a RESTful API for data management and retrieval. This design reduces manual effort, enhances data accuracy, and provides real-time insights into driving costs and patterns.

This report documents a snapshot version of the application. This version is fully functional but requires further testing before it can be considered complete. The application is an Android app that incorporates a WebView, which points to a WebApp hosted on the Render web service. The WebApp uses a MongoDB Atlas cloud-hosted database as its primary data management engine, storing all information used by the app to track users and their journeys.

---

## User Flow

![JourneyApp Flow](https://github.com/user-attachments/assets/c846fb68-621f-4780-87e8-46a9ca6e33c8)

---

## Login Page

This page allows users to either log in or register. When a username and password are entered, the system checks the database for a match. If a valid match is found, the user is logged in. If the credentials do not match, an error message is displayed indicating that the username or password is invalid. If the username does not exist in the database, the page switches to a “register” mode, allowing the user to set a password and complete a reCAPTCHA verification in order to register as a new user.

### Login Page \- Design

The login page is implemented using standard **HTML5** markup and structured to ensure responsiveness, accessibility, and security.

#### **Document Head**

* `<!DOCTYPE html>` declares the document as HTML5.  
* `<html lang="en">` specifies English as the document language for accessibility tools and search engines.  
* The `<head>` section defines metadata:  
  * `<meta charset="utf-8"/>` sets UTF-8 encoding to support a wide range of characters.  
  * `<meta name="viewport" content="width=device-width, initial-scale=1.0"/>` ensures mobile responsiveness by scaling the layout to the device width.  
  * `<title>Login</title>` sets the browser tab title.  
  * `<link href="assets/styles.css" rel="stylesheet"/>` links to the external CSS file containing the page’s styling rules.  
  * `<link rel="icon" type="image/png" href="assets/JourneyApp-logo-1.png"/>` assigns a custom favicon.

  #### **Body Content**

* **Loader Overlay**

   ``` html
  <div id="loader" class="loader-overlay">
      <div class="spinner"></div>
  </div>
   ```
    
  * A loader element is included for use during asynchronous operations (e.g., login validation).  
  * The nested `<div class="spinner"></div>` represents a visual spinner, styled via CSS.

* **Application Container**

   `<div id="app" class="app">...</div>`  
  * Serves as the main container for the login form and related UI elements.  
  * Includes a header `<h1>` for the page title and a horizontal rule `<hr>` for separation.

* **Login Form**

   `<form id="login-form">...</form>`  
  * Contains input fields for user credentials:  
    * `<label for="username">` and `<input type="text" id="username" required>`  captures the username, marked as a required field.  
    * `<label for="password">` and `<input type="password" id="password" required>`  captures the password securely, also required.

  * A **reCAPTCHA widget** container is included for bot protection:

  ``` html
       <div id="captcha-container" style="display: none;"> 
         	<div class="g-recaptcha" data-sitekey="..."></div>
      </div>
  ```

   * Initially hidden (`display: none`) and activated dynamically as needed.  
   * Uses Google reCAPTCHA with a site-specific key for preventing automated login attempts.

* **Action Buttons**

``` html
  <div class="button-group">
    <button type="submit" id="submitLogin" class="button">Login</button>
    <button type="submit" id="submitRegister" class="button" style="display: none">Register</button>
  </div>
```

  * Two buttons are available:  
    * **Login** (`submitLogin`) is visible by default, but hidden in registration mode  
    * **Register** (`submitRegister`) is hidden initially, but made visible when in registration mode.

  #### **External Scripts**

* Google’s reCAPTCHA API is included with:  
   `<script src="https://www.google.com/recaptcha/api.js" async defer></script>`  
  * This loads the reCAPTCHA library asynchronously without blocking the page rendering.

* A module script `index.js` is linked:  
  `<script type="module" src="index.js"></script>`  
  * This file contains the client-side logic for handling form submission, validation, and API communication.

## Login Page \- JavaScript

The JavaScript module (`index.js`) provides the client-side logic for handling login, registration, session management, and user interface updates. It is written as an **ES6 module**, using `import` statements and modern asynchronous (`async/await`) syntax for handling API requests.

**Imports and Global References**  

``` js
import SessionMaintenance from "./sessionMaintenance.js";
import { API_BASE_URL } from "./config.js";

const usernameInput = document.getElementById("username");  
const submitLogin = document.getElementById("submitLogin");  
const submitReg = document.getElementById("submitRegister");
const captchaContainer = document.getElementById("captcha-container");
```

* **SessionMaintenance**: An imported module handling session persistence, loader control, and logging.  
* **API\_BASE\_URL**: Configuration variable defining the backend API root URL.  
* **DOM references**: Cached selectors for the username field, login and register buttons, and the CAPTCHA container.

#### **Operational Functions**

1. **`getDefaults(username)`**

   * Sends a GET request to `API_BASE_URL/api/getUsers/{username}`.  
   * If successful, retrieves user configuration (e.g., tank volume, fuel cost, units, currency).  
   * Stores these values in `localStorage` for persistence across sessions.
  
``` js
// Store defaults ---------------------------------------------------------------------
async function getDefaults(username) {
    const settingsRes = await fetch(`${API_BASE_URL}/api/getUsers/${username}`);
    if (settingsRes.ok) {
        const user = await settingsRes.json();
        console.log("User object:", user);

        localStorage.setItem('tankVolume', user.tankVolume);
        localStorage.setItem('fuelCost', user.defFuelCost);
        localStorage.setItem('gallon', user.gallon);
        localStorage.setItem('currency', user.currency );
    }
}
```

2. **`loginUser(username, password)`**  
   * Sends a POST request to `API_BASE_URL/api/login` with JSON credentials.  
   * Handles success or failure:  
     * On failure → displays error via `alert`.  
     * On success → retrieves user defaults, starts the session, and redirects to `home.html`.  
   * Includes error handling for network-related issues.
  
``` js
// Login User --------------------------------------------------------------------------------------
async function loginUser(username, password){
    try {
        // Send request to backed
        const loginRes = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: {'content-type': 'application/json'},
            body: JSON.stringify({username, password})
        });

        // Evaluate backend response
        if (!loginRes.ok) {
            const err = await loginRes.text();
            alert(`Login failed: ${err}`);
            return;
        }

        // Store username
        await getDefaults(username);
        SessionMaintenance.startSession(username);
        window.location.href = "home.html";

    } catch (error) {
        console.error('Network Error:', error);
        alert(`Network Error: ${error}`);
    }
}

```

3. **`registerUser(username, password)`**

   * Displays a loader while processing.  
   * Sends a POST request to `API_BASE_URL/api/users` with credentials and the CAPTCHA response.  
   * On success:  
     * Alerts the user of successful registration.  
     * Stores default user preferences in `localStorage` (e.g., default tank volume, cost, currency, font).  
     * Starts the session and redirects to `home.html`.  
   * On failure → displays server error messages.  
   * Loader is hidden once complete (via `finally`).
  
``` js
// Register new user --------------------------------------------------------------------------------
async function registerUser(username, password){
    try {
        SessionMaintenance.showLoader();
        // send request to backend
        const res = await fetch(`${API_BASE_URL}/api/users`, {
            method: 'POST',
            headers: {'content-type': 'application/json'},
            body: JSON.stringify({username, password, captcha: captchaResponse})
        });

        // evaluate backend response
        if (res.ok) {
            alert('User Registered!');

            // save username and open home page
            localStorage.setItem('username', username);
            localStorage.setItem('tankVolume', '63');
            localStorage.setItem('fuelCost', '1.4');
            localStorage.setItem('gallon', 'UK');
            localStorage.setItem('userFont', 'Lexend');
            localStorage.setItem('currency', '£');

            SessionMaintenance.startSession(username);

            window.location.href = "home.html";
        } else {
            const err = await res.text();
            alert(`Registration Failed: ${err}`);
        }
    } catch (error) {
        console.error('Network Error:', error);
        alert(`Network Error: ${error}`);
    } finally {
        SessionMaintenance.hideLoader();
    }
}
```

4. **`updateUi(username)`**

   * Checks if the provided username exists in the backend.  
   * If the user exists → shows the **Login** button and hides registration and CAPTCHA.  
   * If not found (404) → shows the **Register** button and enables CAPTCHA.  
   * Unexpected responses are logged as warnings.
  
``` js
// Update UI ---------------------------------------------------------------------------
async function updateUi(username){
    try {
        const res = await fetch(`${API_BASE_URL}/api/getUsers/${username}`);

        if (res.ok) {
            // User exists -> show Login only
            submitLogin.style.display = "block";
            submitReg.style.display = "none";
            captchaContainer.style.display = "none";
        } else if (res.status === 404) {
            // User not found -> show Register + Captcha
            submitLogin.style.display = "none";
            submitReg.style.display = "block";
            captchaContainer.style.display = "block";
        } else {
            console.warn("Unexpected response when checking user:", res.status);
        }
    } catch (err) {
        console.error("Error checking user:", err);
    }
}
```

#### **Event Listeners**

1. **`window.addEventListener('DOMContentLoaded', …)`**

   * Executes after the DOM is loaded.  
   * Logs the page load event via `SessionMaintenance.logBook`.  
   * Hides the loader overlay.
  
``` js
// window loaded event listener ------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
    await SessionMaintenance.logBook("login", "window.DOMContentLoaded", "login page loaded");
    SessionMaintenance.hideLoader();
});
```

2. **`usernameInput.addEventListener('blur', …)`**

   * Triggered when the user leaves the username input field.  
   * Cleans and normalises the input (lowercase \+ trimmed).  
   * Calls `updateUi()` to adjust the interface (Login vs Register options).
  
``` js
// User input leave -------------------------------------------------------------------------
usernameInput.addEventListener("blur", async () => {
    const username = String(usernameInput.value).toLowerCase().trim();
    if (!username) return;

    await updateUi(username);
});
```

3. **`submitLogin.addEventListener('click', …)`**

   * Prevents the default form submission.  
   * Extracts `username` and `password` from the form.  
   * Calls `loginUser()` to authenticate with the backend.
  
``` js
// User Clicks Login Button -------------------------------------------------------------
submitLogin.addEventListener('click', async (e) => {
    e.preventDefault();

    // Get username and password form UI
    const username = String(document.getElementById('username').value).toLowerCase();
    const password = String(document.getElementById('password').value);

    // login User
    await loginUser(username, password);

});
```

4. **`submitReg.addEventListener('click', …)`**

   * Prevents the default form submission.  
   * Extracts `username` and `password` values.  
   * Retrieves a CAPTCHA token using `grecaptcha.getResponse()`.  
   * Ensures CAPTCHA validation before attempting registration.  
   * Calls `registerUser()` if validation passes.
  
``` js
// User Clicks Register button ------------------------------------------------------------
submitReg.addEventListener('click', async (e) => {
    e.preventDefault();

    // Get username and password form UI
    const username = String(document.getElementById('username').value).toLowerCase();
    const password = String(document.getElementById('password').value);

    // Get Captcha token
    const captchaResponse = grecaptcha.getResponse();
    if (!captchaResponse) {
        alert("Please verify that you are not a robot.");
        return;
    }

    // Register User
    await registerUser(username, password);

});
```

#### **Key Features**

* **Session Handling**: Relies on `SessionMaintenance` for persisting login state and showing/hiding loading indicators.  
* **Security Considerations**:  
  * Passwords are never stored in the browser; only sent to the backend via secure API requests.  
  * Google reCAPTCHA is integrated to mitigate bot-based registration attempts.  
* **User Experience**:  
  * Loader overlay provides feedback during async operations.  
  * UI dynamically adapts to whether a username exists (Login vs Register path).  
  * Errors are surfaced directly via alerts for clarity.

---

## Home Page

The Home page is the first page a user sees after logging in or registering. It provides a quick overview of their driving and fuel usage data. At the top, the user is presented with total summary statistics, including their total mileage, total travel time, total fuel used, overall costs, and average miles per gallon (MPG).

In addition to the lifetime totals, the Home page also displays a 28-day summary showing recent mileage, time spent driving, fuel consumption, costs, and fuel efficiency. This allows the user to monitor short-term trends in their usage.

The page also includes a cost breakdown for the past 7, 14, and 28 days, giving users a clear picture of how their fuel expenses are changing over time.

Together, these elements make the Home page a dashboard-style landing screen, designed to give the user a quick but detailed snapshot of their driving habits and costs without needing to dig into the full statistics page.

## Home Page \- Design

The home page serves as the main dashboard of the WebApp, displaying journey statistics and providing navigation to other sections. It is implemented using **HTML5** markup with a layout designed for clarity, responsiveness, and mobile accessibility.

#### **Document Head**

* `<!DOCTYPE html>` declares the document as an HTML5 file.  
* `<html lang="en">` specifies the document language for accessibility.  
* `<head>` section metadata:  
  * `<meta charset="utf-8"/>` ensures proper text encoding.  
  * `<meta name="viewport" content="width=device-width, initial-scale=1.0"/>` optimises scaling for mobile devices.  
  * `<title>Journey App - Home</title>` sets the browser tab title.  
  * `<link href="assets/styles.css" rel="stylesheet"/>` links the external stylesheet.  
  * `<link rel="icon" type="image/png" href="assets/JourneyApp-logo-1.png"/>` sets the favicon.  
  * `<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet"/>` loads Google’s Material Symbols icon font for navigation icons.

#### **Body Content**

**Loader Overlay**

``` html
<div id="loader" class="loader-overlay">
    <div class="spinner"></div>
</div>
```

* A visual loader used during asynchronous data retrieval or page transitions.  
  * The spinner is styled with CSS to provide feedback while the page is processing.

**Main Application Container**

 `<div id="app" class="app">...</div>`

* Contains the page title and primary dashboard statistics.  
  * **Header and Divider**: `<h1>Journey App</h1>` with `<hr>` for separation.

**Statistics Section (`#stats`)**

* Structured into three subsections, each styled with `class="stats numbers"`:  
  * **Summary Statistics (`#sum-stats`)**  
     Displays overall totals:  
    * Total Miles, Total Time, Total Fuel Used, Total Cost, and Average MPG.  
      * Each value is dynamically updated inside a `<span>` element with an `id`.

    * **28-Day Statistics (`id="Past 28 days"`)**  
       Provides recent performance metrics over the last 28 days.  
      * Includes Miles, Time, Fuel, Cost, and MPG.  
      * Allows users to compare recent driving habits with overall performance.

    * **Costing Statistics (`#detail-stats`)**  
       Focuses on cost-related metrics over different timescales:  
      * Last 7 days, 14 days, and 28 days.  
      * Provides insight into fuel expenditure trends.

#### **Navigation Bar**

`<div id="nav-bar">...</div>`

* Positioned at the bottom of the page for mobile accessibility.  
* Each **navigation item** (`<a class="nav-item">`) consists of:  
  * A **Material Symbols icon** (`<span class="material-symbols-outlined">`).  
  * A **label** (`<span class="label">`).

Navigation links include:

* **Home** (`home.html`)  
* **Add** (new journey entry, `new-journey.html`)  
* **Journeys** (`your-journeys.html`)  
* **Stats** (`full-stats.html`)  
* **Settings** (`settings.html`)

This provides clear, icon-driven navigation for quick access to key features.

#### **External Script**

`<script type="module" src="home.js"></script>`

* Loads the JavaScript module (`home.js`) that controls the home page’s dynamic behaviour.  
* Likely handles data retrieval, calculations, and updating of statistics within the DOM.

### **Key Features**

* **Dashboard Layout**: Presents both cumulative and recent driving statistics in a structured format.  
* **Dynamic Content**: Placeholder `<span>` elements with IDs allow JavaScript to update statistics in real time.  
* **Mobile-Friendly Navigation**: Bottom navigation bar with icons and labels ensures usability on smaller screens.  
* **User Feedback**: Loader overlay prevents confusion during background operations.

## Home Page \- JavaScript

The `home.js` module provides the client-side logic for the **Home Page dashboard**. It retrieves user-specific statistics from the backend API, updates the UI with calculated values, and ensures the session is valid. The module uses modern **ES6 features**, including imports and asynchronous operations (`async/await`).

#### **Imports and Configuration**

``` js
import SessionMaintenance from "./sessionMaintenance.js";
import {API_BASE_URL} from "./config.js";

const currency = localStorage.getItem('currency');
```

* **SessionMaintenance**: Utility module that handles session persistence, logging, highlighting navigation, and loader display.  
* **API\_BASE\_URL**: Imported configuration constant that defines the backend API root endpoint.  
* **currency**: Retrieved from `localStorage` to display costs with the correct currency symbol throughout the dashboard.

#### **Operational Functions**

1. **`loadSummary(username)`**

   * Fetches overall journey statistics from `/api/summary/{username}`.  
   * Parses totals for miles, time, fuel used, cost, and average MPG.  
   * Formats **time** into minutes or hours depending on duration.  
   * Updates UI by populating `<span>` elements (`totalMiles`, `totalTime`, `totalFuel`, `totalCost`, `avgMpg`).  
   * Logs the event with `SessionMaintenance.logBook()`.
  
``` js
// Load summary --------------------------------------------------------------------------------------
async function loadSummary(username) {
    try {
        SessionMaintenance.showLoader();
        const res = await fetch(`${API_BASE_URL}/api/summary/${username}`);
        const summary = await res.json();
        const formattedTime = summary.totalTime > 60 ? summary.totalTime / 60 : summary.totalTime;
        const timeUnit = summary.totalTime > 60 ? "Hours" : "Minutes";

        // Total Miles
        document.getElementById('totalMiles').textContent = summary.totalMiles.toLocaleString(undefined, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        });
        // Total Time
        document.getElementById('totalTime').textContent = `${formattedTime.toLocaleString(undefined, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        })} ${timeUnit}`;
        // Total Fuel
        document.getElementById('totalFuel').textContent = summary.totalFuel.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + " L";
        // Total Cost
        document.getElementById('totalCost').textContent = currency + summary.totalCost.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        // Average MPG
        document.getElementById('avgMpg').textContent = summary.avgMpg.toLocaleString(undefined, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        });

        await SessionMaintenance.logBook("home", "loadSummary", `Summary Loaded: ${summary}`);
    } catch (err) {
        console.error("error loading summary:", err);
    } finally {
        SessionMaintenance.hideLoader();
    }
}
```

2. **`loadCosts(username)`**

   * Retrieves cost breakdown from `/api/costs/{username}`.  
   * Extracts costs for the last **7, 14, and 28 days**.  
   * Updates UI elements (`seven`, `fourteen`, `twentyEight`).  
   * Displays values with two decimal places and the correct currency symbol.  
   * Errors are logged to the console if the API request fails.
  
``` js
// Load Insights -----------------------------------------------------------------------------------------------
async function loadInsights(username) {
    try {
        SessionMaintenance.showLoader();

        // get summary for totals
        const res = await fetch(`${API_BASE_URL}/api/summary/${username}`);
        if (!res.ok) throw new Error("Failed to fetch summary");
        const summary = await res.json();

        const tankVolume = localStorage.getItem('tankVolume') || 63;

        // Times around the world
        document.getElementById('aroundWorld').textContent = (summary.totalMiles / 29901).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        // Years Driving
        document.getElementById('yearsDriven').textContent = (summary.totalTime / 525600).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        // Longest Distance
        document.getElementById('longestDistance').textContent = `${summary.longestDistance.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })} Miles`;

        // Longest Time
        document.getElementById('longestTime').textContent = `${summary.longestTime.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        })} Minutes`;

        // Best Journey
        document.getElementById('bestJourney').textContent = `${summary.bestMpg.toLocaleString(undefined, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        })} MPG`;


        // Tanks Used
        document.getElementById('tanksUsed').textContent = (summary.totalFuel / tankVolume).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        await SessionMaintenance.logBook("home", "loadInsights", `Summary Loaded: ${summary}`);
    } catch (err) {
        console.error("error loading insights:", err);
    } finally {
        SessionMaintenance.hideLoader();
    }
}
```

3. **`load28DaySum(username)`**

   * Calculates a date range (current day minus 28 days to today).  
   * Requests stats from `/api/stats/{username}?start=...&end=...`.  
   * Logs both the request and the returned dataset.  
   * Formats the time into minutes or hours, depending on the total.  
   * Updates UI elements (`28Miles`, `28Time`, `28Fuel`, `28Cost`, `28Mpg`).  
   * If an error occurs, logs the failure and alerts the user with *“Failed to load stats”*.
  
``` js
// Load Costs -------------------------------------------------------------------------------------
async function loadCosts(username) {
    try {
        SessionMaintenance.showLoader();
        const res = await fetch(`${API_BASE_URL}/api/costs/${username}`);
        if (!res.ok) throw new Error("Failed to fetch costs");

        const data = await res.json();

        document.getElementById("seven").textContent = currency + data.cost.seven.toLocaleString(undefined,{
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        document.getElementById("fourteen").textContent = currency + data.cost.fourteen.toLocaleString(undefined,{
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        document.getElementById("twentyEight").textContent = currency + data.cost.twentyEight.toLocaleString(undefined,{
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        document.getElementById("ninty").textContent = currency + data.cost.ninty.toLocaleString(undefined,{
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        document.getElementById("sixMonth").textContent = currency + data.cost.sixMonth.toLocaleString(undefined,{
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        document.getElementById("threeSixFive").textContent = currency + data.cost.threeSixFive.toLocaleString(undefined,{
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        await SessionMaintenance.logBook("home", "loadCosts", `Costs Loaded: ${data}`);
    } catch (err) {
        console.error("Error loading Costs:", err);
    } finally {
        SessionMaintenance.hideLoader();
    }
}
```

#### **Event Listeners**

1. **`window.addEventListener('DOMContentLoaded', …)`**

   * Triggers once the DOM has fully loaded.  
   * Logs the page load event.  
   * Highlights the active navigation item using `SessionMaintenance.highlightActivePage()`.  
   * Retrieves the stored username from `localStorage`.  
     * If no username is found, alerts the user to log in and redirects to `index.html`.  
   * If authenticated, calls `loadCosts()`, `loadSummary()`, and `load28DaySum()` sequentially to populate the dashboard.
  
``` js
// window loaded event listener ------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
    await SessionMaintenance.logBook("home", "window.DOMContentLoaded", "Home page loaded");

    const currentPage = window.location.pathname.split("/").pop();
    SessionMaintenance.highlightActivePage(currentPage);

    const username = localStorage.getItem('username').toLowerCase();
    console.log(username);
    console.log(localStorage.getItem('tankVolume'));
    console.log(localStorage.getItem('fuelCost'));
    if (!username) {
        alert('Please Login');
        window.location.href = "index.html";
        return;
    }
    await loadCosts(username);
    await loadSummary(username);
    await load28DaySum(username);
    await loadInsights(username);
});
```

#### **Key Features**

* **Dynamic Data Binding**: Updates statistics directly into predefined `<span>` elements on the home page.  
* **Session Validation**: Ensures only logged-in users can view the page; otherwise, redirects to the login page.  
* **Responsive Feedback**: Loader overlay (`SessionMaintenance.showLoader()` / `hideLoader()`) gives visual feedback during API requests.  
* **Data Logging**: Important events and API results are recorded via `SessionMaintenance.logBook()` for auditing and debugging.  
* **Error Handling**: Provides console errors for developers and user-facing alerts for critical failures.

---
