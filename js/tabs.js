/**
 * Selects and renders a tab
 * @param {tabElement} tabElement - The element that triggered the change
 */
function openTab(tabElement) {
    var tabName = tabElement.srcElement.id;
    var tabs = document.getElementsByClassName("tabcontent");

    for (i = 0; i < tabs.length; i++) {
        if (tabs[i].id != tabName) {
            tabs[i].style.display = "none";
        } else {
            tabs[i].style.display = "block";
        }
    }
}
