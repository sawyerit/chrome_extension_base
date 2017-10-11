const getJIRAFeed = (callback, errorCallback) => {
  let user = document.getElementById("user").value;
  if(user == undefined) return;
  let url = `https://jira.secondlife.com/activity?maxResults=50&streams=user+IS+${user}&providers=issues`;
  makeRequest(url, "").then((response) => {
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
    const response = await makeRequest(s, "json");
    callback(createHTMLElementResult(response));
  } catch (error) {
    errorCallback(error);
  }
}

const makeRequest = (url, responseType) => {
  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest();
    req.open('GET', url);
    req.responseType = responseType;

    req.onload = () => {
      let response = responseType ? req.response : req.responseXML;
      if(response && response.errorMessages && response.errorMessages.length > 0){
        reject(response.errorMessages[0]);
        return;
      }
      resolve(response);
    };

    // Handle network errors
    req.onerror = () => {
      reject(Error("Network Error"));
    }
    req.onreadystatechange = () => { 
      if(req.readyState == 4 && req.status == 401) { 
        reject("You must be logged in to JIRA to see this project.");
      }
    }

    // Make the request
    req.send();
  });
}

const loadOptions = () => {
  chrome.storage.sync.get({
    project: 'Sunshine',
    user: 'nyx.linden'
  }, (items) => {
    document.getElementById('project').value = items.project;
    document.getElementById('user').value = items.user;
  });
}

const buildJQL = (callback) => {
  const callbackBase = "https://jira.secondlife.com/rest/api/2/search?jql=";
  let project = document.getElementById("project").value;
  let status = document.getElementById("statusSelect").value;
  let inStatusFor = document.getElementById("daysPast").value;
  let fullCallbackUrl = callbackBase;
  fullCallbackUrl += `project=${project}+and+status=${status}+and+status+changed+to+${status}+before+-${inStatusFor}d&fields=id,status,key,assignee,summary&maxresults=100`;
  callback(fullCallbackUrl);
}

const createHTMLElementResult = (response) => {

  document.getElementById('query-result').hidden = false;

  const queryResults = response.issues.map((issue) => {
    const { summary, status, assignee } = issue.fields;
    const assigned = assignee ? assignee.displayName : 'Issue is not assigned';
    const info = `
      <article class='issue-container'>
        <h6><strong>ISSUE:</strong> ${summary}</h6>
        <p><strong>ISSUE ID:</strong> ${issue.id}</p>
        <p><strong>STATUS:</strong> ${status.name} <img src="${status.iconUrl}"></p>
        <p><strong>MORE INFO:</strong> <a href=${issue.self}  target="_blank">${issue.self}</a></p>
        <p id='assignee'><strong>ASSIGNEE:</strong> ${assigned}</p>
      </article>
      `;
    return info;
  })

  const displayData = `
    <h4>Total results: ${response.total}</h4>
    <h5>Issues: </h5>
    <section>${queryResults.join('')}</section>
  `;

  return displayData;  
}

// utility 
const domify = (str) => {
  const dom = (new DOMParser()).parseFromString('<!doctype html><body>' + str,'text/html');
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
document.addEventListener('DOMContentLoaded', () => {
  // if logged in, setup listeners
    checkProjectExists().then(() => {
      //load saved options
      loadOptions();

      // query click handler
      
      document.getElementById("query").onclick = () =>{
        // build query
        buildJQL((url) => {
          document.getElementById('status').innerHTML = 'Performing JIRA search for ' + url;
          document.getElementById('status').hidden = false;  
          // perform the search
          getQueryResults(url, (return_val) => {
            // render the results
            document.getElementById('status').innerHTML = 'Query term: ' + url + '\n';
            document.getElementById('status').hidden = false;
            
            const jsonResultDiv = document.getElementById('query-result');
            jsonResultDiv.innerHTML = return_val;
            jsonResultDiv.hidden = false;

          }, (errorMessage) => {
              document.getElementById('status').innerHTML = 'ERROR. ' + errorMessage;
              document.getElementById('status').hidden = false;
          });
        });
      }

      // activity feed click handler
      document.getElementById("feed").onclick = () => {   
        // get the xml feed
        getJIRAFeed((url, xmlDoc) => {
          document.getElementById('status').innerHTML = 'Activity query: ' + url + '\n';
          document.getElementById('status').hidden = false;

          // render result
          const feed = xmlDoc.getElementsByTagName('feed');
          const entries = feed[0].getElementsByTagName("entry");
          const list = document.createElement('ul');

          for (let index = 0; index < entries.length; index++) {
            const html = entries[index].getElementsByTagName("title")[0].innerHTML;
            const updated = entries[index].getElementsByTagName("updated")[0].innerHTML;
            const item = document.createElement('li');
            item.innerHTML = new Date(updated).toLocaleString() + " - " + domify(html);
            list.appendChild(item);
          }

          const feedResultDiv = document.getElementById('query-result');
          if(!list.childNodes.length){
            feedResultDiv.innerHTML = list.outerHTML;
          } else {
            document.getElementById('status').innerHTML = 'There are no activity results.';
            document.getElementById('status').hidden = false;
          }
          
          feedResultDiv.hidden = false;

        }, (errorMessage) => {
          document.getElementById('status').innerHTML = 'ERROR. ' + errorMessage;
          document.getElementById('status').hidden = false;
        });    
      };        

    }).catch((errorMessage) => {
        document.getElementById('status').innerHTML = 'ERROR. ' + errorMessage;
        document.getElementById('status').hidden = false;
    });   
});
