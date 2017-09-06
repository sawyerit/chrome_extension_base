const domify = str => {
  var dom = (new DOMParser()).parseFromString('<!doctype html><body>' + str,'text/html');
  return dom.body.textContent;
}

const entryToHTML = entry => {
  var html = entry.getElementsByTagName("title")[0].innerHTML;
  var updated = entry.getElementsByTagName("updated")[0].innerHTML;
  return "<li>"
    + new Date(updated).toLocaleString() + " - " + domify(html)
    + "</li>";
}

const issueToHTML = issue => {
  let statusClass = 'issue-' + issue.fields.status.name.toLowerCase().replace(" ", "-")
  return `
  <div class='issue-card' data-issue-id='${issue.id}'>
    <div class='issue-status ${statusClass}'>${issue.fields.status.name}</div>
    <div class='issue-key'>
      <a href='${issue.self}'>${issue.key}</a>
    </div>

    <p class='issue-summary'>${issue.fields.summary}</p>
  </div>`
}

export default {
  renderIssues: issuesJSON => {
    return issuesJSON.issues.map(issueToHTML).join("");
  },
  renderFeed: feedXML => {
    let feed = feedXML.getElementsByTagName('feed');
    let entries = feed[0].getElementsByTagName("entry");

    let feedLIs = Array.from(entries).map(entryToHTML).join("")

    return `<ul>${feedLIs}</ul>`
  }
}
