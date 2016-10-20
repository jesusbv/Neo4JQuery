"use strict";

var _ = require('underscore')
  , Error = require('./Libs/Error').instance()
  , LinkedList = require('node-linkedlist')
  , async = require('async')
  , Builder = require('./Builder')
  , DriverNode = require('./Driver/DriverNode')
  , Driver = require('./Driver/Driver')
  , _connections = LinkedList.Create(DriverNode)
  , _graphInstance = null;

/**
 * @todo Change all operations on array into ops of linked list (is a bit faster and really fast with big amount of list items).
 * @constructor
 */
var Neo4JQuery = function() {
  var _cachedQuery = ''
    , _configuration = null;
  /**
   * The Cypher builder object.
   * X
   */
  this.Builder = null;
  this._classMap = {};

  /**
   * Removes all connections from internal driver list.
   *
   * @returns {Neo4JQuery}
   */
  this.flushConnections = function() {
    // @todo Close all available connections before removing them from list!
    _connections.clean();
    return this;
  };
  /**
   * X
   * @param configuration
   * @returns {Neo4JQuery}
   */
  this.connect = function(configuration) {
    configuration = configuration || null;
    if (configuration !== null)
      _configuration = configuration;

    var node = DriverNode.instance()
      , driver = null;

    if (_configuration !== null && _configuration.type !== null) {
      switch(_configuration.type) {
        case Driver.DRIVER_TYPE_BOLT:
          // Create new connection
          driver = require('./Driver/Bolt').instance();
          break;
        case Driver.DRIVER_TYPE_HTTP:
          driver = require('./Driver/Rest').instance();
          break;
      }

      driver.connect(_configuration);
      node.setDriver(driver);
      var connectionName = (_configuration.connection) ? _configuration.connection : 'default';
      node.setName(connectionName);
      // Add new connection
      _connections.add(node);
    }

    return this;
  };

  /**
   * X
   * @param connection
   * @returns {Neo4JQuery}
   */
  this.close = function(connection) {
    connection = (typeof connection === 'string') ? connection : 'default';
    var session = _connections.searchBy('name', connection).getDriver()
      , position = _connections.getPosition();

    switch(session.getType()) {
      case Driver.DRIVER_TYPE_BOLT:
      case Driver.DRIVER_TYPE_HTTP:
        session.close();
        _connections.delete(position);
        break;
    }
    return this;
  };

  /**
   *
   * @param mappingClasses
   * @returns {Neo4JQuery}
   */
  this.registerResultMappings = function(mappingClasses) {
    this._classMap = mappingClasses || {};
    return this;
  };

  /**
   * Query the database directly with a Cypher query.
   *
   * X
   * @param query {string} The Cypher query string.
   * @param parameters {object} An JSON object with the parameters used in the query string.
   * @param connection {string} The name of the connection to send the query.
   * @param callback {function}
   */
  this.query = function(query, parameters, connection, callback) {
    query = query || null;
    parameters = parameters || {};

    if (typeof connection === 'function') {
      callback = connection;
      connection = 'default';
    } else if (connection === void 0 || connection === null || typeof connection !== 'string')
      connection = 'default';

    var session = _connections.searchBy('name', connection)
      , me = this;

    if (!session || !session.getDriver ) {
      callback({error: Error.buildError('No active connection with name "' + connection + '" found.', Error.COMMON_CONNECTION_NAME_NOT_KNOWN)}, null);
    } else{

      session = session.getDriver();

      if (query && typeof query === 'string') {
        session.setGraphTypes(me._classMap);

        session.execute(query, parameters, function(err, result) {
          if (session.getType() === Driver.DRIVER_TYPE_BOLT)
            me.close(connection);

          callback(err, result);
        });
      } else {
        callback({error: Error.getByCode(Error.COMMON_NO_QUERY_GIVEN)}, null);
      }
    }

  };

  /**
   * Start transaction (only with use of Bolt protocol).
   * X-> placeholder
   * @returns {boolean}
   */
  this.beginTransaction = function(connection) {
    var session = _connections.searchBy('name', connection);
    switch(session.getType()) {
      case Driver.DRIVER_TYPE_BOLT:
        session.beginTransaction();
        return true;
        break;
      case Driver.DRIVER_TYPE_HTTP:
      default:
        return false;
        break;
    }
  };

  /**
   * Commit existing transaction (only with use of Bolt protocol).
   * X-> placeholder
   * @param callback
   */
  this.commit = function(callback) {
    var me = this
      , session = _connections.searchBy('name', connection);

    switch(session.getType()) {
      case Driver.DRIVER_TYPE_BOLT:
        session.commit()
          .subscribe({
            onCompleted: function() {
              callback(null, me);
            },
            onError: function(error) {
              callback(Error.getByCode(Error.BOLT_TRANSACTION_COMMIT_FAILS, {sysError: error}), null);
            }
          });
        break;
      case Driver.DRIVER_TYPE_HTTP:
      default:
        callback(Error.getByCode(Error.COMMON_TYPE_REST_DOES_NOT_SUPPORT_TRANSACTION), null);
        break;
    }
  };

  /**
   * Execute a direct stored procedure call.
   * X
   * @param domain {string}
   * @param procedureName {string}
   * @param callback {function}
   */
  this.Call = function(domain, procedureName, callback) {
  //  "use strict";
  //
  //  domain = domain || null;
  //
  //  // Maybe it is the short usage of the call function.
  //  if (typeof procedureName === 'function') {
  //    callback = procedureName;
  //    procedureName = null;
  //  }
  //
  //  var me = this;
  //  // Domain is required!
  //  if (_.isNull(domain)) {
  //    callback({message: 'No procedure domain given', code: 0}, null);
  //  } else {
  //    // Check if there is a function call at the end of the procedure name
  //    var lastIndexOf = domain.lastIndexOf('\(\)')
  //      , procedure = '';
  //
  //    // No procedure name given, maybe in the domain variable.
  //    if (_.isNull(procedureName)) {
  //      // The domain variable has the complete procedure name with function call.
  //      if (lastIndexOf != -1 && lastIndexOf > 0)
  //        procedure = domain;
  //    } else {
  //      // Normal: Procedure name is split into 2 parts.
  //      procedure = domain + '.' + procedureName;
  //    }
  //
  //    // Query the stored procedure.
  //    if (procedure !== '')
  //      me.Query(procedure, {}, callback);
  //      //_connection.query(procedure, {}, callback);
  //    else {
  //      // The procedure name variable is empty so the procedure name is invalid.
  //      callback({message: "The given domain and procedure name is not a valid stored procedure name.", code: 0}, null);
  //    }
  //  }
  };

  /**
   * Execute the query/ies build with the Cypher builder.
   * X
   * @param options {object}
   */
  this.execute = function(options) {

    // Without a builder it makes no sense to query the database.
    if (!options.builder) options.error({message: 'No Cypher query builder found.', code: 1001}, null);
    // Default settings
    if (_.isUndefined(options.cached) || _.isNull(options.cached)) options.cached = false;
    if (!options.labelMap || _.isEmpty(options.labelMap)) options.labelMap = {};
    if(!options.connection) options.connection = 'default';

    if (!options.closeConnection) options.closeConnection = false;
    if (!options.success) options.success = function(result) {};
    if (!options.error) options.error = function(err) {console.log(err);};

    var me = this
      , query = "";

    if (options.cached === false) {
      // Concat all queries.
      query = options.builder.getQuery(options.labelMap);
      _cachedQuery = query;
    } else {
      query = _cachedQuery;
    }

    /**
     * Internal function to lead the result items to the preferred aliases.
     *
     * @param labelMap {object}
     * @param result {array}
     * @param callback {function}
     * @todo Reimplement function with linked list and mapping keys to results in the record list
     * @todo Also check the connection type: Bolt has records and Rest API has normal objects!!
     */
    var buildAliases = function(labelMap, result, callback) {
      if (_.isEmpty(labelMap)) {
        callback(null, result);
      } else {
        var placeholder = _.keys(labelMap);
        // Map over every result item properties to set values to aliases.
        async.mapLimit(
          result,
          1000,
          function iterator(item, immediateCallback) {
            // Loop over the placeholders to be return to replace them with aliases.
            async.eachLimit(
              placeholder,
              100,
              function aliasIterator(placeholder, innerImmediateCallback) {
                if (!_.isUndefined(item[placeholder])) {
                  item[labelMap[placeholder]] = item[placeholder];
                  delete item[placeholder];
                }

                innerImmediateCallback(null);
              },
              function eachCallback(err) {
                immediateCallback(err, item);
              });
          },
          function mapCallback(err, aliasResult) {
            callback(err, aliasResult);
          });
      }
    };

    // Query the database.
    me.query(query, options.builder.getParameters(), options.connection, function(err, result) {
      //console.log(err, result);
      query = null;
      options.builder.reset();
      if (err) {
        options.error(err);
      } else {
        options.success(result);
//        buildAliases(options.labelMap, result, function(err, newResult) {
//          "use strict";
//
//          if (err) options.error(err);
//          else options.success(newResult);
//        });
      }
    });
  };
};

/**
 * Get the Neo4JQuery object.
 *
 * @returns {Neo4JQuery}
 * @Deprecated
 */
Neo4JQuery.singleton = function() {
  if (_.isNull(_graphInstance)) {
    _graphInstance = new Neo4JQuery();
    _graphInstance.Builder = require('./Builder').singleton();
  }

  return _graphInstance;
};

module.exports = Neo4JQuery;
