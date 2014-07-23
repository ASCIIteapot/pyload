/** @jsx React.DOM */
/**
 * Created by Developer on 23.07.14.
 */

var LinksInputElement=React.createClass({
    render: function(){
        return (<div>
                    <textarea required="true" className="form-control" rows="3"
                              placeholder={this.props.l18n.links}
                              name="add_links" id="add_links"></textarea>
                </div>);
    }
});