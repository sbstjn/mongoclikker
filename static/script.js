function triggerCancelEvent(curThis, value) { 
  $(curThis).html(value);
  $(curThis).removeClass('isActive');
  
  $(curThis).click(function(e2) { hasClicked(this, e2); });
}

function triggerSaveEvent(curThis, newValue) {
  $.post("/update/" + $(curThis).attr('id'), { data: newValue},
    function(data) {
      $(curThis).removeClass('isActive');
      $(curThis).html(data);
    }
  );
  
  $(curThis).click(function(e2) { hasClicked(this, e2); });
}

function hasClicked(newThis) {
  var curThis = newThis;
  if (!$(curThis).hasClass('isActive')) {
    $(curThis).unbind();
    var tmpText = $(curThis).text();
    $(curThis).html($('<input type="text" value="" class="curInput" /> <span class="saveOptions">[<a href="#" class="save">save</a>] [<a href="#" class="cancel" oldvalue="' + $(curThis).text() + '">cancel</a>]</span>'));
    $(curThis).find('input').val(tmpText);
    $(curThis).find('input').keydown(function(event) {
      if (event.keyCode == '13') { /* save    */ triggerSaveEvent(curThis, $(curThis).find('input').val()); }
      if (event.keyCode == '27') { /* cancel  */ triggerCancelEvent(curThis, $(curThis).find('.cancel').attr('oldvalue')); }
    });
    $(curThis).addClass('isActive');
    $(curThis).find('input').focus();
  }
  
  $(curThis).find('.save').bind('click', (function(e) {
    e.stopImmediatePropagation();
    triggerSaveEvent(curThis, $(curThis).parent().find('input').attr('value'));
  }));
  
  $(curThis).find('.cancel').bind('click', (function(e) {
    e.stopImmediatePropagation();
    triggerCancelEvent(curThis, $(this).attr('oldvalue'));
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