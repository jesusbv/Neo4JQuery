"use strict";

var _ = require('underscore')
  , ring = require('ring')
  , async = require('async')
  , LinkedList = require('node-linkedlist')
  , Bolt = require('neo4j-driver').v1
  , Driver = require('./Driver');

var BoltDriver = function() {
  this._session = null;
  this._transaction = null;
  this._connection = null;
  this._parameter = null;
  this._type = Driver.DRIVER_TYPE_BOLT;
  this._transactionStarted = false;
};

/**
 *
 * @returns {number|*}
 */
BoltDriver.prototype.getType = function() {
  "use strict";
  return this._type;
};

/**
 *
 * @returns {boolean}
 */
BoltDriver.prototype.isTransactionStarted = function() {
  return this._transactionStarted;
};

/**
 *
 * @param parameter
 * @returns {BoltDriver}
 */
BoltDriver.prototype.connect = function(parameter) {
  var me = this;
  me._parameter = (!_.isEmpty(parameter)) ? parameter : null;

  if (me._parameter !== null) {
    var url = me._parameter.server;
    if (me._parameter.port) url += ':' + me._parameter.port;

    me._connection = Bolt.driver(url, Bolt.auth.basic(me._parameter.user, me._parameter.password));
  }

  return me;
};

/**
 *
 * @param callback
 * @returns {*}
 */
BoltDriver.prototype.getSession = function(callback) {
  var me = this;

  if (me._connection === null) {
    callback({message: 'No connection to the database available. Please connect first.', code: 0}, null);
  } else {
    if (me._session === null) {
      me._session = me._connection.session();
      callback(null, me._session);
      return me._session;
    } else if (me._transaction === null) {
      callback(null, me._session);
      return me._session;
    } else if (me._transaction !== null) {
      callback(null, me._transaction);
      return me._transaction;
    }
  }

  return null;
};

/**
 *
 * @param callback
 * @returns {BoltDriver}
 */
BoltDriver.prototype.beginTransaction = function(callback) {
  var me = this;
  this.getSession(function(err, session) {
    if (err) callback({message: '', code: 0}, null);
    else if (me._transaction !== null) callback(null, me._transaction);
    else {
      me._transaction = this._connection.beginTransaction();
      callback(null, me._transaction);
    }
  });

  return this;
};

/**
 *
 * @returns {BoltDriver}
 */
BoltDriver.prototype.commit = function() {
  if (this._transaction !== null)
    this._transaction.commit();
  return this;
};

/**
 *
 * @param query
 * @param parameter
 * @param callback
 */
BoltDriver.prototype.execute = function(query, parameter, callback) {
  var me = this
    , results = LinkedList.Create();

  async.auto({
    getSessionFromConnection: function(immediateCallback) {
      me.getSession(function(err, session) {
        immediateCallback(err, session);
      });
    },
    /**
     *
     * @param resultObj
     * @param immediateCallback
     */
    executeQuery: ['getSessionFromConnection', function(immediateCallback, resultObj) {
      var session = resultObj.getSessionFromConnection;

      session
        .run(query, parameter)
        .then(function(result) {
          results.setList(result.records, function(err, list) {
            immediateCallback(err, list);
          });
        })
        .catch(function(error) {
          immediateCallback({message: 'Error: Query the database was not successful.', code: 0}, null);
        });
    }]
  }, function(err, resultset) {
    if (err)
      callback({message: 'Error: Something went wrong.', code: 0, sysError: err}, null);
    else {
      callback(null, results);
    }
  });
};

/**
 *
 * @param parameter
 * @returns {BoltDriver}
 */
BoltDriver.prototype.reconnect = function(parameter) {
  if (!_.isEmpty(parameter))
    this.connect(parameter);
  else if (!_.isEmpty(this._parameter))
    this.connect(this._parameter);

  return this;
};

/**
 *
 * @returns {BoltDriver}
 */
BoltDriver.prototype.close = function() {
  this._transaction = null;
  this._session = null;
  this._connection = null;
  return this;
};

var intermediateClass = ring.create([BoltDriver, Driver], {});

/**
 *
 * @returns {BoltDriver}
 */
BoltDriver.instance = function() {
  return new intermediateClass();
};

module.exports = BoltDriver;