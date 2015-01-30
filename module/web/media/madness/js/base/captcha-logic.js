/**
 * Created by Developer on 30.01.15.
 */

function CaptchaService() {
    this.captcha_recived = $.Callbacks('');
    this.loadCaptchaFromServer = function () {
        DoAjaxJsonRequest({
            url: '/json/get_captcha',
            method: 'GET'
        })
            .done(function (data, textStatus, jqXHR) {
                this.captcha = data;
                this.captcha_recived.fire(data);
            }.bind(this));
    }.bind(this);
    this.init = function () {
        setInterval(this.loadCaptchaFromServer, 1000);
    }.bind(this);
    this.setCaptcha = function(cid, value){
        return DoAjaxJsonRequest({
            url: '/json/set_captcha',
            data: {
                'cap_id': cid,
                'cap_result': value
            }
        }, 'установка каптчи для ' + this.captcha[cid].file.name);
    }.bind(this);
}

var captchaServiceInstance = new CaptchaService();
captchaServiceInstance.init();
