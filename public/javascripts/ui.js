function selectCheckboxes(checked) {
  $('tbody input[type=checkbox]').prop('checked', checked);
}

function validateSelection() {
  if ($('tbody input[type=checkbox]:checked').length !== 0)
    return true;
  
  $('.alert.hidden').removeClass('hidden');
  return false;
}

function gatherFormDataForIssues() {
  var data = [];
  $('input[type=checkbox]').each(function(index) {
    var item = $(this);
    data.push({id: item.val(), checked: item.is(':checked')});
  });
  return { 'issues': data };
}

$(document).ready(function() {
  $('.alert .close').on('click', function() { $(this).parent().addClass('hidden'); });
  $('.saveIssues').on('click', function() {
    $('.saveIssues').button('loading');
    var submission = $.post('/api/issues/save', gatherFormDataForIssues());
    submission.done(function(data) {
      $('.saveIssues').button('reset');
    });
  });
});