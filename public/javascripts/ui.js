function gatherFormDataForIssues() {
  var data = [];
  $('tbody input[type=checkbox]').each(function(index) {
    data.push($(this).val());
  });
  return { 'issues': data, 'is_checked': $('.select-all').is(':checked') };
}

var statusChecker;
$(document).ready(function() {
  // Issue Selection Page - Issue Checked/Unchecked
  $('input[type=checkbox]').on('click', function() {
    var submission;
    var checkboxValue = $(this).val();

    if (checkboxValue === "all")
      submission = $.post($(this).attr('data-api-endpoint'), gatherFormDataForIssues());
    else
      submission = $.post($('form').attr('action'), {number: checkboxValue, is_checked: $(this).is(':checked')});

    submission.done(function(data) {
      if (data.is_bulk)
        if (data.checked === 'true')
          $('tbody input[type=checkbox]').prop('checked', true);
        else
          $('tbody input[type=checkbox]').prop('checked', false);

      $('.numSelectedIssues').text(data.num_selected);

      $('tbody input[type=checkbox]').each(function(index) {
        var checkbox = $(this);
        checkbox.closest('tr').attr('class', checkbox.is(':checked') ? 'selected' : '');
      });
    });
  });

  // Discourse Page - Check Settings
  $('#btnCheckSettings').on('click', function() {
    $(this).button('loading');
    $('#checkError,#checkSuccess').addClass('hidden');
    $('#discourseCategory option:not(.keep)').remove();
    var endpoint = $(this).attr('data-api-endpoint');

    var submission = $.post(endpoint, $('form').serialize());
    submission.done(function(data) {
      var ddlCategory = $('#discourseCategory');
      $('#btnCheckSettings').button('reset');

      if (!data.success) {
        $('#checkError').removeClass('hidden');
        ddlCategory.attr('disabled', 'disabled');
        return;
      }

      $('#checkSuccess').removeClass('hidden');

      if (data.categories) {
        $.each(data.categories, function (key, value) {
          ddlCategory.append($('<option></option>').val(value.id).html(value.name));
          $.each(value.subcategories, function(subKey, subValue) {
            ddlCategory.append($('<option></option>').addClass('subcategory').val(subValue.id).html("&nbsp;&nbsp; " + subValue.name))
          })
        });
        ddlCategory.removeAttr('disabled');
      }
    });
  });

  // Discourse Page - Select a Category
  $('#discourseCategory').on('change', function() {
    if ($(this).val() !== "" && hasIssuesToImport())
      $('#btnStartImport').removeAttr('disabled');
    else
      $('#btnStartImport').attr('disabled', 'disabled');
  });

  // Discourse Page - Start Import
  $('#btnStartImport').on('click', function() {
    if (hasIssuesToImport()) {
      $('.btn, form').attr('disabled', 'disabled');
      $('#issuesWithErrors:not(.hidden)').addClass('hidden');
      $(this).button('loading');

      $('.fa-circle-o').removeClass('fa-circle-o').addClass('fa-circle-o-notch fa-spin');
      $('.fa-close').removeClass('fa-close').removeClass('text-danger').addClass('fa-circle-o-notch fa-spin');

      var endpoint = $(this).attr('data-api-endpoint');
      $.post(endpoint, $('form').serialize());
      statusChecker = setInterval(checkStatus, 3000);
    }
  });
});

function hasIssuesToImport() {
  return $('tbody i[data-completed="false"]').length > 0 || $('tbody i.fa-close[data-completed="true"]').length > 0;
}

function checkStatus() {
  var endpoint = $('form#check-status').attr('action');
  var submission = $.post(endpoint);

  submission.done(function(data) {
    var issues = data.issues;
    $.each(issues, function(key, value) {
      $('#error' + value.number).text(value.errorMessage);

      if (value.status == 'success') {
        $('#icon' + value.number).attr('data-completed', 'true').removeClass('fa-circle-o-notch fa-spin').addClass('fa-check text-success');
      } else if (value.status == 'error') {
        $('#issuesWithErrors').removeClass('hidden');
        $('#icon' + value.number).attr('data-completed', 'true').removeClass('fa-circle-o-notch fa-spin').addClass('fa-close text-danger');
      }
    });

    // do not use hasIssuesToImport, as this is to clear the interval, meaning all issues were attempted
    if ($('tbody i[data-completed="false"]').length === 0) {
      $('.btn, form').removeAttr('disabled');
      $('#btnStartImport').button('reset');

      if ($('#issuesWithErrors').is(':not(:visible)'))
        $('#isuesImportedSuccessfully').removeClass('hidden');

      clearInterval(statusChecker);
    }

    if (!hasIssuesToImport())
      $('#btnStartImport').attr('disabled', 'disabled');
  });
}