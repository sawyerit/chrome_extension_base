# Changelog
All notable changes to this project will be documented in this file.

## [1.0.1] - 2017-10-17
### Fixed
- Changed string to template literal in `buildJQL`, fixing the ticket status query URL
- Changed `checkProjectExists` to an async function, allowing `await` to work properly
- Fixed several lint errors based on Airbnb's style guide (camelCase names, single-quoted strings, etc)

### Added
- Included [validate.js](https://validatejs.org/) for form validation
- Added form validation and user friendly errors for both the Ticket Status Query and JIRA Activity Query forms
- Added `CHANGELOG.md`
- Added jshint config file `.jshintrc`
- Added `TESTING.md` with instructions on how to run lint rules using jshint

### Changed
- Called `loadOptions()` before `checkProjectExists()` to load data and present it to the user faster
- Refactored all calls to `make_request` to use `async` / `await` for consistency
- Changed layout to show forms side by side, avoiding the UI jumping around after a query
- Changed scrollbar behavior to allow full display of results
- Update version number to `1.0.1`

### Suggested Improvements
- Tabbing through the forms is not seamless - the body is selected after "Get JIRA Activity" (tabindex="7") instead of the project name input.  
- Pre-populate Jira project names in a list using [this API](https://jira.secondlife.com/rest/api/2/project).
- It may be nice to have a visual vertical separator between the two forms.
- Add tests.  I investigated running tests with [sinon-chrome](https://github.com/acvetkov/sinon-chrome) but was unable to get it to work, so I removed that code.  
- Investigate whether re-enabling `use strict` lint rule is worthwhile.

## [1.0.0] - 2017-08-01
### Added
- Initial project code added
