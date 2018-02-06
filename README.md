# JIRA Chrome extension
A chrome extension that queries a public JIRA API (https://jira.secondlife.com). 

## Files:
* **scripts/main.js** - Contians the main logic for the extension
* **scripts/options.js** - Contains the logic for saving and defaulting prefs
* **pages/main.html** - The UI for the main page.
* **pages/options.html** - display for the user values
* **js/alerts.js** - Common alert functionality
* **js/fields.js** - Common field functionality
* **js/tabs.js** - Common tabs functionality
* **js/http.js** - Common http/get functionality
* **js/functions.js** - Common used functions
* **manifest.json** - contains metadata for the project and defines access permissions

## Todo:
* Add field to set maxresults to ticket search
* Add field to set maxresults to activity feed
* See if there is a json based api for activity feed and put a bullet in XML (yuck)
* Enforce the max on the date field. Error handling captures it though ;)
* Oh god, use constants for urls lol

## Changes:
* Fixed - Removed async call in a non-async function
* Fixed - Removed unnecessary icon.png at root
* Fixed - Removed the project exist check, the main call does this already
* Fixed - Getting of settings from storage
* Fixed - Added error check on storage get
* Fixed - Got rid of a heck of a lot of html that was redundant or messy
* Fixed - Renamed functions as they were not clear
  * buildJQL
  * getQueryResults
  * getJIRAFeed
* Fixed - Binding for Tickets by Status
  * Tried to make both bindings closer to common, but xml vs json.. also changed domify
* Fixed - Added some "common" datarow rendering
* Fixed - Window does not flex out on results, should state somewhat static minus scrollbar
* General - Organized files in solution, more maintainable
* General - Moved events and page setup stuff to top of files
* General - Consistent naming on functions
* General - Commented all functions, intellisense weeee
* General - Changed a lot to string interpolation
* General - Moved http into common function
* General - Moved to promises, I like them better
* Added - Check for errors all over the place.
* Added - Tabs because its yucky having it all mixed up
* Added - Field validation, and defaulted the days in status behind the scenes
* Fun - Main - Generally just made the ui more friendly
* Fun - Main - Added alerts, alerts are cool yo
* Fun - Main - Added more statuses to query and removed the id, using the query language
* Fun - Main - Added loading indicator, hated stuff just popping into the dom
* Fun - Options - Generally just made the ui more friendly
* Fun - Options - Added ability to reset to defaults
* Fun - Options - Added alerts, alerts are cool yo