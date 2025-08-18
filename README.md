This app is very much still under development and I am very much learning as I go.

The Journey app is a replacement for a Google sheet I use to track my fuel consumption and costs as I drive from point A to point B in my life. Using various formulas and my expert excel knowledge I was able to better visualise how much it cost to drive my car. Unfortunately though, filling out a Google sheet is quite annoying, so I decided to make it into an app.  
I use a MongoDb Atlas NoSql Database to store each journey entry and then go from there…

### 🏠 Home Page:

Shows a quick snapshot of summary figures

* Total spent  
* Total driven  
* Average MPG  
* Cost in the past 7 days  
* Cost in the past 14 days  
* Cost in the past 28 days

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

### 📃 Summary

This will show summary data for a given time period chosen by the user. Summary data TBD

### 🛣️ All Journeys 

This will show a list of all the journeys and where the user can click on each and all the details for the journey will be displayed.

### 🚗 Journey Details

This will show the details of a journey with calculated values based on the user input so they can visualise 

### ⚙️ Settings Page

This will allow the user to set default tank volume, fuel cost per litre, dark mode/light mode and maybe other settings, I haven't got to this bit yet

