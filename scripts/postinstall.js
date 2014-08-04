#!/usr/bin/env node

var fs = require('fs');
var path = require('path');

var localFile   = path.normalize(__dirname + '/../config/autosession.js');
var projectFile = path.normalize(process.cwd() + '/../../config/plugins/ah-autosession-plugin.js');

if(!fs.existsSync(process.cwd() + '/../../config/plugins')) {
  fs.mkdirSync(process.cwd() + '/../../config/plugins');
}
if(!fs.existsSync(projectFile)){
  console.log("copying " + localFile + " to " + projectFile);
  fs.createReadStream(localFile).pipe(fs.createWriteStream(projectFile));
}