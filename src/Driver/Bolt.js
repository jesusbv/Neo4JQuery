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
  this._transactionStarted = false;
  this._graphTypes = {};
};

/**
 *
 * @returns {number|*}
 */
BoltDriver.prototype.getType = function() {
  return Driver.DRIVER_TYPE_BOLT;
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
 * @param types
 * @returns {BoltDriver}
 */
BoltDriver.prototype.setGraphTypes = function(types) {
  types = types || {};
  this._graphTypes = types;
  return this;
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
    var url = 'bolt://' + me._parameter.server;
    if (me._parameter.port) url += ':' + me._parameter.port;

    // Configure bolt driver with or without authentication.
    var user = me._parameter.user
      , password = me._parameter.password;

    if (user !== void 0 && user !== null && password !== void 0 && password !== null)
      me._connection = Bolt.driver(url, Bolt.auth.basic(me._parameter.user, me._parameter.password));
    else
      me._connection = Bolt.driver(url, {});
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
      me._transactionStarted = true;
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
  if (this._transaction !== null) {
    this._transaction.commit();
    this._transactionStarted = false;
  }
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
      var session = resultObj.getSessionFromConnection
        , resultMap = {};

      var stream = session.run(query, parameter);
      stream.subscribe({
          onNext: function onNext(record) {
            var i= 0, j = record.length
              , item = null
              , key = '';

            for(; i< j; i++) {
              key = record.keys[i];
              item = record.get(key);
              /**
               * todo check if the record labels/types are one of the registered class names
               * todo If labels/types are equal to class names in the map then create objects and set properties!!!!
               */
              var type = (item !== null && item.labels !== void 0) ? 'node' : (item !== null && item.types !== void 0) ? 'relationship' : null;

              if (type !== null) {
                switch(type) {
                  case 'node':
                    var labels = item.labels
                      , obj = null;

                    labels.forEach(function(label) {
                      if (me._graphTypes[label] !== void 0) {
                        obj = me._graphTypes[label].instance();
                        obj.setId(Bolt.toString(item.identity))
                          .set(record.properties, function(err, obj) {
                            resultMap[key] = obj;
                          });
                      } else {
                        resultMap[key] = item;
                      }
                    });
                    break;
                  case 'relationship':
                    resultMap[key] = item;
                    break;
                }
              }
            }
          },
          onCompleted: function onCompleted() {
            console.log(resultMap);
            immediateCallback(null, resultMap);
          },
          onError: function onError(error) {
            immediateCallback({message: 'Query the database was not successful.', code: 0, sysErr: error}, null);
          }
        });
    }]
  }, function(err, resultset) {
    if (err)
      callback({message: 'Error: Something went wrong.', code: 0, sysError: err}, null);
    else {
      callback(null, resultset.executeQuery);
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
  if (this._transaction) this._transaction.close();
  this._transaction = null;

  if (this._session) this._session.close();
  this._session = null;

  if (this._connection) this._connection.close();
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