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