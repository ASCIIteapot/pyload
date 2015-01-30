/**
 * Created by Developer on 21.07.14.
 */

function ShowNotify(description, params){
    var invoke_params = {
//        ele: '#body-container',
        offset: {from: 'top', amount: 60}
    };
    $.extend(invoke_params, params);

    $.bootstrapGrowl(description, invoke_params);
}

function DoAjaxJsonRequest(ajaxArguments, callDescription){
    var ajax_params = {
            method: 'POST',
            dataType: 'json',
            contentType: "application/json; charset=utf-8"
    };

    $.extend(ajax_params, ajaxArguments);

    ajax_params.data = JSON.stringify(ajax_params.data);

    var ajaxRet = $.ajax(ajax_params);

    if(callDescription!=null){
        ajaxRet.done(function( data, textStatus, jqXHR ) {
            if(callDescription != null){
                console.log('Ajax ssly complited for ', callDescription, '; ', this.url);
                ShowNotify(callDescription, {type: 'success'});
            }
        })
        .fail(function( jqXHR, status, err ) {
            console.error('Ajax filed for ', callDescription, '; ', this.url, status, err.toString());
            ShowNotify(callDescription, {type: 'danger'});
        });
    }

    return ajaxRet;

}

function onActionClick(elem){
    var action_type = $(elem.currentTarget).attr('data-action');

    var action_type_map={
        play:    "/api/unpauseServer",
        stop:    "/api/pauseServer",
        cancel:  "/api/stopAllDownloads"
    };

    console.log('action: ', action_type);

    if(action_type in action_type_map){
        var req_params={
            method: 'get',
            url: action_type_map[action_type]
        };

        DoAjaxJsonRequest(req_params, 'action: '+action_type)
    }
    else{
        if(action_type == 'add'){
            $('#add_package_modal').modal();
        }
        else if(action_type == 'enter_captcha'){
            captchaModalInstance.show();
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

                // remove ajax error
                $('#ajaxFail > [role=alert]', this).remove();

                // reset all radiobutton

                // this impl crashes React
                // $(this).button('reset');
            });
        });
    }
);

function OnAjaxFormSubmit(form){
    var jform = $(form);

    var form_inputs = jform.serializeObject();

    var tune_inputs_attr = jform.attr('data-tune-inputs-method');

    if(tune_inputs_attr){
        console.log('data-tune-inputs-method: ' + tune_inputs_attr);
        window[tune_inputs_attr].call(jform, form_inputs);
    }


    DoAjaxJsonRequest({
        url: jform.attr('action'),
        method: jform.attr('method'),
        data: form_inputs
    })
        .done(function( data, textStatus, jqXHR){
            // close form
            jform.parents('.modal[role=dialog]').modal('hide');
        })
        .fail(function( jqXHR, status, err ) {
            // show inform alert msg
        var alert_box_container = $('.ajaxFail', jform);
        var alert_box = alert_box_container.find('> .alert');

        if(alert_box.size() == 0){
            console.log('creating');
            alert_box=$(
                '<div class="alert alert-danger fade in" role="alert"> \
                  <button type="button" class="close" data-dismiss="alert"><span aria-hidden="true">×</span><span class="sr-only">Close</span></button> \
                  <h4 class="alert-header"></h4> \
                  <p class="alert-description"></p> \
                </div>');
        }

        alert_box.find('.alert-header').first().html('HTML <span class="html-err">'+ jqXHR.status +'</span>: <span>'+status+'</span>');
        alert_box.find('.alert-description').first().text(err.toString());
        alert_box.alert();
        alert_box_container.html(alert_box);
        });
    return false;
}

/*
* Onform ajax submit
* */
function OnAddPackageTuneInputs(form_inputs){
    // TODO: consider extract links from REACT component ether from DOM
//    form_inputs.add_links = $('#parsed_links tbody tr td:nth-child(2)', this).map(function () {
//        return $(this).text();
//    }).get();
    form_inputs.add_links = addLinksFormInput.AllLinksOnly();
}