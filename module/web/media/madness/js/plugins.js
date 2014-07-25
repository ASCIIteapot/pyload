// Avoid `console` errors in browsers that lack a console.
(function() {
    var method;
    var noop = function () {};
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = (window.console = window.console || {});

    while (length--) {
        method = methods[length];

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
    }
}());

// Place any jQuery/helper plugins in here.
// $('.btn').button();

String.prototype.format = function () {
  var args = arguments;
  return this.replace(/\{\{|\}\}|\{(\d+)\}/g, function (m, n) {
    if (m == "{{") { return "{"; }
    if (m == "}}") { return "}"; }
    return args[n];
  });
};

/*
* Record submit-button info for ajax form support and multi submit buttons
* Rus: Во время перехвата события ''onsubmit'' формы, нет возможности узнать штатными средсвами
* какая из кнопок ''submit'' была нажата, нижеследющий код выполняет сохранение такой информации
* в скрытое поле, которое затем может быть извлечено штатными средствами
* Основано на: http://stackoverflow.com/a/8598058
* TODO: выяснить влияние на REACT
* */
$(document).on('click', 'form [type=submit]', function(){
    var name   = $(this).attr('name');
    if (typeof name == 'undefined') return;
    var value  = $(this).attr('value');
    var $form  = $(this).parents('form').first();
    var $input = $('<input type="hidden" class="temp-hidden" />').attr('name', name).attr('value', value);
    $form.find('input.temp-hidden').remove();
    $form.append($input);
});