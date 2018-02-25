# JIRA Chrome extension
A chrome extension that queries a public JIRA API (https://jira.secondlife.com).  
This is a fully functional chrome extension with a bug, some display issues, and generally some bad practices.  

## Bug fix
**checkProjectExists is a promise thus should be async.**

## Other notes:
* Avoid use of **var** but instead use **const** or **let**
* Replace **function** with ES6 **=>** (Arrow function a.k.a Fat Arrow)
* Implement **createHTMLElementResult** for displaying issues


