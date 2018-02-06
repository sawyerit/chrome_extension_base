const _alertContainer = 'alert-container';

/**
 * Clears alerts from the alert contianer.
 */
function clearAlerts() {
    var container = document.getElementById(_alertContainer);
    container.innerHTML = "";
}

/**
 * Puts an error message inside the alert container
 * @param {content} content - The error message, checks for strings or arrays of strings
 * @param {type} type - The type of alert (error, success)
 */
function addAlert(content, type) {
    var container = document.getElementById(_alertContainer);
    
    if (Array.isArray(content)) {
        content.map(function (error) {
            container.innerHTML += baseRenderAlert(error, type);
        });
    } else {
        container.innerHTML += baseRenderAlert(content, type);
    }
}

/**
 * Renders a single alert item
 * @param {text} text - The error message
 * @param {type} type - The type of alert (error, success)
 */
function baseRenderAlert(text, type) {
    var alert = document.createElement("div");
    alert.classList.add("alert");
    alert.classList.add(type);
    alert.appendChild(document.createTextNode(text));
    return alert.outerHTML;
}