module.exports = {
  loadPriority:  50,
  startPriority: 50,
  stopPriority:  50,
  initialize: function(api, next) {
    next();
  },
  stop: function(api, next) {
    next();
  },
  start: function(api, next){
    if(!api.config["ah-autosession-plugin"]) return next("missing ah-autosession-plugin config");
    
    var a, i, j, redis = api.redis.client, RedisSessions = require("redis-sessions");
    
    api.autosession = {};
    
    ////// Public functions (mostly wrappers for redissessions)
    api.autosession.create = function(user_id, options, cb) {
      if(!options) options = {};
      if(!options.ip) options.ip = "unknown";
      if(!options.ttl) options.ttl = api.config["ah-autosession-plugin"].ttl;
      api.autosession.rs.create(api.autosession.idkey(user_id, options.ip, options.ttl), cb);
    };
    api.autosession.kill = function(token, cb) {
      api.autosession.rs.kill(api.autosession.tkey(token), cb);
    };
    api.autosession.killAll = function(user_id, cb) {
      api.autosession.rs.killsoid(api.autosession.idkey(user_id), cb);
    };
    api.autosession.set = function(token, data, cb) {
      var s = api.autosession.tkey(token);
      s.d = data;
      api.autosession.rs.set(s, cb);
    };
    api.autosession.get = function(token, cb) {
      api.autosession.rs.get(api.autosession.tkey(token), cb);
    };
    
    ////// Private functions (ok, actually undocumented, since most are intentionally left publicly accessible)
    
    // helper functions to build rs objects
    api.autosession.tkey = function(token) {
      return {app:api.config["ah-autosession-plugin"].app_id, token:token};
    };
    api.autosession.idkey = function(id, ip, ttl) {
      return {app:api.config["ah-autosession-plugin"].app_id,
              id:id,
              ip:(ip ? ip : ""),
              ttl:(ttl ? ttl : api.config["ah-autosession-plugin"].ttl),
      };
    };
    
    // check if actionTemplate requires our session parameter to load action
    api.autosession._required = function(actionTemplate) {
      var key = api.config["ah-autosession-plugin"].global_override_key;

      // this should theoretically always be the logic used, since it's added to each action on startup
      if(actionTemplate[key] !== null && actionTemplate[key] !== undefined) {
        return actionTemplate[key] === "required";
      }
      
      // if it's somehow missing, we can catch it by checking default behaviour
      if(api.config["ah-autosession-plugin"].default_behaviour == "required") {
        return true;
      }
      
      return false;
    };
    
    ////// Run setup code
    
    // set up rs object with RedisSessions
    api.autosession.rs = new RedisSessions({namespace:api.config["ah-autosession-plugin"].prefix});
    api.autosession.rs._VALID = api.config["ah-autosession-plugin"].valid; // replace validator regex array

    // add token parameter as optional/required as necessary to each action
    function input_exists(a) {
      return a.inputs[api.config["ah-autosession-plugin"].token_param] !== null;
    }
    for(i in api.actions.actions) { // i = action name (ie, "status")
      // j = index of each version(?) of the action
      for(j in api.actions.actions[i]) {
        a = api.actions.actions[i][j];
        // if this action doesn't have an explicit action set, use the default
        if(a.autosession === null || a.autosession === undefined) {
          a.autosession = api.config["ah-autosession-plugin"].default_behaviour;
        }
        
        // and now create the actual parameter
        // load if available, but not required
        if(a.autosession === "required") {
          a.inputs[api.config["ah-autosession-plugin"].token_param] = {required:true};
        }
        // session data required to continue
        else if(a.autosession === "load" ) {
          a.inputs[api.config["ah-autosession-plugin"].token_param] = {required:false};
        }
        // don't load session data
        else if(a.autosession === "off" ) {
          delete a.inputs[api.config["ah-autosession-plugin"].token_param];
        }
      }
    }
    
    // then rebuild the post variables or so our required params actually get passed in
    api.params.buildPostVariables();
    
    // add the preprocessor middleware
    api.autosession._on_action = function(data, mid_next) {
      var token,
          actionTemplate = data.actionTemplate,
          required = api.autosession._required(actionTemplate);
      
      // if it's required or (optional and token was sent)
      token = data.params[api.config["ah-autosession-plugin"].token_param];
      if(!token) {
        if(required) return mid_next(api.config["ah-autosession-plugin"].error.required);
        return mid_next();
      }
    
      api.autosession.get(token, function(err, res) {
        if(err) return mid_next(err);
        if(!res || !res.id) return mid_next(api.config["ah-autosession-plugin"].error.invalid);
        data[api.config["ah-autosession-plugin"].connection_param] = res;
        return mid_next();
      });
    };
    var middleware = {
      name: api.config["ah-autosession-plugin"].name,
      global: api.config["ah-autosession-plugin"].global,
      priority: api.config["ah-autosession-plugin"].priority,
      preProcessor: api.autosession._on_action,
    };
    api.actions.addMiddleware(middleware);
    
    next();
  },
}