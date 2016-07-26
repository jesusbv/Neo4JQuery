"use strict";

var _instance = null
  , _ = require('underscore')
  , LinkedList = require('node-linkedlist')
  , Functions = require('./Libs/Function')
  , FunctionBuilder = Functions.Create();

/**
 * @todo Implement options objects as method signature to pass in parameter into builder methods.
 */
var Builder = function() {
  this.CASE_TYPE_SIMPLE = 1;
  this.CASE_TYPE_GENERIC = 2;

  var  _caseType = 0
    , _whenCalled = false
    , _thenCalled = false
    , _queryPlaceholders = []
    , _uniqueIds = []
    , _parameters = {}
    , _query = {
        distinct: false,
        start: '',
        queries: [],
        cases: [],
        orderBy: [],
        orderByDirection: ' ASC ',
        skip: 0,
        limit: 0,
        errors: [] // Error list that is filled while methods are called. I do not know yet how to use it now.
      };

  this.START = 1;
  this.CREATE = 2;
  this.MERGE = 3;
  this.MATCH = 4;
  this.OPTIONAL_MATCH = 5;
  this.DELETE = 6;
  this.CREATE_INDEX_ON = 7;
  this.DROP_INDEX_ON = 8;

  
  //this.AGGREGATE_SUM = 1;
  //this.AGGREGATE_COUNT = 2;
  //this.AGGREGATE_AVG = 3;
  //this.AGGREGATE_MIN = 4;
  //this.AGGREGATE_MAX = 5;
  //this.AGGREGATE_COLLECT = 6;
  //this.AGGREGATE_FILTER = 7;
  //this.AGGREGATE_EXTRACT = 8;

  /**
   * Get the correct Cypher key word.
   *
   * @param action
   * @returns {*}
   */
  this.getAction = function(action) {
    var me = this;
    switch(action) {
      case me.CREATE:
        return ' CREATE ';
        break;
      case me.MATCH:
        return ' MATCH ';
        break;
      case me.OPTIONAL_MATCH:
        return ' OPTIONAL MATCH ';
        break;
      case me.MERGE:
        return ' MERGE ';
        break;
      case me.DELETE:
        return ' DELETE ';
        break;
      case me.CREATE_INDEX_ON:
        return ' CREATE INDEX ON :';
        break;
      case me.DROP_INDEX_ON:
        return ' CREATE INDEX ON :';
        break;
      default:
        return '';
        break;
    }
  };

  /**
   * Resets the internal Cypher query information.
   *
   * @returns {Builder}
   */
  this.reset = function() {
    _query.start = '';
    _query.queries = [];
    _query.cases = [];
    _query.orderBy = [];
    _query.skip = 0;
    _query.limit = 0;
    _query.errors = [];

    _caseType = 0;
    _whenCalled = false;
    _thenCalled = false;
    _uniqueIds.length = 0;
    _queryPlaceholders = [];

    return this;
  };

  /**
   * Get the Cypher query as string (without applied parameters).
   *
   * @param labelMap
   * @returns {string}
   */
  this.getQuery = function(labelMap) {
    labelMap = (labelMap && !_.isEmpty(labelMap)) ? _.keys(labelMap) : [];

    var me = this
      , query = (_query.start != '') ? _query.start : '';

    if (me.hasQueries()) {
      // Concat all queries.
      query += _query.queries.join('');

      // Get the placeholders for return them...
      if (labelMap.length == 0 && Array.isArray(_queryPlaceholders) && _queryPlaceholders.length > 0) {
        // Return placeholders.
        query += ' RETURN ' + ((_query.distinct === true) ? 'DISTINCT ' : '') + _queryPlaceholders.join(', ');
      } else {
        // ... or have given placeholder to return.
        labelMap = _.unique(labelMap);
        query += ' RETURN ' + ((_query.distinct === true) ? 'DISTINCT ' : '') + labelMap.join(', ');
      }

      query +=
        ' ' + ( (_query.orderBy.length > 0) ? ' ORDER BY ' + _query.orderBy.join(', ') + _query.orderByDirection: '')
        + ' ' + ((_query.skip > 0) ? ' SKIP ' + _query.skip : '')
        + ' ' + ((_query.limit > 0) ? ' LIMIT ' + _query.limit : '');
    }

    return query;
  };

  /**
   *
   * @returns {object}
   */
  this.getParameters = function() {
    return _parameters;
  };

  /**
   *
   * @returns {boolean}
   */
  this.hasQueries = function() {
    return (_query.queries.length > 0);
  };

  /**
   * @todo Look at documentary what is possible in Cypher with the "START" key word.
   * @param placeholder
   * @param label
   * @param parameter
   * @constructor
   */
  this.Start = function(placeholder, label, parameter) {
    placeholder = placeholder || 'ph';
    label = label || '';
    parameter = parameter || {};

    _query.start = this.getNodeQuery(placeholder, label, parameter, this.START);
    _queryPlaceholders.push(placeholder);
  };

  /**
   * Mark the
   * @returns {Builder}
   */
  this.Distinct = function() {
    _query.distinct = true;
    return this;
  };

  /**
   * X
   * @param placeholder
   * @param label
   * @param optional
   * @param parameters
   * @returns {Builder}
   */
  this.Match = function(placeholder, label, parameters, optional) {
    optional = (optional === true);

    if (optional === true)
      _query.queries.push(this.getNodeQuery(placeholder, label, parameters, this.OPTIONAL_MATCH));
    else
      _query.queries.push(this.getNodeQuery(placeholder, label, parameters, this.MATCH));

    _queryPlaceholders.push(placeholder);
    return this;
  };

  /**
   * X
   * @param placeholder
   * @param label
   * @param parameter
   * @returns {Builder}
   * @constructor
   */
  this.OptionalMatch = function(placeholder, label, parameter) {
    return this.Match(placeholder, label, parameter, true);
  };

  /**
   *
   * @param placeholders
   * @param relationPlaceholder
   * @param label
   * @param parameter
   * @returns {Builder}
   */
  this.Related = function(placeholders, relationPlaceholder, label, parameter) {
    placeholders = (Array.isArray(placeholders) && placeholders.length > 0) ? placeholders : [];
    parameter = parameter || {};
    relationPlaceholder = relationPlaceholder || '';
    label = label || '';

    if (label !== '') {
      label = ':'.concat(label);
    }

    var me = this
      , query = '';

    if (placeholders.length == 0 ) {
        return me;
    } else {
      query = '(' + placeholders[0] + ')-[' + relationPlaceholder + label;

      if (parameter && !_.isEmpty(parameter)) {
        query += ' ' + me.prepareParameter(':', parameter) + ']-'
      } else {
        query += ']-';
      }

      query += '(' + placeholders[1] + ') ';

      _query.queries.push(query);

      return me;
    }
  };

  /**
   *
   * @param relationPlaceholder
   * @param label
   * @param parameter
   * @returns {Builder}
   */
  this.relate = function(relationPlaceholder, label, parameter) {
    relationPlaceholder = relationPlaceholder || 'ar';
    label = label || '';

    if (label !== '') {
        label = ':'.concat(label);
    }

    var me = this
      , query = '-['+ relationPlaceholder + label ;

    if (!_.isNull(parameter)) {
      query += ' ' + me.prepareParameter(parameter);
    }

    query += ']-';

    _query.queries.push(query);
    _queryPlaceholders.push(relationPlaceholder);

    return me;
  };

  /**
   *
   * @param placeholder
   * @param label
   * @param parameter
   * @returns {Builder}
   */
  this.toNode = function(placeholder, label, parameter) {
    _query.queries.push(this.getNodeQuery(placeholder, label, parameter, null));
    _queryPlaceholders.push(placeholder);
    return this;
  };

  /**
   *
   * @param placeholder
   * @param label
   * @param parameter
   * @returns {Builder}
   */
  this.Create = function(placeholder, label, parameter) {
    placeholder = placeholder || '';
    label = label || '';
    parameter = parameter || {};

    _query.queries.push(this.getNodeQuery(placeholder, label, parameter, this.CREATE));
    _queryPlaceholders.push(placeholder);

    return this;
  };

  /**
   *
   * @param label
   * @param property
   * @returns {Builder}
   * @constructor
   */
  this.IndexOn = function(kind, label, property) {
    kind = kind || null;
    label = label || null;
    property = property || null;
    var me = this;

    if (label && property) {
      var query;

      switch(kind) {
        case me.CREATE_INDEX_ON:
          query = me.getAction(me.CREATE_INDEX_ON);
          break;
        case me.DROP_INDEX_ON:
          query = me.getAction(me.DROP_INDEX_ON);
          break;
      }

      query += label + '(' + property + ') ';
      _query.queries.push(query);
    }

    return this;
  };

  /**
   * String starts with given part.
   * @todo REduce to one function together with "EndWith" and "Contains"
   *
   * @param value
   * @returns {Builder}
   * @constructor
   */
  this.StartsWith = function(value) {
    value = value || null;

    if (value) {
      _query.queries.push(" STARTS WITH '" + value + "' ");
    }

    return this;
  };

  /**
   * String ends with given part.
   * @param value
   * @returns {Builder}
   * @constructor
   */
  this.EndsWith = function(value) {
    value = value || null;

    if (value) {
      _query.queries.push(" ENDS WITH '" + value + "' ");
    }

    return this;
  };

  /**
   * String contains given part at any position.
   *
   * @param value
   * @returns {Builder}
   * @constructor
   */
  this.Contains = function(value) {
    value = value || null;

    if (value) {
      _query.queries.push(" CONTAINS '" + value + "' ");
    }

    return this;
  };

  /**
   * X
   * @param placeholder
   * @param label
   * @param parameter
   * @returns {Builder}
   */
  this.Merge = function(placeholder, label, parameter) {
    if (_.isNull(placeholder)) placeholder = 't';
    _query.queries.push(this.getNodeQuery(placeholder, label, parameter, this.MERGE));
    _queryPlaceholders.push(placeholder);
    return this;
  };

  /**
   *
   * @param placeholder
   * @param label
   * @param parameter
   * @param action
   * @returns {string}
   */
  this.getNodeQuery = function(placeholder, label, parameter, action) {
    placeholder = placeholder || null;
    parameter = parameter || {};
    label = label || '';
    action = action || '';

    var me = this
      , query = me.getAction(action);


    if (_.isNull(placeholder)) {
      placeholder = 'at';
    }

    if (label !== '') {
      label = ':'.concat(label);
    }

    query += '(' + placeholder + label;

    if (parameter && !_.isEmpty(parameter))
      query += ' ' + me.prepareParameter(':', parameter) + ')';
    else
      query += ')';

    return query;
  };

  /**
   * X
   * @param nodes
   * @param placeholder
   * @param label
   * @param parameter
   * @returns {Builder}
   */
  this.MergeRelationShip = function(nodes, placeholder, label, parameter) {
    nodes = nodes || [];

    if (!parameter && typeof label !== 'string') {
      parameter = label;
      label = placeholder;

    } else {
      placeholder = placeholder || null;
      label = label || '';
      parameter = parameter || {};
    }

    if (nodes.length < 2) {
      return this;
    } else {
      var me = this;

      if (_.isNull(placeholder)) {
        placeholder = 'r'
      }

      var string = ' MERGE (' + nodes[0] + ')-' + '[' + placeholder;
      if (label !== '') {
        string += ':' + label + ' ';
      }

      string += me.prepareParameter(':', parameter) + ']-(' + nodes[1] + ') ';

      _query.queries.push(string);
      _queryPlaceholders.push(placeholder);

      return this;
    }
  };

  /**
   * X
   * @param command
   * @returns {Builder}
   */
  this.onCreate = function(command) {
    command = command || null;
    var string = '';

    if (!_.isNull(command))
      string = ' ON CREATE ' + command;

    if (string !== '')
      _query.queries.push(string);

    return this;
  };

  /**
   * X
   * @param command
   * @returns {Builder}
   */
  this.onMatch = function(command) {
    command = command || null;
    var string = '';

    if (!_.isNull(command))
      string = ' ON MATCH ' + command;

    if (string !== '')
      _query.queries.push(string);

    return this;
  };

  /**
   * X
   * @param placeholder
   * @returns {Builder}
   */
  this.Delete = function(placeholder) {
    placeholder = placeholder || null;
    var me = this;

    if (!_.isNull(placeholder)) {

      var string = me.getAction(me.DELETE);

      if (typeof placeholder === 'string') {
        string += placeholder;
      } else if (Array.isArray(placeholder) && placeholder.length > 0) {
        string += placeholder.join(', ');
      }

      if (string !== '') {
        _query.queries.push(string);
      }
    }

    return this;
  };

  /**
   * X
   * @param placeholders
   * @returns {Builder}
   */
  this.With = function(placeholders) {
    if (Array.isArray(placeholders) && placeholders.length !== 0) {
      var string = ' WITH ' + placeholders.join(', ');
      _query.queries.push(string);
    }

    return this;
  };

  /**
   * X
   * @param condition
   * @param parameters
   * @returns {Builder}
   */
  this.Where = function(condition, parameters) {
    condition = condition || null;
    parameters = parameters || null;
    _query.queries.push(' WHERE ');

    if (!_.isNull(condition) && typeof condition === 'string')
      _query.queries.push(condition);

    if (!_.isNull(parameters))
      _parameters = _.extend(_parameters, parameters);

    return this;
  };

  /**
   * ?????
   * @param condition
   * @param parameters
   * @returns {Builder}
   */
  this.WhereNot = function(condition, parameters) {
    condition = condition || null;
    parameters = parameters || null;

    if (!_.isNull(condition) && typeof condition === 'string')
      _query.queries.push(' WHERE NOT ' + condition);

    if (!_.isNull(parameters))
      _parameters = _.extend(_parameters, parameters);

    return this;
  };

  /**
   * X
   * @param placeholder
   * @param parameter
   * @returns {Builder}
   */
  this.Set = function(placeholder, parameter) {
    if (placeholder && placeholder !== '') {
      var me = this
        , string = ' SET ' + me.prepareParameter(placeholder + '.', parameter);

      _query.queries.push(string);
    }

    return this;
  };

  /**
   *
   * @param orders
   * @param direction
   * @returns {Builder}
   */
  this.OrderBy = function(orders, direction) {
    orders = (Array.isArray(orders)) ? orders : [];
    direction = direction || null;

    if (orders.length > 0) _query.orderBy = orders;
    if (direction) _query.orderByDirection = direction;
    return this;
  };

  /**
   *
   * @param number
   * @returns {Builder}
   */
  this.Skip = function(number) {
    number = parseInt(number) || 0;
    if (!isNaN(number) && number > 0) _query.skip = number;
    return this;
  };

  /**
   *
   * @param limit
   * @returns {Builder}
   */
  this.Limit = function(limit) {
    limit = parseInt(limit) || 0;
    if(!isNaN(limit) && limit > 0) _query.limit = limit;
    return this;
  };

  /**
   * Removes the label from the given placeholder
   * @param labelsAndOrFields
   * @returns {Builder}
   */
  this.Remove = function(labelsAndOrFields) {
    labelsAndOrFields = (Array.isArray(labelsAndOrFields)) ? labelsAndOrFields : [];

    if (labelsAndOrFields.length > 0) {
      _query.queries.push(' REMOVE ' + join(labelsAndOrFields, ', '));
    }

    return this;
  };

  /**
   * X
   * @param condition
   * @param query
   * @returns {Builder}
   */
  this.ForeachCondition = function(condition, query) {
    condition = condition || null;
    query = query || null;

    if (!_.isNull(query) && typeof condition === 'string') {
      var string = ' FOREACH (' + condition + ' | \n' + query + ')';
      _query.queries.push(string);
    }

    return this;
  };

  /**
   *
   * @param field
   * @returns {Builder}
   */
  this.Case = function(field) {
    field = field || null;

    var query = ' CASE ';

    if (null !== field) {
      //Simple case
      _query.cases.push(query + field);
      _caseType = this.CASE_TYPE_SIMPLE;   // @info Just have this info to check later on method call of "When"  and "Then" if it is correct
    } else {
      // Generic case
      _query.cases.push(query);
      _caseType = this.CASE_TYPE_GENERIC;  // @info Just have this info to check later on method call of "When"  and "Then" if it is correct
    }

    return this;
  };

  /**
   *
   * @param value
   * @param field
   * @returns {Builder}
   */
  this.When = function(value, field) {
    field = field || null;
    value = value || null;
    var query = ' WHEN ';

    if (null !== value) {
      if (_caseType === this.CASE_TYPE_GENERIC && null !== field) // @todo The solution has bugs because here only "generic case" is handled but not "simple case"
        _query.cases.push(query + ((null !== field) ? field + '=' + value : value));
      else
        _query.errors.push({message: 'Field is missing on generic case.', method: 'When'});
    } else {
      _query.errors.push({message: 'No value given.', method: 'When'});
    }

    return this;
  };

  /**
   *
   * @param value
   * @returns {Builder}
   */
  this.Then = function(value) {
    value = value || null;

    var query = ' THEN ';

    if (null !== value) {
      if (!_whenCalled)
        _query.errors.push({message: 'CASE method "Then" called before "When".', method: 'Then'});
      else
        _query.cases.push(query + value);
    } else {
      _query.errors.push({message: 'No value given.', method: 'Then'});
    }

    return this;
  };

  /**
   *
   * @param value
   * @returns {Builder}
   */
  this.Else = function(value) {
    value = value || null;
    if (null !== value) {
      _query.cases.push(' ELSE ' + value);
    }

    return this;
  };

  /**
   *
   */
  this.End = function() {
    if (!_whenCalled || !_thenCalled) {
      _query.errors.push({message: 'CASE method "End" called before "When" or "Then".', method: 'End'});
    } else {
      _query.cases.push(' END ')
    }
  };

  /**
   * Check if all items in the list pass the predicate.
   *
   * @param variable {string} Name of variable used in condition.
   * @param list {string} Expression that returns a list like "nodes(x)".
   * @param predicate {string} Predicate which is tested against all list items.
   * @returns {string}
   */
  this.All = function(variable, list, predicate) {
    _query.queries.push(FunctionBuilder.PredicateFunction(Functions.PREDICATE_FUNCTION_ALL, variable, list, predicate));
  };

  /**
   * Check if at least one item in the list pass the predicate.
   *
   * @param variable {string} Name of variable used in condition.
   * @param list {string} Expression that returns a list like "nodes(x)".
   * @param predicate {string} Predicate which is tested against all list items.
   * @returns {string}
   */
  this.Any = function(variable, list, predicate) {
    _query.queries.push(FunctionBuilder.PredicateFunction(Functions.PREDICATE_FUNCTION_ANY, variable, list, predicate));
  };

  /**
   * Check if none of the list items pass the predicate.
   *
   * @param variable {string} Name of variable used in condition.
   * @param list {string} Expression that returns a list like "nodes(x)".
   * @param predicate {string} Predicate which is tested against all list items.
   * @returns {string}
   */
  this.None = function(variable, list, predicate) {
    _query.queries.push(FunctionBuilder.PredicateFunction(Functions.PREDICATE_FUNCTION_NONE, variable, list, predicate));
  };

  /**
   * Check if exact one list item pass the predicate.
   *
   * @param variable {string} Name of variable used in condition.
   * @param list {string} Expression that returns a list like "nodes(x)".
   * @param predicate {string} Predicate which is tested against all list items.
   * @returns {string}
   */
  this.Single = function(variable, list, predicate) {
    _query.queries.push(FunctionBuilder.PredicateFunction(Functions.PREDICATE_FUNCTION_SINGLE, variable, list, predicate));
  };

  /**
   * Prepare parameters for usage for a 'parameterized' query.
   *
   * @param separator
   * @param parameter
   * @returns {string}
   */
  this.prepareParameter = function(separator, parameter) {
    if (!separator) {
      parameter = separator;
      separator = ':';
    }

    var string = ''
      , keys = _.keys(parameter);

    if (separator === ':') {
      string = '{';
    }

    keys.forEach(function(key) {
      if (separator === ':') {
        // Parameter format for node creation
        if (isNaN(parameter[key])) {
          if (_uniqueIds.indexOf(parameter[key]) != -1) {
            string += key + separator + ' ' + parameter[key] + ', ';
          } else {
            string += key + separator + ' "' + parameter[key] + '", ';
          }
        } else if (!isNaN(parameter[key]) && typeof parseFloat(parameter[key]) === 'number') {
          string += key + separator + ' ' + parameter[key] + ', ';
        }
      } else if (separator.indexOf('.') != -1) {

        if (isNaN(parameter[key])) {
          if (_uniqueIds.indexOf(parameter[key]) != -1) {
            string += separator + key + '=' + parameter[key] + ', ';
          } else {
            string += separator + key + '="' + parameter[key] + '", ';
          }
        } else if (!isNaN(parameter[key]) && typeof parseFloat(parameter[key]) === 'number') {
          string += separator + key + '=' + parameter[key] + ', ';
        }
      }

    });

    if (string !== '{')
      string = string.substr(0, string.length - 2);

    if (separator === ':') string += '}';

    return string;
  };

  /**
   *
   * @param values
   * @returns {Builder}
   */
  this.WhereIn = function(values) {
    return this;
  };

  /**
   *
   * @param placeholderPrefixes
   * @param labels
   * @param unique
   * @param parameters
   */
  this.BatchCreate = function(placeholderPrefixes, labels, unique, parameters) {
    /**
     * CREATE (u1:User {...}), (u2:User {...}), ..., (time100:Timestamp {...}));
     */
  };

  /**
   * Use the map to be returned instead of the placeholder or the aliases map.
   * @param map
   * @returns {Builder}
   */
  this.LiteralMap = function(map) {
    return this;
  };
  /**
   * X
   * @param list
   * @param query
   * @returns {Builder}
   */

  this.ForeachArray = function(list, query) {
//    list = list || null;
//    query = query || null;
//
//    if (!_.isNull(query) && Array.isArray(list) && list.length > 0) {
//      var string = ' FOREACH (item in {items} | \n' + query + ')';
//      queries.push(string);
//      parameters = {items: list};
//    }
//
    return this;
  };

    /**
     *
     * @param placeholder
     * @param reader
     * @param aggregateFunc
     * @returns {Builder}
     * @constructor
     */
//  this.AggregateReadOnly = function(placeholder, reader, aggregateFunc) {
//    if (typeof placeholder === 'string') {
//      placeholder = [placeholder];
//    }
//
//    // check here the reader parameter..
//    if (!isReader(reader) || !isAggregateFunc(aggregateFunc)) {
//      return this;
//    } else {
//        // todo Check if the placeholder exists in global array because they have to be replaced by the aggregated ones.
//      var queryPart = '';
//      switch(reader) {
//        case this.MATCH:
//            queryPart = ' MATCH ' + placeholder.map(function(val){
//                "use strict";
//                return glueForAggregation(this.MATCH, val) + ', ';
//            });
//          break;
//        case this.OPTIONAL_MATCH:
//            queryPart = ' MATCH OPTIONAL' + placeholder.map(function(val){
//                "use strict";
//                return glueForAggregation(this.OPTIONAL_MATCH, val) + ', ';
//            });
//          break;
//        case this.START:
//            queryPart = ' START ' + placeholder.map(function(val){
//                "use strict";
//                return glueForAggregation(this.START, val) + ', ';
//            });
//        break;
//      }
//
//        queryPart = queryPart.substr(0, -2);
//        queries.push(queryPart);
//      return this;
//    }
//  };

  /**
   *
   * @param placeholder
   * @param readWriter
   * @param aggregateFunc
   * @returns {Builder}
   * @constructor
   */
//  this.AggregateReadWrite = function(placeholder, readWriter, aggregateFunc) {
//      if (typeof placeholder === 'string') {
//          placeholder = [placeholder];
//      }
//      // check here the reader parameter..
//      if (!isReadWriter(reader) || !isAggregateFunc(aggregateFunc)) {
//          return this;
//      } else {
//        // todo Check if the placeholder exists in global array because they have to be replaced by the aggregated ones.
//        var queryPart = '';
//          switch(readWriter) {
//              case this.CREATE:
//                  queryPart = ' CREATE ' + placeholder.map(function(val){
//                          "use strict";
//                          return glueForAggregation(this.CREATE, val) + ', ';
//                      });
//                  break;
//              case this.CREATE_UNIQUE:
//                  queryPart = ' CREATE UNIQUE ' + placeholder.map(function(val){
//                          "use strict";
//                          return glueForAggregation(this.CREATE_UNIQUE, val) + ', ';
//                      });
//                  break;
//              case this.MERGE:
//                  queryPart = ' MERGE ' + placeholder.map(function(val){
//                          "use strict";
//                          return glueForAggregation(this.MERGE, val) + ', ';
//                      });
//                  break;
//              case this.DELETE:
//                  queryPart = ' DELETE ' + placeholder.map(function(val){
//                          "use strict";
//                          return glueForAggregation(this.DELETE, val) + ', ';
//                      });
//                  break;
//              default:
//                  break;
//          }
//      }
//    return this;
//  };

  /**
   *
   * @param placeholder
   * @param aggregateFunc
   * @returns {Builder}
   * @constructor
   */
//  this.AggregateReturn = function(placeholder, aggregateFunc) {
//      if (typeof placeholder === 'string') {
//          placeholder = [placeholder];
//      }
//      // check here the reader parameter..
//      if (!isAggregateFunc(aggregateFunc)) {
//          return this;
//      } else {
//          placeholder.forEach(function(placeholder) {
//              "use strict";
//              QueryPlaceholders.push(glueForAggregation(aggregateFunc, placeholder));
//          });
//      }
//
//    return this;
//  };

  /**
   *
   * @param idName
   * @param additionalPlaceholders
   * @returns {Builder}
   */
//  this.createUniqueId = function(idName, additionalPlaceholders) {
//    if (!Array.isArray(additionalPlaceholders) || additionalPlaceholders.length == 0)
//      additionalPlaceholders = [idName];
//    else
//      additionalPlaceholders.unshift(idName);
//
//    queries.push(" MERGE (id:UniqueId{}) ON CREATE SET id.count = 1 ON MATCH SET id.count = id.count + 1 WITH id.count AS " + additionalPlaceholders.join(', ') + " ");
//    uniqueIds.push(idName);
//    return this;
//  };


    /**
     *
     * @param reader
     * @returns {boolean}
     */
//  var isReader = function(reader) {
//      reader = reader || 0;
//      if (typeof parseInt(reader) !== 'number')
//        return false;
//
//      switch(reader) {
//          case this.MATCH:
//          case this.OPTIONAL_MATCH:
//          case this.START:
//            return true;
//          break;
//          default:
//            return false;
//          break;
//      }
//  };

    /**
     *
     * @param readWriter
     * @returns {boolean}
     */
//  var isReadWriter = function(readWriter) {
//    readWriter = readWriter || 0;
//    if (typeof parseInt(readWriter) !== 'number') {
//      return false;
//    }
//
//    var me = this;
//    switch(readWriter) {
//      case me.CREATE:
//      case me.MERGE:
//      case me.CREATE_UNIQUE:
//      case me.DELETE:
//        return true;
//        break;
//      default:
//        return false;
//    }
//  };

    /**
     *
     * @param func
     * @returns {boolean}
     */
//  var isAggregateFunc = function (func) {
//    if (isNAN(parseInt(func)))
//      return false;
//
//    var me = this;
//    switch(func) {
//      case me.AGGREGATE_COUNT:
//      case me.AGGREGATE_SUM:
//      case me.AGGREGATE_AVG:
//      case me.AGGREGATE_MIN:
//      case me.AGGREGATE_MAX:
//      case me.AGGREGATE_COLLECT:
//      case me.AGGREGATE_FILTER:
//      case me.AGGREGATE_EXTRACT:
//        return true;
//      default:
//        return false;
//    }
//  };

  /**
   *
   * @param func
   * @param placeholder
   * @returns {string}
   */
//  var glueForAggregation = function(func, placeholder) {
//    var me = this;
//      if (isAggregateFunc(func)) {
//        switch(func) {
//          case me.AGGREGATE_COUNT:
//            return 'count(' + placeholder + ')';
//            break;
//          case me.AGGREGATE_SUM:
//            return 'sum(' + placeholder + ')';
//            break;
//          case me.AGGREGATE_AVG:
//            return 'avg(' + placeholder + ')';
//            break;
//          case me.AGGREGATE_MIN:
//            return 'min(' + placeholder + ')';
//            break;
//          case me.AGGREGATE_MAX:
//            return 'max(' + placeholder + ')';
//            break;
//          case me.AGGREGATE_COLLECT:
//            return 'collect(' + placeholder + ')';
//            break;
//          case me.AGGREGATE_FILTER:
//            return 'filter(' + placeholder + ')';
//            break;
//          case me.AGGREGATE_EXTRACT:
//            return 'extract(' + placeholder + ')';
//            break;
//          default:
//            break;
//        }
//      }
//    }
  };

/**
 *
 * @returns {Builder}
 */
Builder.singleton = function() {
  if (_.isNull(_instance) === true) {
    _instance = new Builder();
  }

  return _instance;
};

module.exports = Builder;