/** @jsx React.DOM */
/**
 * Created by Developer on 25.07.14.
 */

var Package = React.createClass({
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
            },
        ];

        function mapControlItem(val, index){
            var cs=React.addons.classSet;
            var classes = {
                'btn': true,
                'btn-default': true,
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

        var links_progress = Math.round((this.props.data.linksdone / this.props.data.linkstotal)*100);

        return (<div className="pyload-package">
                    <div className="header">
                        <div className='base-info'>
                            <div className='name-rel horisontal-spaced-container'>
                                <span className='name'>{this.props.data.name}</span>
                                <div className='package-control btn-toolbar aux-info'>
                                    <div className='btn-group package-primary'>{package_control_items.map(mapControlItem)}</div>
                                    <div className='btn-group package-restart'>{restart_items.map(mapControlItem)}</div>
                                </div>
                            </div>

                            <div className="progress-info">
                                <div className='progress-quant'>
                                    <div className='size'>
                                        <span className='done'>
                                            <span className='value'>{toHuman(this.props.data.sizedone).size}</span>
                                            {toHuman(this.props.data.sizedone).units}
                                        </span>
                                        <span className='delimiter'>/</span>
                                        <span className='total'>
                                            <span className='value'>{toHuman(this.props.data.sizetotal).size}</span>
                                            {toHuman(this.props.data.sizetotal).units}
                                        </span>
                                    </div>

                                    <div className='links'>
                                        <span className='links-done value'>{this.props.data.linksdone}</span>
                                        <span className='delimiter'>/</span>
                                        <span className='links-total value'>{this.props.data.linkstotal}</span>
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
                        </div>
                    </div>
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
          url: this.props.url,
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
                           return (<Package data={state[value]} l18n={l18n} />);
                        });

        return (<div className="pyload-package-collection">
                    {packages}
                </div>);
    }
});