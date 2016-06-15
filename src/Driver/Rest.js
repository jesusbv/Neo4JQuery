
var ring = require('ring')
  , Driver = require('./Driver');

var RestDriver = function() {
  "use strict";
  this._type = Driver.DRIVER_TYPE_HTTP;
  this._connection = null;
};

RestDriver.prototype.getType = function() {
  "use strict";
  return this._type;
};

RestDriver.prototype.connect = function(parameter) {
  "use strict";

};
RestDriver.prototype.execute = function(query, parameters, callback) {
  "use strict";
  callback(null, this);
};

RestDriver.prototype.close = function() {
  "use strict";
  this._connection = null;
  return this;
};

// Inherit from class 'Driver'
var intermediateClass = ring.create([RestDriver, Driver], {});

/**
 *
 * @returns {BoltDriver}
 */
RestDriver.instance = function() {
  "use strict";
  return new intermediateClass();
};

module.exports = RestDriver;