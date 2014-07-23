/**
 * Created by Developer on 21.07.14.
 */

/*
* Do async request to server, in success or fail events show message with provided description*/
function DoAsyncRequest(ajaxParams, description){
    var wajax={
        beforeSend: function(){
            console.log('Sending command: '+description);
        }
    };

    $.extend(wajax, ajaxParams);

    $.ajax(wajax).done(function(){console.log('request '+description+' done')});
}

function onActionClick(){
    var action_type=$(this).attr('data-action');

    var action_type_map={
        play:    "/api/unpauseServer",
        stop:    "/api/pauseServer",
        cancel:  "/api/stopAllDownloads"
    };

    if(action_type in action_type_map){
        var req_params={
            method: 'get',
            url: action_type_map[action_type]
        };

        DoAsyncRequest(req_params, 'action: '+action_type)
    }
}