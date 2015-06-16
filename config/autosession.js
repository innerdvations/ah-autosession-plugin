exports.default = {
  autosession: function(api){
    return {
      name: 'autosession', // middleware name
      priority: 20, // middleware priority
      global: true, // middleware global value. if false, must manually specify on each page
      default_require: false, // true=prevent action if session missing, false=not required (but loaded if exists)
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
      token_param: "t", // name of the token parameter added to all actions that use autosession
      error: {
        required: "A session token is required to perform this action",
        invalid: "Your session token is invalid",
      },
    };
  }
};