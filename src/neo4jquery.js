"use strict";

var _ = require('underscore')
  , LinkedList = require('node-linkedlist')
  , async = require('async')
  , Builder = require('./Builder')
  , _graphInstance = null
  , DriverNode = require('./Driver/DriverNode')
  , _connections = LinkedList.Create(DriverNode)
  , Driver = require('./Driver/Driver');

/**
 * @todo Change all operations on array into ops of linked list (is a bit faster and really fast with big amount of list items).
 * @constructor
 */
var Neo4JQuery = function() {
  var _cachedQuery = ''
    , _configuration = null;
  /**
   * The Cypher builder object.
   */
  this.Builder = null;


  /**
   * Query the database directly with a Cypher query.
   *
   * @param query {string} The Cypher query string.
   * @param parameters {object} An JSON object with the parameters used in the query string.
   * @param connection {string} The name of the connection to send the query.
   * @param callback {function}
   */
  this.query = function(query, parameters, connection, callback) {
    "use strict";

    query = query || null;
    parameters = parameters || {};

    if (typeof connection === 'function') {
      callback = connection;
      connection = 'default';
    } else if (typeof connection !== 'string')
      connection = 'default';

    var session = _connections.searchBy('name', connection).getDriver();

    if (query && typeof query === 'string') {
      session.execute(query, parameters, callback);
    }
  };

  /**
   * Start transaction (only with use of Bolt protocol).
   *
   * @returns {boolean}
   */
  this.beginTransaction = function(connection) {
    var session = _connections.searchBy('getName', connection);
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
   *
   * @param callback
   */
  this.commit = function(callback) {
    var me = this
      , session = _connections.searchBy('getName', connection);

    switch(session.getType()) {
      case Driver.DRIVER_TYPE_BOLT:
        session.commit()
          .subscribe({
            onCompleted: function() {
              callback(null, me);
            },
            onError: function(error) {
              callback({message: 'Error on execute transactions commit.', code: 0, sysError: error}, null);
            }
          });
        break;
      case Driver.DRIVER_TYPE_HTTP:
      default:
        callback({message: 'This type does not support transactions: Neo4J Rest API'}, null);
        break;
    }
  };

  /**
   * Execute a direct stored procedure call.
   *
   * @param domain {string}
   * @param procedureName {string}
   * @param callback {function}
   */
  //this.Call = function(domain, procedureName, callback) {
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
  //};

  /**
   * Execute the query/ies build with the Cypher builder object.
   * This way is not preferred. Use 'execute' instead with 'options' object.
   *
   * @param builder {Builder}
   * @param cached {boolean}
   * @param callback {function}
   */
  //this.run = function(builder, cached, callback) {
  //  "use strict";
  //
  //  if (typeof cached === 'function') {
  //    callback = cached;
  //    cached = false;
  //  }
  //
  //  var me = this
  //    , query = "";
  //
  //  if (cached === false) {
  //    // Concat all queries.
  //    query = builder.getQuery();
  //    _cachedQuery = query;
  //  } else {
  //    query = _cachedQuery;
  //  }
  //
  //  // Query the database.
  //  me.Query(query, builder.getParameters(), function(err, result) {
  //    "use strict";
  //
  //    query = null;
  //    builder.reset();
  //    callback(err, result);
  //  });
  //};

  /**
   * Execute the query/ies build with the Cypher builder.
   *
   * @param options {object}
   */
  this.execute = function(options) {
    "use strict";

    if (!options.success) options.success = function(result) {};
    if (!options.error) options.error = function(err) {console.log(err);};
    // Without a builder it makes no sense to query the database.
    if (!options.builder) options.error({message: 'No Cypher query builder found.', code: 1001}, null);
    if(!options.connection) options.connection = 'default';
    // Default settings
    if (_.isUndefined(options.cached) || _.isNull(options.cached)) options.cached = false;
    if (!options.labelMap || _.isEmpty(options.labelMap)) options.labelMap = {};

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
      "use strict";

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
    me.query(query, options.builder.getParameters(), function(err, result) {
      "use strict";

      query = null;
      options.builder.reset();
      if (err) {
        options.error(err);
      } else {
        options.success(result);
        //buildAliases(options.labelMap, result, function(err, newResult) {
        //  "use strict";
        //
        //  if (err) options.error(err);
        //  else options.success(newResult);
        //});
      }
    });
  };

  this.connect = function(configuration) {
    configuration = configuration || null;
    _configuration = configuration;

    var node = DriverNode.Create();
    
    if (_configuration !== null && _configuration.type !== null) {
      switch(configuration.type) {
        case Driver.DRIVER_TYPE_BOLT:
        // Create new connection
          var connection = require('./Driver/Bolt').instance();
          connection.connect(_configuration);
          node.setDriver(connection);
          node.setName( ( (configuration.connection) ? configuration.connection : 'default' )) ;
          // Add new connection
          _connections.add(node);
          break;
      }
    }

    return this;
  };

  this.close = function(connection) {
    var session = _connections.searchBy('Name', connection).getDriver();
    switch(session.getType()) {
      case Driver.DRIVER_TYPE_BOLT:
      case Driver.DRIVER_TYPE_HTTP:
        session.close();
        break;
    }
    return this;
  };
};

/**
 * Get the Neo4JQuery object.
 *
 * @param configuration {object}
 * @returns {Neo4JQuery}
 * @Deprecated
 */
Neo4JQuery.singleton = function() {
  "use strict";
  if (_.isNull(_graphInstance)) {
    _graphInstance = new Neo4JQuery();
    _graphInstance.Builder = require('./Builder').singleton();
  }

  return _graphInstance;
};

module.exports = Neo4JQuery;
