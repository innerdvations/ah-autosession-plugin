# ah-autosession-plugin

Create sessions and load them automatically in connection before actions are called.

## installation and configuration ##
To install, just run `npm install ah-autosession-plugin`

A configuration file should then exist at config/plugins/ah-autosession-plugin.js which list and explains all the plugin options.

## usage ##
The global default can be set in the configuration file, but the default can be overridden on a per-action basis by adding the parameter `autosession` to the action with a value of true [attempt to load a session if a session token is sent], 'required' [require an existing session in order to run an action], or false [don't autoload anything]

### create a session ###
Using your own authentication system, after a user is authenticated call `api.autosession.createSession`:

    // ttl, ip, and app are optional by default
    api.autosession.create(user_id, {ttl:session_lifespan, ip:ip_address, app:app_id}, function(err, tokendata) {
      // tokendata.token can now be sent back to the user
    });
    
### access session data ###
Session data is added to the connection object for each action.  You can access it like so:

    var user_id = connection.session.id;
    var some_data = connection.session.some_data;

If you would like to change 'session' to something else, it can be changed in the config file.
    
### end a session ###
    api.autosession.kill(token, function(err, result) {
      // result = {kill:1} on success or {kill:0} on failure
    });
    
### end all sessions ###
    api.autosession.killAll(user_id, function(err, result) {
      // result = {kill:number of sessions ended} on success or {kill:0} on failure
    });

### access the redis-sessions object directly ###
If you need direct access to the redis-sessions object, it is available at `api.autosession.rs`

See https://www.npmjs.org/package/redis-sessions for more info.

## TODO

* write some tests