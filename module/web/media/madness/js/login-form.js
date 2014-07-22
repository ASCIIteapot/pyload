/**
 * Created by Developer on 19.07.14.
 * @return {boolean}
 */

$(document).ready( function() {
    $('#form-signin').submit( function(form) {
//      reuest login from pyload api
        var formData=$(form.target).serialize();
        $.ajax({
            type: "POST",
            url: '/api/login',
            dataType: 'json',
            data: formData
        })
        .fail(function(jqXHR, textStatus, errorThrown){

        })
        .done(function( data, textStatus, jqXHR ) {
            if(data == false){
                // login data incorrect show error message
                $('#invalid-user-alert').removeClass('hidden');
            }
            else{
                // login data is correct
                // process for submit
                console.log('login success');
                form.target.submit();
            }
        });
        return false;
    });
});