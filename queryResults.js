const createTicketDataHTML = (data, response) => {
    let {project, status} = data;
    let result = document.createElement("tbody");

    if (response.total > 0) {
        response.issues.map((issue) => {
            let item = document.createElement("tr");
            let assignee = issue.fields.assignee ? issue.fields.assignee.displayName : "Not assigned";

            item.innerHTML = "<td><a href=\"https://jira.secondlife.com/browse/" + issue.key+ "\">" + issue.key + "</a></td><td>"
                + issue.fields.status.name + "</td><td>" + assignee + "</td><td>" + issue.fields.summary + "</td>";
            result.append(item);
        });

        displayResult = result.outerHTML;
    } else {
        displayResult = "<p>There are no results for project: " + project + "</p>";
    }

    return displayResult;
};

const getQueryResults = (data, callback, errorCallback) => {
    let {query} = data;
    makeRequest(query, "json").then((response) => {
        callback(createTicketDataHTML(data, response));
    }, errorCallback);
};

const buildJQL = (data, callback) => {
    let callbackBase = "https://jira.secondlife.com/rest/api/2/search?jql=";
    let {project, statusSelect, inStatusFor} = data;
    let fullCallbackUrl = callbackBase;
    fullCallbackUrl += `project=${project}+and+status=${statusSelect}+and+status+changed+to+${statusSelect}+before+-${inStatusFor}d&fields=id,status,key,assignee,summary&maxresults=100`;
    callback(fullCallbackUrl);
};

document.addEventListener("DOMContentLoaded", () => {
    let params = (new URL(document.location)).searchParams;
    let project = params.get("project");
    let statusSelect = params.get("statusSelect");
    let inStatusFor = params.get("inStatusFor");

    if (project === "") {
        setError("Please enter a project.");
        return;
    }

    if (inStatusFor === "") {
        setError("Please enter a number of days.");
        return;
    }

    buildJQL({project, statusSelect, inStatusFor}, (query) => {
        getQueryResults({ query, project, statusSelect }, (html) => {
            document.getElementById("status").innerHTML = "Results for project " + project;
            document.getElementById("status").hidden = false;

            let jsonResultDiv = document.getElementById("result-body");
            jsonResultDiv.innerHTML = html;
        }, setError);
    });
});
