/** @jsx React.DOM */
/**
 * Created by Developer on 23.07.14.
 */

var LinksInputElement=React.createClass({
    /*
    * Handle raw links text change
    * */
    handleLinksTextChange: function(event){
        this.setState({ linksrawtext: this.refs.links_text_aria.getDOMNode().value});
        console.log(this.state.linksrawtext);
        DoAjaxJsonRequest({
            url: '/json/parse_urls',
            data: { raw_text: event.target.value }
        }).done(function(data, textStatus, jqXHR){
            this.setupParsedFiles(data.urls);
        }.bind(this));
    },
    setupParsedFiles: function(parsed_files){
        /*
        * Метод устонавливает разобранные файлы
        *
        * Разобранный файл может:
        *   дублировать сушествующий
        *   восстонавливать удалённый
        * */

        // копируем исходные файлы
        this.state.files = [];
        console.log(this.state.existfiles);
        this.state.existfiles.forEach(function(exist_file){
            this.state.files.push(_.clone(exist_file));
        }.bind(this));

        // вычисляем существубщие файлы
        var isRemoved = _.matches({removed: true});

        _.forEach(parsed_files, function(new_file)
        {
            var existFile = _.find(this.state.files, function(item){return item.url === new_file.url});
            if(existFile){
                // если файл существует
                if(isRemoved(existFile)){
                    // и был удалён, то восстонавливаем его
                    existFile.restored = true;
                }
                else{
                    // в противном случае ставим флаг дублирования
                    existFile.doubling = true;
                }
            }
            else{
                // если файл не существует
                this.state.files.push(
                    this.create_file({
                    isnew: true,
                    url: new_file.url,
                    plugin: new_file.plugin
                }));
            }
        }.bind(this));
        // устонавливаем счётчики
        this.updateCounters();
        this.forceUpdate();
     },
    updateCounters: function(){
        this.state.counters = this.createCounters(this.state.files);
    },
    createCounters: function(files){
        /* Только создание объекта счётчиков */
        var isNewFile = _.matches({isnew: true});
        var isDuplicateFile = _.matches({doubling: true});
        return {
                overall : _.chain(files).filter(function(file){return !(file.removed && !file.restored);}).size(files).value(),
                new_files : _.chain(files).
                            filter(isNewFile).
                            size().value(),
                duplicated_files : _.chain(files).
                            filter(isDuplicateFile).
                            size().value()
        };
    },
    create_file: function(args){
        var defaults = {
            url: null,
            plugin: null,
            status: null,
            //
            fid: null,
            name: null,
            //
            isnew: false,
            restored: false,
            removed: false,
            doubling: false,
            //
            isediting: false,
            editinglink: ""
        };
        return _.defaults(args, defaults);
    },
    setupLinksInfo: function(stateObject, propsObject){
        var existFiles=[];
        if(propsObject.package!=null){
            existFiles = _.map(propsObject.package.links,
                function(file){
                    return this.create_file({
                        url: file.url,
                        name: file.name,
                        plugin: file.plugin,
                        status: file.statusmsg
                    });
                }.bind(this))
        }
        _.extend(stateObject, {
            // существующие файлы в пакете
            existfiles: existFiles,
            // отображаемые файлы
            files: _.map(existFiles, _.clone),
            counters: this.createCounters(existFiles)
        });

        return stateObject;
    },
    getInitialState: function() {
        /*
        * Состояние есть:
        *   URL
        *   Плагин
        *   Статус (новый, онлайн, ошибка и т.п.)
        *   // для существующих в пакете файлов
        *   fid
        *   имя
        *   // дополнительный статус
        *   restored,
        *   removed,
        *   isDoubling
        * */
        console.log('LinksInputElement.getInitialState for ', this.props.package);


        var init_state = {
            // существующие файлы в пакете
            existfiles: null,
            // отображаемые файлы
            files: null,
            counters: null,
            // текст ссылок
            linksrawtext: "",
            // файл который редактируется в настоящий момент
            currentlyEditingFile: null
        };

        return this.setupLinksInfo(init_state, this.props);
    },
    componentWillReceiveProps: function(newProps){
        console.log('reciving new props', newProps);
        this.setupLinksInfo(this.state, newProps);
    },
    componentDidMount: function(){
        var target=this.getDOMNode();

        $(target).parents('.modal').on('show.bs.modal', function (e){
            this.setState(this.getInitialState());
        }.bind(this));
    },
    resetLinksText:function(event){
        // сброс введенных ссылок
        console.log('сброс введенных ссылок');
        this.discardEditingFile();
        this.resetParsedFilesImpl();
        this.forceUpdate();
    },
    commitLinksText:function(event){
        // добавление введенных ссылок
        console.log('добавление введенных ссылок');
        this.commitEditingFileImpl();
        this.commitFilesImpl();
        this.resetParsedFilesImpl();
        this.forceUpdate();
    },
    commitFilesImpl: function(){
        var isnotnew = function(item){return !(item.removed && item.restored)}; // _.matches({removed: true, restored: false});
        this.state.existfiles = [];
        _.filter(this.state.files, isnotnew).forEach(function(new_file)
        {
            var new_exist_file = _.clone(new_file);
            new_exist_file.doubling = false;
            new_exist_file.isnew = false;
            this.state.existfiles.push(new_exist_file);
        }.bind(this));
    },
    resetParsedFilesImpl: function(){
        this.state.linksrawtext = "";
        this.setupParsedFiles([]);
    },
    enterFileEdit: function(file){
        this.commitEditingFile();
        this.state.currentlyEditingFile = file;
        file.isediting=true;
        file.editinglink = file.url;
        this.forceUpdate();
    },
    commitEditingFileImpl: function(){
        var file = this.state.currentlyEditingFile;
        if(file !== null){

            // проверям на дуликаты
            var rm = function(item){
                var collection = this.state.files;
                var index = _.indexOf(collection, item);
                collection.remove(index);
            }.bind(this);

            var exist_file = _.chain(this.state.files).difference([file]).where({url: file.editinglink}).first();
            if(! exist_file.isUndefined()){
                exist_file = exist_file.value();
                console.log('Дубликат при редактировании');
                if(_.has(exist_file, 'fid')){
                    rm(file);
                }
                else{
                    rm(exist_file);
                }
            }

            this.state.currentlyEditingFile = null;

            file.isediting=false;
            file.url = file.editinglink;
            file.editinglink = "";

            this.updateCounters();
            this.commitFilesImpl();
            return true;
        }
        return false;
    },
    commitEditingFile: function(){
        if(this.commitEditingFileImpl()){
            this.forceUpdate();
        }
    },
    commitAll: function(){
        this.commitEditingFileImpl();
        this.commitFilesImpl();
    },
    discardEditingFile: function(){
        var file = this.state.currentlyEditingFile;
        if(file !== null){
            this.state.currentlyEditingFile = null;

            file.isediting=false;
            file.editinglink = "";
            this.forceUpdate();
        }
    },
    render: function(){
        console.log("LinksInputElement render request");
        console.log(this.props.package);
        var taria_el=<textarea key='taria'
                      ref='links_text_aria'
                      className="form-control" rows="3"
                      value={this.state.linksrawtext}
                      onChange={this.handleLinksTextChange}
                      placeholder='Ссылки'
                      name="add_links" id="add_links"/>;
        var rawLinksGroup = (
                    <div class="form-group">
                        <label htmlFor="add_links">Ссылки</label>
                        {taria_el}
                    </div>);
        // показываем поле со ссылками если есть хотя бы одна ссылка
        if(_.any(this.state.files)){
            var items=[];

            _.chain(this.state.files).
                filter(function(file){return !(file.removed && !file.restored);}).
                each(function(file, index){
                var classes = cs({
                    isnew: file.isnew,
                    isdoubling: file.doubling,
                    isediting: file.isediting
                });
                var item=null;
                if(file.isediting){
                    var accept = function(event){this.commitEditingFile();}.bind(this);
                    var discard = function(event){this.discardEditingFile();}.bind(this);
                    var onChanged = function(event){
                        var new_value = event.target.value;
                        file.editinglink = new_value;
                        this.forceUpdate();
                    }.bind(this);
                    var keyPressed=function(event){
                        console.log(event);
                        if(event.keyCode === 13){ // enter
                            event.stopPropagation();
                            event.preventDefault();
                            this.commitEditingFile(file);

                        }
                        else if(event.keyCode === 27){ // Escape
                            event.stopPropagation();
                            event.preventDefault();
                            this.discardEditingFile(file);
                        }
                    }.bind(this);
                    item = (<tr key={file.url} className={classes} onKeyPress={keyPressed}>
                                <td>{index+1}</td>
                                <td className='editinglink text_wbuttons_td' colSpan='3'>
                                    <div className='text_wbuttons align_right'>
                                        <input className='text' value={file.editinglink} onChange={onChanged}/>
                                        <div className="btn-group" role="group">
                                          <button type="button" className="btn btn-primary"
                                              title='Принять изменения'
                                                onClick={accept}>
                                              <span className='glyphicon glyphicon-ok accept'></span>
                                          </button>
                                          <button type="button" className="btn btn-default"
                                                title='Отменить изменения'
                                                onClick={discard}>
                                              <span className='glyphicon glyphicon-remove remove'></span>
                                          </button>
                                        </div>
                                    </div>
                                </td>
                              </tr>);
                }
                else{
                    var editLink=function(event){
                        this.enterFileEdit(file);
                    }.bind(this);

                    var removeFileCommand = function(event){
                        file.removed = true;
                        this.updateCounters();
                        this.commitFilesImpl();
                        this.forceUpdate();
                    }.bind(this);

                    var fileControl=(<div className="btn-group" role="group">
                                          <button type="button" className="btn btn-default" onClick={removeFileCommand}
                                          title='Удалить файл'>
                                              <span className='glyphicon glyphicon-remove remove'></span>
                                          </button>
                                    </div>);

                    var nameData = function(){
                        var nameObj=null;
                        if(_.has(file, 'name') && file.name != file.url && file.name){
                            nameObj =(<div className='withurl text'>
                                                <span className='name'>{file.name}</span>
                                                <span>: </span>
                                                <span className='url'>{file.url}</span>
                                        </div>);
                        }
                        else{
                            nameObj = <div className='text'>{file.url}</div>;
                        }
                        return (<div className='text_wbuttons align_right'>
                                    {nameObj}
                                    {fileControl}
                                </div>);
                    }.bind(this);

                    item = (<tr key={file.url} className={classes} onDoubleClick={editLink}>
                                <td>{index+1}</td>
                                <td className='text_wbuttons_td'>{nameData()}</td>
                                <td>{file.plugin}</td>
                                <td>{file.status}</td>
                              </tr>);
                }

               items.push(item);
            }.bind(this));

            var addedItemsPresent = _.any(this.state.files, function(item){ return item.isnew || item.doubling;});
            var addItemsControl = (<div className='form-group horisontal-spaced-container'>
                                        <button type="button" className="btn btn-default"
                                            title='Очистить список введённых ссылок'
                                        onClick={this.resetLinksText}>
                                            <span>
                                                <span className='glyphicon glyphicon-remove-circle remove'></span>
                                                <span> </span>
                                                <span>Очистить</span>
                                            </span>
                                        </button>
                                        <button
                                            title='Добавить разобранные ссылки'
                                        type="button" className="btn btn-success" onClick={this.commitLinksText}>
                                            <span>
                                                <span className='glyphicon glyphicon-plus add'></span>
                                                <span> </span>
                                                <span>Добавить</span>
                                            </span>
                                        </button>
                                    </div>);


            var linksList = (<div className='form-group'>
                                <label htmlFor='parsed_links'>
                                    <span>Разобранные ссылки</span>
                                    <span> </span>
                                    <span>
                                        <span>{this.state.counters.new_files}</span>
                                        <span className='separator'>/</span>
                                        <span>{this.state.counters.duplicated_files}</span>
                                        <span className='separator'>/</span>
                                        <span>{this.state.counters.overall}</span>
                                    </span>
                                </label>
                                {addedItemsPresent ? addItemsControl : null}
                                <table className="table table-condensed table-bordered table-hover parsed_links" id='parsed_links'>
                                    <col width='30px'/>
                                    <thead>
                                        <tr>
                                            <th>Номер</th>
                                            <th>Сылка</th>
                                            <th>Плагин</th>
                                            <th>Статус</th>
                                        </tr>
                                    </thead>
                                    <tbody>{items}</tbody>
                                </table>
                            </div>);

            return (<div>
                        {rawLinksGroup}
                        {linksList}
                    </div>);
        }
        else{
            return rawLinksGroup;
        }
    },
    AllLinksOnly:function(){
        /* Получение полного списка ссылок */

        return _.chain(this.state.existfiles).
            filter(function(item){return (!item.removed && !item.restored);})
            .pluck('url').value();
    }
});

var PackageEditorModal = React.createClass({
    getInitialState: function() {
        return {};
    },
    beginEditPackage: function(pid, anchor){
        console.log('start editing package', pid, anchor);
        this.setState({pid: pid});
        this._startingRecivingPackageInfo();

        // make request
        DoAjaxJsonRequest({
            url: '/json/package/'+pid,
            method: 'GET'
        }).done(function(data, i1, i2){
           console.log('receving data for ', pid, ' done');
           // получаем начальное состояние
           this.setState({
               pid: pid,
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
    },

    _startingRecivingPackageInfo: function(){
        // on starting ajax request. while data will not loaded
        // doing nothing for now
    },

    commitPackageChanges: function(){
        this.refs.links_input.commitAll();
        var packageData = {
            pack_id: this.state.work_info.pid,
            pack_name: this.state.work_info.name,
            pack_folder: this.state.work_info.folder,
            pack_pws: this.state.work_info.password,
            pack_links: this.refs.links_input.AllLinksOnly()
        };

        DoAjaxJsonRequest({
            url: '/json/edit_package',
            data: packageData
        }, 'edit package '+this.state.work_info.pid).done(function(){
            $('#edit_package_modal').modal('hide');
            }.bind(this));
        return false;
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
        console.log("PackageEditorModal render request");
        if('init_info'in this.state){
            var folderButtonClass = cs({
                'btn': true,
                'btn-default': true,
                'active': this.state.folder_follow_name
            });

            return (<form className="modal-dialog"
                              role="form"
                              action="/json/edit_package"
                              method="POST"
                              enctype='application/json'
                              onSubmit={this.commitPackageChanges}>
                            <div className="modal-content">
                                <div className="modal-header">
                                    <button type="button" className="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span
                                            className="sr-only">Close</span></button>
                                    <h4 className="modal-title" id="edit-label">Редактирование пакета {this.state.init_info.pid} - {this.state.init_info.name}</h4>
                                </div>

                                <div className="modal-body">
                                    <div className="form-group">
                                        <label htmlFor={this.create_id('name')}>Имя пакета</label>
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
                                        <label htmlFor={this.create_id('edit_folder')}>
                                            <span>
                                                <span>Папка сохранения</span>
                                                <span> </span>
                                                <button type="button" className={folderButtonClass} data-toggle="button"
                                                        ref='folder_link_button'
                                                        name='folder_link_button'
                                                        onClick={this.onPackagePropertyChanged}
                                                        id={this.create_id('follownamebutton')}
                                                        data-toggle="tooltip" data-placement="top"
                                                        title="Имя папки сохранения связано с именем пакета">
                                                    <span className="glyphicon glyphicon-link"></span>
                                                </button>
                                            </span>
                                            </label>
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
                                        <label htmlFor={this.create_id('password')}>Пароли</label>
                                        <textarea id={this.create_id('password')} rows='3'
                                            ref='pack_pws'
                                            name='pack_pws'
                                            onChange={this.onPackagePropertyChanged}
                                            className="form-control" placeholder="Пароли"
                                            value={this.state.work_info.password}></textarea>
                                    </div>

                                    <LinksInputElement ref='links_input' package={this.state.work_info}/>
                                </div>
                                <div className="ajaxFail"></div>
                                <div className="modal-footer">
                                    <button type="reset" className="btn btn-default" data-dismiss="modal">Отмена</button>
                                    <button type="submit" className="btn btn-primary">Сохранить</button>
                                </div>
                            </div>
                        </form>);
        }
        else{
            return null;
        }
    }
});