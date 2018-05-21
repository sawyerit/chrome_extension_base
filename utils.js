const makeRequest = (url, responseType) => {
    return new Promise((resolve, reject) => {
        let req = new XMLHttpRequest();
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
};

const setStatus = (msg) => {
    let status = document.getElementById("status");
    status.style = "";
    status.innerHTML = msg;
    status.hidden = false;
};

const setError = (msg) => {
    let status = document.getElementById("status");
    status.style = "color: red";
    status.innerHTML = "ERROR: " + msg;
    status.hidden = false;
};
