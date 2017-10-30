(() => {
  function getJIRAFeed(callback, errorCallback) {
    const userNode = document.getElementById('user');
    
    // do a strict null check on the node query
    if (userNode === null) {
      return;
    }

    // if userNode is not null grab user value
    const user = userNode.value;
    const url = `https://jira.secondlife.com/activity?maxResults=50&streams=user+IS+${user}&providers=issues`;

    makeRequest(url, '')
      .then((response) => {
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
      const response = await makeRequest(s, 'json');
      callback(createHTMLElementResult(response));
    } catch (error) {
      errorCallback(error);
    }
  }

  function makeRequest(url, responseType) {
    return new Promise((resolve, reject) => {
      const req = new XMLHttpRequest();

      req.open('GET', url);
      req.responseType = responseType;

      req.onload = () => {
        const response = responseType ? req.response : req.responseXML;

        if (response && response.errorMessages && response.errorMessages.length > 0){
          reject(response.errorMessages[0]);
          return;
        }

        resolve(response);
      };

      // Handle network errors
      req.onerror = () => {
        reject(Error('Network Error'));
      }

      req.onreadystatechange = () => { 
        if(req.readyState === 4 && req.status === 401) { 
          reject('You must be logged in to JIRA to see this project.');
        }
      }

      // Make the request
      req.send();
    });
  }

  function loadOptions() {
    chrome.storage.sync.get({
      project: 'Sunshine',
      user: 'nyx.linden',
    }, (items) => {
      document.getElementById('project').value = items.project;
      document.getElementById('user').value = items.user;
    });
  }

  function buildJQL(callback) {
    const callbackBase = 'https://jira.secondlife.com/rest/api/2/search?jql=';
    const project = document.getElementById('project').value;
    const status = document.getElementById('statusSelect').value;
    const inStatusFor = document.getElementById('daysPast').value

    let fullCallbackUrl = callbackBase;

    fullCallbackUrl += `project=${project}+and+status=${status}+and+status+changed+to+${status}+before+-${inStatusFor}d&fields=id,status,key,assignee,summary&maxresults=100`;
    callback(fullCallbackUrl);
  }

  function createHTMLElementResult(response) {
    /** 
     * Create HTML output to display the search results.
     * results.json in the 'json_results' folder contains a sample of the API response
     * hint: you may run the application as well if you fix the bug. 
     */ 
    return response.issues
      .map((issue) => {
        const { fields, key } = issue;
        const { summary, status } = fields;
        const link = `https://jira.secondlife.com/browse/${key}`;

        return (
          `
            <div>
              <h5>
                <a target="_blank" rel="nofollow" href="${link}">${summary}</a>
              </h5>
              <p>Status: ${status.name} <img src="${status.iconUrl}" /></p>
              <hr>
            </div>
          `
        ).trim();
      })
      .join('');  
  }

  // utility 
  function domify(str) {
    const dom = (new DOMParser())
      .parseFromString(`<!doctype html><body>${str}`, 'text/html');

    return dom.body.textContent;
  }

  async function checkProjectExists(statusNode) {
    try {
      return await makeRequest(
        'https://jira.secondlife.com/rest/api/2/project/SUN',
        'json',
      );
    } catch (errorMessage) {
      statusNode.innerText = `ERROR. ${errorMessage}`;
      statusNode.hidden = false;
    }
  }

  // Setup
  document.addEventListener('DOMContentLoaded', () => {
    // frontload selector for statusNode
    const statusNode = document.getElementById('status');

    // if logged in, setup listeners
    checkProjectExists(statusNode)
      .then(() => {
        //load saved options
        loadOptions();

        // query click handler
        document.getElementById('query').onclick = () => {
          // build query
          buildJQL((url) => {
            statusNode.innerText = `Performing JIRA search for ${url}`;
            statusNode.hidden = false;  
            // perform the search
            getQueryResults(url, (returnVal) => {
              // render the results
              statusNode.innerText = `Query term: ${url}\n`;
              statusNode.hidden = false;
              
              const jsonResultDiv = document.getElementById('query-result');

              jsonResultDiv.innerHTML = returnVal;
              jsonResultDiv.hidden = false;
            }, (errorMessage) => {
              statusNode.innerText = `ERROR. ${errorMessage}`;
              statusNode.hidden = false;
            });
          });
        }

        // activity feed click handler
        document.getElementById('feed').onclick = () => {   
          // get the xml feed
          getJIRAFeed((url, xmlDoc) => {
            statusNode.innerText = 'Activity query: ' + url + '\n';
            statusNode.hidden = false;

            // render result
            const feed = xmlDoc.getElementsByTagName('feed');
            const entries = feed[0].getElementsByTagName('entry');
            const list = document.createElement('ul');

            for (let index = 0; index < entries.length; index++) {
              // frontload entry
              const entry = entries[index];

              const html = entry.getElementsByTagName('title')[0].innerHTML;
              const updated = entry.getElementsByTagName('updated')[0].innerHTML;
              const item = document.createElement('li');  
              const updatedLocaleDate = new Date(updated).toLocaleString();

              item.innerHTML = `
                ${updatedLocaleDate}<ul><li>${domify(html)}</li></ul>
              `.trim();

              list.appendChild(item);
            }

            const feedResultDiv = document.getElementById('query-result');

            if (list.childNodes.length > 0) {
              feedResultDiv.innerHTML = list.outerHTML;
            } else {
              statusNode.innerHTML = 'There are no activity results.';
              statusNode.hidden = false;
            }

            feedResultDiv.hidden = false;
          }, (errorMessage) => {
            statusNode.innerText = `ERROR. ${errorMessage}`;
            statusNode.hidden = false;
          });
        };        
      })
      .catch((errorMessage) => {
        statusNode.innerText = `ERROR. ${errorMessage}`;
        statusNode.hidden = false;
      });   
  });
})();