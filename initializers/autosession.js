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
    if(!api.config.autosession) return next("missing api.config.autosession");
    
    var a, i, j, redis = api.redis.client, RedisSessions = require("redis-sessions");
    
    api.autosession = {};
    
    ////// Public functions (mostly wrappers for redissessions)
    api.autosession.create = function(user_id, options, cb) {
      if(!options) options = {};
      if(!options.ip) options.ip = "unknown";
      if(!options.ttl) options.ttl = api.config.autosession.ttl;
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
      return {app:api.config.autosession.app_id, token:token};
    };
    api.autosession.idkey = function(id, ip, ttl) {
      return {app:api.config.autosession.app_id,
              id:id,
              ip:(ip ? ip : ""),
              ttl:(ttl ? ttl : api.config.autosession.ttl),
      };
    };
    
    // check if actionTemplate requires our session parameter
    api.autosession._required = function(actionTemplate) {
      if(actionTemplate[api.config.autosession.global_override_key]) return actionTemplate[api.config.autosession.global_override_key];
      
      if(actionTemplate.inputs[api.config.autosession.token_param]) {
        if(actionTemplate.inputs[api.config.autosession.token_param].required === true) return true;
        return false;
      }
      
      
      return api.config.autosession.default_require;
    };
    
    ////// Run setup code
    
    // set up rs object with RedisSessions
    api.autosession.rs = new RedisSessions({namespace:api.config.autosession.prefix});
    api.autosession.rs._VALID = api.config.autosession.valid; // replace validator regex array

    // add token parameter as optional/required as necessary to each action
    function input_exists(a) {
      return !!a.inputs[api.config.autosession.token_param];
    }
    for(i in api.actions.actions) { // i = action name (ie, "status")
      for(j in api.actions.actions[i]) { // j = 
        a = api.actions.actions[i][j];
        // if this action doesn't have an explicit action set, use the default
        if(a.autosession === null || a.autosession === undefined) {
          //api.log("setting autosession for action "+a.name+" to default: "+api.config.autosession.default);
          a.autosession = api.config.autosession.default_require;
        }
        
        // and now check for real:
        if(input_exists(a)) {
          // don't do anything
          //api.log('Tried adding session token parameter "'+api.config.autosession.token_param+'" to action "'+a.name+'" but it already exists','warning');
        }
        // load if available, but not required
        else if(a.autosession === false) {
          //api.log("setting autosession for action "+a.name+" to true");
          a.inputs[api.config.autosession.token_param] = {required:false};
        }
        // session data required to continue
        else if(a.autosession === true ) {
          //api.log("setting autosession for action "+a.name+" to required");
          a.inputs[api.config.autosession.token_param] = {required:true};
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
      token = data.params[api.config.autosession.token_param];
      if(!token) {
        if(required) return mid_next(api.config.autosession.error.required);
        return mid_next();
      }
    
      api.autosession.get(token, function(err, res) {
        if(err) return mid_next(err);
        if(!res || !res.id) return mid_next(api.config.autosession.error.invalid);
        data[api.config.autosession.connection_param] = res;
        return mid_next();
      });
    };
    var middleware = {
      name: api.config.autosession.name,
      global: api.config.autosession.global,
      priority: api.config.autosession.priority,
      preProcessor: api.autosession._on_action,
    }
    api.actions.addMiddleware(middleware);
    
    next();
  },
}