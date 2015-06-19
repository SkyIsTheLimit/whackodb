// Whacko DB
var _m = factory = function(options, callback) {
	return WhackoDB(options, callback);
};

module.exports = _m;

var _ = require('underscore');
var fs = require('fs');
var path = require('path');

var DBTypes = {
	"mem": {
		type: "mem",
		retrieve: function() {

		},
		persist: function() {
			// Does nothing as of now.
		}
	},
	"file": {
		type: "file",
		retrieve: function(options, storage, callback) {
			fs.exists(path.join(__dirname, "../", "data", options.dbName + '.json'), function(exists) {
				if(exists === true) {
					fs.readFile(path.join(__dirname, "../", "data", options.dbName + '.json'), "utf-8", 	function(err, data) {
						if(err) {
							console.error("Something bad happened :(", err);
						} else {
							// Success
							_.extend(storage, JSON.parse(data));
						}

						if(typeof callback !== 'undefined' && callback.constructor === Function)
							callback();
					});
				}
			});
		},
		persist: function(options, storage, callback) {
			// Does nothing for now.
			fs.writeFile(path.join(__dirname, "../", "data", options.dbName + '.json'), JSON.stringify(storage), function(err) {
				if(err) {
					console.error("Something bad happened :(", err);
				} else {
					// Success
				}

				if(typeof callback !== 'undefined' && callback.constructor === Function)
					callback();
			});
		}
	}
};

var WhackoDB = function(options, callback) {
	// The main storage of data.
	var storage = {};

	// Method to initialize with default options.
	var initDefaults = function(options) {
		// The default options.
		var defaults = {
			url: "mem:default",
			override: false,
			autocreate: false
		};

		_.defaults(options, defaults);
	};

	// Initialize the options object if not already done.
	options = options || {};

	// Push in some defaults.
	initDefaults(options);

	// The type of DB. File or Mem for now.
	var _type = options.url.split(":")[0];

	// The DB Name.
	var _dbName = options.url.split(":")[1];
	options.dbName = _dbName;

	var persist = function() {
		if(typeof DBTypes[_type] === 'undefined') {
			throw new Error("Could not find a processor for a DB of type " + _type);
		} else {
			if(typeof DBTypes[_type]["persist"] === 'undefined') {
				throw new Error("Could not find persistance layer for a DB of type " + _type);
			}

			// Finally, all good here. Let's persist.
			DBTypes[_type]["persist"].call(null, options, storage);
		}
	};

	var retrieve = function(callback) {
		if(typeof DBTypes[_type] === 'undefined') {
			throw new Error("Could not find a processor for a DB of type " + _type);
		} else {
			if(typeof DBTypes[_type]["retrieve"] === 'undefined') {
				throw new Error("Could not find retrieval layer for a DB of type " + _type);
			}

			// Finally, all good here. Let's persist.
			DBTypes[_type]["retrieve"].call(null, options, storage, callback);
		}
	};

	retrieve(callback);

	var autocreate = function(model) {
		// Check if model does not exists already.
		if(typeof storage[model] === 'undefined') {
			// Create the model automatically if required.
			if(options.autocreate === true) {
				createModel(model);
			} else {
				throw new Error("Model not found [ " + model + " ]");
			}
		}
	};

	var createModel = function(name) {
		// Check if model exists and not allowed to override that model.
		if(typeof storage[name] !== 'undefined' && !options.override) {
			throw new Error("A model with the name " + name + " already exists. Set the override flag to true in the DB options to overwrite this.");
		}

		storage[name] = {
			name: name,
			data: []
		};

		// Let's try to persist.
		persist();
	};

	var updateModel = function(name, options) {
		throw new Error("Not yet implemented method 'updateModel'");
	};

	var deleteModel = function(name) {
		// Blind belief.
		storage[name] = undefined;

		// Let's try to persist.
		persist();
	};

	var insert = function(model, object) {
		// Autocreate
		autocreate(model);

		// Initialize the storage if not already done.
		storage[model]["data"] = storage[model]["data"] || [];

		// Insert the data.
		storage[model]["data"].push(object);

		// Let's try to persist.
		persist();
	};

	var query = function(model, query) {
		// Autocreate
		autocreate(model);

		// Let's store the results in an array.
		var results = [];

		// If a query function is passed, use it.
		if(typeof query !== 'undefined') {
			for(var i = 0; i < storage[model]["data"].length; i++) {
				var item = storage[model]["data"][i];

				if(query.call(null, item) === true) {
					results.push(item);
				}
			}
		} else {
			// If no query function passed, just return all the data.
			results = storage[model]["data"];
		}

		// Finally, return the results.
		return results;
	};

	var update = function(model, _query, values) {
		// Autocreate
		autocreate(model);

		// Query the model for the required items.
		var results = query(model, _query);

		// Iterate over the results and update them.
		for(var i = 0; i < results.length; i++) {
			_.extend(results[i], values);
		}

		// Let's try to persist.
		persist();

		// Finally, return the results.
		return results;
	};

	var remove = function(model, query) {
		// Autocreate
		autocreate(model);

		// Let's store the results in an array.
		var results = [];

		// Will have to do it manually.
		for(var i = 0; i < storage[model]["data"].length; i++) {
			if(query.call(null, storage[model]["data"][i]) === true) {
				// First push in our results.
				results.push(storage[model]["data"][i]);

				// Remove the matching item.
				storage[model]["data"].splice(i, 1);
			}
		}

		// Let's try to persist.
		persist();

		// Finally, return the results.
		return results;
	};

	var models = function() {
		return Object.keys(storage);
	};

	var toString = function() {
		return _dbName;
	};

	return {
		createModel: createModel,
		updateModel: updateModel,
		deleteModel: deleteModel,
		query: query,
		select: query,
		insert: insert,
		update: update,
		remove: remove,
		models: models,
		toString: toString,
		storage: storage
	};
};
