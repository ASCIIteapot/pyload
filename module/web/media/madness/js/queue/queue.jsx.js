/** @jsx React.DOM */
/**
 * Created by Developer on 25.07.14.
 */

var cs=React.addons.classSet;

var package_control_items=[
    {
        id: 'edit',
        name: 'edit',                           // l18n
        description: 'editing package info',    // l18n
        icon: '/media/madness/img/edit.svg',
        action: 'edit_package'
    },
    {
        id: 'add',
        name: 'add',                                    // l18n
        description: 'Add new download in package',    // l18n
        icon: '/media/madness/img/download61.svg',
        action: 'add_download'
    },
    {
        id: 'unpack',
        name: 'unpack',                                    // l18n
        description: 'Unpack archives in package',    // l18n
        icon: '/media/madness/img/box41.svg',
        action: 'unpack'
    }
    ];

    var restart_items=[
    {
        id: 'restart_all',
        name: 'restart all',                                    // l18n
        description: 'Force restart all files in package',    // l18n
        icon: '/media/madness/img/reload3.svg',
        action: 'restart_all'
    },
    {
        id: 'restart_errors',
        name: 'restart errors',                                    // l18n
        description: 'Force restart only error files in package',    // l18n
        icon: '/media/madness/img/reload3.svg',
        action: 'restart_errors'
    },
    {
        id: 'restart_errors_and_wait',
        name: 'restart errors and wait',                                    // l18n
        description: 'Force restart error and wait files in package',    // l18n
        icon: '/media/madness/img/reload3.svg',
        action: 'restart_errors_and_wait'
    }
];

function mapControlItem(val, index){
    var classes = {
        'btn': true,
        'btn-default': true
    };

    classes[val.action]=true;

    return (<button type="button" className={cs(classes)}
                       data-action={val.action}
                       key={val.id}
                       rel="tooltip" data-toggle="tooltip" data-placement="bottom" title={val.description}>
                <img src={val.icon} alt={val.name}></img>
            </button>)
}


function toHuman(size_in_bytes){
    return getHumanSize({
        bytes: size_in_bytes,
        returntype: 'array',
        accuracy: 2,
        standard: 'IEC'
    });
}

var Package = React.createClass({

    getInitialState: function() {
        return {
            show_details: false,
            show_files: false,
            folder_follow_name: true,
            show_package_save: false,
            details: this.props.get_state
        };
    },
    onToggleShowState: function(event){
        var button = $(event.target);
        var showToggle = button.attr('data-action');
        // изменяем статус отображения
        this.state[showToggle] = ! this.state[showToggle];
        console.log(showToggle, this.props.pid, this.state[showToggle]);
        // обробатываем изменеения
        if(showToggle == 'show_files'){
            // Если это файлы, то сооьщаем супервизору о том что нужна ли информация о пакетах
            this.props.lookupFiles(this.state[showToggle]);
        }
        else if(showToggle == 'show_details' && this.state[showToggle]){
            // если показываются детали, то создаём поля данных для форм деталей
            this.state.show_package_save = false;
            this.create_details_form_data();
        }

        this.forceUpdate();
    },
    /**
     * Vrthod creates and setup form data for editing */
    create_details_form_data: function(){
        var details = this.state.details();
        this.state.package_form_details={
                name: details.name,
                folder: details.folder,
                password: details.password,
                folder_follow_name: details.folder == details.name
            };
    },
    restart_file_command: function(file){
        DoAjaxJsonRequest({
            url: '/json/restart_files',
            data: { files_list: [file.fid]}
        }, 'Перезапуск файла '+file.url);
    },
    abort_file_command: function(file){
        DoAjaxJsonRequest({
            url: '/json/abort_files',
            data: { files_list: [file.fid]}
        }, 'Остановка файла '+file.url);
    },
    get_files_vdom : function(){
        var state = this.state;
        var files_elements = state.details().links.map(function(file, index){
            var links_class={};
            links_class[file.status] = true;

            var super_status_map = {
                'super-finished': ["finished"],
                'super-queue': ['queued'],
                'super-error' : ['offline', 'aborted', 'failed', 'temp. offline'],
                'super-waiting': ['waiting'],
                'super-neutral': ['skipped', 'online', 'unknown'],
                'super-processing': ['custom', 'processing', 'downloading', 'starting', 'decrypting']
            };

            // setup super status
            var super_setted = null;
            for(super_item in super_status_map){
                if(super_status_map[super_item].indexOf(file.status)>-1){
                   links_class[super_item] = true;
                   super_setted = super_item;
                   break;
                }
            }

            var status_icon_map={
                'super-finished': 'status-icon glyphicon glyphicon-ok',
                'super-queue': 'status-icon glyphicon glyphicon-time',
                'super-error': 'status-icon glyphicon glyphicon-warning-sign',
                'super-waiting': 'status-icon glyphicon glyphicon-time',
                'super-processing': 'status-icon glyphicon glyphicon-forward'
            };

            var status_icon = (<span className={status_icon_map[super_setted]}></span>);


            var size = <td>{toHuman(file.size).size}<span className='units'>{toHuman(file.size).units}</span></td>;

            var restart_file = function(){this.restart_file_command(file)}.bind(this);
            var abort_file = function(){this.abort_file_command(file)}.bind(this);

            var file_info = function(){
                if('status-data' in file){
                    var stdata = file['status-data'];

                    var items = [];
                    if(super_setted == 'super-processing' &&  stdata.percent){
                        items[items.length]=<span className='progress-proc with-units'>
                                                <span className='value'>{stdata.percent}</span>
                                                <span className='units'>%</span>
                                             </span>;
                    }

                    var speed = toHuman(stdata.speed);
                    items[items.length]=(<span>
                                            <span className='eta'>{stdata.format_eta}</span>
                                            <span className='delimiter'>@</span>
                                            <span className='with-units'>
                                                <span className='value'>{speed.size}</span>
                                                <span className='units'>{speed.units}/s</span>
                                            </span>
                                         </span>);

                    return items;
                }
                else{
                    return <span title={file.error}>{file.error}</span>;
                }
            }.bind(this);

            return (<tr className={cs(links_class)}>
                       <td>{index}</td>
                       <td>
                           <span className='oneline-ellipsis'>
                                 {file.name}
                           </span>
                       </td>
                       <td>
                           <span className='oneline-ellipsis'>
                                {file.plugin}
                           </span>
                       </td>
                       <td>
                            <span className='status-data'>
                                {status_icon}
                                {file.statusmsg}
                            </span>
                       </td>
                       {file.size ? size : <td></td> }
                       <td className='info-data'>
                           <div>
                               <span className='info-text oneline-ellipsis'>{file_info()}</span>
                                <div className="btn-group">
                                  <button type="button" className="btn btn-default"
                                        onClick={restart_file}>
                                      <span className='glyphicon glyphicon-refresh'></span>
                                  </button>
                                  <button type="button" className="btn btn-default"
                                        onClick={abort_file}>
                                      <span className='glyphicon glyphicon-ban-circle'></span>
                                  </button>
                                </div>
                           </div>
                       </td>
                    </tr>);
        }.bind(this));

        return (<div className='files'>
                        <table className="table table-hover">
                            <col/>
                            <col className='column-name'/>
                            <col/>
                            <col/>
                            <col/>
                            <col className='column-info'/>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Имя</th>
                                    <th>Плагин</th>
                                    <th>Статус</th>
                                    <th>Размер</th>
                                    <th>Информация</th>
                                </tr>
                            </thead>
                            <tbody>{files_elements}</tbody>
                        </table>
                     </div>);
    },
    get_package_base_info_vdom : function(){
        var links_progress = Math.round((this.state.details().linksdone / this.state.details().linkstotal)*100);
        return (<div className='base-info'>
            <div className='name-rel horisontal-spaced-container'>
                <span className='name oneline-ellipsis'>{this.state.details().name}</span>
                <div className='package-control btn-toolbar aux-info'>
                    <div className='btn-group package-primary'>{package_control_items.map(mapControlItem)}</div>
                    <div className='btn-group package-restart'>{restart_items.map(mapControlItem)}</div>
                </div>
            </div>

            <div className="progress-info">
                <div className='progress-quant'>
                    <div className='size'>
                        <span className='done'>
                            <span className='value'>{toHuman(this.state.details().sizedone).size}</span>
                                                    {toHuman(this.state.details().sizedone).units}
                        </span>
                        <span className='delimiter'>/</span>
                        <span className='total'>
                            <span className='value'>{toHuman(this.state.details().sizetotal).size}</span>
                                                    {toHuman(this.state.details().sizetotal).units}
                        </span>
                    </div>

                    <div className='links'>
                        <span className='links-done value'>{this.state.details().linksdone}</span>
                        <span className='delimiter'>/</span>
                        <span className='links-total value'>{this.state.details().linkstotal}</span>
                    </div>
                </div>
                <div className="progress">
                    <div className="progress-bar" role="progressbar"
                    aria-valuenow={links_progress}
                    style={{width: links_progress+'%'}}
                    aria-valuemin="0" aria-valuemax="100">
                                                {links_progress+'%'}
                    </div>
                </div>
            </div>
        </div>);
    },
    create_button_vdom : function(action){
            var state_on = this.state[action];
            var button_classes = {toggled:state_on };
            var batton_glyph = {
                'glyphicon ': true,
                'glyphicon-chevron-up' : state_on,
                'glyphicon-chevron-down' : ! state_on
            };
            var text = state_on ? 'спрятать' : 'показать';
            var action_map = {
                show_details : 'детали',
                show_files   : 'файлы'
            };
            text+= ' ' + action_map[action];

            return (<button  className={cs(button_classes)}
                            onClick={this.onToggleShowState}
                            data-action={action}>
                        <span className={cs(batton_glyph)}></span><span className='description'>{text}</span>
                    </button>)
        },
    create_id: function(name){
            return name + '_' +this.props.pid;
    },
    get_package_details_vdom: function(){

        // HACK: Если данные пакета не изменены, то они при перерисовке сбрасываются на данные пакета
        if(! this.state.show_package_save){
            this.create_details_form_data();
        }

        var labelClass = cs({
            'control-label': true,
            'col-sm-3': true
        });

        var folderButtonClass = cs({
            'btn': true,
            'btn-default': true,
            'active': this.state.package_form_details.folder_follow_name
        });

        var resetFunc=function(){
            this.resetPackageDetailForm();
            this.state.show_package_save = false;
            this.forceUpdate();
        }.bind(this);

        var footer=<div className='form-footer'>
                        <button
                            type="reset"
                            className='btn btn-default'
                            onClick={resetFunc}>Отмена</button>
                        <button className='btn btn-primary'
                            type="submit">Сохранить</button>
                    </div>;

        return (<form className='package-details form-horizontal'
                    onSubmit={this.commitPackageChanges}
                    role="form"
                    ref='details-form'>
                    <div className="form-group">
                        <label className={labelClass}>
                            <div className='horisontal-spaced-container'>
                                <span>Id пакета</span>
                                <span className="glyphicon glyphicon-pencil hid"></span>
                            </div>
                        </label>
                        <div className='col-sm-9'>
                            <p className="form-control-static">{this.props.pid}</p>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className={labelClass} for={this.create_id('name')}>
                            <div className='horisontal-spaced-container'>
                                <span>Имя пакета</span>
                                <span className="glyphicon glyphicon-pencil edit-marker"></span>
                            </div>
                        </label>
                        <div className='col-sm-9'>
                            <input type="text" id={this.create_id('name')}
                                   ref='pname'
                                   name='pack_name'
                                   className="form-control" placeholder="Имя пакета"
                                   onChange={this.onPackagePropertyChanged}
                                   value={this.state.package_form_details.name}/>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className={labelClass} for={this.create_id('folder')}>
                            <div className='horisontal-spaced-container'>
                                <span>Папка сохранения</span>
                                <button type="button" className={folderButtonClass} data-toggle="button"
                                        ref='folder_link_button'
                                        id={this.create_id('follownamebutton')}
                                        onClick={this.onPackagePropertyChanged}
                                        data-toggle="tooltip" data-placement="top"
                                        title="Имя папки сохранения связано с именем пакета">
                                    <span className="glyphicon glyphicon-link"></span>
                                </button>
                                <span className="glyphicon glyphicon-pencil edit-marker"></span>
                            </div>
                        </label>
                        <div className='col-sm-9'>
                            <input type="text" id={this.create_id('folder')}
                                    ref='pfolder' name='pack_folder'
                                className="form-control" placeholder="Папка сохранения"
                                    onChange={this.onPackagePropertyChanged}
                                value={this.state.package_form_details.folder}/>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className={labelClass} for={this.create_id('passwords')}>
                            <div className='horisontal-spaced-container'>
                                <span>Пароли</span>
                                <span className="glyphicon glyphicon-pencil edit-marker"></span>
                            </div>

                        </label>
                        <div className='col-sm-9'>
                            <textarea id={this.create_id('passwords')} rows='3'
                                ref='ppass' name='pack_pws'
                                className="form-control" placeholder="Пароли"
                                onChange={this.onPackagePropertyChanged}
                                value={this.state.package_form_details.password}></textarea>
                        </div>
                    </div>
                    { this.state.show_package_save ? footer: null}
                </form>)
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
        var detials_form = this.state.package_form_details;
        var process = true;
        if(event.target.id == this.create_id('folder')){
            // имя папки изменилось, необходимо сбросить переключатель следования имени пакета
            detials_form.folder = event.target.value;
            if(detials_form.folder_follow_name){
                detials_form.folder_follow_name = detials_form.folder == detials_form.name;
            }

            this.forceUpdate();
        }
        else if(event.target.id == this.create_id('name')){
            detials_form.name = event.target.value;
            if(detials_form.folder_follow_name){
                detials_form.folder = detials_form.name;
            }
        }
        else if(event.target.id == this.create_id('follownamebutton')){
            detials_form.folder_follow_name = ! detials_form.folder_follow_name;
            if(detials_form.folder_follow_name){
                process = detials_form.folder != detials_form.name;
                detials_form.folder = detials_form.name;
            }
        }
        else if(event.target.id == this.create_id('passwords')){
            detials_form.password = event.target.value;
        }

        if(process){
            this.processPackageDataChange();
        }
        this.forceUpdate();
    },
    processPackageDataChange: function(){
        console.log('process');
        this.state.show_package_save = true;
    },
    render : function(){
        // только для расширенного режима, пока отложим и будем работать с сокращёными данными
//        // интересны следующий статусы
//        // downoaded
//        // waiting
//        // error
//        // queued
//
//        function statusCount(status){
//            var counter = 0;
//            for(download in this.state.values()){
//                if(download.)
//            }
//        }

        var files_exists = this.state.show_files && ('links' in this.state.details());

        var view_control= <div className='package-view-control-outer'>
                                <div className='package-view-control'>
                                    {this.create_button_vdom('show_details')}
                                    {this.create_button_vdom('show_files')}
                                </div>
                            </div>;

        return (<div className="pyload-package">
                    {view_control}
                    <div className="header">
                        {this.get_package_base_info_vdom()}
                        {this.state.show_details ? this.get_package_details_vdom() : null}
                    </div>
                    {files_exists ? this.get_files_vdom() : null}
                </div>);
    }
});

var PackageQueue = React.createClass({
    getInitialState: function() {
        return {};
    },
    componentDidMount: function() {
        this.loadPackagesFromServer();
        setInterval(this.loadPackagesFromServer, this.props.pollInterval);
    },
    loadPackagesFromServer: function(){
        // определяем функцию ajax запроса для подачи её в 'map'
        var ajaxCallFunction = function(reqpar, callback){
            DoAjaxJsonRequest(reqpar).
                done(function( data, textStatus, jqXHR ){
                    callback(null, data);
                }).
                fail(function( jqXHR, status, err ) {
                    callback(arguments, null);
                });
        };

        // получаем список пакетов для которых должны быть загружена информация о файлах
        var load_files=[];
        for(pid in this.state){
            if(this.state[pid].load_files){
                load_files.push(pid);
            }
        }
        // console.log('load_files', load_files);

        // формируем запросы
        var requests=[
            // список 'всех' пакетов в очереди/хранилеще
            {url: '/json/packages', method: 'GET'},
            // список активных закачек
            {url: '/json/links', method: 'GET'},
            // загрзука файлов для выбранных пакетов
            {url: '/json/packages', method: 'POST', data:{pids: load_files}}
        ];

        async.map(requests, ajaxCallFunction,
            function(err, results){
                // выполняем комплиментацию результатов
                // console.log(results);
                // console.log(err);
                var packages = results[0];

                // добавляем информацию о файлах
                for(pid in results[2]){
                    packages[pid].links=results[2][pid].links;
                    packages[pid].load_files=true;
                }

                results[1]['links'].forEach(function(link, index){
                    var package_ = packages[link.packageID];
                    if('links' in package_){
                        var file_ = _.find(package_.links, function(item){return item.fid == link.fid});
                        file_['status-data'] = link;
                    }
                });

                this.setState(packages);
            }.bind(this));
    },
    getPackageState: function(pid){
        // получение информации для указнного пакета
        return this.state[pid];
        this.forceUpdate();
    },

    /**
     * @pid: package id
     * @enable: enables lookup for files change. If enabled then files info fetched from server via /json/package/<id> and call forceUpdate when necessary/
     * */
    lookupFiles: function(pid, /*bool*/ enable){
        this.state[pid].load_files = enable;
        this.loadPackagesFromServer();
    },
    render: function(){
        var l18n = this.props.l18n;
        var state = this.state;
        var packages = Object.keys(state).map(function(pid, index) {
                           var get_state_func=function(){
                               return this.getPackageState(pid)
                           }.bind(this);
                           var lookup_files=function(enable){
                               return this.lookupFiles(pid, enable);
                           }.bind(this);

                           return (<Package ref={'p_'+pid}
                                            pid={pid}
                                            l18n={l18n}
                                            get_state={get_state_func}
                                            lookupFiles={lookup_files}
                                            />);
        }.bind(this));

        return (<div className="pyload-package-collection">
                    {packages}
                </div>);
    }
});