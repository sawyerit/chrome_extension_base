class JiraApiRequest {

  constructor() {
    this.baseURL = "https://jira.secondlife.com/"
    this.apiURL = "https://jira.secondlife.com/rest/api/2/"
    this.searchPath = "search?jql="
    this.projectURL = this.apiURL + "project/SUN"
  }

  get project() { return document.getElementById("project").value }
  get status() { return document.getElementById("statusSelect").value }
  get inStatusFor() { return document.getElementById("daysPast").value }
  get user() { return document.getElementById("user").value }

  get jiraQuery() {
    return `project=${this.project}+and+status=${this.status}+and+status+changed+to+${this.status}+before+-${this.inStatusFor}d&fields=id,status,key,assignee,summary&maxresults=100`
  }

  get feedURL() {
    return this.baseURL + `activity?maxResults=50&streams=user+IS+${this.user}&providers=issues`
  }

  get searchURL() {
    return this.apiURL + this.searchPath + this.jiraQuery
  }

  fetchFeed() {
    return fetch(this.feedURL, { credentials: 'include' })
  }

  fetchSearch() {
    return fetch(this.searchURL, { credentials: 'include' })
  }

  fetchProject() {
    return fetch(this.projectURL, { credentials: 'include' })
  }

}

export default JiraApiRequest
