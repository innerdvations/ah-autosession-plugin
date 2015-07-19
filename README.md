# ah-autosession-plugin

Create sessions and load them automatically in connection before actions are called.

## Compatibility ##
For Actionhero 8 and 9, use version 1.*
For Actionhero 11, use version 11.*

If upgrading from v1 to v11 or higher, please note that code will need to be updated to reflect usage and config file changes.


## installation and configuration ##
To install, run `npm install ah-autosession-plugin`

A configuration file should then exist at config/plugins/ah-autosession-plugin.js which lists and explains all the plugin options.
    
exports.default = {
  "ah-autosession-plugin": function(api){
    return {
      name: 'ah-autosession-plugin', // middleware name
      priority: 20, // middleware priority
      global: true, // middleware global value. if false, must manually specify on each page
      default_behaviour: "required", // 'required'=prevent action if session missing, 'load'=load if exists but don't require it, 'off'=don't attempt to load session
      global_override_key: "autosession", // if an action doesn't require it, like login or public page, set action.autosession = false
      connection_param: "session", // where will the session data be available in data object? data.session
      app_id: "sess", // app id used by redis_sessions
      valid: { // custom regex validators used by redis_sessions
        app: /^([a-zA-Z0-9_-]){1,20}$/, // make sure it allows app_id set above
        id: /^([a-zA-Z0-9_-]){1,128}$/, // this should validate your user ids
        token: /^([a-zA-Z0-9]){64}$/, // validates token (don't change unless you know what you're doing)
        ip: /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$|^unknown$|^testServer$/, // allows ip address, "unknown", or "testServer"
        //ip: /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, // use this if you want to throw error on invalid/missing ip
      },
      prefix: 'ah:sess:', // redis prefix
      ttl:1000 * 60 * 60 * 24 * 14, // session time to live; 1000 * 60 * 60 * 24 * 14 = two weeks
      token_param: "t", // this is the name of the token parameter added to all actions that use autosession
      error: {
        required: {code:"token_required"},
        invalid: {code:"token_not_found"},
      },
    };
  }
};

## Usage ##

As soon as the plugin is installed, all actions will start attempting to load session data if a token is sent. 

The global default option can be overridden on a per-action basis by adding the parameter `autosession` to the action with a value of 'load' [attempt to load a session if a session token is sent], 'required' [require an existing session in order to run an action], or 'off' [don't autoload anything].

Example 1: For a system that tries to store session information for each user but doesn't necessarily require it,  set the global default_behaviour to 'load', and the plugin will then attempt to load session data on every action, but not require it to exist to run the action.

Example 2: For a closed system that requires authentication, set the config default_behaviour value to 'required' and then create an authentication action with `autosession: 'off'` or `autosession: false`.  Unauthorized users will then be able to call that action and only that action.

Example 3: For a system that is mostly open but requires authentication on a few actions, you would set the config default_behaviour to 'off' and then add `autosession: 'required'` to any actions that need it.

### create a session ###
Using your own authentication system, after a user is authenticated call `api.autosession.createSession`:

    // ttl, ip, and app are optional by default
    api.autosession.create(user_id, {ttl:session_lifespan, ip:ip_address, app:app_id}, function(err, tokendata) {
      // tokendata.token can now be sent back to the user
    });
    
### set/update/delete session data ###
The data object contains a simple key/value list where values can be string, number, boolean or null.

To remove keys set them to null. 

Keys that are not supplied will not be touched.

    api.autosession.set(token, data, function(err, result) {
      // result = all the session data
    });
    
### access session data ###
Session data is added to the connection object for each action.  You can access it like so:

    var user_id = connection.session.id;
    var some_data = connection.session.d.some_data; // note that any data stored with .set() is stored in session.d

If you would like to change 'session' to something else, it can be changed in the config file.

### end a session ###
    api.autosession.kill(token, function(err, result) {
      // result = {kill:1} on success or {kill:0} on failure
    });
    
### end all sessions ###
    api.autosession.killAll(user_id, function(err, result) {
      // result = {kill:number of sessions ended} on success or {kill:0} on failure
    });

### redis-sessions ###
The plugin is basically a wrapper to make redis-sessions less of a hassle, with some added actionhero-specific functionality.  Please read the [redis-sessions page](https://www.npmjs.org/package/redis-sessions) to find out more about how the sessions are being stored. 

If you need direct access to the redis-sessions object, it is available at `api.autosession.rs`