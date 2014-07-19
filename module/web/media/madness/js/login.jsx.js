/** @jsx React.DOM */
/**
 * Created by Developer on 19.07.14.
 */

var LoginForm = React.createClass({
    render: function () {
        return (
            <form className="form-signin" role="form">
                <input type="hidden" name="do" value="login" />
                <div className="pyload-logo">
                    <img src="media/madness/img/pyloadlogo-01.svg" className="logo-img"/>
                    <span className="pyload-text">pyLoad</span>
                </div>
                <h2 className="form-signin-heading">Please sign in</h2>
                <input className="form-control" placeholder={this.props.unameph}
                name="username"
                required="true" autofocus="" type="text"/>
                <input className="form-control" placeholder={this.props.upassph}
                name="password"
                required="" type="password"/>
                <button className="btn btn-lg btn-primary btn-block" type="submit">Sign in</button>
            </form>
            );
    }
});