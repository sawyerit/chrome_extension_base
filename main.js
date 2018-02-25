const getJIRAFeed = (callback, errorCallback) => {
    const user = document.getElementById("user").value;
    if (user == undefined) {
        return;
    }

    const url = "https://jira.secondlife.com/activity?maxResults=50&streams=user+IS+" + user
              + "&providers=issues";
    make_request(url, "").then((response) => {
        // empty response type allows the request.responseXML property to be returned in the
        // makeRequest call
        callback(url, response);
    }, errorCallback);
}

/**
 * @param {string} searchTerm - Search term for JIRA Query.
 * @param {function(string)} callback - Called when the query results have been
 *   formatted for rendering.
 * @param {function(string)} errorCallback - Called when the query or call fails.
 */

const getQueryResults = async (s, callback, errorCallback) => {
    try {
        let response = await
        make_request(s, "json");
        callback(createHTMLElementResult(response));
    } catch (error) {
        errorCallback(error);
    }
}

const make_request = (url, responseType) => {
    return new Promise((resolve, reject) => {
        let req = new XMLHttpRequest();
        req.open('GET', url);
        req.responseType = responseType;

        req.onload = () => {
            let response = responseType ? req.response : req.responseXML;
            if (response && response.errorMessages && response.errorMessages.length > 0) {
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
            if (req.readyState == 4 && req.status == 401) {
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
    const project = document.getElementById("project").value;
    const status = document.getElementById("statusSelect").value;
    const inStatusFor = document.getElementById("daysPast").value
    let fullCallbackUrl = callbackBase;
    fullCallbackUrl +=
        `project=${project}+and+status=${status}+and+status+changed+to+${status}+before+-${inStatusFor}d&fields=id,status,key,assignee,summary&maxresults=100`;
    callback(fullCallbackUrl);
}

const createHTMLElementResult = (response) => {
    document.getElementById('query-result').hidden = false;
    let issues = response.issues.map((issue) =>{
        return `<b>Summary: ${issue.fields.summary}</b><ul><li>Id: ${issue.id}</li><li>Status: ${issue.fields.status.name}</li><li>Link: <a href=${issue.self}>${issue.self}</a></li></ul>`
    })
    return `<div id ='query-issue-result'>
      <h4>Issues: ${response.total}</h4>
      <div>
        ${issues.join('')}
      </div>
    </div>`;

}

// utility 
const domify = (str) => {
    const dom = (new DOMParser()).parseFromString('<!doctype html><body>' + str, 'text/html');
    return dom.body.textContent;
}

const checkProjectExists = async () => {
    try {
        return await
        make_request("https://jira.secondlife.com/rest/api/2/project/SUN", "json");
    } catch (errorMessage) {
        document.getElementById('status').innerHTML = 'ERROR. ' + errorMessage;
        document.getElementById('status').hidden = false;
    }
}

// Setup
document.addEventListener('DOMContentLoaded', () => {
    // if logged in, setup listeners

    /**
     * BUG fixed: checkProjectExists() is the promise without creation of Promise object thus make it async function
     */
    checkProjectExists().then(() => {
        //load saved options
        loadOptions();

        // query click handler
        document.getElementById("query").onclick = () => {
            // build query
            buildJQL((url) => {
                document.getElementById('status').innerHTML = 'Performing JIRA search for ' + url;
                document.getElementById('status').hidden = false;
                // perform the search
                getQueryResults(url, (return_val) => {
                    // render the results
                    document.getElementById('status').innerHTML = 'Query term: ' + url + '\n';
                    document.getElementById('status').hidden = false;

                    let jsonResultDiv = document.getElementById('query-result');
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
                let feed = xmlDoc.getElementsByTagName('feed');
                let entries = feed[0].getElementsByTagName("entry");
                let list = document.createElement('ul');

                for (let index = 0; index < entries.length; index++) {
                    let html = entries[index].getElementsByTagName("title")[0].innerHTML;
                    let updated = entries[index].getElementsByTagName("updated")[0].innerHTML;
                    let item = document.createElement('li');
                    item.innerHTML = new Date(updated).toLocaleString() + " - " + domify(html);
                    list.appendChild(item);
                }

                let feedResultDiv = document.getElementById('query-result');
                if (list.childNodes.length > 0) {
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
