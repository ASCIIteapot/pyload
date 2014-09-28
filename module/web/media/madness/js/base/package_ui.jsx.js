/** @jsx React.DOM */
/**
 * Created by Developer on 23.07.14.
 */

var LinksInputElement=React.createClass({
    ajaxRequestInProgress: false,
    /*
    * Handle raw links text change
    * */
    handleLinksTextChange: function(event){
        if(this.ajaxRequestInProgress){
            return false;
        }

        DoAjaxJsonRequest({
            url: this.props.linkParseUrl,
            data: { raw_text: event.target.value },
            beforeSend: function( /* jqXHR */ jqXHR, /* PlainObject */ settings ){
                this.ajaxRequestInProgress=true;
            }.bind(this)
        }).done(function(data, textStatus, jqXHR){
            console.log($(data.urls).size());
            this.setState(data);
            console.log('setted');
        }.bind(this))
          .always(function( data /*|jqXHR*/, textStatus, /*jqXHR|*/ errorThrown ) {
                this.ajaxRequestInProgress=false;
          }.bind(this));
        return false;
    },
    getInitialState: function() {
        return {urls: []};
    },
    componentDidMount: function(){
        var target=this.getDOMNode();

        $(target).parents('.modal').on('show.bs.modal', function (e){
            this.setState(this.getInitialState());
        }.bind(this));
    },
    render: function(){
        var taria_el=<textarea key='taria'
                      className="form-control" rows="3"
                      required
                      onChange={this.handleLinksTextChange}
                      placeholder={this.props.l18n.links}
                      name="add_links" id="add_links"/>;

        if($(this.state.urls).size()!=0){
            var items=[];

            $(this.state.urls).each(function(index, url){
               items.push(<tr key={url.url}>
                            <td>{index+1}</td>
                            <td>{url.url}</td>
                            <td>{url.plugin}</td>
                          </tr>);
            });

            return (<div>
                        {taria_el}
                        <label for='parsed_links'>Parsed links</label>
                        <table className="table table-condensed table-bordered table-hover" id='parsed_links'>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>link</th>
                                <th>hoster</th>
                            </tr>
                        </thead>
                        <tbody>{items}</tbody>
                    </table>
                </div>);
        }
        else{
            return <div>{taria_el}</div>;
        }
    }
});

var PackageEditorModal = React.createClass({
    getInitialState: function() {
        return {};
    },
    beginEditPackage: function(pid, anchor){
        console.log('start editing package', pid, anchor);
        this._startingRecivingPackageInfo();

        // make request
        DoAjaxJsonRequest({
            url: '/json/package/'+pid,
            method: 'GET'
        }).done(function(data, i1, i2){
           // получаем начальное состояние
           this.setState({
               init_info: data,
               work_info: _.clone(data),
               folder_follow_name: data.name == data.folder
           });
           if(anchor !== null && anchor!==undefined){
               this.state.work_info[anchor.source.replace('pack_', '')] = anchor.value;
               this.forceUpdate();
               this.refs[anchor.source].getDOMNode().focus();
           }
        }.bind(this));

        this.setState({pid: pid});
    },

    _startingRecivingPackageInfo: function(){
        // on starting ajax request. while data will not loaded
        // doing nothing for now
    },

    commitPackageChanges: function(){
        var packageData = {
            pack_id: this.props.pid,
            pack_name: this.state.package_form_details.name,
            pack_folder: this.state.package_form_details.folder,
            pack_pws: this.state.package_form_details.password
        };

        DoAjaxJsonRequest({
            url: '/json/edit_package',
            data: packageData
        }, 'edit package '+this.props.pid).done(function(){
            this.resetPackageDetailForm();
            //this.forceUpdate();
            }.bind(this));
        return false;
    },
    // метод сбрасывает значения полей формы деталей пакета на умолчательные, соотвествующие таковым в объекте состояния
    resetPackageDetailForm: function(){
        this.create_details_form_data();
        this.state.show_package_save = false;
    },
    onPackagePropertyChanged: function(event){
        var target = event.target.name;

        if(target == 'folder_link_button'){
            this.state.folder_follow_name = ! this.state.folder_follow_name;
            if(this.state.folder_follow_name){
                this.state.work_info.folder = this.state.work_info.name;
            }
        }
        else{
            switch(target){
                case 'pack_pws':
                    target = 'password';
                    break;
                default:
                    target = target.replace('pack_', '');
                    break;
            }
            // обновляем собсвенное значение
            this.state.work_info[target] = event.target.value;
        }

        if(target == 'name' && this.state.folder_follow_name){
            this.state.work_info.folder = event.target.value;
        }

        if(target == 'folder'){
            this.state.folder_follow_name = false;
        }

        this.forceUpdate();
    },

    create_id: function(name){
            return 'editp_' + name;
    },

    render: function(){
        if('init_info'in this.state){
            var folderButtonClass = cs({
                'btn': true,
                'btn-default': true,
                'active': this.state.folder_follow_name
            });

            return (<form className="modal-dialog"
                              role="form"
                              action=""
                              method="POST"
                              enctype='application/json'
                              onsubmit="return OnAjaxFormSubmit(this);">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <button type="button" className="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span
                                            className="sr-only">Close</span></button>
                                    <h4 className="modal-title" id="edit-label">Редактирование пакета {this.state.init_info.pid} - {this.state.init_info.name}</h4>
                                </div>

                                <div className="modal-body">
                                    <div className="form-group">
                                        <label for={this.create_id('name')}>Имя пакета</label>
                                        <input type="text"
                                               required="true"
                                               className="form-control"
                                               name='pack_name'
                                               ref='pack_name'
                                               value={this.state.work_info.name}
                                               onChange={this.onPackagePropertyChanged}
                                               id={this.create_id('name')} placeholder='Имя'/>
                                    </div>

                                    <div className="form-group">
                                        <label for={this.create_id('edit_folder')}>Имя пакета</label>
                                            <button type="button" className={folderButtonClass} data-toggle="button"
                                            ref='folder_link_button'
                                            name='folder_link_button'
                                            onClick={this.onPackagePropertyChanged}
                                            id={this.create_id('follownamebutton')}
                                            data-toggle="tooltip" data-placement="top"
                                            title="Имя папки сохранения связано с именем пакета">
                                        <span className="glyphicon glyphicon-link"></span>
                                    </button>
                                        <input type="text"
                                               required="true"
                                               className="form-control"
                                               name='pack_folder'
                                               ref='pack_folder'
                                               value={this.state.work_info.folder}
                                               onChange={this.onPackagePropertyChanged}
                                               id={this.create_id('edit_folder')} placeholder='Папка'/>
                                    </div>

                                    <div className="form-group">
                                        <label for={this.create_id('password')}>Пароли</label>
                                        <textarea id={this.create_id('password')} rows='3'
                                            ref='pack_pws'
                                            name='pack_pws'
                                            onChange={this.onPackagePropertyChanged}
                                            className="form-control" placeholder="Пароли"
                                            value={this.state.work_info.password}></textarea>
                                    </div>
                                </div>

                                <div className="ajaxFail"></div>
                                <div className="modal-footer">
                                    <button type="reset" className="btn btn-default" data-dismiss="modal">Отмена</button>
                                    <button type="submit" className="btn btn-primary" name="save" value="collector">Сохранить</button>
                                </div>
                            </div>
                        </form>);
        }
        else{
            return null;
        }
    }
});