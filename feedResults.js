const getJIRAFeed = (user, callback, errorCallback) => {
    if (user == undefined) {
        errorCallback("Unknown User");
        return;
    }

    let url = "https://jira.secondlife.com/activity?maxResults=50&streams=user+IS+"+user+"&providers=issues";

    makeRequest(url, "").then((response) => {
        callback(url, response);
    }, errorCallback);
};

const domify = (str) => {
    var dom = (new DOMParser()).parseFromString('<!doctype html><body>' + str,'text/html');
    return dom.body.textContent;
};

document.addEventListener("DOMContentLoaded", () => {
    let params = (new URL(document.location)).searchParams;
    let user = params.get("user");

    getJIRAFeed(user, (url, xmlDoc) => {
        document.getElementById('status').innerHTML = 'Activity query: ' + url + '\n';
        document.getElementById('status').hidden = false;

        let result = document.createElement("tbody");
        let entries  = xmlDoc.getElementsByTagName('feed')[0].getElementsByTagName("entry");
        let feedResultDiv = document.getElementById('result-body');

        for (let index = 0; index < entries.length; index++) {
            let html = entries[index].getElementsByTagName("title")[0].innerHTML;
            let updated = entries[index].getElementsByTagName("updated")[0].innerHTML;
            let item = document.createElement('tr');

            item.innerHTML = "<td>" + new Date(updated).toLocaleString() + "</td><td>" + domify(html) + "</td>";

            result.appendChild(item);
        }

        if(result.childNodes.length > 0){
            feedResultDiv.innerHTML = result.outerHTML;
        } else {
            setStatus('There are no activity results for user ' + user + '.');
        }
    }, setError);
});
