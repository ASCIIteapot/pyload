/**
 * Created by Developer on 25.01.15.
 */

function show_confirmation_modal(args_dict, onSuccess){
    _.defaults(args_dict, {
        title: "Подтверждение",
        content: 'message'
    });
    var modal_window = $('#confirmation-modal');
    $('.modal-body', modal_window).html(args_dict.content);
    $('#confirm-label', modal_window).html(args_dict.title);
    $('#button-confirm', modal_window).off('click.confirm').on('click.confirm',onSuccess);
    modal_window.modal();
}
