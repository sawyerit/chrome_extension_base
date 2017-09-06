import JiraApiRequest from './lib/JiraApiRequest'
import JiraResultsRenderer from './lib/JiraResultsRenderer'
import DomManipulator from './lib/DomManipulator'

function loadOptions(){
  chrome.storage.sync.get({
    project: 'Sunshine',
    user: 'nyx.linden'
  }, DomManipulator.setSearchFields);
}

document.addEventListener('DOMContentLoaded', function() {
  let requester = new JiraApiRequest
  requester.fetchProject().then(function() {
    loadOptions();

    document.getElementById("query").onclick = function() {
      DomManipulator.resultsStatus('Performing JIRA search for ' + requester.jiraQuery)
      requester.fetchSearch()
        .then(resp => resp.json())
        .then(JiraResultsRenderer.renderIssues)
        .then(function(issueHTML) {
          DomManipulator.resultsStatus('Query term: ' + requester.jiraQuery)
          DomManipulator.queryResult(issueHTML)
        })
        .catch(errorText => DomManipulator.resultsStatus('ERROR. ' + errorText));
    }

    // activity feed click handler
    document.getElementById("feed").onclick = function(){
      if(requester.user == undefined)
        return DomManipulator.resultsStatus("Please enter a user to view feed")
      DomManipulator.resultsStatus('Getting feed for ' + requester.feedURL)

      requester.fetchFeed()
        .then(response => response.text())
        .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
        .then(JiraResultsRenderer.renderFeed)
        .then(feedHTML => {
          if(feedHTML.length) {
            DomManipulator.resultsStatus('Activity query: ' + requester.feedURL);
            DomManipulator.queryResult(feedHTML)
          } else {
            DomManipulator.resultsStatus('There are no activity results.')
          }
        })
        .catch(errorText => DomManipulator.resultsStatus('ERROR. ' + errorText))
    }
  }).catch(errorText => DomManipulator.resultsStatus('ERROR. ' + errorText));
})
