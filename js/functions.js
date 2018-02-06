const _loadingContainer = 'loading-container';

/**
 * Clears the element contents.
 * @param {element} element - The element we want to clear.
 */
function clearElement(element) {
    var elm = document.getElementById(element);
    if (elm) {
        elm.innerHTML = '';
    }
}

/**
 * Tells the page your are in a loading state.
 * @param {isLoading} isLoading - Hide/Show the loading status.
 */
function isLoading(isLoading) {
    var elm = document.getElementById(_loadingContainer);
    if (elm) {
        elm.hidden = !isLoading;
    }
}

/**
 * Hacky way to decode html without a lib. Heh...
 * @param {data} data - The string of data to decode
 */
function htmlDecode(data){
    var e = document.createElement('div');
    e.innerHTML = data;
    return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
}