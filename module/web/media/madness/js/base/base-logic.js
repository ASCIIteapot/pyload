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

function onActionClick(elem){
    var action_type = $(elem.currentTarget).attr('data-action');

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
    else{
        if(action_type == 'add'){
            $('#add_package_modal').modal();
        }
    }
}

/*
* clear add package input valies on show
* */
$(function(){
        $('#add_package_modal').on('show.bs.modal', function (e) {
            console.log('add_package_modal show.bs.modal');
            $('form', this).each(function(){
                // reset form inputs
                this.reset();
                // reset all radiobutton
                $(this).button('reset');
            });
        });
    }
);