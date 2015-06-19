#!/usr/bin/env node

var repl = require("repl");

var WhackoDB = require('./whacko');

var _ = require('underscore');

var dbs = [];
var dbRefs = {};

var help = function() {
	var help = "\nNoBrainDB\n=========\nconnect => Connect to a DB\n";

	console.log(help);
};

var showDbs = function() {
	console.log(WhackoDB.getDBs().map(function(db) { return db.toString(); }));
};

//A "local" node repl with a custom prompt
var local = repl.start({
	prompt: "whacko> ",
	ignoreUndefined: true
});

_.extend(local.context, WhackoDB);

local.context.help = help;
local.context.showDbs = showDbs;

module.exports = local.context;