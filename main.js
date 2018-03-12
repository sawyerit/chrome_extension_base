var app = angular.module('mobileApp', ['ngTable','ngResource','ngSanitize']);
 
app.controller('MainCtrl', ['$http','$log','NgTableParams', 
	function($http, $log, NgTableParams) {
      var self = this;
      self.loaded = null;
      self.project_url = 'https://jira.secondlife.com/rest/api/2/project/SUN';
      self.project_name = ""; 
      self.status = "";
      self.project = null;
      self.days_past = 0;
      self.tickets = null;
      self.issues = [];
      
      // Not sure there is a even a real purpose for this since the values
      // are hard-coded in the model.
      //chrome.storage.sync.set({"pid": "Sunshine"},{"uid","nyx.linden"});
      
      $http.get(self.project_url).then(function(project_response) {
        self.project = project_response.data; 
        if(self.project){
        	self.project_name = self.project.name;
        	loaded = true;
        }
        console.log(self.items)
      }, function(errResponse) {	    	  
    	  if(errResponse.status == 401) { 
	    		self.status="You must be logged in to JIRA to see this project.";
	    		}
    	  else{ 
    		  self.status="Network Error!";
    	  }
    	  $log.log('Error.'+errResponse.msg);
      }); 
 
      self.get_tickets = function() {
    	  self.search_url = "https://jira.secondlife.com/rest/api/2/search";
    	  self.issues = [];
    	  $http.get(self.search_url, {
    		    params: { jql: "project="+self.project_name +
    		    	" and status in ('"+self.status_select+"')" + 
    		    	" and status changed to '"+self.status_select+
    		    	"' before -"+self.days_past+"d",
    		    	maxresults: 10,
    		    	fields: "id,status,key,assignee,summary"
    		    	}, 
    	  		headers : {'Accept' : 'application/json'}
    	  }).then(function(search_response){    		  
    		  self.tickets = search_response.data;
    		  for(var i = 0; i < self.tickets.issues.length; i++){
    	    	  self.issues.push({id: self.tickets.issues[i].id, 
    	    		  status:self.tickets.issues[i].fields.status.name, 
    	    		  key:self.tickets.issues[i].key,  
    	    		  assignee:(self.tickets.issues[i].fields.assignee != null?
    	    				  self.tickets.issues[i].fields.assignee.name:''), 
    	    		  summary: self.tickets.issues[i].fields.summary});  
    	      }
    		  // Disabled pagination because it's not rendering properly
    		  // in the extentsion. 
    		  /*var initialParams = {
		        count: 10 // initial page size
		      };
		      var initialSettings = {
		        counts: [],
		        paginationMaxBlocks: 8, 
		        paginationMinBlocks: 2,
		        dataset: self.issues
		      };
		      self.tableParams = new NgTableParams(initialParams, initialSettings);*/
    		  self.tableParams = self.issues;
    		 
    	  }, function(errResponse) {	    	  
    		  self.status="Network Error!";
	    	  $log.log('Error.'+errResponse.msg);
	      });
      }; 
}]);

app.factory('FeedService', ['$http', function ($http) {
    return {
        parseFeed: function (url) {
            return $http.get(url,{
                transformResponse: function (response) {
                  var x2js = new X2JS();
                  var json_data = x2js.xml_str2json(response);
                  return json_data;
                }
              });
        }  
    } 
}]);

app.controller("FeedCtrl", ['FeedService', '$log', function (FeedService, $log) {
	var self = this;
    self.user_id = 'nyx.linden'; // default
    self.feeds = null;
    
    self.get_jira_activity = function () {
    	self.feedSrc = "https://jira.secondlife.com/activity?"+"maxResults=50&streams="+
		"user+IS+"+self.user_id+"&providers=issues";
    	
    	FeedService.parseFeed(self.feedSrc).then(function (res) {
            self.feeds = res.data.feed.entry;
            if(self.feeds)
            	self.status = null;
            else{
            	self.status = "There are no activity results.";
            }
        }, function(errResponse) {	    	  
  		  self.status="Network Error!";
    	  $log.log('Error.'+errResponse.msg);  
        });
    }
    
    self.get_local_date = function(date){
    	return Date(date).split("GMT")[0];
    }
}]);  