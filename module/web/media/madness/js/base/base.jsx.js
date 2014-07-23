/** @jsx React.DOM */
/**
 * Created by Developer on 21.07.14.
 */

var MenuItem = React.createClass({
  render: function() {
    var cx = React.addons.classSet;
    var classes = cx(this.props.classes);
    return (
        <li className={classes}
            data-action={this.props.action}
            onClick={onActionClick}>
            <a href={this.props.link}
               className={this.props.class} >
                <div className="navbar-item">
                    <img src={this.props.icon} className="icon"/>
                    <span className="text">{this.props.text}</span>
                </div>
            </a>
        </li>
    );
  }
});

var DropdownMenuItem = React.createClass({
  render: function() {
    var convertedNodes=[];

    this.props.items.forEach(function(item){
        convertedNodes.push(createSingleMenuItem(item));
    });

    return (
        <li className='dropdown' >
            <a href='#' className="dropdown-toggle"
                data-toggle="dropdown" data-replace-tmp-key="6be2458a7786d2dfdb6b72d7583e8104">
                <div className="navbar-item">
                    <img src={this.props.icon} className={this.props.icon!=null ? "icon" : "hidden" }/>
                    <span className="text">{this.props.text}</span>
                    <span className="caret"></span>
                </div>
            </a>
            <ul className="dropdown-menu" role="menu">{convertedNodes}</ul>
        </li>
    );
  }
});

function createSingleMenuItem(item, additionalClases = null){
    if ('items' in item){
        // is dropdown
        return (<DropdownMenuItem
                isactive={item.active}
                icon={item.icon}
                text={item.text}
                link={item.link}
                items={item.items}/>);
    }
    else{
        // ordinal item

        var classes = {
            'active': item.active,
            'action': item.action != null
        };

        if(item.action != null){
            classes[item.action]=true;
        }

        $.extend(classes, additionalClases);

        return (<MenuItem
                action={'action' in item ? item.action : null}
                classes={classes}
                icon={item.icon}
                text={item.text}
                link={item.link}/>);
    }
}


var Menu = React.createClass({
    render: function(){
        var convertedNodes=[];

        this.props.items.forEach(function(item){
            convertedNodes.push(createSingleMenuItem(item));
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
    getInitialState: function() {
        return {data: []};
    },

    componentDidMount: function() {
        this.loadCommentsFromServer();
        setInterval(this.loadCommentsFromServer, this.props.pollInterval);
    },

    loadCommentsFromServer: function(){
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
        var serverActive=! this.state.pause;

        var filteredActionsList=actionsList.filter(function(item){
            if(serverActive){
                return item.action!='play';
            }
            else{
                return item.action!='stop';
            }
        });

        var serverStatusItems = filteredActionsList.map(function(item){
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