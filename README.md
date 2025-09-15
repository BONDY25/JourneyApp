# Journey App

This app is very much still under development and I am very much learning as I go.

The Journey app is a replacement for a Google sheet I use to track my fuel consumption and costs as I drive from point A to point B in my life. Using various formulas and my expert excel knowledge I was able to better visualise how much it cost to drive my car. Unfortunately though, filling out a Google sheet is quite annoying, so I decided to make it into an app.  
I use a MongoDb Atlas NoSql Database to store each journey entry and then go from there…

## Current "To Do"

* Improve navigation
* Add protection against spam on the Login Page
* Get total journeys to show on settings page
* Add delete function to journey details
* Add edit function to journey details
* Make view of stats easier to read? fields names on the left, field values on the right or table view?
* Add Change password to user settings
* Add summary stats for past 28 days on home page
* Turn into Android app with a WebView

### Logo

<img width="500" height="500" alt="Journey App" src="https://github.com/user-attachments/assets/c9ffa46f-bab7-4d75-8865-60bede2d07cc" />

### Login Page:

This page allows user to either login with a username and password or register as a new user with a username and password

<img width="392" height="653" alt="image" src="https://github.com/user-attachments/assets/d8855223-2b49-4d9b-b821-73614d4959ed" />

### 🏠 Home Page:

Shows a quick snapshot of summary figures

* Total spent  
* Total driven  
* Average MPG  
* Cost in the past 7 days  
* Cost in the past 14 days  
* Cost in the past 28 days

<img width="402" height="672" alt="image" src="https://github.com/user-attachments/assets/8ec27951-0b3a-4823-b3f9-c5844256737e" />

### ✍️ New Journey

This is a form that the user will fill in the data from their journey. The fields are:

* Description  
* Date & Time  
* Distance (Miles)  
* MPG  
* Time Driven (Minutes)  
* Temperature (C)  
* Condition (Wet/Dry)  
* Fuel cost per liter (This will be pre populated a default set by the user on a settings page, but can be changed here to (changing it here will update the default))  

<img width="399" height="832" alt="image" src="https://github.com/user-attachments/assets/662e54f2-961e-41d8-af61-f39dcfa4f3e3" />

### 📃 Summary

This will show summary data for a given time period chosen by the user. Summary data TBD

<img width="399" height="762" alt="image" src="https://github.com/user-attachments/assets/a3a7500f-fd0d-49b5-a55e-e04686cf1427" />

### 🛣️ All Journeys 

This will show a list of all the journeys and where the user can click on each and all the details for the journey will be displayed.

<img width="404" height="820" alt="image" src="https://github.com/user-attachments/assets/3e60db87-e6d2-4bd8-a97a-043bf5e96577" />

### 🚗 Journey Details

This will show the details of a journey with calculated values based on the user input so they can visualise 

<img width="403" height="514" alt="image" src="https://github.com/user-attachments/assets/b5d897f1-e430-4f9b-8ccf-22b23f6c1aa3" />

### ⚙️ Settings Page

This will allow the user to set default tank volume, fuel cost per litre, dark mode/light mode and maybe other settings.

<img width="403" height="635" alt="image" src="https://github.com/user-attachments/assets/254cb39e-ff7b-4dfe-ba78-6ad1ab1d0697" />
