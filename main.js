/* global validateActivityQueryForm, validateTicketStatusForm, async, chrome */

function makeRequest(url, responseType) {
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
      reject(Error('Network Error'));
    }
    ;
    req.onreadystatechange = function() {
      if(req.readyState === 4 && req.status === 401) {
          reject('You must be logged in to JIRA to see this project.');
      }
    };

    // Make the request
    req.send();
  });
}

function createHTMLElementResult(response){
// Create HTML output to display the search results.
  var html = '';
  for (var issue of response.issues) {
    html += `${issue.key}</a> - <img src='${issue.fields.status.iconUrl}'>`;
    html += ` ${issue.fields.status.name} - ${issue.fields.summary}<br>`;
  }
  return html;

}

async function getJIRAFeed(callback, errorCallback) {
    var user = document.getElementById('user').value;
    if(user === undefined) return;

    var url = `https://jira.secondlife.com/activity?maxResults=50&streams=user+IS+${user}` +
      `&providers=issues`;
    try {
      var feedResult = await makeRequest(url, '');
      callback(url, feedResult);
    } catch (errorMessage) {
      errorCallback(errorMessage);
    }
}
/**
 * @param {string} searchTerm - Search term for JIRA Query.
 * @param {function(string)} callback - Called when the query results have been
 *   formatted for rendering.
 * @param {function(string)} errorCallback - Called when the query or call fails.
 */
async function getQueryResults(searchTerm, callback, errorCallback) {
  try {
    var queryResult = await makeRequest(searchTerm, 'json');
    callback(createHTMLElementResult(queryResult));
  } catch (errorMessage) {
    errorCallback(errorMessage);
  }
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

function buildJQL(callback) {
  var callbackBase = 'https://jira.secondlife.com/rest/api/2/search?jql=';
  var project = document.getElementById('project').value;
  var status = document.getElementById('statusSelect').value;
  var inStatusFor = document.getElementById('daysPast').value;
  var cbUrl = callbackBase;
  cbUrl += `project=${project}+and+status=${status}+and+status+changed+to+${status}`;
  cbUrl += `+before+-${inStatusFor}d&fields=id,status,key,assignee,summary&maxresults=100`;
  callback(cbUrl);
}

// utility
function domify(str){
  var dom = (new DOMParser()).parseFromString('<!doctype html><body>' + str,'text/html');
  return dom.body.textContent;
}

async function checkProjectExists(){
    try {
      return await makeRequest('https://jira.secondlife.com/rest/api/2/project/SUN', 'json');
    } catch (errorMessage) {
      document.getElementById('status').innerHTML = 'ERROR. ' + errorMessage;
      document.getElementById('status').hidden = false;
    }
}

// Setup
loadOptions();

document.addEventListener('DOMContentLoaded', function() {
  // if logged in, setup listeners
    checkProjectExists().then(function() {
      // query click handler
      document.getElementById('query').onclick = function(){
        // build query
        if (!validateTicketStatusForm()) {
          return;
        }
        buildJQL(function(url) {
          document.getElementById('status').innerHTML = 'Retrieving ticket statuses...';
          document.getElementById('status').hidden = false;
          document.getElementById('query-result').innerHTML = '';
          // perform the search
          getQueryResults(url, function(returnVal) {
            // render the results
            document.getElementById('status').hidden = true;

            var jsonResultDiv = document.getElementById('query-result');
            jsonResultDiv.innerHTML = returnVal;
            jsonResultDiv.hidden = false;

          }, function(errorMessage) {
              document.getElementById('status').innerHTML = 'ERROR. ' + errorMessage;
              document.getElementById('status').hidden = false;
          });
        });
      };

      // activity feed click handler
      document.getElementById('feed').onclick = function(){
        // get the xml feed
        if (!validateActivityQueryForm()) {
          return;
        }
        document.getElementById('status').innerHTML = 'Loading results for user ' +
          document.getElementById('user').value + '...';
        document.getElementById('status').hidden = false;
        document.getElementById('query-result').innerHTML = '';
        getJIRAFeed(function(url, xmlDoc) {
          document.getElementById('status').hidden = true;

          // render result
          var feed = xmlDoc.getElementsByTagName('feed');
          var entries = feed[0].getElementsByTagName('entry');
          var list = document.createElement('ul');

          for (var index = 0; index < entries.length; index++) {
            var html = entries[index].getElementsByTagName('title')[0].innerHTML;
            var updated = entries[index].getElementsByTagName('updated')[0].innerHTML;
            var item = document.createElement('li');
            item.innerHTML = new Date(updated).toLocaleString() + ' - ' + domify(html);
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
