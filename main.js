/**
 * @param {function(string, object)} callback - Called when given request url
 * returns with data
 * @param {function(string)} errorCallback - Called when fetch fails.
 */
function getJIRAFeed(callback, errorCallback){
    var user = document.getElementById("user").value;
    if(user == undefined) return;

    var url = "https://jira.secondlife.com/activity?" +
                "maxResults=50&streams=user+IS+"
                + user +
                "&providers=issues";

    make_request(url, "").then(function(response) {
      // empty response type allows the request.responseXML property
      // to be returned in the makeRequest call
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


/**
 * @param {string} url - URL for GET request
 * @param {string} responseType - JSON if mentioned as JSON, else fetches XML
 */
function make_request(url, responseType) {
  return new Promise(function(resolve, reject) {
    var req = new XMLHttpRequest();
    req.open('GET', url);
    req.responseType = responseType;

    req.onload = function() {
      var response = responseType ? req.response : req.responseXML;
      if(response && response.errorMessages && response.errorMessages.length > 0){
        reject(response.errorMessages[0]);
        return;
      }
      resolve(response);
    };

    // Handle network errors
    req.onerror = function() {
      reject(Error("Network Error"));
    }
    req.onreadystatechange = function() {
      if(req.readyState == 4 && req.status == 401) {
          reject("You must be logged in to JIRA to see this project.");
      }
    }

    // Make the request
    req.send();
  });
}


function loadOptions(){
  chrome.storage.sync.get({
    project: 'Sunshine',
    user: 'nyx.linden'
  }, function(items) {
    document.getElementById('project').value = items.project;
    document.getElementById('user').value = items.user;
  });
}

/**
 * @param {function(string)} callback - Called after forming the JQL as string
*/
function buildJQL(callback) {
  var callbackBase = "https://jira.secondlife.com/rest/api/2/search?jql=";
  var project = document.getElementById("project").value;
  var status = document.getElementById("statusSelect").value;
  var inStatusFor = document.getElementById("daysPast").value
  var fullCallbackUrl = callbackBase;
  fullCallbackUrl += `project=${project}+and+status=${status}` +
                      `+and+status+changed+to+${status}+before+-` +
                      `${inStatusFor}d&fields=id,status,key,` +
                      `assignee,summary&maxresults=100`;
  console.log(fullCallbackUrl);
  callback(fullCallbackUrl);
}


/**
 * @param {object} response - A response object containing ticket data.
 * Check json_results/results.json for an example of this object.
*/
function createHTMLElementResult(response){
  try {
    const ticketsTable = document.createElement('table');

    response.issues.forEach(function(issue) {
      const ticketRow = document.createElement('tr');
      const id = issue.id;
      const summary = issue.fields.summary;
      const statusName = issue.fields.status.name;
      const assigneeDispName = issue.fields.assignee?
                          issue.fields.assignee.displayName : "No Assignee";

      insertTableRowWithCellValue(ticketRow, id);
      insertTableRowWithCellValue(ticketRow, summary);
      insertTableRowWithCellValue(ticketRow, status);
      insertTableRowWithCellValue(ticketRow, assigneeDispName);

      ticketsTable.append(ticketRow);
    });

    return ticketsTable.outerHTML;
  }
  catch(error) {
    return `<p>ERROR. ${error}`;
  }
}


function checkProjectExists(){
    try {
      return make_request("https://jira.secondlife.com/rest/api/2/project/SUN", "json");
    } catch (errorMessage) {
      document.getElementById('status').innerHTML = 'ERROR. ' + errorMessage;
      document.getElementById('status').hidden = false;
    }
}


// Setup
document.addEventListener('DOMContentLoaded', function() {
  // if logged in, setup listeners
    checkProjectExists().then(function() {
      //load saved options
      loadOptions();

      // query click handler
      document.getElementById("query").onclick = function(){
        // build query
        buildJQL(function(url) {
          document.getElementById('status').innerHTML = 'Performing JIRA search for ' + url;
          document.getElementById('status').hidden = false;
          // perform the search
          getQueryResults(url, function(return_val) {
            // render the results
            document.getElementById('status').innerHTML = 'Query term: ' + url + '\n';
            document.getElementById('status').hidden = false;

            var jsonResultDiv = document.getElementById('query-result');
            jsonResultDiv.innerHTML = return_val;
            jsonResultDiv.hidden = false;

          }, function(errorMessage) {
              document.getElementById('status').innerHTML = 'ERROR. ' + errorMessage;
              document.getElementById('status').hidden = false;
          });
        });
      }

      // activity feed click handler
      document.getElementById("feed").onclick = function(){
        // get the xml feed
        getJIRAFeed(function(url, xmlDoc) {
          document.getElementById('status').innerHTML = 'Activity query: ' + url + '\n';
          document.getElementById('status').hidden = false;

          // render result
          var feed = xmlDoc.getElementsByTagName('feed');
          var entries = feed[0].getElementsByTagName("entry");
          var list = document.createElement('ul');

          for (var index = 0; index < entries.length; index++) {
            var html = entries[index].getElementsByTagName("title")[0].innerHTML;
            var updated = entries[index].getElementsByTagName("updated")[0].innerHTML;
            var item = document.createElement('li');
            item.innerHTML = new Date(updated).toLocaleString() + " - " + domify(html);
            list.appendChild(item);
          }

          var feedResultDiv = document.getElementById('query-result');
          if(list.childNodes.length > 0){
            feedResultDiv.innerHTML = list.outerHTML;
          } else {
            document.getElementById('status').innerHTML = 'There are no activity results.';
            document.getElementById('status').hidden = false;
          }

          feedResultDiv.hidden = false;

        }, function(errorMessage) {
          document.getElementById('status').innerHTML = 'ERROR. ' + errorMessage;
          document.getElementById('status').hidden = false;
        });
      };

    }).catch(function(errorMessage) {
        document.getElementById('status').innerHTML = 'ERROR. ' + errorMessage;
        document.getElementById('status').hidden = false;
    });
});


// Utility Methods
/**
 * @param {string} str - String containing HTML tags for domifying
*/
function domify(str){
  var dom = (new DOMParser()).parseFromString('<!doctype html><body>' + str,'text/html');
  return dom.body.textContent;
}


/**
 * @param {object} rowRef - DOM Object containing reference to a table row
 * @param {string} value - Text contents for new table cell
 * @param {number} position - 0 indicates insert at beginning,
 *  -1 for inserting in the last position, defaults to -1
*/
const insertTableRowWithCellValue = function(rowRef, value, position = -1) {
  const cell = rowRef.insertCell(position);
  cell.innerHTML = value;
  return cell;
}
