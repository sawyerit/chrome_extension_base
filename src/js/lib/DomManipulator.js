export default {
  resultsStatus: statusText => {
    document.getElementById('status').innerHTML = statusText
    document.getElementById('status').hidden = false
  },
  queryResult: resultHTML => {
    document.getElementById('query-result').innerHTML = resultHTML
    document.getElementById('query-result').hidden = false
  },
  setSearchFields: items => {
    document.getElementById('project').value = items.project;
    document.getElementById('user').value = items.user;
  },

}
