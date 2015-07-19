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