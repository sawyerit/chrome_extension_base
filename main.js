function getJIRAFeed(callback, errorCallback){
  var user = document.getElementById("user").value;
  if(user == undefined) return;
  
  var url = "https://jira.secondlife.com/activity?maxResults=50&streams=user+IS+"+user+"&providers=issues";
  make_request(url, "").then(function(response) {
    // empty response type allows the request.responseXML property to be returned in the makeRequest call
    callback(url, response);
  }, errorCallback);
}

/**
 * @param {string} searchTerm - Search term for JIRA Query.
 * @param {function(string)} callback - Called when the query results have been  
 *   formatted for rendering.
 * @param {function(string)} errorCallback - Called when the query or call fails.
 */
async function getQueryResults(s, callback, errorCallback) {                                                 
  try {
    var response = await make_request(s, "json");
    callback(createHTMLElementResult(response));
  } catch (error) {
    errorCallback(error);
  }
}

function make_request(url, responseType) {
  return new Promise(function(resolve, reject) {
    var req = new XMLHttpRequest();
    req.open('GET', url);
    req.responseType = responseType;

    req.onload = function() {
      var response = responseType ? req.response : req.responseXML;
      if(response && response.errorMessages && response.errorMessages.length > 0){
        reject(response.errorMessages[0]);
        return;
      }
      resolve(response);
    };

    // Handle network errors
    req.onerror = function() {
      reject(Error("Network Error"));
    }
    req.onreadystatechange = function() { 
      if(req.readyState == 4 && req.status == 401) { 
          reject("You must be logged in to JIRA to see this project.");
      }
    }

    // Make the request
    req.send();
  });
}

function loadOptions(){
  chrome.storage.sync.get({
    project: 'Sunshine',
    user: 'nyx.linden'
  }, function(items) {
    document.getElementById('project').value = items.project;
    document.getElementById('user').value = items.user;
  });
}

function buildJQL(callback) {
  var callbackBase = "https://jira.secondlife.com/rest/api/2/search?jql=";
  var project = document.getElementById("project").value;
  var status = document.getElementById("statusSelect").value;
  var inStatusFor = document.getElementById("daysPast").value
  var fullCallbackUrl = callbackBase;
  fullCallbackUrl += 'project='+project+'+and+status='+status+'+and+status+changed+to+'+status+'+before+-'+inStatusFor+'d&fields=id,status,key,assignee,summary&maxresults=100';

  callback(fullCallbackUrl);
}

/*
  format response data to display in screen
*/
function createHTMLElementResult(response){
  var rootContainerEl, issueContainerEl, detailsContainerEl, assigneeContainerEl;
  // 
  // Create HTML output to display the search results.
  // results.json in the "json_results" folder contains a sample of the API response
  // hint: you may run the application as well if you fix the bug. 
  //
  rootContainerEl = document.createElement("div");

  response.issues.forEach(function(item){

    issueContainerEl = document.createElement("div");

    detailsContainerEl = createDetailsSection(item.fields);
    assigneeContainerEl = createAssigneeSection(item.fields.assignee);

    issueContainerEl.appendChild(assigneeContainerEl);
    issueContainerEl.insertBefore(detailsContainerEl, assigneeContainerEl);

    rootContainerEl.appendChild(issueContainerEl);
  });

  return rootContainerEl;
}

/*
  this creates issue details section on the left side of the screen
  @detail {object} - fields object as part of the response
*/
function createDetailsSection(detail){
  var detailsContainerEl, statusEl, statusDescriptionEl,
      descriptionContainerEl, descriptionEl;
 
  detailsContainerEl = createFieldSet("Details");
  detailsContainerEl.className = "u-pull-left eight columns";

  statusEl = createItem("Status", detail.status.name);
  statusDescriptionEl = createItem("Status Description", detail.status.description);
  detailsContainerEl.appendChild(statusDescriptionEl);
  detailsContainerEl.insertBefore(statusEl, statusDescriptionEl);

  descriptionContainerEl = createFieldSet("Description");
  descriptionEl = createItem("", detail.summary);
  descriptionContainerEl.appendChild(descriptionEl);
  detailsContainerEl.appendChild(descriptionContainerEl);
  
  return detailsContainerEl;
}

/*
  this creates assignee section on the right side of the screen
  @assignee {object} - assignee object that came as part of the response
*/
function createAssigneeSection(assignee){
  var assigneeContainerEl, avatarEl, assigneeEl, emailContainerEl, emailLinkEl;

  assigneeContainerEl = createFieldSet("People");
  assigneeContainerEl.className = "u-pull-right three columns";

  if(assignee){
    avatarEl = createImage(assignee.avatarUrls["48x48"], 48, 48);
    assigneeEl = createItem("Assignee", assignee.displayName);
    emailLinkEl = createEmailLink(assignee.displayName, assignee.emailAddress);
    emailContainerEl = createItem("Email", emailLinkEl);

    assigneeContainerEl.appendChild(avatarEl);
    assigneeContainerEl.appendChild(assigneeEl);
    assigneeContainerEl.appendChild(emailContainerEl);
  }

  return assigneeContainerEl;
}

/*
  creating a fieldset as a blocking container for specific section of the screen.
  @title {string} - text to display as a title
*/
function createFieldSet(title){
  var containerEl, legendEl, legendTextEl;

  containerEl = document.createElement("fieldset");

  legendEl = document.createElement("legend");
  legendTextEl = document.createTextNode(title);
  legendEl.appendChild(legendTextEl);
  
  containerEl.appendChild(legendEl);

  return containerEl;
}

/*
  this function is to create a element in name value format to display in screen
  @title {string} - this is a text to display as a name
  @value {stirng | object} - this can be either text or dom element
*/
function createItem(title, value){
  var containerEl, itemTitleEl, itemTitleText, itemContentEl, itemContentText;
  
  containerEl = document.createElement("div");

  if(title){
    itemTitleEl = document.createElement("span");
    itemTitleText = document.createTextNode(title+": ");
    itemTitleEl.appendChild(itemTitleText);
    containerEl.appendChild(itemTitleEl);
  }

  itemContentEl = document.createElement("span");
  //
  if(typeof value === "string") {
    itemContentText = document.createTextNode(value);
    itemContentEl.appendChild(itemContentText);
  }else if(value.tagName || value.nodeName)
    itemTitleEl.appendChild(value);

  containerEl.appendChild(itemContentEl);

  return containerEl;
}

/*
  creating email link
  @title {string} - text to display as email link
  @value {string} - email address
*/
function createEmailLink(title, value){
  var emailLink = document.createElement("a");
  emailLink.className = "emailLink";
  emailLink.textContent = title;
  emailLink.href = "mailto:"+value; 

  return emailLink;
}

/*
  creating image for avatar or anything
*/
function createImage(imgSrc, width, height){
  var imageContainerEl = document.createElement("div");
  var imageEl = document.createElement("img");
  imageEl.width = width;
  imageEl.width = height;
  imageEl.src = imgSrc;
  imageContainerEl.appendChild(imageEl);

  return imageContainerEl;
}

// utility 
function domify(str){
  var dom = (new DOMParser()).parseFromString('<!doctype html><body>' + str,'text/html');
  return dom.body.textContent;
}

async function checkProjectExists(){
  try {
    return await make_request("https://jira.secondlife.com/rest/api/2/project/SUN", "json");
  } catch (errorMessage) {
    let statusEl = document.getElementById('status');
    statusEl.innerHTML = 'ERROR. ' + errorMessage;
    statusEl.hidden = false;
  }
}

/*
  setting up ticket status query and event wiring 
*/
function wireUpTicketStatusQueryEventHandler(){
  var statusEl = document.getElementById('status');
  // query click handler
  document.getElementById("query").onclick = function(){
    // build query
    buildJQL(function(url) {
      statusEl.innerHTML = 'Performing JIRA search for ' + url;
      statusEl.hidden = false;
      // perform the search
      getQueryResults(url, function(return_val) {
        // render the results
        statusEl.innerHTML = 'Query term: ' + url + '\n';
        statusEl.hidden = false;
        
        var jsonResultDiv = document.getElementById('query-result');
        jsonResultDiv.innerHTML = return_val.innerHTML;
        jsonResultDiv.hidden = false;
      }, function(errorMessage) {
          statusEl.innerHTML = 'ERROR. ' + errorMessage;
          statusEl.hidden = false;
      });
    });
  }
}

/*
  setting up jira activity query and event wiring
*/
function wireUpJiraActivityQueryHandler(){
  var statusEl = document.getElementById('status');
  // activity feed click handler
  document.getElementById("feed").onclick = function(){   
    // get the xml feed
    getJIRAFeed(function(url, xmlDoc) {
      statusEl.innerHTML = 'Activity query: ' + url + '\n';
      statusEl.hidden = false;

      // render result
      var feed = xmlDoc.getElementsByTagName('feed');
      var entries = feed[0].getElementsByTagName("entry");
      var list = document.createElement('ul');

      for (var index = 0; index < entries.length; index++) {
        var html = entries[index].getElementsByTagName("title")[0].innerHTML;
        var updated = entries[index].getElementsByTagName("updated")[0].innerHTML;
        var item = document.createElement('li');
        item.innerHTML = new Date(updated).toLocaleString() + " - " + domify(html);
        list.appendChild(item);
      }

      var feedResultDiv = document.getElementById('query-result');
      if(list.childNodes.length > 0){
        feedResultDiv.innerHTML = list.outerHTML;
      } else {
        statusEl.innerHTML = 'There are no activity results.';
        statusEl.hidden = false;
      }
      
      feedResultDiv.hidden = false;

    }, function(errorMessage) {
      statusEl.innerHTML = 'ERROR. ' + errorMessage;
      statusEl.hidden = false;
    });    
  };
}

// Setup
document.addEventListener('DOMContentLoaded', function() {
  // if logged in, setup listeners
  checkProjectExists().then(function() {
    //load saved options
    loadOptions();

    wireUpTicketStatusQueryEventHandler();
    wireUpJiraActivityQueryHandler();
       
  }).catch(function(errorMessage) {
      let statusEl = document.getElementById('status');
      statusEl.innerHTML = 'ERROR. ' + errorMessage;
      statusEl.hidden = false;
  });
});
