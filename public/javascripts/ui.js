function gatherFormDataForIssues() {
  var data = [];
  $('tbody input[type=checkbox]').each(function(index) {
    data.push($(this).val());
  });
  return { 'issues': data, 'is_checked': $('.select-all').is(':checked') };
}

$(document).ready(function() {
  $('input[type=checkbox]').on('click', function() {
    var submission;
    var checkboxValue = $(this).val();
    if (checkboxValue === "all")
      submission = $.post('/api/issues/bulk', gatherFormDataForIssues());
    else
      submission = $.post('/api/issues/save', {number: checkboxValue, is_checked: $(this).is(':checked')});

    submission.done(function(data) {
      if (!data.success)
        return;

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
});