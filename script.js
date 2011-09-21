function hasClicked(newThis) {
  var curThis = newThis;
  if (!$(curThis).hasClass('isActive')) {
    $(curThis).unbind();
    $(curThis).html($('<input type="text" value="' + $(curThis).text() + '" class="curInput" /> <span class="saveOptions">[<a href="#" class="save">save</a>] [<a href="#" class="cancel" oldvalue="' + $(curThis).text() + '">cancel</a>]</span>'));
    $(curThis).addClass('isActive');
    $(curThis).find('input').focus();
  }
  
  $(curThis).find('.cancel').bind('click', (function(e) {
    $(curThis).html($(this).attr('oldvalue'));
    $(curThis).removeClass('isActive');
    
    e.stopImmediatePropagation();
    $(curThis).click(function(e2) {
      hasClicked(this, e2);
    });
  }));
}

$(document).ready(function() {
  $('.canEdit').each(function() {
    $(this).click(function(e) {
      e.stopImmediatePropagation();
      hasClicked(this, e);
    });
  });
});