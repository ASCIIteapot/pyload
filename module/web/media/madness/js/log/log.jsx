/** @jsx React.DOM */
/**
 * Created by Developer on 25.07.14.
 */

var cs=React.addons.classSet;
var logRegexObject = new RegExp('(\\S+) (\\S+) (\\S+) (.+)\\s*$');
var PyLoadLog = React.createClass({
    getInitialState: function() {
        return {
            logentres: [],
            offset: 0
        };
    },
    loadLogsFromServer: function(){
        var this_pointer = this;
        DoAjaxJsonRequest({
          url: '/api/getLog',
          data: {kwargs: {offset: this.state.offset}},
          success: function(data) {
              var items = _.map(data, function(item, index){
                  var parsed = logRegexObject.exec(item);
                  return {
                      number : index + this_pointer.state.offset,
                      logitem: {
                          date: parsed[1],
                          time: parsed[2],
                          level: parsed[3],
                          message: parsed[4]
                      }
                  };
              });
              var newEntries = _.union(this_pointer.state.logentres, items);
              this.setState({
                logentres: newEntries,
                offset: this.state.offset + _.size(data)
            });
          }.bind(this),
          error: function(xhr, status, err) {
            console.error(this.props.url, status, err.toString());
          }.bind(this)
        });
    },
    componentDidMount: function() {
        this.loadLogsFromServer();
        setInterval(this.loadLogsFromServer, 3000);
    },
    render:function(){
        var get_item = function(logentity){
            var level_classes = {
                'warning': logentity.logitem.level == 'WARNING',
                'danger': logentity.logitem.level == 'ERROR',
                'info': logentity.logitem.level == 'INFO',
            };
            return <tr key={logentity.number} className={cs(level_classes)}>
                        <td>{logentity.logitem.date}</td>
                        <td>{logentity.logitem.time}</td>
                        <td>{logentity.logitem.level}</td>
                        <td>{logentity.logitem.message}</td>
                   </tr>;
        };
        return <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>Дата</th>
                            <th>Время</th>
                            <th>Уровень</th>
                            <th>Сообщение</th>
                        </tr>
                    </thead>
                    <tbody>
                        {_.map(this.state.logentres, get_item)}
                    </tbody>
               </table>;
    }
});