/** @jsx React.DOM */
/**
 * Created by Developer on 21.07.14.
 */

var MenuItem = React.createClass({
  render: function() {
    var cx = React.addons.classSet;
    var classes = cx(this.props.classes);
    return (
        <li className={classes} >
            <a href={this.props.link}
                action={this.props.action}
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