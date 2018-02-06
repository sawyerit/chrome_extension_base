/**
 * Populates the activity section based on data set.
 * @param {xmlDoc} xmlDoc - XML Payload used to build list
 */
function populateActivityDataSet(xmlDoc) {
    var contentDiv = document.getElementById('query-result-activity');
    contentDiv.innerHTML = '';

    var feed = xmlDoc.getElementsByTagName('feed');
    var entries = feed[0].getElementsByTagName("entry");
    var list = document.createElement('ul');

    if (!entries || entries.length === 0)
    {
        contentDiv.innerHTML = "No Results Found.";
        contentDiv.hidden = false;
        return;
    }
    
    contentDiv.innerHTML = `<hr> <strong>Activity Feed</strong>`;

    for (var index = 0; index < entries.length; index++) {
        var title = makeClickableLinks(entries[index].getElementsByTagName("title")[0].innerHTML);
        var updated = entries[index].getElementsByTagName("updated")[0].innerHTML;
        appendDataRow(contentDiv, htmlDecode(title), "Updated", new Date(updated).toLocaleString());
    }

    contentDiv.hidden = false;
}

/**
 * Populates the tickets section based on data set.
 * @param {jsonDoc} jsonDoc - JSON Payload used to build list
 */
function populateTicketsDataSet(jsonDoc) {
    var contentDiv = document.getElementById('query-result-tickets');
    contentDiv.innerHTML = '';

    var model = JSON.parse(jsonDoc);

    // This call actually returns errors if present
    if (model.errorMessages)
    {
        addAlert(model.errorMessages, "error");
        return;
    }

    if (!model.issues || model.issues.length === 0)
    {
        contentDiv.innerHTML = "No Results Found.";
        contentDiv.hidden = false;
        return;
    }

    contentDiv.innerHTML += `<hr> <strong>Ticket Results</strong> (${model.total} / ${model.maxResults})`;
    
    model.issues.map(function (row, index) {
        var content = `<a target="_blank" href="https://jira.secondlife.com/browse/${row.key}">${row.key}</a> - ${row.fields.summary}`;
        appendDataRow(contentDiv, content, "Created", new Date(row.fields.created).toLocaleString());
    })

    contentDiv.hidden = false;
}

/**
 * Constructs and appends a data row to container
 * @param {contentDiv} contentDiv - The container to add to
 * @param {content} content - The row content to render
 * @param {dateType} dateType - The date label
 * @param {date} date - The date to render
 */
function appendDataRow(contentDiv, content, dateType, date) {
    var div = document.createElement("div");
    div.innerHTML += `&#8226; ${content}`;
    div.innerHTML += `<p class="date-text"><small>${dateType}: ${date}</small></p>`;
    contentDiv.innerHTML += div.outerHTML;
}

/**
 * HACK: Adds a target="_blank" to hyperlinks.
 * @param {linkBody} linkBody - The markup for the hyperlink
 */
function makeClickableLinks(linkBody) {
    return linkBody.replace(/a href=/g, `a target="_blank" href=`);
}