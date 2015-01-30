/** @jsx React.DOM */
/**
 * Created by Developer on 21.07.14.
 */

/*
 * Main app menu
 */
var cx = React.addons.classSet;

function menuItem(item) {
    var def_state = {
        action: null,
        icon: null,
        link: '#',
        active: false,
        content: null,
        add_classes: {}
    };
    _.defaults(item, def_state);

    var classes = {
        'dropdown': true,
        'active': item.active
    };
    _.extend(classes, item.add_classes);

    return (
        <li className={cs(classes)}
        key={item.action}
        data-action={item.action}
        onClick={onActionClick}>
            <a href={item.link} >
                <div className="navbar-item">
                    <img src={item.icon} className="icon"/>
                    <span className="text">{item.content}</span>
                </div>
            </a>
        </li>
        );
}

function dropdownMenuItem(item) {
    var def_state = {
        action: null,
        icon: null,
        content: null,
        active: false,
        add_classes: {},
        items: []
    };
    _.defaults(item, def_state);
    var convertedNodes = _.map(item.items, createSingleMenuItem);

    var classes = {
        'dropdown': true,
        'active': item.active
    };
    _.extend(classes, item.add_classes);


    return (
        <li className={cs(classes)} key={item.action}>
            <a href='#' className="dropdown-toggle" data-toggle="dropdown">
                <div className="navbar-item">
                    <img src={item.icon} className={item.icon != null ? "icon" : "hidden" }/>
                    <span className="text">{item.content}</span>
                    <span className="caret"></span>
                </div>
            </a>
            <ul className="dropdown-menu" role="menu">{convertedNodes}</ul>
        </li>);
}

function createSingleMenuItem(item, additionalClases) {
    if ('items' in item) {
        // is dropdown
        return dropdownMenuItem(item);
    }
    else {
        return menuItem(item);
    }
}


var Menu = React.createClass({
    render: function () {
        var convertedNodes = [];

        this.props.items.forEach(function (item) {
            _.defaults(item, {
                add_classes: {}
            });
            convertedNodes.push(createSingleMenuItem(item, item.add_classes));
        });

        return (<ul className={this.props.isright == 'true' ? "nav navbar-nav navbar-right" : "nav navbar-nav" }>
                    {convertedNodes}
        </ul>);
    }
});


/*
 * server status control
 * */

var ServerStatusControl = React.createClass({
    getInitialState: function () {
        return {data: []};
    },

    componentDidMount: function () {
        this.loadCommentsFromServer();
        setInterval(this.loadCommentsFromServer, this.props.pollInterval);
    },

    loadCommentsFromServer: function () {
        $.ajax({
            url: this.props.url,
            dataType: 'json',
            timeout: this.props.pollInterval,
            success: function (data) {
                this.setState(data);
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },
    render: function () {
        var serverActive = !this.state.pause;

        var filteredActionsList = actionsList.filter(function (item) {
            if (serverActive) {
                return item.action != 'play';
            }
            else {
                return item.action != 'stop';
            }
        });

        var serverStatusItems = filteredActionsList.map(function (item) {
            return createSingleMenuItem(item, additionalClases = {'controls-group-item': true})
        });

        var headerItem = (<li className="header">
            <span>{serverActive ? 'Сервер запущен' : 'Сервер остановлен'}</span>
        </li>);

        serverStatusItems.splice(0, 0, headerItem);

        var cx = React.addons.classSet;
        var classesControls = cx({
            'actions-control': true,
            'server-active': serverActive
        });

        var classesActiveState = cx({
            'server-status-info': true
        });

        return (<div className="row server-status">
            <div className='col-md-6'>
                <div className={classesControls}>
                    <ul className="controls-group">{serverStatusItems}</ul>
                </div>
            </div>
            <div className='col-md-4'>
                <div className={classesActiveState}>
                    <ul className="controls-group">
                        <li className='download-count-group'>
                            <span>
                                        {this.props.l18n.active}
                                <span className='download-count'>{this.state.active}</span>
                            /
                                <span   className='download-count'
                                rel="tooltip"
                                data-toggle="tooltip"
                                data-placement="bottom"
                                title={this.props.l18n.queued}>
                                            {this.state.queue}
                                </span>
                            /
                                <span   className='download-count'
                                rel="tooltip"
                                data-toggle="tooltip"
                                data-placement="bottom"
                                title={this.props.l18n.total}>
                                            {this.state.total}
                                </span>
                            </span>
                        </li>
                        <li>
                            <span>{this.props.l18n.speed} </span>
                            <span className='speed'>{this.state.speed}</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>);
    }
});

/*
 * Главное меню
 * */



var BasepageHeader = React.createClass({
    getInitialState: function () {
        var actions_item = _.find(mainItems,
            function (menu_item) {
                return 'actions' === _.property('action')(menu_item);
            });
        var actions_clone = _.clone(actions_item);

        return {
            main_items: mainItems,
            aux_items: auxItems,
            actions_item: actions_item,
            actions_item_backup: actions_clone
        }
    },
    captchaRecived: function (captcha) {
        // console.log('captchaRecived', captcha);
        var mainitems_clone = _.clone(this.state.main_items);

        var new_actions = _.clone(this.state.actions_item_backup.items);

        if(_.size(captcha) > 0){
            this.state.actions_item.content =
                (<span>
                    {this.state.actions_item_backup.content}
                    <span> </span>
                    <span className="label label-info">captcha</span>
                </span>);
            var captcha_item = {
                content: (<span>captcha <span className='badge'>{_.size(captcha)}</span></span>),
                action: 'enter_captcha'
            };

            new_actions.push(captcha_item);
        }
        else{
            this.state.actions_item.content = this.state.actions_item_backup.content;
        }

        this.state.actions_item.items = new_actions;

        this.setState({main_items: mainitems_clone});
    },
    componentDidMount: function () {
        captchaServiceInstance.captcha_recived.add(this.captchaRecived);
    },
    render: function () {
        return (<div className="container">
            <div className="navbar-header">
                <a href="#" className="navbar-brand">
                    <div className="pyload-logo">
                        <img src="/media/madness/img/pyloadlogo-01.svg" className="logo-img"></img>
                        <span className="pyload-text">pyLoad</span>
                    </div>
                </a>
                <button type="button" className="navbar-toggle" data-toggle="collapse" data-target=".navbar-collapse">
                    <span className="icon-bar"></span>
                    <span className="icon-bar"></span>
                    <span className="icon-bar"></span>
                </button>
            </div>
            <div className="navbar-collapse collapse in">
                <Menu items={this.state.main_items} isright='false'/>
                <Menu items={this.state.aux_items} isright='true'/>
            </div>
        </div>);
    }
});