# Journey App

This app is very much still under development and I am very much learning as I go.

The Journey app is a replacement for a Google sheet I use to track my fuel consumption and costs as I drive from point A to point B in my life. Using various formulas and my expert excel knowledge I was able to better visualise how much it cost to drive my car. Unfortunately though, filling out a Google sheet is quite annoying, so I decided to make it into an app.  
I use a MongoDb Atlas NoSql Database to store each journey entry and then go from there…

Repo for the android app here https://github.com/BONDY25/JourneyAppAndroid

* [29/09/2025 Technical Report](CarrierModuleDatabaseDictionary.md)

## Current "To Do"

...

### Logo

<img width="500" height="500" alt="Journey App" src="https://github.com/user-attachments/assets/c9ffa46f-bab7-4d75-8865-60bede2d07cc" />

### Login Page:

This page allows user to either login with a username and password or register as a new user with a username and password

<img width="380" height="823" alt="image" src="https://github.com/user-attachments/assets/e3dfb404-eaa9-4bf4-9a8f-155325f3f9d6" />

### 🏠 Home Page:

Shows a quick snapshot of summary figures

* Total spent  
* Total driven  
* Average MPG  
* Cost in the past 7 days  
* Cost in the past 14 days  
* Cost in the past 28 days

<img width="380" height="823" alt="image" src="https://github.com/user-attachments/assets/54eafa6d-9b69-4e1b-9fdc-414699b23873" />

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

<img width="380" height="823" alt="image" src="https://github.com/user-attachments/assets/07ba1cf1-2df1-4a4c-bd9e-1f84cd291fe5" />

### 📃 Summary

This will show summary data for a given time period chosen by the user. Summary data TBD

<img width="380" height="823" alt="image" src="https://github.com/user-attachments/assets/3e41ff91-2fa8-4b2e-b555-8ad7e1f7e9e6" />

### 🛣️ All Journeys 

This will show a list of all the journeys and where the user can click on each and all the details for the journey will be displayed.

<img width="380" height="823" alt="image" src="https://github.com/user-attachments/assets/36fefc3f-1185-4798-8437-5d5521dc70bd" />

### 🚗 Journey Details

This will show the details of a journey with calculated values based on the user input so they can visualise 

<img width="380" height="823" alt="image" src="https://github.com/user-attachments/assets/32397103-f463-4976-95ea-619a1e807bb8" />

### ✍️ Edit Journey

This will allow users to change any details for a journey or delete a journey if required.

<img width="380" height="823" alt="image" src="https://github.com/user-attachments/assets/ddd4debd-6c54-450e-b135-94b769c91356" />

### ⚙️ Settings Page

This will allow the user to set default tank volume, fuel cost per litre, dark mode/light mode and maybe other settings.

<img width="380" height="823" alt="image" src="https://github.com/user-attachments/assets/53a8eed3-6184-45b1-b6a2-e52da0ca25e0" />

