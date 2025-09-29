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
