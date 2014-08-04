var autosession = function(api, next){
  if(!api.config.autosession) return next();
  
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
    return (actionTemplate.inputs.required.indexOf(api.config.autosession.token_param) !== -1);
  };
  
  // check if actionTemplate allows our session parameter
  api.autosession._optional = function(actionTemplate) {
    return (actionTemplate.inputs.optional.indexOf(api.config.autosession.token_param) !== -1);
  };
  
  ////// Run setup code
  
  // set up rs object with RedisSessions
  api.autosession.rs = new RedisSessions({namespace:api.config.autosession.prefix});
  api.autosession.rs._VALID = api.config.autosession.valid; // replace validator regex array

  // add token parameter as optional/required as necessary to each action
  function input_exists(a) {
    return (
      a.inputs.optional.indexOf(api.config.autosession.token_param) !== -1 ||
      a.inputs.required.indexOf(api.config.autosession.token_param) !== -1
    );
  }
  for(i in api.actions.actions) {
    for(j in api.actions.actions[i]) {
      a = api.actions.actions[i][j];
      // if this action doesn't have an explicit action set, use the default
      if(a.autosession === null || a.autosession === undefined) {
        //api.log("setting autosession for action "+a.name+" to default: "+api.config.autosession.default);
        a.autosession = api.config.autosession.default;
      }
      
      // and now check for real:
      
      // don't load session
      if(a.autosession === false) {
        //api.log("setting autosession for action "+a.name+" to false");
         // nothing extra to do
      }
      else if(input_exists(a)) {
        //api.log('Tried adding session token parameter "'+api.config.autosession.token_param+'" to action "'+a.name+'" but it already exists','warning');
      }
      // load if available, but not required
      else if(a.autosession === true) {
        //api.log("setting autosession for action "+a.name+" to true");
        a.inputs.optional.push(api.config.autosession.token_param);
      }
      // session data required to continue
      else if(a.autosession === "required" ) {
        //api.log("setting autosession for action "+a.name+" to required");
        a.inputs.required.push(api.config.autosession.token_param);
      }
    }
  }
  
  // then rebuild the post variables or so our required params actually get passed in
  api.params.buildPostVariables();
  
  // add the preprocessor middleware
  api.autosession._on_action = function(connection, actionTemplate, cb) {
    var token,
        required = api.autosession._required(actionTemplate),
        optional = api.autosession._optional(actionTemplate);
    
    // if it's required or (optional and token was sent)
    if(required || (optional && connection.params && connection.params[api.config.autosession.token_param])) {
      token = connection.params[api.config.autosession.token_param];
      if(!token || !token.length) {
        connection.error = api.config.autosession.error.required;
        return cb(connection, false);
      }
      api.autosession.get(token, function(err, res) {
        if(err) connection.error = api.e(err);
        else if(!res || !res.id) connection.error = api.config.autosession.error.invalid;
        else connection[api.config.autosession.connection_param] = res;
        
        return cb(connection, !connection.error);
      });
    }
    else { // if this item doesn't automatically look up a token
      return cb(connection, true);
    }
  };
  
  if(require('semver').lt(require('../../actionhero/package.json').version, '9.0.0')) api.actions.preProcessors.push(api.autosession._on_action);
  else api.actions.addPreProcessor(api.autosession._on_action, (api.config.autosession.priority ? api.config.autosession.priority : 3));
  
  next();
};
exports.autosession = autosession;