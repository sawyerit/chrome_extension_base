// -------------------------------------------------------------
// Main Functions
// -------------------------------------------------------------

document.addEventListener('DOMContentLoaded', setupPage);

/**
 * Sets up the page and event handlers
 */
function setupPage() {
    clearAlerts();
    loadOptions();
    document.getElementById('save').addEventListener('click', saveOptions);
    document.getElementById('defaults').addEventListener('click', saveDefaultOptions);
}

// -------------------------------------------------------------
// Supporting functions
// -------------------------------------------------------------

/**
 * Loads the options from chrome storage if present, otherwise empty string
 */
function loadOptions() {
    chrome.storage.sync.get(['project', 'user'], function(items) {
        if (!chrome.runtime.error) {
            document.getElementById('project').value = (items.project) ? items.project : '';
            document.getElementById('user').value = (items.user) ? items.user : '';
        }
    });
}

/**
 * Saves the options to chrome storage
 */
function saveOptions() {
    clearAlerts();
    var prj = document.getElementById('project').value;
    var usr = document.getElementById('user').value;
    
    chrome.storage.sync.set({
        project: prj,
        user: usr
    }, function() {
        addAlert("Options updated", "success");
        setTimeout(function(){ 
            clearAlerts(); 
        }, 1000);
    });
}

/**
 * Restores defaults and saves the options to chrome storage
 */
function saveDefaultOptions() {
    var prj = document.getElementById('project').value = 'Sunshine';
    var usr = document.getElementById('user').value = 'nyx.linden';
    saveOptions();
}