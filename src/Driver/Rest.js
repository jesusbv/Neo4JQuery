"use strict";

var ring = require('ring')
  , http = require('http')
  , _ = require('underscore')
  , Driver = require('./Driver');

var RestDriver = function() {
  this._requestParameter = {
    'hostname': null,
    'port': null,
    'protocol': null,
    'auth': null,
    'path': 'transaction/commit',
    'method': 'POST',
    'headers': {
      'Accept': 'application/json; charset=UTF-8',
      'Content-Type': 'application/json',
      'Content-Length': 0
    }
  };
  this._graphTypes = [];
};

/**
 *
 * @returns {number|*}
 */
RestDriver.prototype.getType = function() {
  return Driver.DRIVER_TYPE_HTTP;
};


/**
 *
 * @param types
 * @returns {BoltDriver}
 */
RestDriver.prototype.setGraphTypes = function(types) {
  types =  (Array.isArray(types)) ? types : [];

  if (types.length > 0) {
    this._graphTypes = types;
  }

  return this;
};

/**
 *
 * @param parameter
 * @returns {RestDriver}
 */
RestDriver.prototype.connect = function(parameter) {
  var me = this;
  parameter = (!_.isEmpty(parameter)) ? parameter : null;

  if (parameter !== null ) {
    this._requestParameter.hostname = parameter.server;
    this._requestParameter.port = parameter.port;
    this._requestParameter.protocol = parameter.protocol;
    this._requestParameter.path = parameter.endpoint + this._requestParameter.path;
    if (parameter.user !== void 0 && parameter.password !== void 0)
      this._requestParameter.auth = parameter.user + ':' + parameter.password;
    else {
      delete this._requestParameter['auth'];
    }
  }

  return this;
};

/**
 *
 * @returns {RestDriver}
 */
RestDriver.prototype.close = function() {
  this._requestParameter.hostname = null;
  this._requestParameter.port = null;
  this._requestParameter.protocol = null;
  this._requestParameter.path = null;
  this._requestParameter.auth = null;
  this._requestParameter.headers['Content-Length'] = 0;
  return this;
};

/**
 *
 * @param query
 * @param parameters
 * @param callback
 */
RestDriver.prototype.execute = function(query, parameters, callback) {
  // @todo Implement ssl connection with https.
  var payload = JSON.stringify({
        statements: [{
          statement: query,
          parameters: parameters
        }]
      });

  this._requestParameter.headers['Content-Length'] = Buffer.byteLength(payload);

  var request = http.request(this._requestParameter, function(response) {
    var responseValues = '';

    response.on('data', function(data) {
      responseValues += data;
    });

    response.on('end', function() {
      callback(null, JSON.parse(responseValues));
    });

  });



  setTimeout(function() {
    request.on('error', callback);
    request.write(payload);
    request.end();
  }, 0);
};

// Inherit from class 'Driver'
var intermediateClass = ring.create([RestDriver, Driver], {});

/**
 *
 * @returns {BoltDriver}
 */
RestDriver.instance = function() {
  return new intermediateClass();
};

module.exports = RestDriver;