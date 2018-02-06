/**
 * Validates a field and makes it run
 * @param {elementName} elementName - The element name to make red
 */
function validateField(elementName) {
    var isValid = true;
    var fld = document.getElementById(elementName);
    if (fld) {
        fld.setAttribute("class", "");
        if (!fld.value) {
            fld.setAttribute("class", "has-error");
            isValid = false;
        }
    }
    return isValid;
}