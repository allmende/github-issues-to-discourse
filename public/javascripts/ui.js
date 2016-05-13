function selectCheckboxes(checked) {
  $('tbody input[type=checkbox]').prop('checked', checked);
}

function validateSelection() {
  if ($('tbody input[type=checkbox]:checked').length !== 0)
    return true;
  
  $('.alert.hidden').removeClass('hidden');
  return false;
}

$(document).ready(function() {
  $('.alert .close').on('click', function() { $(this).parent().addClass('hidden'); });
});