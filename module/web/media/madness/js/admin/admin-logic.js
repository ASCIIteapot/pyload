/**
 * Created by Developer on 25.01.15.
 */

$(function(){
    var actions_dict = {
                quit: {
                    message: 'Вы подтверждаете закрытие pyLoad?',
                    command_url: '/api/kill',
                    description: 'закрытие pyLoad'
                },
                restart: {
                    message: 'Вы подтверждаете перезапуск pyLoad?',
                    command_url: '/api/restart',
                    description: 'Перезапуск pyLoad'
                }
            };
    $('button[data-action]')
            .click(function(event){
                var action = $(event.target).attr('data-action');
                console.log(action);
                show_confirmation_modal({
                    content: actions_dict[action].message
                }, function(){
                    console.log(action, ' is accepted');
                    DoAjaxJsonRequest({
                        url: actions_dict[action].command_url,
                        method: 'GET'
                    }, actions_dict[action].description)
                });
            });
});
