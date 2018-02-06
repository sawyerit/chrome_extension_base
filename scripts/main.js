// -------------------------------------------------------------
// Main Functions
// -------------------------------------------------------------

document.addEventListener('DOMContentLoaded', setupPage);

/**
 * Sets up the page and event handlers
 */
function setupPage() {
    // LOAD DEFAULT OPTIONS
    loadDefaultSettings();

    // TABS HANDLER
    document.querySelectorAll('button').forEach(function(elm) {
        elm.addEventListener('click', openTab);
    });

    // TICKETS BY STATUS HANDLER
    document.getElementById("tickets").onclick = function() {
        getTicketsByStatus();
    };

    // ACTIVITY FEED HANDLER
    document.getElementById("activity").onclick = function() {
        getActivityFeed();
    };
}

// -------------------------------------------------------------
// Setting Functions
// -------------------------------------------------------------

/**
 * Loads the default field values if present.
 */
function loadDefaultSettings() {
    chrome.storage.sync.get(['project', 'user'], function(items) {
        if (!chrome.runtime.error) {
            document.getElementById('project').value = (items.project) ? items.project : '';
            document.getElementById('user').value = (items.user) ? items.user : '';
        }
    });
}

// -------------------------------------------------------------
// Network Call Functions
// -------------------------------------------------------------

/**
 * Gets the ticket results from your search.
 */
function getTicketsByStatus() {
    clearAlerts();
    clearElement('query-result-tickets');

    if (!validateField("project", "Project is required.")) {
        return;
    }

    var project = document.getElementById("project").value;
    var status = document.getElementById("statusSelect").value;
    var inStatusFor = document.getElementById("daysPast").value;
    var ticketsQueryUrl = buildTicketQuery(project, status, inStatusFor);

    isLoading(true);

    baseGetRequest(ticketsQueryUrl, "")
        .then(function(data) {
            populateTicketsDataSet(data);
        })
        .catch(function(error) {
            addAlert(error, "error");
        })
        .finally(function() {
            isLoading(false);
        });
}

/**
 * Gets the activity results from your search.
 */
function getActivityFeed() {
    clearAlerts();
    clearElement('query-result-activity');

    if (!validateField("user", "User is required.")) {
        return;
    }

    var user = document.getElementById("user").value;

    isLoading(true);

    baseGetRequest(`https://jira.secondlife.com/activity?maxResults=50&streams=user+IS+${user}&providers=issues`, "")
        .then(function(data) {
            populateActivityDataSet(data);
        })
        .catch(function(error) {
            addAlert(error, "error");
        })
        .finally(function() {
            isLoading(false);
        });
}

// -------------------------------------------------------------
// Supporting functions
// -------------------------------------------------------------

/**
 * Builds the query used to query JIRA
 * @param {project} project - The project
 * @param {status} status - The status
 * @param {inStatusFor} inStatusFor - The Min # of days in status (not required)
 */
function buildTicketQuery(project, status, inStatusFor) {
    var baseUrl = "https://jira.secondlife.com/rest/api/2/search?jql=";
    if (!inStatusFor) {
        inStatusFor = 0;
    }
    return baseUrl += `project=${project}+and+status=${status}+and+status+changed+to+${status}+before+-${inStatusFor}d&fields=id,status,key,assignee,summary,created&maxresults=100`;
}
