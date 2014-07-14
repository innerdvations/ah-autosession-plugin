exports.default = {
  autosession: function(api){
    return {
      enabled: true,
      default: true, // true=load but don't require, false=don't autoload (disable plugin), 'required'=session token required to run action
      connection_param: "session", // where will the session data be available in connection object? connection.session
      app_id: "sess", // app id used by redis_sessions
      valid: { // custom regex validators used by redis_sessions
        app: /^([a-zA-Z0-9_-]){1,20}$/, // just make sure it allows app_id set above
        id: /^([a-zA-Z0-9_-]){1,128}$/, // this should match your user ids
        token: /^([a-zA-Z0-9]){64}$/, // don't change this unless you know what you're doing
        ip: /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$|^unknown$|^testServer$/, // allows ip address, "unknown", or "testServer"
        //ip: /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, // use this if you want to throw error on invalid/missing ip
      },
      prefix: 'ah:sess:', // redis prefix
      ttl:1000 * 60 * 60 * 24 * 14, // session time to live; 1000 * 60 * 60 * 24 * 14 = two weeks
      token_param: "t", // this is the name of the token parameter added to all actions that use autosession
      error: {
        required: "A session token is required to perform this action",
        invalid: "Your session token is invalid",
      },
      priority: 3, // action preProcessor priority
    };
  }
};