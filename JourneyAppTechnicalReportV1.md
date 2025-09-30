# Journey App

#### Aiden Bond \- 29/09/2025

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

<img width="380" height="823" alt="image" src="https://github.com/user-attachments/assets/97c58a2b-9368-4ffa-a020-3f1b5530e094" />

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

## New Journey Page

The New Journey page allows the user to record details of a completed journey. The form collects information such as a journey description, date and time, distance travelled, fuel efficiency (MPG), time driven, external temperature, driving conditions (dry or wet), and the cost of fuel per litre.

Once the form is submitted, the application automatically calculates additional fields such as fuel used, average speed, total cost, cost per mile, and percentage of tank consumed. These calculations ensure that every journey entry is stored with both raw inputs and derived statistics, providing richer insights.

The completed journey record is then saved to the database under the logged-in user’s account. This allows the data to contribute to the overall statistics shown in the app and to be retrieved later for summaries, cost breakdowns, and reporting features.

## New Journey Page \- Design

**Document setup**

* The page starts with `<!DOCTYPE html>` to declare the document type as HTML5.  
* The root `<html>` element specifies the language as English (`lang="en"`).  
* Inside the `<head>`, the metadata is defined:  
  * `<meta charset="utf-8"/>` ensures proper character encoding (UTF-8).  
  * `<meta name="viewport"...>` makes the page responsive for mobile devices.  
  * `<title>` sets the page title shown in the browser tab.  
  * External stylesheets are linked:  
    * `assets/styles.css` for custom app styling.  
    * A Google Fonts link for **Material Symbols**, providing the icon set used in the navigation bar.

**Loader overlay**

* A `<div id="loader" class="loader-overlay">` contains a `<div class="spinner">`.  
* This provides a **loading screen/spinner** to indicate when data is being processed or fetched, improving user experience.

**Main application container**

* The `<div id="app" class="app">` acts as the main wrapper for page content.  
* A heading `<h1>Add Journey</h1>` labels the page’s purpose.

**Journey input form** (`<form id="journey-form">`)  
 This form collects details of a user’s journey. It uses semantic `<label>` and `<input>` pairs to ensure accessibility.

* **Description**: Text input with placeholder (`e.g. To the shops`).  
* **Date & Time**: `datetime-local` input allows choosing both date and time.  
* **Distance (miles)**: Numeric input with decimal precision (`step="0.1"`).  
* **MPG**: Numeric input for fuel efficiency, also allowing decimal precision.  
* **Time Driven**: Text input for journey duration (e.g. “35 minutes”).  
* **Temperature (°C)**: Numeric input with decimal step, optional field.  
* **Condition**: A `<select>` dropdown with options for `dry` and `wet` conditions.  
* **Cost per Litre (£)**: Numeric input with `step="0.01"` to support two decimal places for currency values.  
* **Submit Button**: A styled button (`class="button"`) to add the journey.

**Navigation bar** (`<div id="nav-bar">`)

* Provides links to different sections of the app.  
* Each `<a>` link contains:  
  * A Material Symbol icon (e.g. `home`, `add_circle`, `directions_car`, `query_stats`, `settings`).  
  * A label for clarity (e.g. “Home”, “Add”, “Journeys”).  
* This ensures consistent navigation across the app.

**JavaScript link**

* At the bottom of the body, a script tag loads `newJourney.js` as a **JavaScript module** (`type="module"`).  
* This script handles the logic for submitting journeys, validating inputs, and interacting with the backend API.

## New Journey Page \- JavaScript

### **Boilerplate / Imports**

``` js
`import SessionMaintenance from "./sessionMaintenance.js";`  
`import {API_BASE_URL} from "./config.js";`
```

* Imports **session management utilities** and the **API base URL** from config.  
* A reference to the **submit button** is also retrieved:

`const submit = document.getElementById('submit');`

### **Operational Functions**

#### **`checkFields(fields)`**

* Simple validation helper.  
* Returns `true` if the field(s) passed in are non-empty.

``` js
// Check Fields --------------------------------------------------------------------------
function checkFields(fields) {
    return fields && fields.length > 0;
}
```

#### **`insertJourney(journeyData)`**

* Handles **submitting a new journey** to the backend.  
* Steps:  
  1. Shows the loader spinner.  
  2. Sends a **POST request** to the API (`/api/journeys`) with the journey data in JSON.  
  3. Saves the `fuelCost` to `localStorage` if it’s included (so it can be pre-filled next time).  
  4. If submission is successful:  
     * Logs the event.  
     * Shows an alert ("Journey Saved\!").  
     * Redirects the user back to `home.html`.  
  5. If it fails:  
     * Reads error text from the response.  
     * Logs the failure and alerts the user.  
  6. Always hides the loader afterwards.
 
``` js
// Insert Journey ------------------------------------------------------------------------
async function insertJourney(journeyData){
    try {
        SessionMaintenance.showLoader();

        const res = await fetch(`${API_BASE_URL}/api/journeys`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(journeyData)
        });

        //Save fuel cost in case of change
        console.log("DEBUG journeyData:", journeyData);
        if (journeyData && journeyData.costPl !== undefined) {
            localStorage.setItem('fuelCost', journeyData.costPl.toString());
        } else {
            console.warn("costPl missing from journeyData:", journeyData);
        }

        if (res.ok) {
            await SessionMaintenance.logBook(
                "newJourney",
                "submit.click",
                `Journey Submission Successful. ${JSON.stringify(journeyData, null, 2)}`
            );
            alert('Journey Saved!');
            window.location.href = "home.html";
        } else {
            const err = await res.text();
            await SessionMaintenance.logBook("newJourney", "submit.click", `Journey Submission failed. ${err}`);
            alert(`Error: ${err}`);
        }
    } catch (error) {
        await SessionMaintenance.logBook("newJourney", "submit.click", `Network Error: ${error}`, true);
    } finally {
        SessionMaintenance.hideLoader();
    }
}
```

#### **`calculateValues({timeUnit = 'minutes'} = {})`**

* Core **calculation function**.  
* Logs that calculations are starting, then:  
  1. Gets default values like **tank volume** and **gallon unit** from `localStorage`.  
  2. Retrieves values from the form safely (helper function `getValue` ensures empty fields don’t crash things).  
  3. Performs calculations:  
     * **Average speed** \= distance ÷ hours driven  
     * **Fuel used (litres)** \= distance ÷ miles-per-litre  
     * **Cost per mile** and **total cost** based on cost per litre  
     * **Percentage of tank used** \= fuel used ÷ tank size  
  4. Packages everything into an **output object** with values rounded appropriately.  
  5. Logs the calculated values and returns the object.

This ensures the backend receives *complete, calculated journey details*.

``` js
// Calculate values -----------------------------------------------
async function calculateValues({timeUnit = 'minutes'} = {}) {
    await SessionMaintenance.logBook("newJourney", "calculateValues", "Calculating Values");

    // Get tank volume from user defaults
    const tankVolume = Number(localStorage.getItem('tankVolume')) || 64;

    // Get Elements safely
    const getValue = (id, type = 'string') => {
        const el = document.getElementById(id);
        if (!el || el.value === '') return type === 'number' ? 0 : '';
        return type === 'number' ? Number(el.value) : String(el.value);
    };

    const description = getValue('description');
    const dateTimeRaw = getValue('datetime');
    const dateTime = dateTimeRaw ? new Date(dateTimeRaw) : new Date();
    const mpg = getValue('mpg', 'number');
    const distance = getValue('distance', 'number');
    const timeDriven = getValue('timeDriven', 'number');
    const temp = getValue('temp', 'number');
    const condition = getValue('condition');
    const costPerLitre = getValue('cost', 'number');

    // Calculate Helpers
    const gallon = localStorage.getItem('gallon');
    const hours = timeUnit === 'minutes' ? (timeDriven / 60) : timeDriven;
    const safeHours = hours > 0 ? hours : 1; // avoid division by zero
    const GALLON_L = (gallon === 'US') ? 3.79541 : 4.54609;
    const milesPerLitre = mpg > 0 ? (mpg / GALLON_L) : 1; // avoid division by zero

    // Calculate Values
    const avgSpeed = distance / safeHours;
    const fuelUsedL = distance / milesPerLitre;
    const costPerMile = costPerLitre / milesPerLitre;
    const totalCost = costPerMile * distance;
    const percOfTank = tankVolume > 0 ? (fuelUsedL / tankVolume) : 0;

    const user = localStorage.getItem('username') || 'unknown';
    const round = (n, dp = 3) => isNaN(n) ? 0 : Number(Number(n).toFixed(dp));

    // Construct Output
    const output = {
        user,
        description,
        dateTime,
        distance: round(distance, 2),
        mpg: round(mpg, 2),
        timeDriven: round(timeDriven, 2),
        temp: round(temp, 1),
        condition,
        costPl: round(costPerLitre, 2),
        avgSpeed: round(avgSpeed, 2),
        totalCost: round(totalCost, 2),
        costPerMile: round(costPerMile, 2),
        fuelUsedL: round(fuelUsedL, 2),
        percOfTank: round(percOfTank, 4),
    };

    await SessionMaintenance.logBook("newJourney", "calculateValues", `Values Calculated: ${JSON.stringify(output, null, 2)}`);

    return output;
}
```

### **Event Listeners**

#### **`DOMContentLoaded`**

When the page finishes loading:

* Logs that the page is ready.  
* Highlights the correct **nav bar item**.  
* Hides the loader (so UI shows).  
* Pre-fills the **fuel cost field** with the last used value from `localStorage`.  
* Logs the stored cost for debugging.

``` js
// window loaded event listener ------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
    await SessionMaintenance.logBook("newJourney", "window.DOMContentLoaded", "New Journey page loaded");

    const currentPage = window.location.pathname.split("/").pop();
    SessionMaintenance.highlightActivePage(currentPage);

    SessionMaintenance.hideLoader();

    const costField = document.getElementById('cost');
    if (costField) {
        const storedCost = localStorage.getItem('fuelCost');
        costField.value = storedCost !== null ? parseFloat(storedCost) : 0;
    }

    console.log("Fuel cost from localStorage:", localStorage.getItem('fuelCost'));
});
```

#### **`submit.addEventListener('click')`**

* Runs when the user clicks the **Add Journey** button.  
* Steps:  
  1. Prevents the form’s default reload behaviour.  
  2. Logs the submission attempt.  
  3. Calls `calculateValues()` to build a full `journeyData` object.  
  4. Validates that a **description** has been entered. If not → alert.  
  5. Calls `insertJourney()` with the calculated data to save it.
 
``` js
// Event Listener to submit form ---------------------------------------------------------------------
submit.addEventListener('click', async (event) => {
    event.preventDefault(); // Stop form reload
    await SessionMaintenance.logBook("newJourney", "submit.click", "Journey Submission attempted.");

    const journeyData = await calculateValues();
    const description = String(document.getElementById('description').value);

    // Check if a description has been entered
    if (!checkFields(description)) {
        alert('Please enter a description');
        return;
    }

    // Insert Journey
    await insertJourney(journeyData);

});
```

### **Overall Flow**

* When the user opens the page, the cost field is pre-filled.  
* When they submit:  
  * The form values are collected.  
  * All derived values (cost, fuel, speed, etc.) are calculated.  
  * A full journey record is **sent to the backend API**.  
  * On success: stored, logged, and redirected to Home.

---

## Full Stats Page

This page allows the user to enter a start and end date and retrieve a summary of data similar to the data shown on the home screen.

## Full Stats Page \- Design

**Document Setup**

* The page starts with `<!DOCTYPE html>` to declare HTML5.  
* The `<html>` element specifies the language as English (`lang="en"`).  
* `<head>` contains metadata and resources:  
  * `<meta charset="utf-8"/>` ensures UTF-8 encoding for all text.  
  * `<meta name="viewport"...>` makes the page responsive on mobile devices.  
  * `<title>` sets the page title as "Journey App \- Full Stats".  
  * `assets/styles.css` is linked for custom styling.  
  * The page icon (`favicon`) is defined via `<link rel="icon">`.  
  * Google Fonts is used to include **Material Symbols**, providing icons for navigation.

**Loader Overlay**

* `<div id="loader" class="loader-overlay">` contains a `<div class="spinner">`.  
* Displays a **loading spinner** while the page is fetching statistics or performing calculations.

**Main Application Container**

* `<div id="app" class="app">` wraps the primary page content.  
* A heading `<h1>Full Statistics</h1>` clearly identifies the page.

**Statistics Parameters Form** (`<div id="prams" class="stats">`)

* Contains a simple form for selecting a **start date** and **end date**.  
* Inputs are `<input type="date">`, allowing users to pick a range for which statistics are displayed.  
* A **"Get Stats" button** triggers data retrieval and updates the statistics shown.

**Summary Statistics Section** (`<div id="sum-stats" class="stats numbers">`)

* Displays calculated statistics for the selected period.  
* Each statistic is a `<p>` element with a `<span>` for the dynamic value. Key statistics include:  
  * Total miles, total time driven, total fuel used, total cost.  
  * Average miles per tank, MPG, speed, fuel price, temperature, time driven, and cost per mile/day.  
* This allows users to quickly view both cumulative and average metrics for all journeys in the selected period.

**Navigation Bar** (`<div id="nav-bar">`)

* Provides links to main sections of the app.  
* Each `<a>` element contains a **Material Symbol icon** and a **text label**.  
* Ensures consistent, user-friendly navigation across the app:  
  * Home, Add Journey, Your Journeys, Full Stats (active page), Settings.

**JavaScript Module Link**

* At the bottom of the body, `<script type="module" src="fullStats.js"></script>` loads the JS file.  
* This script handles retrieving, calculating, and populating all statistics dynamically, based on the selected date range.

## Full Stats Page \- JavaScript

**Imports and Initialization**

* The module imports `SessionMaintenance` for session logging, loader management, and UI utilities.  
* The `API_BASE_URL` constant is imported from the configuration file, providing the endpoint for all API requests.  
* `currency` is retrieved from `localStorage` to display costs consistently in the user’s preferred currency.  
* The **Get Stats button** element is stored in `getStatsBtn` for later event binding.

``` js
import SessionMaintenance from "./sessionMaintenance.js";
import { API_BASE_URL } from "./config.js";

const currency = localStorage.getItem('currency');
const getStatsBtn = document.getElementById('getStats');
```

**Operational Functions**

 **`getStats(username, start, end)`**

* Core function to retrieve and display journey statistics for a specific user over a given date range.  
* **Loader management:** Activates a loading spinner via `SessionMaintenance.showLoader()` to indicate processing.  
* **Logging:** Records the request and results using `SessionMaintenance.logBook()`, providing traceability for debugging and auditing.  
* **Fetch request:** Sends a GET request to the API endpoint `/api/stats/<username>` with query parameters for `start` and `end` dates.  
* **Response processing:**  
  * Converts the total time from minutes to hours if over 60 minutes.  
  * Dynamically populates the HTML `<span>` elements with the retrieved data, including:  
    * Total miles, time driven, fuel used, total cost.  
    * Average miles per tank, MPG, speed, cost per day, cost per mile, fuel price, temperature, and time driven.  
  * All numerical values are formatted for readability with fixed decimal places using `toLocaleString`.  
* **Error handling:** Logs errors via `logBook` and shows an alert if the API request fails.  
* **Loader deactivation:** Ensures the spinner is hidden after the operation finishes.

``` js
// Get Stats -------------------------------------------------------------------------------------------
async function getStats(username, start, end) {
    try {
        SessionMaintenance.showLoader();
        // Get Data Endpoint
        await SessionMaintenance.logBook("fullStats", "getStats", `Getting full stats: (${start}, ${end})`);
        const res = await fetch(`${API_BASE_URL}/api/stats/${username}?start=${start}&end=${end}`);
        const data = await res.json();
        const formattedTime = data.totalTime > 60 ? data.totalTime / 60 : data.totalTime;
        const timeUnit = data.totalTime > 60 ? "Hours" : "Minutes";

        await SessionMaintenance.logBook("fullStats", "getStats", `Full Stats retrieved: ${JSON.stringify(data, null, 2)}`);

        // Populate UI with Data
        document.getElementById('totalMiles').textContent = data.totalMiles.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('totalTime').textContent = `${formattedTime.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${timeUnit}`;
        document.getElementById('totalFuel').textContent = data.totalFuel.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('totalCost').textContent = `${currency}${data.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById('avgMilesPerTank').textContent = data.avgMilesPerTank.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('avgMpg').textContent = data.avgMpg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('avgSpeed').textContent = data.avgSpeed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('avgCostPerDay').textContent = `${currency}${data.avgCostPerDay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById('avgCostPerMile').textContent = `${currency}${data.avgCostPerMile.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById('avgFuelPrice').textContent = `${currency}${data.avgFuelPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById('avgTemp').textContent = data.avgTemp.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        document.getElementById('avgTimeDriven').textContent = data.avgTimeDriven.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } catch (err) {
        await SessionMaintenance.logBook("fullStats", "getStats", `Error fetching stats: ${err}`, true);
        alert("Failed to load stats");
    } finally {
        SessionMaintenance.hideLoader();
    }
}
```

**Event Listeners**

* **`DOMContentLoaded`**  
  * Fires when the page finishes loading.  
  * Logs the page load event.  
  * Highlights the current page in the navigation bar for user feedback.  
  * Hides the loader overlay.
 
``` js
// window loaded event listener ------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
    await SessionMaintenance.logBook("fullStats", "window.DOMContentLoaded", "Full Stats page loaded");

    const currentPage = window.location.pathname.split("/").pop();
    SessionMaintenance.highlightActivePage(currentPage);

    SessionMaintenance.hideLoader();
});
```

* **Get Stats Button (`getStatsBtn.click`)**  
  * Triggered when the user clicks the "Get Stats" button after selecting a start and end date.  
  * Retrieves the username from `localStorage` and the date range from the input fields.  
  * Calls `getStats()` with these parameters to fetch and display the requested statistics dynamically.  
  * Logs the button click action for auditing.
 
``` js
// Get Stats Button Click --------------------------------------------------------------------------
getStatsBtn.addEventListener('click', async () => {
    await SessionMaintenance.logBook("fullStats", "getStatsBtn.click", "Full Stats page loaded");

    // Declare Variables
    const username = localStorage.getItem('username').toLowerCase();
    const start = document.getElementById('start').value;
    const end = document.getElementById('end').value;

    await getStats(username, start, end);
});
```

---

## Your Journeys Page

This page provides the user with a complete list of all their recorded journeys, displayed in a table format. Each entry shows the date and time, the journey description, and the distance travelled, giving a clear overview of past activity. If no journeys are found, the page will display a message to inform the user instead of showing an empty table.

The table rows are interactive, by selecting a journey, the user is redirected to a detailed journey view where more information about that specific trip can be accessed. This functionality makes it easy for users to review and recall individual journeys while maintaining a simple, high-level overview on the main list page.

### Your Journeys Page \- Design

1. **Document Metadata and Resources**  
   * Declares the document as HTML5 (`<!DOCTYPE html>`).  
   * `<html lang="en">` specifies the language for accessibility and search engines.  
   * `<head>` contains key metadata:  
     * Character encoding is set to UTF-8 for full symbol and character support.  
     * A responsive `<meta viewport>` tag ensures proper scaling on mobile devices.  
     * The `<title>` element names the page: *Journey App – Your Journeys*.  
     * Stylesheet `assets/styles.css` is linked for consistent styling.  
     * A favicon (`JourneyApp-logo-1.png`) provides branding in the browser tab.  
     * Google’s **Material Symbols Outlined** icon font is imported for navigation icons.

2. **Loader Overlay**  
   * `<div id="loader" class="loader-overlay">` defines a hidden loading spinner.  
   * Used to indicate processing during asynchronous operations, e.g., fetching journey data.

3. **Main Application Container (`#app`)**  
   * Acts as the primary wrapper for the page’s content.  
   * Contains:  
     * **Heading (`<h1>`)**: Clearly labels the page as *Your Journeys*.  
     * **Table Container (`#table-container`)**:  
       * Holds the journey history table.  
       * Table structure:  
         * `<thead>` defines column headers: *Date/Time*, *Description*, *Distance (miles)*.  
         * `<tbody>` initially empty. It will be dynamically populated with user journey data by JavaScript.  
       * Provides a structured and scrollable display for multiple entries.  
4. **Navigation Bar (`#nav-bar`)**  
   * Persistent bottom navigation for app-wide consistency.  
   * Each `<a>` element acts as a navigation item with an icon and label:  
     * **Home:** `home.html`  
     * **Add New Journey:** `new-journey.html`  
     * **Your Journeys (active page):** `your-journeys.html`  
     * **Statistics:** `full-stats.html`  
     * **Settings:** `settings.html`  
   * Icons come from the Material Symbols font, paired with descriptive text labels for clarity and accessibility.

5. **JavaScript Integration**  
   * `<script type="module" src="yourJourneys.js"></script>` links the page-specific JavaScript module.  
   * This script dynamically retrieves journey records from the backend, inserts rows into the `<tbody>` of the table, and manages interactive features.

**Purpose and Functionality**  
The **Your Journeys page** provides users with a historical view of their recorded journeys. The empty table body (`<tbody>`) acts as a dynamic placeholder where journeys are inserted once fetched from the database. This design ensures scalability, allowing the table to grow as the user records more journeys. The page maintains visual and functional consistency with the rest of the application through the loader overlay, navigation bar, and shared styles.

### Your Journeys Page \- JavaScript

#### Boilerplate Imports

``` js
import SessionMaintenance from "./sessionMaintenance.js";
import { API_BASE_URL } from "./config.js";
```

* **SessionMaintenance**: a utility module for handling UI session actions (e.g., showing/hiding the loader, logging events, highlighting the active nav item).  
* **API\_BASE\_URL**: a centralised constant defining the base URL of the backend API. Keeps endpoints consistent across files.

#### Operational Function – `getJourneys()`

`async function getJourneys(tableBody, username) { ... }`

This asynchronous function retrieves and displays the user’s journeys.

**Process Flow**:

1. **Loader Display**  
   * Calls `SessionMaintenance.showLoader()` to indicate data fetching.

2. **API Call**

Sends a `fetch` request to:  
 `GET /api/getJourneys?username={username}`

* Returns a JSON response containing the user’s journey records.  
3. **No Data Handling**

If the response array is empty, inserts a single table row:  
 `<tr><td colspan="3">No journeys found.</td></tr>`

* Prevents a blank table.

4. **Data Population**  
   * Iterates over each journey object in the response.  
   * Creates a `<tr>` for each journey with three cells:  
     * **Date/Time**: formatted with `toLocaleString()` for readability.  
     * **Description**: user-entered description of the journey.  
     * **Distance**: miles travelled.

   * Each row is clickable:  
     * `row.addEventListener("click", ...)` redirects the user to a `journey-details.html` page, passing the journey’s unique `_id` as a query parameter.

5. **Error Handling**  
   * If the fetch fails (e.g., network issue), logs the error with `SessionMaintenance.logBook()`.

Displays an error message in the table:  
 `<tr><td colspan="3">Error loading journeys</td></tr>`

6. **Cleanup**  
   * Calls `SessionMaintenance.hideLoader()` in a `finally` block to ensure the loader disappears regardless of success or failure.
  
``` js
// Get Journeys --------------------------------------------------------------------
async function getJourneys(tableBody, username) {
    try {
        SessionMaintenance.showLoader();
        const res = await fetch(`${API_BASE_URL}/api/getJourneys?username=${username}`, {})
        const journeys = await res.json();

        if (journeys.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="3">No journeys found.</td></tr>`;
            return;
        }

        await SessionMaintenance.logBook("yourJourneys", "getJourneys", `Getting Journeys`);
        journeys.forEach((journey) => {
            const row = document.createElement("tr");

            row.innerHTML = `
        <td>${new Date(journey.dateTime).toLocaleString()}</td>
        <td>${journey.description}</td>
        <td>${journey.distance}</td>
      `;

            row.addEventListener("click", () => {
                window.location.href = `journey-details.html?id=${journey._id}`;
            });

            tableBody.appendChild(row);
        });

    } catch (err) {
        await SessionMaintenance.logBook("yourJourneys", "getJourneys", `Network Error: ${err}`, true);
        tableBody.innerHTML = `<tr><td colspan="3">Error loading journeys</td></tr>`;
    } finally {
        SessionMaintenance.hideLoader();
    }
}
```

### Event Listener – DOMContentLoaded

`document.addEventListener("DOMContentLoaded", async () => { ... });`

This listener runs when the HTML is fully loaded and parsed.

**Steps Executed**:

1. **Logging and Navigation Highlight**  
   * Records a log entry: `"Home page loaded"`.  
   * Highlights the active page in the bottom navigation bar using `SessionMaintenance.highlightActivePage()`.

2. **Loader Handling**  
   * Ensures the loader is hidden when the page is first displayed.

3. **User Validation**  
   * Retrieves the `username` from `localStorage`.

If absent, displays a message in the table:  
 `<tr><td colspan="3">No username found</td></tr>`

* Prevents further execution without a valid user.

4. **Fetch Journeys**  
   * Calls `getJourneys(tableBody, username)` to fetch and render the user’s journey history in the table.
  
``` js
// window loaded event listener ------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
    await SessionMaintenance.logBook("yourJourneys", "window.DOMContentLoaded", "Home page loaded");

    const currentPage = window.location.pathname.split("/").pop();
    SessionMaintenance.highlightActivePage(currentPage);

    SessionMaintenance.hideLoader();

    const username = localStorage.getItem("username");
    const tableBody = document.querySelector("#journeys-table tbody");

    if (!username) {
        tableBody.innerHTML = `<tr><td colspan="3">No username found</td></tr>`;
        return;
    }

    await getJourneys(tableBody, username);
});
```

### Key Features and Design Choices

* **Separation of Concerns**:  
  * `getJourneys()` handles only data retrieval and table rendering.  
  * The `DOMContentLoaded` event deals with page setup and orchestration.

* **Resilience**:  
  * Includes error states for both missing usernames and network/API issues.  
  * Loader ensures a smooth UX during data fetching.

* **Scalability**:  
  * The table body is dynamically populated, supporting an arbitrary number of journeys.  
  * Clickable rows allow for easy navigation to detailed views, paving the way for expansion (e.g., editing or deleting journeys).

---

## Journey Details Page

The Journey Details page displays the complete dataset for an individual journey. It retrieves both raw input values (such as distance, time driven, and fuel price) and calculated statistics (such as cost per mile, percentage of tank used, and average speed) from the database for the selected journey.  
The page provides:

* A clear breakdown of the journey’s date, time, description, and conditions.  
* Key performance metrics, including MPG, fuel consumption, and journey cost.  
* Supporting statistics that help users understand efficiency, such as cost per mile and percentage of fuel tank consumed.  
* A simple navigation and action interface:  
  * Edit button: Allows users to modify the journey’s details.  
  * Back button: Returns users to the Your Journeys overview page.

This page acts as the single record view, giving the user a complete picture of a journey and enabling further actions (edit or review) as part of the wider journey management workflow.

### Journey Details Page \- Design

The **Journey Details page** is structured using standard HTML5 and provides a detailed view of a single recorded journey.

#### **1\. Page Setup**

* `<!DOCTYPE html>` defines the document type as HTML5.  
* The `<head>` contains metadata, including:  
  * Character set (`UTF-8`) for broad text compatibility.  
  * Viewport settings for **mobile responsiveness**.  
  * A `<title>` that identifies the page in the browser tab.  
  * Links to an external **CSS stylesheet** (`assets/styles.css`) for consistent styling.  
  * A favicon (`JourneyApp-logo-1.png`) for branding in the browser tab.

#### **2\. Loader Overlay**

``` html
<div id="loader" class="loader-overlay">
   <div class="spinner"></div>
</div>
```

This provides a **loading screen** that overlays the page while data is being fetched. The `spinner` is styled with CSS to show a visual loading animation, and it is controlled by JavaScript to appear/disappear as required.

#### **3\. Main Application Container**

`<div id="app" class="app">`

This acts as the main wrapper for all journey details content, giving structure and allowing CSS to style the app layout consistently.

#### **4\. Header and Section Divider**

* `<h1>` shows the page title *Journey Details*.  
* `<hr>` adds a horizontal rule to visually separate the heading from the data.

#### **5\. Journey Statistics Section**

``` html
<div id="stats">
    <div id="sum-stats" class="stats numbers">  
        <p><span id="DateTime">0000-00-00 00:00:00</span></p> 
        <p>Description: <span id="description">If you're reading this, Something went wrong</span></p>
        ...
    </div> 
    <hr>  
</div>
```

This section displays all journey-specific statistics. Each statistic is wrapped in a `<p>` tag with a `<span>` that has a unique ID (e.g., `distance`, `mpg`, `timeDriven`).

* These spans are **placeholders** that are dynamically updated by JavaScript (`journeyDetails.js`).  
* Default or fallback values are included (e.g., `0` or a warning message) to handle cases where data is not loaded correctly.  
* The stats cover key fields such as **date/time, distance, time driven, fuel used, cost, MPG, average speed, and percentage of fuel tank used**.

#### **6\. Action Buttons**

``` html
<div class="button-group">
    <button class="button" id="btnEdit">Edit</button>
    <a href="your-journeys.html">
        <button type="button" class="button" id="btnBack">Back</button>
    </a>
</div>
```

* **Edit button**: Allows the user to modify the details of the current journey (handled in JavaScript).  
* **Back button**: A link back to the *Your Journeys* page so users can return to the list view.

#### **7\. JavaScript Linking**

`<script type="module" src="journeyDetails.js"></script>`

* Connects the page to the **journeyDetails.js** file.  
* This script is responsible for fetching the journey’s data from the database, updating the `<span>` elements with real values, and handling button actions.  
* Declared as a `module` for cleaner imports and modern JavaScript usage.

### Journey Details Page \- JavaScript

The JavaScript file `journeyDetails.js` provides the **dynamic behaviour** of the Journey Details page. It retrieves journey data from the server, formats it for readability, and updates the HTML fields. It also manages user interactions such as editing a journey.

#### **1\. Imports and Global Variables**

``` js
import SessionMaintenance from "./sessionMaintenance.js";
import { API_BASE_URL } from "./config.js";

const editButton = document.getElementById("btnEdit");
const currency = localStorage.getItem('currency');
let journeyId = null;
```

* **SessionMaintenance**: provides utility functions like logging and showing/hiding the loader.  
* **API\_BASE\_URL**: stores the base URL for the backend API.  
* **editButton**: references the "Edit" button in the HTML.  
* **currency**: retrieves the user’s chosen currency symbol from `localStorage`.  
* **journeyId**: stores the ID of the journey currently being viewed.

#### **2\. Helper Functions**

**a. Formatting Dates**

``` js
function formatDateTime(value){
    if(!value){ return "-"; } 
    const date = new Date(value);
    return date.toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    });  
}
```

* Converts a raw date-time string into a **readable UK-style format** (e.g., `26 Sep 2025, 14:30`).  
* Returns `"-"` if no date is available.

**b. Formatting Numbers**

``` js
function formatNumber(value, decimals = 2){
    if(value==null||value==="") return "-";
    return Number(value).toFixed(decimals);
}
```

* Converts numeric values to fixed decimal places.  
* Returns `"-"` for empty or invalid inputs.

#### **3\. Main Operational Function: `getJourneys()`**

`async function getJourneys(journeyId) { ... }`

This function retrieves the details for a specific journey and updates the page:

1. **Validation and Logging**  
   * Checks if a `journeyId` is present.  
   * Logs the action with `SessionMaintenance.logBook()`.

2. **API Request**

Sends a `GET` request to:

 `{API_BASE_URL}/api/getJourney/{journeyId}`

* Expects a JSON response containing the journey’s details.

3. **Processing Response**  
   * If `timeDriven > 60`, converts minutes into hours and changes the unit label accordingly.  
   * Logs the received journey data for debugging.

4. **Populating the Page**  
   * Updates the `<span>` fields in the HTML with journey details, including:  
     * **Date & Time**  
     * **Description**  
     * **Distance (mi)**  
     * **Time Driven (mins/hours)**  
     * **Fuel Used (litres)**  
     * **Cost (with currency symbol)**  
     * **MPG**  
     * **Temperature (°C)**  
     * **Weather condition**  
     * **Average Speed (mph)**  
     * **Cost per Mile**  
     * **Percentage of Tank Used**  
   * Uses the formatting helpers to ensure consistent display (e.g., `12.50 mi` instead of raw numbers).  
   * Fallback values such as `"-"` or `0` are shown if data is missing.

5. **Error Handling**  
   * If the request fails, logs an error with `SessionMaintenance`.

6. **Cleanup**  
   * Hides the loader overlay once data has been processed.
  
``` js
// Get Journeys -----------------------------------------------------------------------------------------
async function getJourneys(journeyId) {
    try {
        SessionMaintenance.showLoader();
        if (!journeyId) {
            await SessionMaintenance.logBook("journeyDetails", "getJourney", `No Journey Found ${journeyId}`, true);
            return;
        }

        // Log action
        await SessionMaintenance.logBook("journeyDetails", "getJourney", `Getting journey ${journeyId}`);

        // Get Journey Details
        const response = await fetch(`${API_BASE_URL}/api/getJourney/${journeyId}`, {
            method: "GET",
            headers: {"Content-Type": "application/json"}
        });

        if (!response.ok) throw new Error("Failed to get journey details");

        const journey = await response.json();
        const formattedTime = journey.timeDriven > 60 ? journey.timeDriven / 60 : journey.timeDriven;
        const timeUnit = journey.timeDriven > 60 ? "Hours" : "Minutes";

        await SessionMaintenance.logBook("journeyDetails", "getJourney", `journey Data: ${JSON.stringify(journey)}`);

        // Populate Fields
        document.getElementById("DateTime").textContent = formatDateTime(journey.dateTime);
        document.getElementById("description").textContent = journey.description || "-";
        document.getElementById("distance").textContent = journey.distance ? `${formatNumber(journey.distance, 1)} mi` : "0 mi";
        document.getElementById("timeDriven").textContent = `${formatNumber(formattedTime, 2)} ${timeUnit}` || "-";
        document.getElementById("fuelUsedL").textContent = journey.fuelUsedL ? `${formatNumber(journey.fuelUsedL, 2)} L` : "0 L";
        document.getElementById("cost").textContent = journey.totalCost ? `${currency}${formatNumber(journey.totalCost, 2)}` : "£0.00";
        document.getElementById("mpg").textContent = journey.mpg ? `${formatNumber(journey.mpg, 1)}` : "0 mpg";
        document.getElementById("temp").textContent = journey.temp ? `${formatNumber(journey.temp, 1)} °C` : "0 °C";
        document.getElementById("condition").textContent = journey.condition || "-";
        document.getElementById("avgSpeed").textContent = journey.avgSpeed ? `${formatNumber(journey.avgSpeed, 1)} mph` : "0 mph";
        document.getElementById("costPerMile").textContent = journey.costPerMile ? `${currency}${formatNumber(journey.costPerMile, 2)}/mi` : `${currency}0.00/mi`;
        document.getElementById("percOfTank").textContent = journey.percOfTank ? `${formatNumber(journey.percOfTank * 100, 2)} %` : "0 %";
    } catch (err) {
        await SessionMaintenance.logBook("journeyDetails", "getJourney", `Error getting journeys ${err}`, true);
    } finally {
        SessionMaintenance.hideLoader();
    }
}
```

#### **4\. Event Listeners**

**a. Page Load (`DOMContentLoaded`)**

`window.addEventListener('DOMContentLoaded', async () => { ... });`

* Runs when the page is fully loaded.  
* Logs that the journey details page has loaded.  
* Extracts the journey ID from the page URL (using `URLSearchParams`).  
* Calls `getJourneys(journeyId)` to fetch and display the journey’s data.

``` js
// window loaded event listener ------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
    await SessionMaintenance.logBook("journeyDetails", "window.DOMContentLoaded", "journey page loaded");
    SessionMaintenance.hideLoader();

    // Get ID from URL
    const params = new URLSearchParams(window.location.search);
    journeyId = params.get("id");

    // Log what we got
    await SessionMaintenance.logBook("journeyDetails", "window.DOMContentLoaded", `Journey ID from URL: ${journeyId}`);

    await getJourneys(journeyId);
});
```

**b. Edit Button**

`editButton.addEventListener("click", () => { ... });`

* Redirects the user to the **Edit Journey page**, passing the journey ID in the URL.  
* If no journey ID is available, alerts the user.

``` js
// Edit button event listener -------------------------------------------------------------------------
editButton.addEventListener("click", () => {
    if (journeyId) {
        window.location.href = `edit-journey.html?id=${journeyId}`;
    } else {
        alert("No journey ID available to edit.");
    }
});
```

### **Summary**

The `journeyDetails.js` file makes the Journey Details page **interactive and data-driven**. It:

* Retrieves journey information from the backend API.  
* Formats and displays the information in a clear, user-friendly way.  
* Provides an **edit option** for modifying journey data.  
* Handles missing data and errors gracefully.  
* Logs all major events for debugging and maintenance.

---

## Edit Journey Page

This page allows a user to update the details of an existing journey they have previously recorded. The editable fields are the same as those found on the New Journey page (such as date and time, distance, MPG, time driven, weather condition, temperature, and fuel cost per litre), with the exception of the journey description, which cannot be changed once a journey has been created.  
When the user updates a field, the system automatically recalculates key statistics, such as fuel usage, total cost, cost per mile, and average speed. This ensures the journey record remains accurate and consistent with the changes.

* In addition to editing, the page provides options to:  
  * Save Changes: Updates the journey in the database and returns the user to the Your Journeys overview.  
  * Delete Journey: Permanently removes the selected journey from the database after confirmation.  
  * Back: Returns the user to the journey list without making any changes.

This page ensures flexibility for correcting mistakes or updating information, while also maintaining clear safeguards for data integrity.

### Edit Journey Page \- Design

The **Edit Journey page** provides a form-based interface that allows the user to modify or delete an existing journey record. It uses a structured layout for input fields and includes validation where appropriate.

---

1\. Page Metadata and Styling  

``` html
<!DOCTYPE html>  
<html lang="en">  
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">  
    <title>Edit Journey</title>  
    <link rel="stylesheet" href="assets/styles.css">  
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet"/>  
</head>
```

* **Document type and language**: Defines the file as HTML5 and sets language to English.  
* **Meta tags**: Ensure proper character encoding (`UTF-8`) and mobile responsiveness (`viewport`).  
* **Title**: Sets the browser tab name to *Edit Journey*.  
* **Stylesheet**: Applies custom application styles from `assets/styles.css`.  
* **Google Material Symbols**: Provides access to standard icon fonts for consistency across the app.

2\. Loader Overlay  

``` html
<div id="loader" class="loader-overlay">
    <div class="spinner"></div>
</div>
```

* Displays a **spinner overlay** while data is being fetched or saved.  
* Managed dynamically by JavaScript to indicate loading state.

3\. Main Application Container

``` html
<div id="app" class="app">
    <h1>Edit Journey</h1>
    <form id="editJourneyForm">
        ...  
    </form>
</div>
```

* **Wrapper (`#app`)**: Provides a container for all page content.  
* **Heading**: The page is clearly labelled as *Edit Journey*.  
* **Form (`#editJourneyForm`)**: Contains the input fields for modifying journey data.

4\. Form Fields

The form captures a complete set of journey attributes. Each field uses HTML5 input types for validation and better user experience.

1. **Date & Time**

``` html
<label for="datetime">Date & Time:</label>
<input type="datetime-local" id="datetime" required>
```

* Ensures precise entry of date and time.  
* Marked as **required** to prevent missing entries.

2. **Distance**

``` html
<label for="distance">Distance:</label>
<input type="number" id="distance" name="distance" step="0.1" required>
```

* Captures journey distance (in miles).  
* Uses **decimal step control (0.1)** for accuracy.  
* Required field.

3. **Miles per Gallon (MPG)**

``` html
<label for="mpg">MPG:</label>
<input type="number" id="mpg" name="mpg" step="0.1" required>
```

* Tracks vehicle fuel efficiency.  
* Decimal input with 0.1 precision.  
* Required field.

4. **Time Driven**

``` html
<label for="timedriven">Time Driving:</label>
<input type="number" id="timedriven" name="timedriven" step="0.1" required>
```

* Records journey duration (in minutes or hours).  
* Decimal values permitted.  
* Required field.

5. **Temperature**

``` html
<label for="temp">Temperature (°C)</label>  
<input type="number" id="temp" step="0.1">
```

* Captures outside temperature.  
* Decimal precision of 0.1°C.  
* Optional field.

6. **Condition**

``` html
<label for="condition">Condition</label> 
<select id="condition">
    <option value="">Select</option>
    <option value="dry">Dry</option>
    <option value="wet">Wet</option>
</select>
```

* Dropdown menu for selecting **road/weather conditions**.  
* Defaults to “Select” with no preset value.

7. **Fuel Cost**

``` html
<label for="cost">Cost per L(£)</label>
<input type="number" id="cost" step="0.01" required>
```

* Input for **fuel price per litre**.  
* Two decimal precision for currency.  
* Required field.

5\. Form Action Buttons  

``` html
<div class="button-group">
    <button type="submit" class="button">Save Changes</button>
    <button type="button" id="deleteBtn" class="danger button">Delete Journey</button>
    <a href="your-journeys.html">
        <button type="button" class="button" id="btnBack">Back</button>
    </a>
</div>
```

* **Save Changes**: Submits the form to update the journey in the database.  
* **Delete Journey**: Triggers a delete action via JavaScript (`#deleteBtn`), removing the record.  
* **Back Button**: Navigates the user back to the *Your Journeys* page without making changes.

6\. JavaScript Integration  
`<script type="module" src="editJourney.js"></script>`

* Links to the `editJourney.js` script file, which:  
  * Loads existing journey data into the form.  
  * Handles validation and submission.  
  * Implements delete functionality.  
  * Provides error handling and loader control.

### Summary

The **Edit Journey HTML page** is designed to give users full control over modifying journey data. It includes:

* A structured **form** with validation on critical fields.  
* Support for editing time, distance, efficiency, weather conditions, and costs.  
* Dedicated buttons for **saving, deleting, and navigation**.  
* Integration with JavaScript for dynamic behaviour and backend communication.

This ensures consistency, reliability, and usability when managing journey records.

### Edit Journey Page \- JavaScript

The **Edit Journey page** is powered by a JavaScript module that enables users to load, update, and delete journey records. It communicates with the backend API and recalculates journey statistics in real time.

1\. Boilerplate Setup

* Imports configuration (`API_BASE_URL`) and the `SessionMaintenance` module for logging and session control.  
* Extracts the `journeyId` from the page URL using query parameters.

``` js
import {API_BASE_URL} from "./config.js";
import SessionMaintenance from "./sessionMaintenance.js";

const params = new URLSearchParams(window.location.search);
const journeyId = params.get("id");
```

2\. Utility Functions

* **`formatDatetime()`**: Converts ISO date strings into a format compatible with HTML `<input type="datetime-local">`. This ensures consistent date/time display when editing records.

``` js
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
```

3\. Core Operational Functions

* **`reCalculateValues()`**:  
  * Reads form input values (distance, MPG, cost per litre, conditions, etc.).  
  * Uses helper calculations to derive additional statistics, such as:  
    * Average speed.  
    * Fuel used (litres).  
    * Cost per mile.  
    * Total cost.  
    * Percentage of fuel tank consumed.

  * Applies rounding for readability and stores results in a structured object.  
  * Logs calculation steps for traceability.
 
``` js
//Calculate Values ----------------------------------------------------------------------------
async function reCalculateValues({timeUnit = 'minutes'} = {}) {
    await SessionMaintenance.logBook("editJourney", "calculateValues", "Calculating Values");

    const tankVolume = Number(localStorage.getItem('tankVolume')) || 64;
    const dateTime = document.getElementById("datetime").value || "";
    const distance = document.getElementById("distance").value || 0;
    const mpg = document.getElementById("mpg").value || 0;
    const timeDriven = document.getElementById("timedriven").value || 0;
    const costPerLitre = document.getElementById("cost").value || 0;
    const condition = document.getElementById("condition").value || "Dry";
    const temp = document.getElementById("temp").value  || 0;

    // Calculate Helpers
    const gallon = localStorage.getItem('gallon');
    const hours = timeUnit === 'minutes' ? (timeDriven / 60) : timeDriven;
    const safeHours = hours > 0 ? hours : 1; // avoid division by zero
    const GALLON_L = (gallon === 'US') ? 3.79541 : 4.54609;
    const milesPerLitre = mpg > 0 ? (mpg / GALLON_L) : 1; // avoid division by zero

    // Calculate Values
    const avgSpeed = distance / safeHours;
    const fuelUsedL = distance / milesPerLitre;
    const costPerMile = costPerLitre / milesPerLitre;
    const totalCost = costPerMile * distance;
    const percOfTank = tankVolume > 0 ? (fuelUsedL / tankVolume) : 0;

    const round = (n, dp = 3) => isNaN(n) ? 0 : Number(Number(n).toFixed(dp));

    const output = {
        dateTime,
        distance: round(distance, 2),
        mpg: round(mpg, 2),
        timeDriven: round(timeDriven, 2),
        temp: round(temp, 1),
        condition,
        costPl: round(costPerLitre, 2),
        avgSpeed: round(avgSpeed, 2),
        totalCost: round(totalCost, 2),
        costPerMile: round(costPerMile, 2),
        fuelUsedL: round(fuelUsedL, 2),
        percOfTank: round(percOfTank, 4),
    }

    await SessionMaintenance.logBook("editJourney", "calculateValues", `Values Calculated: ${JSON.stringify(output, null, 2)}`);

    return output;
}
```

* **`loadJourney()`**:  
  * Fetches the journey record from the API using the `journeyId`.  
  * Populates the edit form with stored values.  
  * Provides fallback behaviour in case of fetch errors (logs errors and maintains session stability).
 
``` js
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
        document.getElementById("temp").value = journey.temp || "";
        document.getElementById("condition").value = journey.condition || "";
        document.getElementById("cost").value = journey.costPl || "";
    } catch (err) {
        await SessionMaintenance.logBook("editJourney", "loadJourney", `Error getting journey ${err}`, true);
    } finally {
        SessionMaintenance.hideLoader();
    }
}
```

* **`saveJourney()`**:  
  * Recalculates values based on current form inputs.  
  * Submits an HTTP `PUT` request to update the record in the database.  
  * On success: alerts the user, logs the event, and redirects to the *Your Journeys* page.  
  * On failure: logs the error and alerts the user.

``` js
// Save Journey -----------------------------------------------------------------------------
async function saveJourney() {

    const updated = await reCalculateValues();

    try {
        SessionMaintenance.showLoader();
        const res = await fetch(`${API_BASE_URL}/api/journeys/${journeyId}`, {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(updated),
        });

        if (res.ok) {
            alert("Journey updated successfully!");
            await SessionMaintenance.logBook("saveJourney", "saveJourney", `Journey Saved successfully! ${JSON.stringify(updated)}`);
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
```

* **`deleteJourney()`**:  
  * Confirms with the user before proceeding.  
  * Sends an HTTP `DELETE` request to remove the record.  
  * Provides success/failure feedback and redirects back to the *Your Journeys* overview page.
 
``` js
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

```

4\. Event Binding

* On page load (`DOMContentLoaded`):  
  * Logs that the page is ready.  
  * Calls `loadJourney()` to prefill form data.  
  * Attaches event listeners:  
    * **Form submit** → `saveJourney()`.  
    * **Delete button** → `deleteJourney()`.
   
``` js
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
```

Technical Considerations

* **Error handling**: All API operations use `try/catch` with user feedback (alerts) and server-side logging.  
* **Data integrity**: Calculations include safeguards against division by zero and missing values.  
* **User experience**:  
  * A loader is shown during long operations.  
  * Alerts and redirects provide clear navigation after changes.  
* **Maintainability**: Modular design separates concerns (calculation, load, save, delete).

This script provides the **business logic** for editing journeys, ensuring that user inputs are validated, statistics are recalculated consistently, and records are synchronised with the database.

---

## Settings Page

This page provides users with the ability to view and update their personalized application settings. Users can modify key parameters that influence journey calculations and the app interface, including:

* Default fuel tank volume: Sets the tank size for calculating fuel usage and percentage of tank consumed.  
* Default fuel cost: Used for calculating journey costs and cost per mile.  
* User currency: Determines the currency symbol used throughout the app.  
* Preferred gallon system (US or UK): Adjusts fuel consumption calculations based on the measurement system.  
* Font selection: Allows the user to choose a preferred font for the app interface for readability or aesthetic preference.  
* Password update: Provides the option to change the user’s login password securely.

Additionally, the page displays non-editable user information, such as the username and the total number of journeys recorded, giving users a quick overview of their account data. Settings are persisted both locally and on the server to ensure consistency across sessions and devices.

### Settings Page \- Design

The **Settings page** provides users with the ability to customize application preferences and update their account information. The HTML structure is designed to present these options clearly while maintaining consistency with the rest of the application.

Key Sections

1. **Document Setup**  
   * Declares the document type as HTML5 and sets the language to English.  
   * Includes meta tags for **character encoding** (`UTF-8`) and **viewport scaling** to ensure responsiveness on mobile devices.  
   * The `<title>` is set to *Journey App \- Settings*.  
   * External resources include:  
     * A custom stylesheet (`assets/styles.css`).  
     * A favicon for branding (`JourneyApp-logo-1.png`).  
     * Google Fonts Material Symbols for icons.

2. **Loader Component**  
   * A `<div>` with the class `loader-overlay` contains a spinner element.  
   * This acts as a loading screen shown during asynchronous operations such as saving settings.

3. **Main Application Container** (`<div id="app" class="app">`)  
   * **Page Title**: Displays "Settings" in an `<h1>`.  
   * **User Info Section**: Displays the current username and total journeys recorded, dynamically filled with JavaScript.

4. **Settings Form** (`<form id="settingsForm">`)  
    The form allows users to configure application preferences:  
   * **Tank Volume**: Default fuel tank capacity in litres.  
   * **Fuel Cost**: Default cost of fuel per litre in £.  
   * **Gallon Selection**: Allows the user to choose between UK and US gallon units.  
   * **Font Selection**: Provides multiple font choices for personalising the app’s appearance.  
   * **Currency Selection**: Allows the user to choose between £, $, and €.  
   * **Update Password**: Provides an input field to change the account password.  
   * **Save Button**: Submits the form to persist settings changes.

5. *Note*: A commented-out section for theme selection (Dark/Light) is present, this is for future functionality.

6. **Navigation Bar** (`<div id="nav-bar">`)  
   * Fixed navigation at the bottom of the page provides quick access to other sections:  
     * **Home**  
     * **Add Journey**  
     * **Your Journeys**  
     * **Statistics**  
     * **Settings** (active)  
   * Each navigation item is represented with an icon from Google’s Material Symbols and a text label.

7. **JavaScript Integration**  
   * At the end of the `<body>`, the script `settings.js` is included as a module.  
   * This script handles form submission, loads current settings, and applies user preferences dynamically.

Summary  
 The **Settings page** is structured to give users control over their app experience, combining **user account info**, **application preferences**, and **navigation** within a responsive and consistent design.

### Settings Page \- JavaScript

The JavaScript for the Settings page provides functionality for **loading, displaying, updating, and saving user preferences** as well as handling some interactive UI features like font selection.

Key Sections

1\. Boilerplate and Imports  

``` js
import SessionMaintenance from "./sessionMaintenance.js";
import {API_BASE_URL} from "./config.js";

const fontSelect = document.getElementById('font-select');
```

* Imports the **SessionMaintenance** module for logging and loader control.  
* Imports the API base URL from `config.js`.  
* Captures the font selection dropdown element for later event handling.

2\. Operational Functions

a) `getTotalJourneys(username)`

`async function getTotalJourneys(username) { ... }`

* Fetches the **total number of journeys** for the logged-in user from the API endpoint `/api/getTotalJourneys/{username}`.  
* Updates the DOM element `totalJourneys` with the retrieved value.  
* Logs the action via `SessionMaintenance.logBook`.  
* Implements error handling to fallback to `0` if the fetch fails.

``` js
// Get total number of journeys ----------------------------------------------------------
async function getTotalJourneys(username) {
    const totalElem = document.getElementById('totalJourneys');

    try {
        const res = await fetch(`${API_BASE_URL}/api/getTotalJourneys/${username}`);
        if (!res.ok) throw new Error("Failed to fetch journeys");

        const data = await res.json();
        totalElem.textContent = data.total; // update DOM

        await SessionMaintenance.logBook("settings", "getTotalJourneys", `Journey Total retrieved: ${data.total}`);

        return data.total;
    } catch (err) {
        console.error("Error fetching total journeys:", err);
        await SessionMaintenance.logBook("settings", "getTotalJourneys", `Network Error: ${err}`, true);
        return 0;
    }
}
```

3\. Event Listeners

a) Font Selection

``` js
fontSelect.addEventListener('change', (e) => {
    document.documentElement.style.setProperty(
        '--default-font',
        ` `${e.target.value}, sans-serif` `
    );  
});
```

* Dynamically updates the application font when the user selects a new option.  
* Uses a CSS variable (`--default-font`) to apply the font globally.

b) Window Loaded Event

`document.addEventListener('DOMContentLoaded', async () => { ... });`

When the page loads, several initialization tasks occur:

1. **Logging and UI Highlighting**  
   * Logs page load and highlights the active page in the navigation bar.

2. **Loader Control**  
   * Hides the loading overlay once initialization starts.

3. **User Validation**  
   * Retrieves the `username` from `localStorage`.  
   * Alerts the user if no username is found.

4. **Display Basic User Info**  
   * Sets the DOM element `username` with the logged-in user.  
   * Calls `getTotalJourneys` to display the user’s journey count.

5. **Fetch Current Settings**  
   * Fetches stored user settings from `/api/getUsers/{username}`.  
   * Populates input fields in the form: tank volume, fuel cost, gallon type, font, and currency.  
   * Implements error handling and logging for failed requests.

4\. Form Submission (Save Settings)  
`document.getElementById('settingsForm').addEventListener('submit', async (e) => { ... });`

* Prevents default form submission with `e.preventDefault()`.  
* Reads form field values and builds a payload object for the API.  
* Adds optional password update if provided.  
* Sends the payload via a **PUT request** to `/api/saveUsers/{username}`.  
* Updates **localStorage** with new preferences to maintain app state.  
* Provides feedback via `alert()` for both success and failure.  
* Logs all actions using `SessionMaintenance.logBook`.  
* Handles errors gracefully and ensures loader visibility is properly managed.

``` js
// window loaded event listener ------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    await SessionMaintenance.logBook("settings", "window.DOMContentLoaded", "Settings page loaded");

    const currentPage = window.location.pathname.split("/").pop();
    SessionMaintenance.highlightActivePage(currentPage);

    SessionMaintenance.hideLoader();

    const username = localStorage.getItem('username');
    if (!username) {
        alert('No user logged in!');
        return;
    }

    document.getElementById('username').textContent = username;
    if (username) {
        await getTotalJourneys(username);
    }

    // Fetch current user settings
    try {
        SessionMaintenance.showLoader();
        await SessionMaintenance.logBook("settings", "window.DOMContentLoaded", "Getting current user settings");
        const res = await fetch(`${API_BASE_URL}/api/getUsers/${username}`);

        if (res.ok) {
            const user = await res.json();
            document.getElementById('tankVolume').value = user.tankVolume ?? "";
            document.getElementById('fuelCost').value = user.defFuelCost ?? "";
            document.getElementById('gallon-select').value = user.gallon ?? "UK";
            document.getElementById('font-select').value = user.userFont ?? "Lexend";
            document.getElementById('currency-select').value = user.currency ?? "£";

        } else {
            await SessionMaintenance.logBook("settings", "window.DOMContentLoaded", "Failed fetching user settings", true);
        }
    } catch (err) {
        await SessionMaintenance.logBook("settings", "window.DOMContentLoaded", `Failed fetching user settings: ${err}`, true);
    } finally {
        SessionMaintenance.hideLoader();
    }

    // Handle save function -----------------------------------------------------------------------------------------
    document.getElementById('settingsForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const tankVolume = Number(document.getElementById('tankVolume').value);
        const fuelCost = Number(document.getElementById('fuelCost').value);
        let gallon = document.getElementById('gallon-select').value.toUpperCase();
        if (!gallon || gallon.trim() === "") gallon = "UK";
        const userFont = document.getElementById('font-select').value || "Lexend";
        const currency = document.getElementById('currency-select').value || "£";
        const newPassword = document.getElementById('new-password').value || "";

        // Build Payload
        const payLoad = {
            tankVolume,
            defFuelCost: fuelCost,
            gallon,
            userFont,
            currency,
        };

        if (newPassword && newPassword.trim() !== "") {
            payLoad.newPassword = newPassword;
        }

        try {
            SessionMaintenance.showLoader();
            const res = await fetch(`${API_BASE_URL}/api/saveUsers/${username}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payLoad),
            });

            // Update Local storage
            localStorage.setItem('tankVolume', tankVolume.toString());
            localStorage.setItem('fuelCost', fuelCost.toString());
            localStorage.setItem('gallon', gallon);
            localStorage.setItem('userFont', userFont);
            localStorage.setItem('userFont', userFont);
            localStorage.setItem('currency', currency);

            if (res.ok) {
                await SessionMaintenance.logBook("settings", "window.DOMContentLoaded", `Settings saved successfully {${JSON.stringify(payLoad)}}`);
                alert("Settings saved successfully");
            } else {
                const err = await res.text();
                await SessionMaintenance.logBook("settings", "window.DOMContentLoaded", `Failed to save user settings: ${err}`);
                alert(`Failed to save user settings: ${err}`);
            }
        } catch (err) {
            await SessionMaintenance.logBook("settings", "window.DOMContentLoaded", `Network Error: ${err}`, true);
        } finally {
            SessionMaintenance.hideLoader();
        }
    });
});
```

5\. Summary of Functionality

* **Fetches and displays** user-specific data (username, total journeys, settings).  
* **Allows dynamic customization** of font style.  
* **Persists user preferences** to the backend and updates local storage.  
* Provides **error handling and logging** for network or API failures.  
* Integrates with UI elements (loader, input fields, font selection, form submission).

**Summary**  
 The `settings.js` file is responsible for **loading, editing, and saving user preferences**, ensuring the UI reflects the current user settings and maintaining consistent logging and error handling.

---

## SessionMaintenance Class  

The `SessionMaintenance` class is a **utility class** that provides essential application-wide functions for session management, logging, loader control, and UI navigation highlighting in the Journey App. It is designed as a **static class**, meaning all methods and properties are accessed directly on the class rather than through instances.

1\. Boilerplate and Imports

`import {API_BASE_URL} from "./config.js";`

* Imports the API base URL from `config.js` to enable server communication for logging purposes.

2\. Class Properties (Global Variables)

``` js
static debugMode = false;
static currentVersion = "1.0.0";
static appName = "journeyApp"; 
static sessionId = null;
static username = null;
```

* `debugMode`: Controls whether logs are printed to the console only (true) or sent to the server (false).  
* `currentVersion` and `appName`: Metadata for logging and version tracking.  
* `sessionId` and `username`: Track the current session and user.

3\. Operational Functions

a) startSession(username)

`static startSession(username) { ... }`

* Starts a new session by generating a **unique session ID** using `crypto.randomUUID()`.  
* Stores the `username` and `sessionId` in **localStorage** to persist session state across pages.  
* Calls `logBook` to record the session start event.

**Purpose:** Ensure each user session is uniquely identified and traceable in logs.

``` js
    static startSession(username) {
        this.sessionId = crypto.randomUUID();
        this.username = username;

        // Save Session ID & Username
        localStorage.setItem("username", this.username);
        localStorage.setItem("sessionId", this.sessionId);

        this.logBook("SessionMaintenance", "startSession", `Starting session for ${username}`);
    }
```

b) logBook(source, func, notes, error \= false)

`static async logBook(source, func, notes, error = false) { ... }`

* Creates a **log entry object** containing:  
  * `timestamp`, `app`, `version`, `sessionId`, `username`  
  * `source` (module or page), `func` (function name), `notes` (description), `error` (optional flag)  
* If `debugMode` is enabled, logs to **console** only.  
* Otherwise, sends the log to the server via `POST` to `/api/logBook`.  
* Handles network errors gracefully with a `console.error`.

**Purpose:** Provides **centralized logging** for actions, errors, and debugging across all pages.

``` js
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
```

c) showLoader() and hideLoader()

``` js
static showLoader() { ... }
static hideLoader() { ... }
```

* Controls visibility of the **page loader overlay** (`#loader`).  
* `showLoader()` removes the `hidden` class to display the loader.  
* `hideLoader()` adds the `hidden` class to hide it.

**Purpose:** Standardizes loader behavior across all pages to improve UX during asynchronous operations.

d) highlightActivePage(currentPage)

`static highlightActivePage(currentPage) { ... }`

* Maps page filenames to navbar element IDs.  
* Removes the `active` class from all `.nav-item` elements.  
* Adds the `active` class to the element corresponding to the current page.

**Purpose:** Dynamically highlights the **active page** in the navigation bar for user orientation.

``` js
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
```

4\. Summary of Functionality

The `SessionMaintenance` class provides a **centralized utility system** for:

1. **Session Management:** Starting and persisting unique sessions per user.  
2. **Logging:** Tracking actions, events, and errors both in the console and remotely on the server.  
3. **UI Enhancements:** Showing/hiding loaders and highlighting active navigation links.  
4. **Debugging Support:** Optional debug mode for development without server logging.

**Summary**  
 `SessionMaintenance.js` is a **foundational class** for the Journey App that ensures consistent session tracking, logging, and UI feedback, making it easier to maintain, debug, and monitor application behavior.

---

## CSS Design

The CSS file defines the visual styling and layout for the Journey App web interface. It uses **CSS variables**, responsive design principles, and modular styles to create a consistent, mobile-first user experience. The stylesheet covers **global styles, typography, forms, tables, buttons, loaders, statistics cards, and the navigation bar**.

1\. Font Imports  
`@import url('https://fonts.googleapis.com/css2?family=Google+Sans+Code...&display=swap');`

* Imports multiple fonts from Google Fonts.  
* Fonts include `Lexend`, `Roboto Condensed`, `Permanent Marker`, `Google Sans Code`, and `Monsieur La Doulaise`.  
* These fonts are used throughout the app to provide readability, code-like styling, and aesthetic options.

2\. Root Variables  

``` css
:root {
    --bg-color: #3a3a3a;
    --accent-color: #d95000;
    --text-color: white;
    --card-bg: #fff; 
    --card-text: #000;
    --button-bg: #00d916; 
    --button-text: #000000;  
    --stat-color-1: #be4702;  
    --stat-color-2: #ff5d00;
    --default-font: 'Lexend', sans-serif;
}
```

* Defines reusable variables for colors, fonts, and interface elements.  
* Promotes **consistency** across the application and simplifies theme changes.

3\. Global Styles  

``` css
body {
    background-color: var(--bg-color);
    color: var(--text-color);
    font-family: var(--default-font);
    display: flex;
    justify-content: center; 
    align-items: flex-start;
    min-height: 100%;
    box-sizing: border-box;
    margin: 0;
    padding: env(safe-area-inset, 8px);  
}
```

* Sets the global background, text color, and font.  
* Uses **flexbox** for centering content horizontally while aligning to the top vertically.  
* Ensures safe-area padding for mobile devices with notches.  
* `box-sizing: border-box` ensures consistent sizing with padding and borders included.

``` css
#app {
    width: 100%; 
    max-width: 500px; 
    min-height: 100%; 
    margin-bottom: 20%;
    height: 1440px;
}
```

* Constrains app content to **mobile-first layout**.  
* Keeps content centered on larger screens without excessive width.

4\. Typography and Text Containers  

``` css
h1 {
    text-align: center;  
    margin: 10% 10px 1rem; 
}  
p {
    margin: 0.3rem 0;  
    font-size: 1rem;  
}
hr {
    border: none; 
    border-top: 1px solid rgba(255, 255, 255, 0.3); 
    margin: 1rem 0;
}
```

* Centers headings, ensures consistent spacing, and provides light horizontal rules.

5\. Statistics Cards  

``` css
.stats {  
    background-color: var(--accent-color); 
    color: var(--card-text); 
    border-radius: 10px; 
    padding: 1rem;
    margin-bottom: 1rem; 
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);  
}  
.numbers p:nth-child(odd) { background-color: var(--stat-color-1); ... }  
.numbers p:nth-child(even) { background-color: var(--stat-color-2); ... }
```

* Defines colored statistic cards with rounded corners and soft shadows.  
* Alternates row colors for numeric stats to improve readability.

6\. Buttons  

``` css
.button-group { display: flex; flex-direction: column; gap: 1rem; }  
.button { background-color: var(--button-bg); ... cursor: pointer; }  
.button:hover { background-color: #000; color: white; }
```

* Provides uniform styling for buttons.  
* Includes **hover effects** for interactivity.  
* `#import-button` styles a floating import button separately.

7\. Forms  

``` css
form {
    display: flex;  
    flex-direction: column;  
    gap: 10px;  
    background-color: var(--accent-color);  
    padding: 20px;  
    border-radius: 10px; 
    max-width: 90%;
    margin: 20px auto;
}
form input, form select, form button { padding: 10px; border-radius: 5px; }
```

* Forms are vertically stacked with consistent spacing.  
* Inputs, selects, and buttons share padding and rounded corners.

8\. Tables  

``` css
#journeys-table { width: 100%; border-collapse: collapse; } 
#journeys-table th, td { padding: 0.75rem; text-align: left; }  
#journeys-table tr:nth-child(even) { background-color: rgba(0,0,0,0.05); }
#journeys-table tr:hover { background-color: rgba(0,0,0,0.15); cursor: pointer; }
```

* Styles the journeys table for clarity.  
* Alternates row colors and adds hover highlighting.

9\. Loading Spinner  

``` css
.loader-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.6); display: flex; justify-content:center; align-items:center; z-index:9999; }
.loader-overlay.hidden { display: none; } 
.spinner { width: 60px; height: 60px; border: 6px solid #ddd; border-top: 6px solid #4CAF50; border-radius: 50%; animation: spin 1s linear infinite; }  
@keyframes spin { 100% { transform: rotate(360deg); } }
```

* Full-screen overlay with a **loading spinner**.  
* Spinner is animated with a **CSS keyframes rotation**.

10\. Navigation Bar  

``` css
#nav-bar { position: fixed; bottom: 0; left: 0; right: 0; height: 80px; display: flex; justify-content: space-around; align-items: center; }  
.nav-item { text-align: center; flex: 1; font-size: 12px; }  
.nav-item.active { color: white; }
```

* Fixed bottom navigation bar with **flexbox layout**.  
* Each nav-item includes icon and label.  
* Active page is highlighted for visual feedback.

11\. Responsiveness  

``` css
@media (max-width: 400px) {
    p { font-size: 0.9rem; }
    .button { font-size: 0.95rem; }
}
```

* Ensures text and buttons remain readable on small screens.  
* Adopts a **mobile-first design approach**.

Summary

The CSS file establishes a **consistent, visually appealing, and responsive design** for the Journey App. Key features include:

* Use of **CSS variables** for easy theming.  
* **Mobile-first layout** with content constraints and safe-area support.  
* Distinct styling for **buttons, forms, tables, statistics cards, and navigation bar**.  
* Visual feedback through **hover effects, active states, and loading spinner animations**.  
* Full support for **responsive adjustments** on small devices.

---

## Backend

This javaScript file contains all the API endpoints to communicate with the frontend and allow the application to communicate with the MongoDb database. 

**Boilerplate code**

The boilerplate section of `server.js` sets up the necessary environment, dependencies, and initial configuration for the backend server. Its purpose is to establish a foundation for the RESTful API endpoints and provide connectivity to the database.

1\. Environment and Dependency Imports  

``` js
import dotenv from 'dotenv';
import bcryptjs from 'bcryptjs';
import fetch from "node-fetch";
import express from 'express';
import cors from 'cors';
import {MongoClient, ObjectId} from 'mongodb';
import path from 'path';
import {fileURLToPath} from 'url';
```

* **dotenv**: Loads environment variables from a `.env` file, allowing sensitive data such as database URIs or API keys to be kept outside the source code.  
* **bcryptjs**: Provides password hashing for secure user authentication.  
* **node-fetch**: Enables server-side HTTP requests to external APIs.  
* **express**: Framework for creating the server and routing endpoints.  
* **cors**: Middleware for enabling Cross-Origin Resource Sharing (CORS), controlling which domains can access the server.  
* **mongodb**: Provides MongoDB connectivity through `MongoClient` and object ID handling via `ObjectId`.  
* **path** and **fileURLToPath**: Utilities for working with file paths, particularly useful when serving frontend files in a cross-platform way.

2\. Environment Configuration  

``` js
dotenv.config(); 
console.log("Mongo URI:", process.env.MONGO_URI); // test output
```

* Loads `.env` configuration variables into `process.env`.  
* Outputs the MongoDB URI to the console for verification. This ensures the server is using the correct connection string.

3\. Path Setup  

``` js
const __filename = fileURLToPath(import.meta.url);  
const __dirname = path.dirname(__filename);
```

* Converts the ES module file URL to a standard file path.  
* Defines `__dirname` for resolving relative paths, which is necessary because ES modules do not provide `__dirname` natively.

4\. Default Server Variables  
`let tankVolume = 64;`

* Sets a default value for the vehicle tank volume, which may be used in journey calculations if no user-specific value exists.

5\. Express Application Initialization  

``` js
const app = express();
app.use(express.json());  
app.use(express.static(path.join(__dirname, '..', 'frontend')));
```

* Creates an instance of the Express application.  
* Enables **JSON parsing** for incoming request bodies (`express.json()`).  
* Serves static frontend files from the `frontend` directory, allowing the client application to be accessed via the same server.

6\. CORS Configuration  

``` js
const corsOptions = { 
    origin: 'http://localhost:63342', // Allow requests from this origin 
    optionsSuccessStatus: 200 
};  
app.use(cors(corsOptions));
```

* Configures CORS to allow requests only from a specified origin (your local frontend).  
* Ensures compatibility with browsers that require a 200 response for preflight requests.

7\. MongoDB Client Setup  
`const client = new MongoClient(process.env.MONGO_URI);`

* Initializes a new MongoDB client instance with the URI from environment variables.  
* This client will later be used to connect to the database, perform CRUD operations, and manage collections for journeys and user data.

Summary

This boilerplate section establishes the **core backend infrastructure**:

* Loads environment variables.  
* Imports required libraries for server operation and security.  
* Configures paths, default variables, and JSON handling.  
* Sets up **CORS** for controlled cross-origin requests.  
* Initializes a **MongoDB client** for database interactions.  
* Serves frontend static files to allow seamless integration between client and server.

**Endpoints**

The endpoints in the `startServer` function provide all **CRUD operations** and supporting functionality for the Journey App. They interact with two main MongoDB collections: **`users`** and **`journeys`**. Each endpoint performs input validation, database operations, and error handling.

1\. Logging Endpoint

`app.post('/api/logBook', ...)`

* **Purpose**: Stores log entries for debugging and operational tracking.  
* **Input**: Log object containing `source`, `function`, `notes`, timestamp, and session info.  
* **Database**: Inserts into `logBook` collection.  
* **Response**: Returns `200` on success or `500` on error.

``` js
// LogBook Endpoint ------------------------------------------------------------------------------------------
        app.post('/api/logBook', async (req, res) => {
            try {
                const logEntry = req.body;
                console.log(logEntry);
                const db = client.db('journeyAppDb');
                await db.collection('logBook').insertOne(logEntry);
                res.status(200).json({success: true, message: "Log recorded"});
            } catch (err) {
                console.error('Error saving log:', err);
                res.status(500).send('Error saving log:');
            }
        });
```

2\. Journey Management

**a) Insert a Journey**

`app.post('/api/journeys', ...)`

* Saves a new journey document to the `journeys` collection.  
* Request body contains journey details like `distance`, `timeDriven`, `fuelUsedL`, etc.  
* Returns `201` on success or `500` on error.

``` js
 // Insert Journey --------------------------------------------------------------------------------------------
        app.post('/api/journeys', async (req, res) => {
            try {
                await journeys.insertOne(req.body);
                console.log('Journey saved:', req.body);
                res.status(201).send('Journey saved');
            } catch (err) {
                console.error('Error saving journey:', err);
                res.status(500).send('Error saving journey');
            }
        });
```

**b) Get All Journeys for User**

`app.get('/api/getJourneys', ...)`

* Retrieves all journeys for a specific `username`.  
* Uses aggregation to cast `dateTime` to `Date` and sort by newest first.

``` js
// Your Journeys Endpoint ----------------------------------------------------------------
        app.get('/api/getJourneys', async (req, res) => {
            try {
                const {username} = req.query; // safer to get from query

                const journeys = await db.collection('journeys').aggregate([
                    {
                        $match: {user: username}
                    },
                    {
                        $addFields: {
                            dateTimeCorrected: {$toDate: "$dateTime"} // cast to Date
                        }
                    },
                    {
                        $sort: {dateTimeCorrected: -1} // newest first
                    }
                ]).toArray();

                res.json(journeys);
            } catch (err) {
                console.error("Error retrieving journeys", err);
                res.status(500).send("Error retrieving journeys");
            }
        });

```

**c) Get Single Journey by ID**

`app.get("/api/getJourney/:id", ...)`

* Fetches a journey by its MongoDB ObjectId.  
* Returns `404` if not found.

``` js
// Get single journey ---------------------------------------------------------------
        app.get('/api/journeys/:id', async (req, res) => {
            try {
                const {id} = req.params;
                const journey = await db.collection('journeys').findOne({_id: new ObjectId(id)});
                if (!journey) return res.status(404).send('No journey found.');
                res.json(journey);
            } catch (err) {
                res.status(500).send("Error retrieving journeys");
            }
        });
```

**d) Update Journey**

`app.put('/api/journeys/:id', ...)`

* Updates an existing journey based on its ObjectId.  
* Uses `$set` to update only the fields provided.

``` js
// Update journey -------------------------------------------------------------------
        app.put('/api/journeys/:id', async (req, res) => {
            try {
                const {id} = req.params;
                const updated = req.body;
                const result = await db.collection('journeys').updateOne(
                    {_id: new ObjectId(id)},
                    {$set: updated},
                );
                res.json(result);
            } catch (err) {
                res.status(500).send("Error updating journeys");
            }
        });
```

**e) Delete Journey**

`app.delete('/api/journeys/:id', ...)`

* Deletes a journey by ObjectId.  
* Returns `204 No Content` on success.

``` js
// Delete journey -------------------------------------------------------------------
        app.delete('/api/journeys/:id', async (req, res) => {
            try {
                const {id} = req.params;
                await db.collection('journeys').deleteOne({_id: new ObjectId(id)});
                res.sendStatus(204);
            } catch (err) {
                res.status(500).send("Error deleting journeys");
            }
        });
```

**f) Import Multiple Journeys**

`app.post('/api/importJourneys', ...)`

* Accepts an array of journeys to insert in bulk.  
* Performs validation, type conversion, and calculates derived fields like `fuelUsedL` and `percOfTank`.  
* Inserts into the `journeys` collection using `insertMany`.

``` js
// Import Journey ---------------------------------------------------------------
        app.post('/api/importJourneys', async (req, res) => {
            try {
                let journeys = req.body;
                console.log(journeys);

                // Check if Array has data
                if (!Array.isArray(journeys) || journeys.length === 0) {
                    return res.status(400).send("No journeys provided");
                }

                // Clean data before import
                journeys = journeys.map(j => {
                    const distance = Number(j.distance) || 0;
                    const mpg = Number(j.mpg) || 0;

                    const fuelUsedL = mpg > 0 ? distance / (mpg / 3.785) : 0;
                    const percOfTank = tankVolume > 0 ? fuelUsedL / tankVolume : 0;

                    return {
                        user: j.user?.toLowerCase() || "unknown",
                        description: j.description || "",
                        dateTime: new Date(j.dateTime),
                        distance,
                        mpg,
                        timeDriven: Number(j.timeDriven) || 0,
                        temp: Number(j.temp) || 0,
                        condition: j.condition || "Dry",
                        costPl: Number(j.costPl) || 0,
                        avgSpeed: Number(j.avgSpeed) || 0,
                        totalCost: Number(j.totalCost) || 0,
                        costPerMile: Number(j.costPerMile) || 0,
                        fuelUsedL,
                        percOfTank
                    };
                });


                // Declare Db & Collection
                const db = client.db('journeyAppDb');
                const collection = db.collection('journeys');

                // insert records
                await collection.insertMany(journeys);
                res.status(201).send("Journeys imported successfully");
            } catch (err) {
                console.error("Error importing journeys:", err);
                res.status(500).send("Error importing journeys");
            }
        });
```

3\. User Management

**a) Create User**

`app.post('/api/users', ...)`

* Accepts `username`, `password`, and `captcha`.  
* Verifies Google reCAPTCHA for bot prevention.  
* Hashes password using `bcryptjs`.  
* Adds default settings (tank volume, fuel cost, currency, font).  
* Inserts user into the `users` collection.

``` js
 // Insert User --------------------------------------------------------------------------------------------
        app.post('/api/users', async (req, res) => {
            try {
                const {username, password, captcha} = req.body;

                const secretKey = process.env.RECAPTCHA_SECRET;
                const verifyRes = await fetch(
                    `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captcha}`,
                    {method: "POST"}
                );
                const verifyData = await verifyRes.json();

                console.log("Captcha received:", captcha);

                if (!verifyData.success) {
                    return res.status(400).send("Captcha failed, try again.");
                }

                // check is fields are complete
                if (!username || !password) {
                    return res.status(400).send('Username and Password required');
                }

                // check if the user already exists in the database
                const existing = await users.findOne({username});
                if (existing) {
                    return res.status(400).send('Username already exist');
                }

                // Hash password
                const hashedPassword = await bcryptjs.hash(req.body.password, 10);

                // create user document to insert
                const userDoc = {
                    username,
                    password: hashedPassword,
                    dateCreated: new Date(),
                    tankVolume: tankVolume,
                    defFuelCost: 0.0,
                    gallon: "UK",
                    userFont: "Lexend",
                    currency: "£",
                };

                // insert the user into the database
                await users.insertOne(userDoc);
                res.status(201).send('User created');
            } catch (err) {
                console.error('Error saving user:', err);
                res.status(500).send('Error saving user:');
            }
        });
```

**b) Login User**

`app.post('/api/login', ...)`

* Validates `username` and `password`.  
* Uses `bcryptjs.compare` to check hashed password.  
* Returns `200` with username if successful.

``` js
 // Check User for Login --------------------------------------------------------------------------------------------
        app.post('/api/login', async (req, res) => {
            try {
                const {username, password} = req.body;

                // Find user
                const user = await users.findOne({username});
                if (!user) {
                    return res.status(400).send('Invalid username or password');
                }

                // Compare password
                const isMatch = await bcryptjs.compare(password, user.password);
                if (!isMatch) {
                    return res.status(400).send('Invalid username or password');
                }

                // Success Login
                res.status(200).json({username: user.username});
            } catch (err) {
                console.error('Error saving user:', err);
                res.status(500).send('Error logging in:');
            }
        });
```

**c) Get User Data**

`app.get('/api/getUsers/:username', ...)`

* Retrieves a user document excluding the password.  
* Returns `404` if user is not found.

``` js
// Get Users Endpoint -------------------------------------------------------------------
        app.get('/api/getUsers/:username', async (req, res) => {
            const username = req.params.username.toLowerCase();
            try {
                const db = client.db('journeyAppDb');
                const user = await db.collection('users').findOne({username}, {projection: {password: 0}});
                if (!user) return res.status(404).send('No user found.');
                res.json(user);
            } catch (err) {
                console.error("Error retrieving user:", err);
                res.status(500).send("Error retrieving user");
            }
        });
```

**d) Update User Settings**

`app.put('/api/saveUsers/:username', ...)`

* Updates user-specific fields: `tankVolume`, `defFuelCost`, `gallon`, `userFont`, `currency`.  
* Optionally updates password if provided.  
* Uses `$set` for atomic updates.

``` js
 // Save User Endpoint -----------------------------------------------------------------
        app.put('/api/saveUsers/:username', async (req, res) => {
            const username = req.params.username.toLowerCase();
            const {tankVolume, defFuelCost, gallon, userFont, currency, newPassword} = req.body;

            try {
                const db = client.db('journeyAppDb');
                const updateFields = {tankVolume, defFuelCost, gallon, userFont, currency};

                // Add Password if provided
                if (newPassword && newPassword.trim() !== "") {
                    updateFields.password = await bcryptjs.hash(newPassword, 10);
                }

                console.log(`Payload received: ${JSON.stringify(updateFields)}`);

                const result = await db.collection('users').updateOne(
                    {username},
                    {$set: updateFields}
                );

                if (result.matchedCount === 0) {
                    return res.status(404).send('No user found.');
                }

                res.send("Successfully updated user");
            } catch (err) {
                console.error("Error updating user:", err);
                res.status(500).send("Error updating user");
            }
        });
```

4\. Summary and Statistics

**a) User Totals**

`app.get('/api/summary/:username', ...)`

* Aggregates total metrics for a user: `totalMiles`, `totalTime`, `totalFuel`, `totalCost`, `avgMpg`, `longestDistance`, etc.  
* Converts `Decimal128` to JavaScript numbers.  
* Returns `0` for all metrics if no journeys exist.

``` js
 // Get user totals ---------------------------------------------------------------------------------
        app.get('/api/summary/:username', async (req, res) => {
            const username = req.params.username;

            try {
                const summary = await db.collection('journeys').aggregate([
                    { $match: { user: username } },
                    {
                        $group: {
                            _id: null,
                            totalMiles: { $sum: { $toDouble: "$distance" } },
                            totalTime: { $sum: { $toDouble: "$timeDriven" } },
                            totalFuel: { $sum: { $toDouble: "$fuelUsedL" } },
                            totalCost: { $sum: { $toDouble: "$totalCost" } },
                            avgMpg: { $avg: { $toDouble: "$mpg" } },
                            longestDistance: { $max: { $toDouble: "$distance" } },
                            longestTime: { $max: { $toDouble: "$timeDriven" } },
                            bestMpg: { $max: { $toDouble: "$mpg" } }
                        }
                    }
                ]).toArray();

                if (summary.length === 0) {
                    return res.json({
                        totalMiles: 0,
                        totalTime: 0,
                        totalFuel: 0,
                        totalCost: 0,
                        avgMpg: 0,
                        longestDistance: 0,
                        longestTime: 0,
                        bestMpg: 0
                    });
                }

                // Convert Decimal128 → JS numbers (just in case)
                const cleanSummary = Object.fromEntries(
                    Object.entries(summary[0]).map(([key, val]) => [key, Number(val)])
                );

                res.json(cleanSummary);
            } catch (err) {
                console.error(err);
                res.status(500).send("Error retrieving summary");
            }
        });
```

**b) Cost Breakdown**

`app.get('/api/costs/:username', ...)`

* Computes fuel cost over different time periods: 7, 14, 28, 90, 180, 365 days.  
* Uses `$addFields` to normalize `dateTime` strings to `Date`.  
* Aggregates totals using `$sum` with conditional `$cond`.

``` js
// Cost Breakdown --------------------------------------------------------------------------------
        app.get('/api/costs/:username', async (req, res) => {
            const username = req.params.username;

            try {
                const journeysCollection = db.collection('journeys');
                const now = new Date();

                const sevenDaysAgo = new Date(now);
                sevenDaysAgo.setDate(now.getDate() - 7);

                const fourteenDaysAgo = new Date(now);
                fourteenDaysAgo.setDate(now.getDate() - 14);

                const twentyEightDaysAgo = new Date(now);
                twentyEightDaysAgo.setDate(now.getDate() - 28);

                const nintyDaysAgo = new Date(now);
                nintyDaysAgo.setDate(now.getDate() - 90);

                const sixMonthsAgo = new Date(now);
                sixMonthsAgo.setDate(now.getDate() - 180);

                const threeSixFiveDaysAgo = new Date(now);
                threeSixFiveDaysAgo.setDate(now.getDate() - 365);

                const result = await journeysCollection.aggregate([
                    {
                        $match: {user: username}
                    },
                    {
                        // Normalize dateTime
                        $addFields: {
                            parsedDate: {
                                $cond: [
                                    {$eq: [{$type: "$dateTime"}, "string"]},
                                    {$dateFromString: {dateString: "$dateTime"}},
                                    "$dateTime"
                                ]
                            }
                        }
                    },
                    {
                        $match: {
                            parsedDate: {$gte: threeSixFiveDaysAgo}
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            seven: {
                                $sum: {$cond: [{$gte: ["$parsedDate", sevenDaysAgo]}, "$totalCost", 0]}
                            },
                            fourteen: {
                                $sum: {$cond: [{$gte: ["$parsedDate", fourteenDaysAgo]}, "$totalCost", 0]}
                            },
                            twentyEight: {
                                $sum: {$cond: [{$gte: ["$parsedDate", twentyEightDaysAgo]}, "$totalCost", 0]}
                            },
                            ninty:{
                                $sum: {$cond: [{$gte: ["$parsedDate", nintyDaysAgo]}, "$totalCost", 0]}
                            },
                            sixMonth: {
                                $sum: {$cond: [{$gte: ["$parsedDate", sixMonthsAgo]}, "$totalCost", 0]}
                            },
                            threeSixFive: {
                                $sum: {$cond: [{$gte: ["$parsedDate", threeSixFiveDaysAgo]}, "$totalCost", 0]}
                            }
                        }
                    }
                ]).toArray();

                const costs = result.length > 0 ? result[0] : {seven: 0, fourteen: 0, twentyEight: 0};

                res.json({cost: costs});
            } catch (err) {
                console.error("Error retrieving costs:", err);
                res.status(500).send("Error retrieving costs");
            }
        });
```

**c) Full Stats**

`app.get('/api/stats/:username', ...)`

* Returns detailed metrics over journeys, optionally filtered by `start` and `end` dates.  
* Metrics include totals, averages, and derived statistics like `avgMilesPerTank`, `avgCostPerDay`, and `avgCostPerMile`.

``` js
// Full Stats Endpoint ---------------------------------------------------------------
        app.get('/api/stats/:username', async (req, res) => {
            // Declare Parameters
            const username = req.params.username;
            const {start, end} = req.query;

            try {
                const query = {user: username};

                // Check date parameters
                if (start || end) {
                    query.dateTime = {};
                    if (start) query.dateTime.$gte = new Date(start);
                    if (end) {
                        const endDate = new Date(end);
                        endDate.setHours(23, 59, 59, 999); // Included end of the date
                        query.dateTime.$lte = endDate;
                    }
                }

                const journeysData = await journeys.aggregate([
                    {$match: {user: username}},
                    {$addFields: {dateTimeCorrected: {$toDate: "$dateTime"}}},
                    {
                        $match: (() => {
                            const filter = {};
                            if (start) filter.$gte = new Date(start);
                            if (end) {
                                const endDate = new Date(end);
                                endDate.setHours(23, 59, 59, 999);
                                filter.$lte = endDate;
                            }
                            return Object.keys(filter).length ? {dateTimeCorrected: filter} : {};
                        })()
                    }
                ]).toArray();

                console.log(journeysData);

                // Handle empty array
                if (!journeysData || journeysData.length === 0) {
                    return res.json({
                        totalMiles: 0,
                        totalTime: 0,
                        totalFuel: 0,
                        totalCost: 0,
                        avgMilesPerTank: 0,
                        avgMpg: 0,
                        avgSpeed: 0,
                        avgCostPerDay: 0,
                        avgCostPerMile: 0,
                        avgFuelPrice: 0,
                        avgTemp: 0,
                        avgTimeDriven: 0
                    });
                }

                // Calculate base totals
                const totalMiles = journeysData.reduce((sum, j) => sum + j.distance, 0);
                const totalTime = journeysData.reduce((sum, j) => sum + j.timeDriven, 0);
                const totalFuel = journeysData.reduce((sum, j) => sum + j.fuelUsedL, 0);
                const totalCost = journeysData.reduce((sum, j) => sum + j.totalCost, 0);

                // Calculate Averages
                const avgTimeDriven = totalTime / journeysData.length;
                const avgMpg = journeysData.reduce((sum, j) => sum + (+j.mpg || 0), 0) / journeysData.length;
                const avgSpeed = journeysData.reduce((sum, j) => sum + j.avgSpeed, 0) / journeysData.length;
                const avgFuelPrice = journeysData.reduce((sum, j) => sum + j.costPl, 0) / journeysData.length;
                const avgTemp = journeysData.reduce((sum, j) => sum + j.temp, 0) / journeysData.length;

                // Derived Stats
                const avgMilesPerTank = totalFuel > 0 ? totalMiles / totalFuel * tankVolume : 0;
                const avgCostPerDay = (() => {
                    const dates = journeysData.map(j => new Date(j.dateTime));
                    const minDate = start ? new Date(start) : new Date(Math.min(...dates));
                    const maxDate = end ? new Date(end) : new Date(Math.max(...dates));
                    const diffDays = Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)));
                    return totalCost / diffDays;
                })();
                const avgCostPerMile = totalMiles > 0 ? totalCost / totalMiles : 0;

                // Build object
                res.json({
                    totalMiles,
                    totalTime,
                    totalFuel,
                    totalCost,
                    avgMilesPerTank,
                    avgMpg,
                    avgSpeed,
                    avgCostPerDay,
                    avgCostPerMile,
                    avgFuelPrice,
                    avgTemp,
                    avgTimeDriven
                });
            } catch (err) {
                console.error("Error retrieving stats:", err);
                res.status(500).send("Error retrieving stats");
            }
        });
```

5\. Totals and Counting

**a) Total Journeys for User**

`app.get('/api/getTotalJourneys/:username', ...)`

* Counts total journeys for a specific user using `countDocuments`.

``` js
// Get total journeys -------------------------------------------------------------
        app.get('/api/getTotalJourneys/:username', async (req, res) => {
            try {
                const username = req.params.username.toLowerCase();
                const count = await db.collection('journeys').countDocuments({user: username});
                res.json({total: count});
            } catch (error) {
                console.error("Error fetching total journeys:", error);
                res.status(500).json({error: "Failed to fetch total journeys"});
            }
        });
```

6\. Security and Validation Features

* **Password Hashing**: Ensures passwords are never stored in plaintext.  
* **reCAPTCHA**: Protects user creation from bots.  
* **Input Sanitization**: Converts string inputs to numbers for calculations, validates arrays for bulk inserts.  
* **Error Handling**: All endpoints catch errors and return appropriate HTTP status codes (`400`, `404`, `500`).

7\. Server Initialization

`app.listen(3000, ...)`

* Starts the Express server on port `3000`.  
* Logs successful startup or MongoDB connection errors.

Summary

The endpoints collectively provide:

* **CRUD operations** for journeys.  
* **User authentication and management**.  
* **Statistics and analytics** for journeys and fuel costs.  
* **Logging and session tracking** for operational insights

All endpoints are designed to handle asynchronous database operations, provide informative responses, and maintain data integrity.

---

## Conclusion

This report has documented a snapshot version of the Journey App, a web-based application integrated into an Android WebView designed to track user journeys, fuel consumption, and related costs. The application replaces manual spreadsheet tracking with a more efficient, interactive, and visually intuitive system.
The frontend, implemented with HTML, CSS, and JavaScript, provides pages for creating, editing, and viewing journeys, adjusting user-specific settings, and visualising statistics. Features such as responsive design, dynamic form handling, and a mobile-optimised navigation bar enhance usability across devices. The backend, built with Express.js and MongoDB Atlas, offers RESTful API endpoints to manage users, journeys, and analytics securely and efficiently. Additional functionality, such as password management, user-specific settings, and cost aggregation over multiple time periods, ensures the app is both practical and flexible for real-world use.
Throughout development, session management and logging mechanisms have been implemented to support debugging, user tracking, and operational reliability. Together, these components provide a cohesive system that automates journey data collection, reduces manual effort, and delivers actionable insights for users.
Although the current version is fully functional, further testing and refinement are recommended to ensure robustness, data integrity, and usability across all intended devices. Future improvements could include enhanced data visualisation, support for multiple vehicles, offline functionality, and expanded analytics features.
In conclusion, the Journey App demonstrates a complete, end-to-end web and mobile solution for journey tracking, providing a clear improvement over manual spreadsheet methods and laying a foundation for ongoing development and enhancement.
