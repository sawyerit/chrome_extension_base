const getJIRAFeed = (callback, errorCallback) => {
  let user = document.getElementById('user').value;
  if(!user) return;
  const url = `https://jira.secondlife.com/activity?maxResults=50&streams=user+IS+${user}&providers=issues`;
  makeRequest(url, '').then((response) => {
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
async function getQueryResults(searchTerm, callback, errorCallback) {    
  try {
    const response = await makeRequest(searchTerm, 'json');
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
      const response = responseType ? req.response : req.responseXML;
      if(response && response.errorMessages && !response.errorMessages.length){
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

const loadOptions = () => {
  chrome.storage.sync.get({
    project: 'Sunshine',
    user: 'nyx.linden'
  }, (items) => {
    const { project, user } = items;
    document.getElementById('project').value = project;
    document.getElementById('user').value = user;
  });
}

const buildJQL = (callback) => {
  const callbackBase = 'https://jira.secondlife.com/rest/api/2/search?jql=';
  const project = document.getElementById('project').value;
  const status = document.getElementById('statusSelect').value;
  const inStatusFor = document.getElementById('daysPast').value;
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
        <p><strong>STATUS:</strong> ${status.name} <img src='${status.iconUrl}' alt='status icon'></p>
        <p><strong>MORE INFO:</strong> <a href=${issue.self}  target='_blank'>${issue.self}</a></p>
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

const showStatus = (html) => {
  document.getElementById('status').innerHTML = html; 
  document.getElementById('status').hidden = false;
}

async function checkProjectExists(){
    try {
      return await makeRequest('https://jira.secondlife.com/rest/api/2/project/SUN', 'json');
    } catch (errorMessage) {
      showStatus(`ERROR. ${errorMessage}`);
    }
}

const displayError = (errorMesssage) => {
  showStatus(`ERROR. ${errorMessage}`);
}

const handleQueryClick = () => {
  document.getElementById('query').onclick = () => {
    buildJQL((url) => {
      showStatus(`Performing JIRA search for ${url}`);  
      getQueryResults(url, (returnVal) => {
        showStatus(`Query term: ${url}\n`);
        
        const jsonResultDiv = document.getElementById('query-result');
        jsonResultDiv.innerHTML = returnVal;
        jsonResultDiv.hidden = false;

      }, (errorMessage) => {
          displayError(errorMessage);
      });
    });
  };
}

const renderList = (xmlDoc) => {
  const feed = xmlDoc.getElementsByTagName('feed');
  const entries = feed[0].getElementsByTagName('entry');
  let list = document.createElement('ul');

  for (let index = 0; index < entries.length; index++) {
    const html = entries[index].getElementsByTagName('title')[0].innerHTML;
    const updated = entries[index].getElementsByTagName('updated')[0].innerHTML;
    const listItem = document.createElement('li');
    listItem.innerHTML = new Date(updated).toLocaleString() + ' - ' + domify(html);
    list.appendChild(listItem);
  }
  return list;
}

const handleFeedClick = () => {
  document.getElementById('feed').onclick = () => {   
    // get the xml feed
    getJIRAFeed((url, xmlDoc) => {
      showStatus(`Activity query: ${url}\n`);

      const list = renderList(xmlDoc);
      const feedResultDiv = document.getElementById('query-result');

      list.childNodes.length ? feedResultDiv.innerHTML = list.outerHTML : showStatus('There are no activity results.');
      
      feedResultDiv.hidden = false;

    }, (errorMessage) => {
      displayError(errorMessage);
    });    
  };
}

// Setup
document.addEventListener('DOMContentLoaded', () => {
  // if logged in, setup listeners
    checkProjectExists().then(() => {
      loadOptions();
      handleQueryClick();
      handleFeedClick();        
    }).catch((errorMessage) => {
        displayError(errorMessage);
    });   
});
