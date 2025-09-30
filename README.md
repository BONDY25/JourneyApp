# Journey App

This app is very much still under development and I am very much learning as I go.

The Journey app is a replacement for a Google sheet I use to track my fuel consumption and costs as I drive from point A to point B in my life. Using various formulas and my expert excel knowledge I was able to better visualise how much it cost to drive my car. Unfortunately though, filling out a Google sheet is quite annoying, so I decided to make it into an app.  
I use a MongoDb Atlas NoSql Database to store each journey entry and then go from there…

Repo for the android app here https://github.com/BONDY25/JourneyAppAndroid

**Currently in phase 2 After getting basic functionallity complete so users can view, add and edit journeys. Now for QoL imporvements and some more interesting features!**

* [29/09/2025 Technical Report (Phase 1)](JourneyAppTechnicalReportV1.md)

## Current "To Do"

* Add Budget Tracking Feature
* Add user themes Light/dark/etc...
* Add mileage/time targets/limits
* Add ability to create graphical representations of stats, e.g. line graph, bar charts.
* Add Ability to export data to CSV

### Logo

<img width="500" height="500" alt="Journey App" src="https://github.com/user-attachments/assets/c9ffa46f-bab7-4d75-8865-60bede2d07cc" />

### Login Page:

This page allows users to either log in or register. When a username and password are entered, the system checks the database for a match. If a valid match is found, the user is logged in. If the credentials do not match, an error message is displayed indicating that the username or password is invalid. If the username does not exist in the database, the page switches to a “register” mode, allowing the user to set a password and complete a reCAPTCHA verification in order to register as a new user.

<img width="380" height="823" alt="image" src="https://github.com/user-attachments/assets/e3dfb404-eaa9-4bf4-9a8f-155325f3f9d6" />

### 🏠 Home Page:

The Home page is the first page a user sees after logging in or registering. It provides a quick overview of their driving and fuel usage data. At the top, the user is presented with total summary statistics, including their total mileage, total travel time, total fuel used, overall costs, and average miles per gallon (MPG).

In addition to the lifetime totals, the Home page also displays a 28-day summary showing recent mileage, time spent driving, fuel consumption, costs, and fuel efficiency. This allows the user to monitor short-term trends in their usage.
The page also includes a cost breakdown for the past 7, 14, and 28 days, giving users a clear picture of how their fuel expenses are changing over time.
Together, these elements make the Home page a dashboard-style landing screen, designed to give the user a quick but detailed snapshot of their driving habits and costs without needing to dig into the full statistics page.

* Total spent  
* Total driven  
* Average MPG  
* Cost in the past 7 days  
* Cost in the past 14 days  
* Cost in the past 28 days

<img width="380" height="823" alt="image" src="https://github.com/user-attachments/assets/54eafa6d-9b69-4e1b-9fdc-414699b23873" />

### ✍️ New Journey

The New Journey page allows the user to record details of a completed journey. The form collects information such as a journey description, date and time, distance travelled, fuel efficiency (MPG), time driven, external temperature, driving conditions (dry or wet), and the cost of fuel per litre.
Once the form is submitted, the application automatically calculates additional fields such as fuel used, average speed, total cost, cost per mile, and percentage of tank consumed. These calculations ensure that every journey entry is stored with both raw inputs and derived statistics, providing richer insights.
The completed journey record is then saved to the database under the logged-in user’s account. This allows the data to contribute to the overall statistics shown in the app and to be retrieved later for summaries, cost breakdowns, and reporting features.
The fields are:

* Description  
* Date & Time  
* Distance (Miles)  
* MPG  
* Time Driven (Minutes)  
* Temperature (C)  
* Condition (Wet/Dry)  
* Fuel cost per liter (This will be pre populated a default set by the user on a settings page, but can be changed here to (changing it here will update the default))  

<img width="380" height="823" alt="image" src="https://github.com/user-attachments/assets/07ba1cf1-2df1-4a4c-bd9e-1f84cd291fe5" />

### 📃 Full Stats

This will show summary data for a given time period chosen by the user. Summary data TBD

<img width="380" height="823" alt="image" src="https://github.com/user-attachments/assets/3e41ff91-2fa8-4b2e-b555-8ad7e1f7e9e6" />

### 🛣️ Your Journeys 

This page provides the user with a complete list of all their recorded journeys, displayed in a table format. Each entry shows the date and time, the journey description, and the distance travelled, giving a clear overview of past activity. If no journeys are found, the page will display a message to inform the user instead of showing an empty table.
The table rows are interactive, by selecting a journey, the user is redirected to a detailed journey view where more information about that specific trip can be accessed. This functionality makes it easy for users to review and recall individual journeys while maintaining a simple, high-level overview on the main list page.

<img width="380" height="823" alt="image" src="https://github.com/user-attachments/assets/36fefc3f-1185-4798-8437-5d5521dc70bd" />

### 🚗 Journey Details

The Journey Details page displays the complete dataset for an individual journey. It retrieves both raw input values (such as distance, time driven, and fuel price) and calculated statistics (such as cost per mile, percentage of tank used, and average speed) from the database for the selected journey.  
The page provides:

* A clear breakdown of the journey’s date, time, description, and conditions.  
* Key performance metrics, including MPG, fuel consumption, and journey cost.  
* Supporting statistics that help users understand efficiency, such as cost per mile and percentage of fuel tank consumed.  
* A simple navigation and action interface:  
  * Edit button: Allows users to modify the journey’s details.  
  * Back button: Returns users to the Your Journeys overview page.

This page acts as the single record view, giving the user a complete picture of a journey and enabling further actions (edit or review) as part of the wider journey management workflow.

<img width="380" height="823" alt="image" src="https://github.com/user-attachments/assets/32397103-f463-4976-95ea-619a1e807bb8" />

### ✍️ Edit Journey

This page allows a user to update the details of an existing journey they have previously recorded. The editable fields are the same as those found on the New Journey page (such as date and time, distance, MPG, time driven, weather condition, temperature, and fuel cost per litre), with the exception of the journey description, which cannot be changed once a journey has been created.  
When the user updates a field, the system automatically recalculates key statistics, such as fuel usage, total cost, cost per mile, and average speed. This ensures the journey record remains accurate and consistent with the changes.

* In addition to editing, the page provides options to:  
  * Save Changes: Updates the journey in the database and returns the user to the Your Journeys overview.  
  * Delete Journey: Permanently removes the selected journey from the database after confirmation.  
  * Back: Returns the user to the journey list without making any changes.

This page ensures flexibility for correcting mistakes or updating information, while also maintaining clear safeguards for data integrity.

<img width="380" height="823" alt="image" src="https://github.com/user-attachments/assets/ddd4debd-6c54-450e-b135-94b769c91356" />

### ⚙️ Settings Page

This page provides users with the ability to view and update their personalized application settings. Users can modify key parameters that influence journey calculations and the app interface, including:

* Default fuel tank volume: Sets the tank size for calculating fuel usage and percentage of tank consumed.  
* Default fuel cost: Used for calculating journey costs and cost per mile.  
* User currency: Determines the currency symbol used throughout the app.  
* Preferred gallon system (US or UK): Adjusts fuel consumption calculations based on the measurement system.  
* Font selection: Allows the user to choose a preferred font for the app interface for readability or aesthetic preference.  
* Password update: Provides the option to change the user’s login password securely.

Additionally, the page displays non-editable user information, such as the username and the total number of journeys recorded, giving users a quick overview of their account data. Settings are persisted both locally and on the server to ensure consistency across sessions and devices.


<img width="380" height="823" alt="image" src="https://github.com/user-attachments/assets/53a8eed3-6184-45b1-b6a2-e52da0ca25e0" />

