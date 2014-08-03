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
            details: this.props.init_state
        };
    },
    onToggleShowState: function(event){
        var button = $(event.target);
        var showToggle = button.attr('data-action')
        console.log(showToggle, this.props.pid);
        // изменяем статус отображения
        this.state[showToggle] = ! this.state[showToggle];

        // обробатываем изменеения
        if(this.state[showToggle]){
            this.fetch_info(showToggle);
        }
        else{
            this.forceUpdate();
        }
    },
    fetch_info: function(show_target){

        function computeLinks(links, func){
            var size=0;
            var count=0;
            for(index in links){
               var item=links[index];
               if(func==null || func(item.status)){
                   size+=item.size;
                   count++;
               }
            }
            return {size: size, count: count};
        }


        if(show_target == 'show_files'){
            $.ajax({
              url: '/json/package/'+this.props.pid,
              dataType: 'json',
              success: function(data) {
                  var done = computeLinks(data.links, function(status){return status == 'finished'});
                  data.linksdone = done.count;
                  data.sizedone = done.size;

                  var total = computeLinks(data.links);
                  data.linkstotal = total.count;
                  data.sizetotal = total.size;

                  this.state.details = data;
                  this.forceUpdate();
              }.bind(this),
              error: function(xhr, status, err) {
                console.error('/json/package/'+this.props.pid, status, err.toString());
              }.bind(this)
            });
        }
        else{
            this.state.show_package_save = false;
            this.state.folder_follow_name = true;
            this.forceUpdate();
        }
    },
    get_files_vdom : function(){
        var state = this.state;
        var files_elements = state.details.links.map(function(file, index){
            var links_class={};
            links_class[file.status] = true;

            var super_status_map = {
                'super-finished': ["finished"],
                'super-queue': ['online', 'queued'],
                'super-offline' : ['offline', 'aborted'],
                'super-waiting': ['waiting'],
                'super-failed': ['failed'],
                'super-skipped': ['skipped'],
                'super-processing': ['custom', 'processing']
                // all other
                // 'super-downloading': ['downloading']
            };

            // setup super status
            var super_setted = false;
            for(super_item in super_status_map){
                if(super_status_map[super_item].indexOf(file.status)>-1){
                   links_class[super_item] = true;
                   super_setted = true;
                   break;
                }
            }
            if(! super_setted){
               links_class['super-downloading'] = true;
            }

            var size = <td>{toHuman(file.size).size}<span className='units'>{toHuman(file.size).units}</span></td>;

            return (<tr className={cs(links_class)}>
                       <td>{index}</td>
                       <td>{file.name}</td>
                       <td>{file.plugin}</td>
                       <td>{file.statusmsg}</td>
                       {file.size ? size : <td></td> }
                       <td>{file.error}</td>
                    </tr>);
        });

        return (<div className='files'>
                        <table className="table table-hover">
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
        var links_progress = Math.round((this.state.details.linksdone / this.state.details.linkstotal)*100);
        return (<div className='base-info'>
            <div className='name-rel horisontal-spaced-container'>
                <span className='name'>{this.state.details.name}</span>
                <div className='package-control btn-toolbar aux-info'>
                    <div className='btn-group package-primary'>{package_control_items.map(mapControlItem)}</div>
                    <div className='btn-group package-restart'>{restart_items.map(mapControlItem)}</div>
                </div>
            </div>

            <div className="progress-info">
                <div className='progress-quant'>
                    <div className='size'>
                        <span className='done'>
                            <span className='value'>{toHuman(this.state.details.sizedone).size}</span>
                                                    {toHuman(this.state.details.sizedone).units}
                        </span>
                        <span className='delimiter'>/</span>
                        <span className='total'>
                            <span className='value'>{toHuman(this.state.details.sizetotal).size}</span>
                                                    {toHuman(this.state.details.sizetotal).units}
                        </span>
                    </div>

                    <div className='links'>
                        <span className='links-done value'>{this.state.details.linksdone}</span>
                        <span className='delimiter'>/</span>
                        <span className='links-total value'>{this.state.details.linkstotal}</span>
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
            return name + '_' +this.state.details.pid;
    },
    get_package_details_vdom: function(){

        var labelClass = cs({
            'control-label': true,
            'col-sm-3': true
        });

        var folderButtonClass = cs({
            'btn': true,
            'btn-default': true,
            'active': this.state.folder_follow_name
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
                            <p className="form-control-static">{this.state.details.pid}</p>
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
                                   defaultValue={this.state.details.name}/>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className={labelClass} for={this.create_id('folder')}>
                            <div className='horisontal-spaced-container'>
                                <span>Папка сохранения</span>
                                <button type="button" className={folderButtonClass} data-toggle="button"
                                        ref='folder_link_button'
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
                                defaultValue={this.state.details.folder}/>
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
                                defaultValue={this.state.details.password}></textarea>
                        </div>
                    </div>
                    { this.state.show_package_save ? footer: null}
                </form>)
    },
    commitPackageChanges: function(){
        var packageData = $(this.refs['details-form'].getDOMNode()).serializeObject();
        packageData['pack_id'] = this.props.pid;
        DoAjaxJsonRequest({
            url: '/json/edit_package',
            data: packageData
        }, 'edit package '+this.props.pid).done(function(){
            this.resetPackageDetailForm();
            this.state.show_package_save = false;
            this.forceUpdate();
            }.bind(this));
        return false;
    },
    // метод сбрасывает значения полей формы деталей пакета на умолчательные, соотвествующие таковым в объекте состояния
    resetPackageDetailForm: function(){
        function resetInput(input){
            input.setState(input.getInitialState());
        }

        var inputNames = ['pname', 'pfolder', 'ppass'];

        inputNames.map(function(item, index){
            return this.refs[item];
        }.bind(this)).forEach(resetInput);

        // HACK: <textarea/> не обнуляется через setState()
        this.refs['ppass'].getDOMNode().value = this.refs['ppass'].getInitialState().initialValue ;

        this.state.folder_follow_name = true;
    },
    onPackagePropertyChanged: function(event){
        var nameNode = this.refs['pname'].getDOMNode();
        var folderNode = this.refs['pfolder'].getDOMNode();
        var folderLinkButton = this.refs['folder_link_button'].getDOMNode();
        var process = true;
        if(event.target.id == this.create_id('folder')){
            // имя папки изменилось, необходимо сбросить переключатель следования имени пакета
            var folder = folderNode.value;
            var name = nameNode.value;

            if(this.state.folder_follow_name){
                this.state.folder_follow_name = folder == name;
            }

            this.forceUpdate();
        }
        else if(event.target.id == this.create_id('name')){
            if(this.state.folder_follow_name){
                var name = nameNode.value;
                this.refs['pfolder'].setState({'value': name});
            }
        }
        else if(event.target == folderLinkButton){
            process = folderNode.value != nameNode.value;
            this.state.folder_follow_name = !this.state.folder_follow_name;
            if(this.state.folder_follow_name){
                this.refs['pfolder'].setState({'value': nameNode.value});
            }
            this.forceUpdate();
        }
        if(process){
            this.processPackageDataChange();
        }
    },
    processPackageDataChange: function(){
        console.log('process');
        this.state.show_package_save = true;
        this.forceUpdate();
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

        var files_exists = this.state.show_files && ('links' in this.state.details);

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
        $.ajax({
          url: '/json/packages',
          dataType: 'json',
          success: function(data) {
            this.setState(data);
          }.bind(this),
          error: function(xhr, status, err) {
            console.error(this.props.url, status, err.toString());
          }.bind(this)
        });
    },
    render: function(){
        var l18n = this.props.l18n;
        var state = this.state;
        var packages = Object.keys(state).map(function(value, index) {
                           return (<Package pid={state[value].pid} l18n={l18n} init_state={state[value]} />);
                        });

        return (<div className="pyload-package-collection">
                    {packages}
                </div>);
    }
});