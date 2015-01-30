/** @jsx React.DOM */
/**
 * Created by Developer on 30.01.15.
 */

var CaptchaModal = React.createClass({
    getInitialState: function () {
        return {
            captchas: {}
        }
    },
    componentDidMount: function () {
        captchaServiceInstance.captcha_recived.add(this.captcha_changed);
    },
    captcha_changed: function (new_captcha_info) {
        _.each(new_captcha_info, function(item, key){
            _.defaults(item, this.state.captchas[key]);
        }.bind(this));
        this.setState({captchas: new_captcha_info});

        if(_.size(new_captcha_info) == 0){
            $('#captcha_modal').modal('hide');
        }
    },
    show: function () {
        $('#captcha_modal').modal('show');
    },
    submit_captcha: function(cid){
        var item = this.state.captchas[cid];
        console.log('submit_captcha ', cid, item.value);
        item.sending = true;
        captchaServiceInstance.setCaptcha(cid, item.value)
    },
    create_captcha_list_vdom: function () {
        return _.map(this.state.captchas, function (item, key) {
            var onSubmit = function(event){
                this.submit_captcha(key);
            }.bind(this);
            var onInput = function(event){
                item.value = event.target.value;
                // console.log(event, item);
                this.setState(this.state);
            }.bind(this);
            var panel_classes = {
                'panel': true,
                'panel-default': true
            };
            return (<div className={cs(panel_classes)} key={key}>
                <div className="panel-heading">{item.file.name} / {item.package.name}</div>
                <div className="panel-body">
                    <div className='thumbnail'>
                        <img src={item.url} alt="captcha"></img>
                    </div>
                    <p>
                        <fieldset disabled={item.sending}>
                            <div className="input-group">
                                <input onChange={onInput} value={item.value}
                                    type="text" className="form-control" placeholder="Decaptcha..."></input>
                                <span className="input-group-btn">
                                    <button className="btn btn-default" type="button" onClick={onSubmit}>Ввести</button>
                                </span>
                            </div>
                        </fieldset>
                    </p>
                </div>
            </div>);
        }.bind(this));
    },
    render: function () {
        return (<div className="modal-dialog">
            <div className="modal-content">
                <div className="modal-header">
                    <button type="button" className="close" data-dismiss="modal">
                        <span aria-hidden="true">&times;</span>
                        <span
                        className="sr-only">Close</span>
                    </button>
                    <h4 className="modal-title" id="edit-label">Ввод каптчи</h4>
                </div>
                <div className="modal-body">
                {this.create_captcha_list_vdom()}
                </div>
                < div
                className = "modal-footer" >
                    <button type="reset" className="btn btn-default" data-dismiss="modal">Закрыть</button>
                </div >
            </div>
        </div >
            )
            ;
    }
});
