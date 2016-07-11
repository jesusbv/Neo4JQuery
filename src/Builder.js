"use strict";

var _instance = null
  , _ = require('underscore')
  , LinkedList = require('node-linkedlist');

/**
 * @todo Implement options objects as method signature to pass in parameter into builder methods.
 */
var Builder = function() {
  var _start = ''
    , _queries = []
    , _queryPlaceholders = []
    , _uniqueIds = []
    , _parameters = {}
    , _counter = 0;

  this.MATCH = 1;
  this.OPTIONAL_MATCH = 2;
  this.START = 3;
  this.CREATE = 4;
  this.CREATE_UNIQUE = 5;
  this.DELETE = 6;
  this.MERGE = 7;
  
  this.AGGREGATE_SUM = 1;
  this.AGGREGATE_COUNT = 2;
  this.AGGREGATE_AVG = 3;
  this.AGGREGATE_MIN = 4;
  this.AGGREGATE_MAX = 5;
  this.AGGREGATE_COLLECT = 6;
  this.AGGREGATE_FILTER = 7;
  this.AGGREGATE_EXTRACT = 8;

  /**
   *
   * @param labelMap
   * @returns {string}
   */
  this.getQuery = function(labelMap) {
    labelMap = (labelMap && !_.isEmpty(labelMap)) ? _.keys(labelMap) : [];

    var me = this
      , query = (_start != '') ? _start : '';

    if (me.hasQueries()) {
      // Concat all queries.
      query += _queries.join('');

      // Get the placeholders for return them...
      if (labelMap.length == 0 && Array.isArray(_queryPlaceholders) && _queryPlaceholders.length > 0) {
        // Return placeholders.
        query += ' RETURN ' + _queryPlaceholders.join(', ');
      } else {
        // ... or have given placeholder to return.
        labelMap = _.unique(labelMap);
        query += ' RETURN ' + labelMap.join(', ');
      }
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
    return (_queries.length > 0);
  };

  /**
   *
   * @param placeholder
   * @param label
   * @param parameter
   * @constructor
   */
  this.Start = function(placeholder, label, parameter) {
    placeholder = placeholder || 'ph';
    label = label || '';
    parameter = parameter || {};

    _start = this.getNodeQuery(placeholder, label, parameter, this.START);
    _queryPlaceholders.push(placeholder);
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
      _queries.push(this.getNodeQuery(placeholder, label, parameters, this.OPTIONAL_MATCH));
    else
      _queries.push(this.getNodeQuery(placeholder, label, parameters, this.MATCH));

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

      _queries.push(query);

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

    _queries.push(query);
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
    _queries.push(this.getNodeQuery(placeholder, label, parameter, null));
    _queryPlaceholders.push(placeholder);
    return this;
  };

  /**
   *
   * @param placeholder
   * @param label
   * @param unique
   * @param parameter
   * @returns {Builder}
   */
  this.Create = function(placeholder, label, unique, parameter) {
    placeholder = placeholder || '';
    label = label || '';
    parameter = parameter || {};
    if (unique === true) _queries.push(this.getNodeQuery(placeholder, label, parameter, this.CREATE_UNIQUE));
    else _queries.push(this.getNodeQuery(placeholder, label, parameter, this.CREATE));
    _queryPlaceholders.push(placeholder);
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
   *
   * @param placeholder
   * @param label
   * @param parameter
   * @returns {Builder}
   */
  this.UniqueCreate = function(placeholder, label, parameter) {
    return this.Create(placeholder, label, true, parameter);
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
    _queries.push(this.getNodeQuery(placeholder, label, parameter, this.MERGE));
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
      , getAction = function(action) {
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
            case me.CREATE_UNIQUE:
              return ' CREATE UNIQUE ';
              break;
            default:
              return '';
              break;
          }
        }
      , query = getAction(action);


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

      _queries.push(string);
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
      _queries.push(string);

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
      _queries.push(string);

    return this;
  };

  /**
   * X
   * @param placeholder
   * @returns {Builder}
   */
  this.Delete = function(placeholder) {
    placeholder = placeholder || null;

    if (!_.isNull(placeholder)) {
      var string = '';
      if (typeof placeholder === 'string') {
        string += ' DELETE ' + placeholder;
      } else if (Array.isArray(placeholder) && placeholder.length > 0) {
        string += ' DELETE ' + placeholder.join(', ');
      }

      if (string !== '') {
        _queries.push(string);
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
      _queries.push(string);
    }

    return this;
  };

  /**
   * X
   * @param condition
   * @param parameter
   * @returns {Builder}
   */
  this.Where = function(condition, parameter) {
    condition = condition || null;
    parameter = parameter || null;

    if (!_.isNull(condition) && typeof condition === 'string')
      _queries.push(' WHERE ' + condition);

    if (!_.isNull(parameter))
      _parameters = _.extend(_parameters, parameter);

    return this;
  };

  this.WhereIn = function(values) {
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

      _queries.push(string);
    }

    return this;
  };

  this.OrderBy = function(orders) {
    return this;
  };

  this.Skip = function(number) {
    return this;
  };

  this.Limit = function(limit) {
    return this;
  };

  /**
   * Removes the label from the given placeholder
   * @param placeholder
   * @param label
   * @returns {Builder}
   * @constructor
   */
  this.Remove = function(placeholder, label) {
    return this;
  };

  /**
   * Use the map to be returned instead of the placeholder or the aliases map.
   * @param map
   * @returns {Builder}
   * @constructor
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
      _queries.push(string);
    }

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
   * X
   * @returns {Builder}
   */
  this.reset = function() {
    _queryPlaceholders = [];
    _queries = [];
    _uniqueIds.length = 0;

    return this;
  };

  /**
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