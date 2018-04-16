/**
 * @param {string} searchTerm - Search term for JIRA Query.
 * @param {function(string)} callback - Called when the query results have been
 *   formatted for rendering.
 * @param {function(string)} errorCallback - Called when the query or call fails.
 */

// Network Request & Utility Functions

const make_request = (url, responseType) => {
  return new Promise((resolve, reject) => {
    var req = new XMLHttpRequest();
    req.open("GET", url);
    req.responseType = responseType;

    req.onload = () => {
      var response = responseType ? req.response : req.responseXML;
      if (
        response &&
        response.errorMessages &&
        response.errorMessages.length > 0
      ) {
        reject(response.errorMessages[0]);
        return;
      }
      resolve(response);
    };

    handleNetworkError(req);
    req.send();
  });
};

const handleNetworkError = req => {
  req.onerror = () => {
    reject(Error("Network Error"));
  };
  req.onreadystatechange = () => {
    if (req.readyState == 4 && req.status == 401) {
      reject("You must be logged in to JIRA to see this project.");
    }
  };
};

async function checkProjectExists() {
  try {
    var result = await make_request(
      "https://jira.secondlife.com/rest/api/2/project/SUN",
      "json"
    );
    return result;
  } catch (e) {
    errorMessage(e);
  }
}

const element = id => {
  return document.getElementById(id);
};

const errorMessage = error => {
  var status = element("status");
  status.innerHTML = "ERROR: " + error;
  status.hidden = false;
  clearResultsDisplay();
};

const loadOptions = () => {
  chrome.storage.sync.get(
    {
      project: "Sunshine",
      user: "nyx.linden"
    },
    items => {
      element("project").value = items.project;
      element("user").value = items.user;
    }
  );
};

const domify = str => {
  var dom = new DOMParser().parseFromString(
    "<!doctype html><body>" + str,
    "text/html"
  );
  return dom.body.textContent;
};

const clearResultsDisplay = () => {
  var queryResultElement = element("query-result");
  queryResultElement.innerHTML = "";
  queryResultElement.hidden = true;
};

// Ticket Status Query Functions

const formatTicketStatusQueryResults = response => {
  var issues = response["issues"];
  var count = response["total"];
  var results = issues.map(issue => {
    return (
      "<div class='card'><div class='card-container'>" +
      `<h6>Issue ID: ${issue["id"]} | Key: ${issue["key"]}</h6>` +
      `<img src='${issue["fields"]["status"]["iconUrl"]}' /> ` +
      issue["fields"]["status"]["name"] +
      ": " +
      issue["fields"]["summary"] +
      "</div></div><br/>"
    );
  });
  return (
    `<h6><b>Ticket Status Query Results</b><br/>Total Count: ${count}</h6>` +
    results.join("")
  );
};

const buildJQLForTicketStatusQuery = callback => {
  var callbackBase = "https://jira.secondlife.com/rest/api/2/search?jql=";
  var project = element("project").value;
  var status = element("statusSelect").value;
  var inStatusFor = element("daysPast").value;
  var fullCallbackUrl = callbackBase;
  fullCallbackUrl += `project=${project}+and+status=${status}+and+status+changed+to+${status}+before+-${inStatusFor}d&fields=id,status,key,assignee,summary&maxresults=100`;
  callback(fullCallbackUrl);
};

async function getQueryResults(s, callback, errorCallback) {
  try {
    var response = await make_request(s, "json");
    callback(formatTicketStatusQueryResults(response));
  } catch (error) {
    errorCallback(error);
  }
}

const ticketQueryClickHandler = () => {
  var status = element("status");
  element("query").onclick = () => {
    buildJQLForTicketStatusQuery(url => {
      status.innerHTML = "Performing JIRA search for " + url;
      status.hidden = false;
      getQueryResults(
        url,
        return_val => {
          status.innerHTML = "<i>Query term: " + url + "</i>\n";
          status.hidden = false;

          var queryResultDiv = document.getElementById("query-result");
          queryResultDiv.innerHTML = return_val;
          queryResultDiv.hidden = false;
        },
        errorMessage
      );
    });
  };
};

// JIRA Activity Feed Query Functions

const getJIRAFeed = (callback, errorCallback) => {
  if (element("user").value == undefined) return;

  var url =
    "https://jira.secondlife.com/activity?maxResults=50&streams=user+IS+" +
    element("user").value +
    "&providers=issues";
  make_request(url, "").then(response => {
    // empty response type allows the request.responseXML property
    // to be returned in the makeRequest call
    callback(url, response);
  }, errorCallback);
};

const buildActivityFeedDisplayList = (entries, list) => {
  for (var i = 0; i < entries.length; i++) {
    var html = entries[i].getElementsByTagName("title")[0].innerHTML;
    var updated = entries[i].getElementsByTagName("updated")[0].innerHTML;
    var item = document.createElement("li");
    item.innerHTML = new Date(updated).toLocaleString() + " - " + domify(html);
    list.appendChild(item);
  }
};

const renderActivityFeedResults = entries => {
  var list = document.createElement("ul");
  buildActivityFeedDisplayList(entries, list);
  var status = element("status");

  if (list.childNodes.length > 0) {
    element("query-result").innerHTML =
      "<h6><b>JIRA Activity Feed Results</b></h6>" + list.outerHTML;
    status.innerHTML = "";
    status.hidden = true;
  } else {
    status.innerHTML = "There are no activity results.";
    status.hidden = false;
    clearResultsDisplay();
  }

  element("query-result").hidden = false;
};

const activityFeedClickHandler = () => {
  element("feed").onclick = () => {
    getJIRAFeed((url, xmlDoc) => {
      status.innerHTML = "Activity query: " + url + "\n";
      status.hidden = false;

      var feed = xmlDoc.getElementsByTagName("feed");
      var entries = feed[0].getElementsByTagName("entry");

      renderActivityFeedResults(entries);
    }, errorMessage);
  };
};

// Build the Extension Display Page

document.addEventListener("DOMContentLoaded", () => {
  checkProjectExists()
    .then(() => {
      loadOptions();
      ticketQueryClickHandler();
      activityFeedClickHandler();
    })
    .catch(errorMessage);
});
