# Journey App

This app is very much still under development and I am very much learning as I go.

The Journey app is a replacement for a Google sheet I use to track my fuel consumption and costs as I drive from point A to point B in my life. Using various formulas and my expert excel knowledge I was able to better visualise how much it cost to drive my car. Unfortunately though, filling out a Google sheet is quite annoying, so I decided to make it into an app.  
I use a MongoDb Atlas NoSql Database to store each journey entry and then go from there…

## Current "To Do"

* Improve navigation
* Add Logo
* Fix costing pannel on home page (Cost in the last 7, 14 & 28 days)
* Add protection against spam on the Login Page
* Get username to show on setting page
* Get total jounryes to show on settings page
* Add delete function to journey details
* Make view of stats easier to read? fields names on the left, field values on the right or table view?
* Add Change password to user settings
* Add summary stats for past 28 days on home page
* Turn into Android app with a WebView

### Logo

<img width="500" height="500" alt="Journey App" src="https://github.com/user-attachments/assets/c9ffa46f-bab7-4d75-8865-60bede2d07cc" />

### Login Page:

This page allows user to either login with a username and password or register as a new user with a username and password

<img width="352" height="661" alt="image" src="https://github.com/user-attachments/assets/5e3085ca-a23b-401c-a831-925e42352297" />

### 🏠 Home Page:

Shows a quick snapshot of summary figures

* Total spent  
* Total driven  
* Average MPG  
* Cost in the past 7 days  
* Cost in the past 14 days  
* Cost in the past 28 days

<img width="298" height="559" alt="image" src="https://github.com/user-attachments/assets/9bddbbd7-5bfc-4fc2-8af8-3f7110b45fd6" />

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
* Tank Volume (This will be pre populated a default set by the user on a settings page, but can be changed here to (changing it here will update the default))

<img width="302" height="568" alt="image" src="https://github.com/user-attachments/assets/e06b8146-d441-4b62-9f33-a9e8db01ce6e" />

### 📃 Summary

This will show summary data for a given time period chosen by the user. Summary data TBD

<img width="301" height="566" alt="image" src="https://github.com/user-attachments/assets/cb0c688e-11c1-4f34-8af8-df19b8dd717b" />

### 🛣️ All Journeys 

This will show a list of all the journeys and where the user can click on each and all the details for the journey will be displayed.

<img width="303" height="566" alt="image" src="https://github.com/user-attachments/assets/8c2d1a3c-8c1a-4e3e-b8d0-7cd78d89ab0f" />

### 🚗 Journey Details

This will show the details of a journey with calculated values based on the user input so they can visualise 

<img width="297" height="556" alt="image" src="https://github.com/user-attachments/assets/df7ca038-b957-4e60-8c3f-c35627d94677" />

### ⚙️ Settings Page

This will allow the user to set default tank volume, fuel cost per litre, dark mode/light mode and maybe other settings, I haven't got to this bit yet

<img width="293" height="556" alt="image" src="https://github.com/user-attachments/assets/0b132539-e590-45c5-89c8-5265923d799d" />
