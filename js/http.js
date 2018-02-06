/**
 * @param {url} url - The url we will be doing executing
 * @param {responseType} responseType - The response type expected
 */
function baseGetRequest(url, responseType) {
    return new Promise(function(resolve, reject) {
        var req = new XMLHttpRequest();
        req.open('GET', url);
        req.responseType = responseType;

        req.onload = function() {
            var response = req.responseXML ? req.responseXML : req.response;
            if (response && response.errorMessages && response.errorMessages.length > 0) {
                reject(response.errorMessages[0]);
                return;
            }
            resolve(response);
        };

        req.onerror = function(error) {
            reject(Error(`Network Error - ${error}`));
        }

        req.onreadystatechange = function() {
            if (req.readyState == 4 && req.status == 401) {
                reject("You must be logged in to JIRA to see this project.");
            }
        }

        req.addEventListener("load", function() { 
            console.debug(`Req Loaded: ${url}`);
        });

        req.addEventListener("error", function() { 
            console.debug(`Req Error: ${url}`);
        });

        req.send();
    });
}
