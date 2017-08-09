/**Params*****
* @param {string} searchTerm - Search term for JIRA Query.
* @param {function(string)} callback - Called when the query results have been
*   formatted for rendering.
* @param {function(string)} errorCallback - Called when the query or call fails.
*/

function getJIRAFeed(callback, errorCallback){
    let user = document.getElementById("user").value;
    if(user == undefined) return;

    let url = `https://jira.secondlife.com/activity?maxResults=50&streams=user+IS+${user}&providers=issues`;
    makeRequest(url, "").then((response) => {
      // empty response type allows the request.responseXML property to be returned in the makeRequest call
      // without this, more difficult to parse responses that return different formats: JSON vs XML.
      callback(url, response);
    }, errorCallback);
}
async function getQueryResults(searchTerm, callback, errorCallback) {
    try {
      let response = await makeRequest(searchTerm, "json"); //awaits a resolved promise from makeRequest
      callback(createHTMLElementResult(response));
    } catch (error) {
      errorCallback(error);
    }
}

function makeRequest(url, responseType) {

  return new Promise((resolve, reject) => {

    let req = new XMLHttpRequest();
    req.open('GET', url);
    req.responseType = responseType;

    req.onload = () =>{
      let response = responseType ? req.response : req.responseXML;
      if(response && response.errorMessages && response.errorMessages.length > 0){
        reject(response.errorMessages[0]);
        return;
      }
      resolve(response);
    };

    // Handle network errors
    req.onerror = () =>{
      reject(Error("Network Error"));
    }
    req.onreadystatechange = () =>{
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
  }, (items) => {
    document.getElementById('project').value = items.project;
    document.getElementById('user').value = items.user;
  });
}

function buildJQL(callback) {
  let callbackBase = "https://jira.secondlife.com/rest/api/2/search?jql=";
  let project = document.getElementById("project").value;
  let status = document.getElementById("statusSelect").value;
  let inStatusFor = document.getElementById("daysPast").value
  let fullCallbackUrl = callbackBase;
  fullCallbackUrl += `project=${project}+and+status=${status}+and+status+changed+to+${status}+before+-${inStatusFor}d&fields=id,status,key,assignee,summary&maxresults=100`;
  callback(fullCallbackUrl);
}

function createHTMLElementResult(response){
  document.getElementById('query-result').hidden = false;
  let resultsArray = response.issues.map((issue) =>{
    return `<h6>${issue.fields.summary}</h6><ul><li>Status: <strong>${issue.fields.status.name}</strong></li><li>Key: <em>${issue.key}</em>, ID: <em>${issue.id}</em></li><li><a href=${issue.self}>${issue.self}</a></li></ul>`
  })
  return `<div id ='response-results'>
      <h4>Total Results: ${response.total}</h4>
      <h5>Issues: </h5>
      <div>
        ${resultsArray.join('')}
      </div>
    </div>`;
}

// utility
function domify(str){
  let dom = (new DOMParser()).parseFromString('<!doctype html><body>' + str,'text/html');
  return dom.body.textContent;
}

async function checkProjectExists(){
    try {
      return await makeRequest("https://jira.secondlife.com/rest/api/2/project/SUN", "json");
    } catch (errorMessage) {
      document.getElementById('status').innerHTML = 'ERROR. ' + errorMessage;
      document.getElementById('status').hidden = false;
    }
}

// Setup
document.addEventListener('DOMContentLoaded', () =>{
  // if logged in, setup listeners
    checkProjectExists().then(() =>{
      //load saved options
      loadOptions();

      // query click handler
      document.getElementById("query").onclick = ()=>{
        // build query
        buildJQL((url) =>{
          document.getElementById('status').innerHTML = 'Performing JIRA search for ' + url;
          document.getElementById('status').hidden = false;
          // perform the search
          getQueryResults(url, (returnVal) =>{
            // render the results
            document.getElementById('status').innerHTML = 'Query term: ' + url + '\n';
            document.getElementById('status').hidden = false;

            let jsonResultDiv = document.getElementById('query-result');
            jsonResultDiv.innerHTML = returnVal;
            jsonResultDiv.hidden = false;

          }, (errorMessage)=> {
              document.getElementById('status').innerHTML = 'ERROR. ' + errorMessage;
              document.getElementById('status').hidden = false;
          });
        });
      }

      // activity feed click handler
      document.getElementById("feed").onclick = ()=>{
        // get the xml feed
        getJIRAFeed((url, xmlDoc) => {
          document.getElementById('status').innerHTML = 'Activity query: ' + url + '\n';
          document.getElementById('status').hidden = false;

          // render result
          let feed = xmlDoc.getElementsByTagName('feed');
          let entries = feed[0].getElementsByTagName("entry");
          let list = document.createElement('ul');

          for (let index = 0; index < entries.length; index++) {
            let html = entries[index].getElementsByTagName("title")[0].innerHTML;
            let updated = entries[index].getElementsByTagName("updated")[0].innerHTML;
            let item = document.createElement('li');
            item.innerHTML = new Date(updated).toLocaleString() + " - " + '<br/>' + domify(html);
            list.appendChild(item);
          }

          let feedResultDiv = document.getElementById('query-result');
          if(list.childNodes.length > 0){
            feedResultDiv.innerHTML = list.outerHTML;
          } else {
            document.getElementById('status').innerHTML = 'There are no activity results.';
            document.getElementById('status').hidden = false;
          }

          feedResultDiv.hidden = false;

        }, (errorMessage) =>{
          document.getElementById('status').innerHTML = 'ERROR. ' + errorMessage;
          document.getElementById('status').hidden = false;
        });
      };

    }).catch((errorMessage) =>{
        document.getElementById('status').innerHTML = 'ERROR. ' + errorMessage;
        document.getElementById('status').hidden = false;
    });
});
