/* exported validateActivityQueryForm, validateTicketStatusForm */
/* global validate */

function handleFormErrors(formErrors) {
  // handleFormError takes the object (or lack thereof) returned by validate.css's
  //   validate() function.
  // This will display any errors to the user.
  // It returns true or false depending on whether or not the form had errors.
  if (formErrors !== undefined) {
    var errorText = '';
    Object.keys(formErrors).map(function(key) {
      errorText += formErrors[key][0] + '<br>';
    });
    document.getElementById('error').innerHTML = errorText;
    document.getElementById('error').hidden = false;
    return false;
  } else {
    document.getElementById('error').hidden = true;
    return true;
  }
}

function validateActivityQueryForm() {
  var constraints = {
    user: {
      presence: {
        message: 'is required.'
      }
    }
  };

  var formErrors = validate({
    user: document.getElementById('user').value
  }, constraints);

  return handleFormErrors(formErrors);

}

function validateTicketStatusForm() {
  var constraints = {
    project: {
      presence: {
        message: 'is required.'
      },
      format: {
        pattern: "[^ [\\]+.,;?|*/%^$#@]+",
        message: "can not contain reserved JQL characters."
      }
    },
    status: {
      inclusion: {
        within: ['1', '3'],
        message: 'must be selected.'
      }
    },
    days: {
      numericality: {
        onlyInteger: true,
        greaterThan: -1,
        lessThan: 21,
        message: 'must be between 0 and 20.'
      }
    }
  };

  var formErrors = validate({
    project: document.getElementById('project').value,
    status: document.getElementById('statusSelect').value,
    days: document.getElementById('daysPast').value
  }, constraints);

  return handleFormErrors(formErrors);
}
