#!/usr/bin/env node

var fs = require('fs');
var path = require('path');

var configDir   = path.normalize(__dirname + '/../config');
var localFile   = path.normalize(__dirname + '/../config/autosession.js');
var projectFile = path.normalize(process.cwd() + '/../../config/plugins/ah-autosession-plugin.js');

// create config/plugins directory if it doesn't exist
if(!fs.existsSync(configDir) {
  fs.mkdirSync(process.cwd() + '/../../config/plugins');
}

// copy default config file if it doesn't exist
if(!fs.existsSync(projectFile) && fs.existsSync(localFile)) {
  console.log("copying " + localFile + " to " + projectFile);
  fs.createReadStream(localFile).pipe(fs.createWriteStream(projectFile));
}