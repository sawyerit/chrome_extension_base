// Setup
document.addEventListener('DOMContentLoaded', async function() {
	try {
		// if logged in, setup listeners
		await checkProjectExists();
		//load saved options
		await loadOptions();

		// query click handler
		document.getElementById('query').onclick = statusQueryHandler;

		// activity feed click handler
		document.getElementById('feed').onclick = activityFeedHandler;        

	} catch(error) {
		writeError('ERROR. ' + errorMessage);
	}   
});

async function checkProjectExists(){
	try {
		return await make_request('https://jira.secondlife.com/rest/api/2/project/SUN', 'json');
	} catch (errorMessage) {
		writeError('ERROR. ' + errorMessage);
	}
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

const statusQueryHandler = () => {
	// build query
	buildJQL(function(url) {
		writeStatus('Performing JIRA search for ' + url);

		// perform the search
		getQueryResults(url, function(return_val) {
			// render the results
			writeStatus('Query term: ' + url + '\n');
	
			writeResults(return_val);

		}, function(errorMessage) {
			writeError('ERROR. ' + errorMessage);
		});
	});
};

const activityFeedHandler = () => {
	// get the xml feed
	getJIRAFeed(function(url, xmlDoc) {
		writeStatus('Activity query: ' + url + '\n');
  
		// render result
		const feed = xmlDoc.getElementsByTagName('feed');
		const entries = feed[0].getElementsByTagName('entry');
		const list = document.createElement('ul');

		for (let index = 0; index < entries.length; index++) {
			const html = entries[index].getElementsByTagName('title')[0].innerHTML;
			const updated = entries[index].getElementsByTagName('updated')[0].innerHTML;
			const item = document.createElement('li');
			item.innerHTML = new Date(updated).toLocaleString() + ' - ' + domify(html);
			list.appendChild(item);
		}

		if(list.childNodes.length > 0){
			writeResults(list.outerHTML);
		} else {
			writeStatus('There are no activity results.');
			emptyResults();
		}
  
	}, function(errorMessage) {
		writeError('ERROR. ' + errorMessage);
	});  
};

/**
 * @param {string} searchTerm - Search term for JIRA Query.
 * @param {function(string)} callback - Called when the query results have been  
 *   formatted for rendering.
 * @param {function(string)} errorCallback - Called when the query or call fails.
 */
async function getQueryResults(s, callback, errorCallback) {                                                 
	try {
		const response = await make_request(s, 'json');
		callback(createHTMLElementResult(response));
	} catch (error) {
		errorCallback(error);
	}
}

function buildJQL(callback) {
	const callbackBase = 'https://jira.secondlife.com/rest/api/2/search?jql=';
	const project = document.getElementById('project').value;
	const status = document.getElementById('statusSelect').value;
	const inStatusFor = document.getElementById('daysPast').value;
	if (!project || !status || !inStatusFor) {
		writeError('Project and status and daysPast fields need values.');
		return;
	} 
	let fullCallbackUrl = callbackBase;
	fullCallbackUrl += `project=${project}+and+status=${status}+and+status+changed+to+${status}+before+-${inStatusFor}d&fields=id,status,key,assignee,summary&maxresults=100`;
	callback(fullCallbackUrl);
}

function createHTMLElementResult(response){
	return tablifyJson(response);
}

const tablifyJson = (jsonResponse) => {
	const { issues } = jsonResponse;
	// TODO: paginate issues using startAt, maxResults, total

	const headers = Object.keys(issues[0].fields);
	const table = makeSimpleTableWithHeader(headers);
	
	issues.forEach(issue => {
		const row = document.createElement('tr');
		headers.forEach(key => {
			const column = document.createElement('td');
			const text = getFieldValue(issue, key);
			const textNode = document.createTextNode(text);
			column.appendChild(textNode);
			row.appendChild(column);
			table.appendChild(row);
		});
	});
	return table.outerHTML;
};

const makeSimpleTableWithHeader = (headers) => {
	const table = document.createElement('table');
	const headerRow = document.createElement('tr');

	headers.forEach(key => {
		const h1 = document.createElement('th');
		const text = document.createTextNode(key);
		h1.appendChild(text);
		headerRow.appendChild(h1);
	});
	table.appendChild(headerRow);
	return table;
};

const getFieldValue = (issue, key) => {
	if (key === 'status') {
		return getIssueStatus(issue);
	}
	else if (key === 'assignee') {
		return getIssueAssignee(issue);
	}
	else {
		return issue.fields[key];
	}
};

const getIssueStatus = (issue) => {
	return issue.fields.status.name;
};

const getIssueAssignee = (issue) => {
	return (issue.fields.assignee ? issue.fields.assignee.displayName : '');
};

async function getJIRAFeed(callback, errorCallback){
	const user = document.getElementById('user').value;
	if(user == undefined) return;
    
	const url = 'https://jira.secondlife.com/activity?maxResults=50&streams=user+IS+'+user+'&providers=issues';
	try {
		// empty response type allows the request.responseXML property to be returned in the makeRequest call
		const response = await make_request(url, '');
		callback(url, response);
	}
	catch (error) {
		errorCallback(error);
	}
}

// utility
function make_request(url, responseType) {
	return new Promise(function(resolve, reject) {
		const req = new XMLHttpRequest();
		req.open('GET', url);
		req.responseType = responseType;

		req.onload = function() {
			const response = responseType ? req.response : req.responseXML;
			if(response && response.errorMessages && response.errorMessages.length > 0){
				reject(response.errorMessages[0]);
				return;
			}
			resolve(response);
		};

		// Handle network errors
		req.onerror = function() {
			reject(Error('Network Error'));
		};
		req.onreadystatechange = function() { 
			if(req.readyState == 4 && req.status == 401) { 
				reject('You must be logged in to JIRA to see this project.');
			}
		};

		// Make the request
		req.send();
	});
}
 
function domify(str){
	const dom = (new DOMParser()).parseFromString('<!doctype html><body>' + str,'text/html');
	return dom.body.textContent;
}

const writeResults = (results) => {
	const resultDiv = document.getElementById('query-result');
	resultDiv.innerHTML = results;
	resultDiv.hidden = false;
};

const emptyResults = () => {
	const resultDiv = document.getElementById('query-result');
	resultDiv.innerText = '';
	resultDiv.hidden = true;
};

const writeError = (msg) => {
	const statusEle = writeStatus(msg);
	statusEle.style.color = 'red';
	emptyResults();
	return statusEle;
};

const writeStatus = (msg) => {
	const statusEle = document.getElementById('status');
	statusEle.innerText = msg;
	statusEle.hidden = false;
	statusEle.style.color = 'black';
	return statusEle;
};
