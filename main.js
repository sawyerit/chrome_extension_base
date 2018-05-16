
function getJIRAFeed(callback, errorCallback) {
  var user = document.getElementById("user").value;
  if (user == undefined) return;

  var url = "https://jira.secondlife.com/activity?maxResults=50&streams=user+IS+" + user + "&providers=issues";
  make_request(url, "").then(function (response) {
    // empty response type allows the request.responseXML property to be returned in the makeRequest call
    callback(url, response);
  }, errorCallback);
}
/**
 * @param {string} searchTerm - Search term for JIRA Query.
 * @param {function(string)} callback - Called when the query results have been  
 *   formatted for rendering.
 * @param {function(string)} errorCallback - Called when the query or call fails.
 */
async function getQueryResults(s, callback, errorCallback) {
  try {
    var response = await make_request(s, "json");
    callback(createHTMLElementResult(response));
  } catch (error) {
    errorCallback(error);
  }
}

function make_request(url, responseType) {
  return new Promise(function (resolve, reject) {
    var req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.responseType = responseType;

    req.onload = function () {
      var response = responseType ? req.response : req.responseXML;
      if (response && response.errorMessages && response.errorMessages.length > 0) {
        reject(response.errorMessages[0]);
        return;
      }
      resolve(response);
    };

    // Handle network errors
    req.onerror = function () {
      reject(Error("Network Error"));
    }
    req.onreadystatechange = function () {
      if (req.readyState == 4 && req.status == 401) {
        reject("You must be logged in to JIRA to see this project.");
      }
    }

    // Make the request
    req.send();
  });
}

function loadOptions() {
  chrome.storage.sync.get({
    project: 'Sunshine',
    user: 'nyx.linden'
  }, function (items) {
    document.getElementById('project').value = items.project;
    document.getElementById('user').value = items.user;
  });
}
function buildJQL(callback) {
  if (document.getElementById("daysPast").value <= 0) {
    document.getElementById('status').innerHTML = 'ERROR. Enter a valid value for days';
    document.getElementById('status').hidden = false;
    return;
  }

  var callbackBase = "https://jira.secondlife.com/rest/api/2/search?jql=";
  var project = document.getElementById("project").value;
  var status = document.getElementById("statusSelect").value;
  var inStatusFor = document.getElementById("daysPast").value
  var fullCallbackUrl = callbackBase;
  fullCallbackUrl += `project=${project}+and+status=${status}+and+status+changed+to+${status}+before+-${inStatusFor}d&fields=id,status,key,assignee,summary&maxresults=100`;
  callback(fullCallbackUrl);
}

// Render Ticket Status Query
function createHTMLElementResult(response) {
  // parse issues
  var issues = response.issues;

  // create table header
  var table = document.createElement('table');
  var header = document.createElement('tr');
  var statusHeader = document.createElement('th');
  var keyHeader = document.createElement('th');
  var summaryHeader = document.createElement('th');
  statusHeader.innerHTML = "Status";
  keyHeader.innerHTML = "Key";
  summaryHeader.innerHTML = "Summary";
  header.innerHTML = `${statusHeader.outerHTML} ${keyHeader.outerHTML} ${summaryHeader.outerHTML}`;
  table.appendChild(header);

  // create columns
  var summary = document.createElement('td');
  var key = document.createElement('td');
  var status = document.createElement('td');

  // build table
  for (var index = 0; index < issues.length; index++) {
    var row = document.createElement('tr');
    status.innerHTML = `<img src="${issues[index].fields.status.iconUrl}"/>`;
    summary.innerHTML = issues[index].fields.summary.length > 75 ? `${issues[index].fields.summary.substring(0, 75)}...` : issues[index].fields.summary;
    key.innerHTML = `<a href="https://jira.secondlife.com/browse/${issues[index].key}" target="_blank">${issues[index].key}</a>`;
    row.innerHTML = `${status.outerHTML} ${key.outerHTML} ${summary.outerHTML}`;
    table.appendChild(row);
  }

  return table;

}

// utility 
function domify(str) {
  var dom = (new DOMParser()).parseFromString('<!doctype html><body>' + str, 'text/html');
  return dom.body.textContent;
}

async function checkProjectExists() {
  try {
    return await make_request("https://jira.secondlife.com/rest/api/2/project/SUN", "json");
  } catch (errorMessage) {
    document.getElementById('status').innerHTML = 'ERROR. ' + errorMessage;
    document.getElementById('status').hidden = false;
  }
}

function getJiraInfo() {
  // if logged in, setup listeners
  checkProjectExists().then(function () {
    //load saved options
    loadOptions();

    // query click handler
    document.getElementById("query").onclick = function () {
      // build query
      buildJQL(function (url) {
        document.getElementById('status').innerHTML = 'Performing JIRA search for ' + url;
        document.getElementById('status').hidden = false;
        // perform the search
        getQueryResults(url, function (return_val) {
          // render the results
          document.getElementById('status').innerHTML = 'Query term: ' + url + '\n';
          document.getElementById('status').hidden = false;

          var jsonResultDiv = document.getElementById('query-result');
          jsonResultDiv.innerHTML = return_val.outerHTML;
          jsonResultDiv.hidden = false;

        }, function (errorMessage) {
          document.getElementById('status').innerHTML = 'ERROR. ' + errorMessage;
          document.getElementById('status').hidden = false;
        });
      });
    }

    // activity feed click handler
    document.getElementById("feed").onclick = function () {
      // get the xml feed
      getJIRAFeed(function (url, xmlDoc) {
        document.getElementById('status').innerHTML = 'Activity query: ' + url + '\n';
        document.getElementById('status').hidden = false;

        // render result
        var feed = xmlDoc.getElementsByTagName('feed');
        var entries = feed[0].getElementsByTagName("entry");
        var table = document.createElement('table');
        var header = document.createElement('tr');
        var dateHeader = document.createElement('th');
        var activityHeader = document.createElement('th');
        // build headers
        dateHeader.innerHTML = "Date";
        activityHeader.innerHTML = "Activity";
        header.innerHTML = `${dateHeader.outerHTML} ${activityHeader.outerHTML}`;
        table.appendChild(header);

        var date = document.createElement('td');
        var activity = document.createElement('td');

        //build rows
        for (var index = 0; index < entries.length; index++) {
          var row = document.createElement('tr');
          var html = entries[index].getElementsByTagName("title")[0].innerHTML;
          var updated = entries[index].getElementsByTagName("updated")[0].innerHTML;

          row.innerHTML = `<td>${new Date(updated).toLocaleString()}</td> <td>${domify(html)}</td>`;
          table.appendChild(row);
        }

        var feedResultDiv = document.getElementById('query-result');
        if (table.childNodes.length > 0) {
          feedResultDiv.innerHTML = table.outerHTML;
        } else {
          document.getElementById('status').innerHTML = 'There are no activity results.';
          document.getElementById('status').hidden = false;
        }

        feedResultDiv.hidden = false;

      }, function (errorMessage) {
        document.getElementById('status').innerHTML = 'ERROR. ' + errorMessage;
        document.getElementById('status').hidden = false;
      });
    };

  }).catch(function (errorMessage) {
    document.getElementById('status').innerHTML = 'ERROR. ' + errorMessage;
    document.getElementById('status').hidden = false;
  });
}

// Setup
document.addEventListener('DOMContentLoaded', getJiraInfo);