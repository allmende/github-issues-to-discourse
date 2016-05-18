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
      submission = $.post('/api/issues/bulk', gatherFormDataForIssues());
    else
      submission = $.post('/api/issues/save', {number: checkboxValue, is_checked: $(this).is(':checked')});

    submission.done(function(data) {
      if (data.is_bulk)
        if (data.checked === 'true')
          $('tbody input[type=checkbox]').attr('checked', "checked");
        else
          $('tbody input[type=checkbox]').removeAttr('checked');

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

    var submission = $.post('/api/discourse/check', $('form').serialize());
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
    if ($(this).val() !== "" && $('.issue-numbers[data-completed="false"]').length > 0)
      $('#btnStartImport').removeAttr('disabled');
    else
      $('#btnStartImport').attr('disabled', 'disabled');
  });

  // Discourse Page - Start Import
  $('#btnStartImport').on('click', function() {
    if ($('.issue-numbers[data-completed="false"]').length > 0) {
      $('.btn, form').attr('disabled', 'disabled');
      $(this).button('loading');

      $('.fa-circle-o').removeClass('fa-circle-o').addClass('fa-circle-o-notch fa-spin');
      statusChecker = setInterval(checkStatus, 3000);
      importIssues();
    }
  });
});

function importIssues() {
  var importSubmission = $.post('/api/discourse/import', $('form').serialize());
  importSubmission.done(function(data) {
    if (data.has_more)
      importIssues();
  });
}

function checkStatus() {
  var submission = $.post('/api/discourse/status');
  submission.done(function(data) {
    var issues = data.issues;
    $.each(issues, function(key, value) {
      if (value.status == 'success') {
        $('#status' + value.number).attr('data-completed', 'true');
        $('#icon' + value.number).removeClass('fa-circle-o-notch fa-spin').addClass('fa-check text-success');
      } else if (value.status == 'error') {
        $('#status' + value.number).attr('data-completed', 'true');
        $('#icon' + value.number).removeClass('fa-circle-o-notch fa-spin').addClass('fa-close text-danger');
      }
    });

    if ($('.issue-numbers[data-completed="false"]').length === 0) {
      $('.btn, form').removeAttr('disabled');
      $('#btnStartImport').button('reset');
      $('#btnStartImport').attr('disabled', 'disabled');

      clearInterval(statusChecker);
    }
  });
}