#!/usr/bin/env node
var WhackoDB = require('./db');

var dbs = [];
var dbRefs = {};

var connect = function(options, callback) {
	db = WhackoDB(options, callback);

	dbs.push(db.toString());
	dbRefs[db.toString()] = db;
	
	return db;
};

var db = function(name) {
	return dbRefs[name];
};

var getDBs = function() {
	return dbs;
};

module.exports = {
	connect: connect,
	db: db,
	dbs: dbs
};