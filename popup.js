const loadOptions = () => {
    chrome.storage.local.get({
        project: "Sunshine",
        user: "nyx.linden"
    }, (items) => {
        document.getElementById("project").value = items.project;
        document.getElementById("user").value = items.user;
    });
};

const queryClickHandler = () => {
    let project = document.getElementById("project").value;
    let statusSelect = document.getElementById("statusSelect").value;
    let inStatusFor = document.getElementById("daysPast").value

    if (project === "") {
        setError("Please enter a project.");
        return;
    }

    if (inStatusFor === "") {
        setError("Please enter number of days.");
        status.hidden = false;
        return;
    }

    chrome.tabs.create({ url: "queryResults.html?project=" + project + "&statusSelect=" + statusSelect + "&inStatusFor=" + inStatusFor });
};

const feedClickHandler = () => {
    let user = document.getElementById("user").value;

    if (user === "") {
        setError("Please enter a user.");
        return;
    }

    chrome.tabs.create({ url: "feedResults.html?user=" + user });
};

document.addEventListener("DOMContentLoaded", () => {
    makeRequest("https://jira.secondlife.com/rest/api/2/project/SUN", "json").then(() => {
        loadOptions();
        document.getElementById("query").onclick = queryClickHandler;
        document.getElementById("feed").onclick = feedClickHandler;
    }, setError);
});
