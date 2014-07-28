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

        function computeLinks(links, func=null){
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
    },
    render: function(){
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

        var links_progress = Math.round((this.state.details.linksdone / this.state.details.linkstotal)*100);

        var package_base_info = (<div className='base-info'>
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

        var get_files = function(){
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
        }.bind(this);

        var files_exists = this.state.show_files && ('links' in this.state.details);

        return (<div className="pyload-package">
                    <div className='package-view-control-outer'>
                        <div className='package-view-control'>
                            <button className={cs({toggled: this.state.show_details})}
                                    onClick={this.onToggleShowState}
                                    data-action='show_details'>Показать детали</button>
                            <button className={cs({toggled: this.state.show_files})}
                                    onClick={this.onToggleShowState}
                                    data-action='show_files'>Показать файлы</button>
                        </div>
                    </div>
                    <div className="header">
                        {package_base_info}
                    </div>
                    {files_exists ? get_files() : null}
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