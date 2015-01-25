/** @jsx React.DOM */
/**
 * Created by Developer on 25.07.14.
 */

var cs=React.addons.classSet;


function convert_property(name, value, on_input_callback){
    var input_value;
    var input_type = <span className='label label-default'>{value.type}</span>;

    var on_input = function(event){
            on_input_callback(event.target.value);
    };

    var string_types = [
        'str',
        'string',
        'folder',
        'ip',
        'int',
        'time',
        'file'
    ];

    if(name == 'activated'){
        return null;
    }
    else if(! _.isObject(value)){
        return null;
    }
    else if(_.contains(string_types, value.type)){
        input_value = <input className="form-control" id={name}
                             onChange={on_input} value={value.value}></input>;
    }
    else if(value.type == 'password'){
        input_value = <input type='password' className="form-control" id={name}
                        onChange={on_input} value={value.value}></input>;
    }
    else if(value.type == 'bool'){
        on_input = function(event){
                on_input_callback(event.target.checked);
        };
        return <div className="checkbox">
                    <label>
                      <input type="checkbox" onChange={on_input} checked={value.value}></input>
                            {value.desc}
                    </label>
                  </div>;
    }
    else if(_.has(value, 'list')){
        on_input = function(event){
                on_input_callback(event.target.selected);
        };

        var items = _.map(value.list, function(item){
            return <option>{item}</option>;
        });
        input_type = null;
        input_value = <select className="form-control" onChange={on_input} selected={value.value}>
                            {items}
                        </select>;
    }
    else{
        // error
        input_value = <div className="alert alert-danger" role="alert">
                  <span className="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>
                  <span className="sr-only">Error:</span>
                  Неизвестный тип: {value.type}
                </div>
    }

    return <div className="form-group">
            <label for={name}>{value.desc} {input_type}</label>
            {input_value}
          </div>;

}

var PyLoadConfig = React.createClass({
    getInitialState: function() {
        return {
            general: [],
            plugin: [],
            curently_edited: null
        };
      },
      componentDidMount: function() {
            DoAjaxJsonRequest({
              url: '/json/load_config_list',
              dataType: 'json',
              success: function(data) {
                this.setState(data);
              }.bind(this),
              error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());
              }.bind(this)
            });
      },
      start_edit_item: function(category, section){
          console.log('start_edit_item', category, section);
          var description = 'Запрос данных для '+category + '/' + section;
          var url = '/json/load_config/'+category+ '/' +section;
          DoAjaxJsonRequest({
              url: url,
              method: 'GET'
          }, description)
              .done(function( data, textStatus, jqXHR ){
                  _.extend(data, {
                      section: section,
                      category: category
                  });
                  var filter_func = function(item){return _.has(item[1], 'type')};
                  var options = {};
                  _.chain(data).pairs().filter(filter_func).each(function(pair){options[pair[0]]=pair[1]});
                  var fdata = {};
                  _.chain(data).pairs().reject(filter_func).each(function(pair){fdata[pair[0]]=pair[1]});
                  fdata.options = options;
                  console.log('conv', fdata);
                  this.setState({curently_edited: fdata})
              }.bind(this));
      },
      get_curently_edited_vdom: function(){
          var ced = this.state.curently_edited;
          var get_title_vdom = function(){
              var title = ced.section;
              if('desc' in ced){
                  title = ced.desc;
              }

              if('outline' in ced){
                  var outline = <span className='outline'>{ced.outline}</span>;
              }

              var title_vdom = <span>
                                    <span className='title'>{title}</span>
                                    {outline}
                                </span>;

              if('activated' in ced){
                  return <h3 className="panel-title">
                            <input type="checkbox" checked={ced.activated.value}></input>
                            {title_vdom}
                         </h3>;
              }
              else{
                  return <h3 className="panel-title">{title_vdom}</h3>;
              }
          };
          if(ced!=null){
              var input_items = _.chain(ced.options)
                  .pairs()
                  .map(function(pair){
                      var name = pair[0];
                      var on_input = function(new_value){
                          // console.log('changed', name, new_value);
                          this.state.curently_edited.options[name].value = new_value;
                          this.state.curently_edited.props_changed = true;
                          this.setState(this.state);
                      }.bind(this);

                      return convert_property(name, pair[1], on_input);
                  }.bind(this))
                  .filter(function(item){return item != null;})
                  .value();

              var on_form_input = function(){
                  console.log('on_form_input')
              };

              var concel_edit = function(){
                  this.setState({curently_edited: null});
              }.bind(this);

              var commit_edit = function(){
                  var commit_data = {};
                  _.each(ced.options, function(value, key){
                      console.log(key, value);
                      commit_data[key] = value.value;
                  });
                  console.log('commit_data', commit_data);

                  var description = 'Запрос сохранения данных для '+ced.category + '/' + ced.section;
                  var url = '/json/save_config/'+ced.category+ '/' +ced.section;
                  DoAjaxJsonRequest({
                      url: url,
                      method: 'POST',
                      data: commit_data
                  }, description)
                      .done(function( data, textStatus, jqXHR ){
                          var newState = _.clone(ced);
                          newState.operation_status = 'success';
                          this.setState({curently_edited: newState})
                      }.bind(this))
                      .fail(function( jqXHR, status, err ) {
                          var newState = _.clone(ced);
                          newState.operation_status = 'error';
                          this.setState({curently_edited: newState})
                      }.bind(this));
              }.bind(this);

              var button_group = <div className="horisontal-spaced-container">
                                    <button type="button" className="btn btn-primary" onClick={commit_edit}>
                                        Сохранить
                                    </button>
                                    <button type="button" className="btn btn-default" onClick={concel_edit}>
                                        Отменить
                                    </button>
                                </div>;
              console.log('ced', ced);

              var is_desibled = ! this.state[ced.category][ced.section].activated;
              var panel_classes = {
                  edit_form: true,
                  panel: true,
                  'panel-default': is_desibled,
                  'panel-primary': !is_desibled && (ced.operation_status != 'success' && ced.operation_status != 'error'),
                  'panel-success': ced.operation_status == 'success',
                  'panel-danger': ced.operation_status == 'error'
              };

              return <form className={cs(panel_classes)}>
                        <div className="panel-heading">
                            {get_title_vdom()}
                        </div>
                        <div className='panel-body scrolled' onInput={on_form_input}>
                            <fieldset disabled={is_desibled}>
                                {input_items}
                                {this.state.curently_edited.props_changed ? button_group: null}
                            </fieldset>
                        </div>
                     </form>;
          }
          else{
              return <div className='edit_form'></div>
          }
      },
    render: function(){
          var conf_pointer = this;
          var list_con_func = function(group, items){
              return _.chain(items)
                  .pairs()
                  .sortBy(function(pair){return pair[0];})
                        .map(function(pair){
                            var key = pair[0];
                            var value = pair[1];
                            var projected_items = [];
                            if(value.activated != 'undefined'){
                                var on_activated_changed = function(event){
                                    var new_value = event.target.checked;
                                    console.log('on_activated_changed', new_value);

                                    var description = (new_value ? 'А': 'Деа') + 'ктивация для '+group + '/' + key;
                                    var url = '/json/save_config/'+group+ '/' +key;
                                    DoAjaxJsonRequest({
                                      url: url,
                                      method: 'POST',
                                      data: {activated: new_value}
                                    }, description)
                                      .done(function( data, textStatus, jqXHR ){
                                          var ssState= {};
                                          ssState[group] = _.clone(conf_pointer.state[group]);
                                          ssState[group][key] = {};
                                          ssState[group][key].activated = new_value;
                                            conf_pointer.setState(ssState);
                                      }.bind(this));
                                };

                                projected_items.push(
                                    <div className="checkbox">
                                        <label>
                                          <input type="checkbox" onChange={on_activated_changed} checked={value.activated}> {key}</input>
                                        </label>
                                    </div>);
                            }
                            else{
                                projected_items.push(key);
                            }

                          var onItemClick = function(event){
                              this.start_edit_item(group, key);
                          }.bind(conf_pointer);
                                var ced = conf_pointer.state.curently_edited;
                                var a_classes = {
                                    'list-group-item': true,
                                    'active': _.isObject(ced) && _.matches({category: group, section: key})(ced)
                                };
                                return (<a key={group + '_' + key} onClick={onItemClick}
                                        href='#'
                                        className={cs(a_classes)}>{projected_items}</a>);
                        })
                    .value();
          };
          var create_group = function(name, className, items){
              return <div className={className}>
                    <h1>{name}</h1>
                    <div className='list-group'>
                        { list_con_func(className, items) }
                    </div>
                </div>
          };
          var plugins_list = (<div className='scrolled config-list'>
                        {create_group('General', 'general', this.state.general)}
                        {create_group('Plugins', 'plugin', this.state.plugin)}
                   </div>);
          var edit_form = this.get_curently_edited_vdom();
          return <div>
                     {plugins_list}
                     {edit_form}
                 </div>;
        }
});