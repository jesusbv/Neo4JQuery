var _instance = null
  , Functions = function() {
    this.PREDICATE_FUNCTION_ALL = 1;
    this.PREDICATE_FUNCTION_ANY = 2;
    this.PREDICATE_FUNCTION_NONE = 3;
    this.PREDICATE_FUNCTION_SINGLE = 4;
  };


// Predicate functions


/**
 *
 * @param funcId
 * @param variable
 * @param list
 * @param predicate
 * @returns {string}
 */
Functions.prototype.PredicateFunction = function(funcId, variable, list, predicate) {
  variable = variable || null;
  list = list || null;
  predicate = predicate || null;

  var me = this
    , query = '';

  if (typeof list === 'string') {
    var func = '';

    if (!variable) variable = 'dummyVariable2';
    if (predicate) predicate = variable + '.'+ predicate;

    query = ' NONE ( ' + variable + ' IN ' + list + ((predicate !== null ) ? ' WHERE ' + predicate : '');

    switch(funcId) {
      case me.PREDICATE_FUNCTION_ALL:
        func = ' ALL ';
        break;
      case me.PREDICATE_FUNCTION_ANY:
        func = ' ANY ';
        break;
      case me.PREDICATE_FUNCTION_NONE:
        func = ' NONE ';
        break;
      case me.PREDICATE_FUNCTION_SINGLE:
        func = ' SINGLE ';
        break;
    }

    query = func + query;
  }



  return query;
};
/**
 *
 * @param pattern
 * @returns {string}
 * @constructor
 */
Functions.prototype.Exists = function(pattern) {
  pattern = pattern || null;

  var query = '';

  if (pattern)

  return query;
};

// Scalar functions
// Size of lists or expressions
Functions.prototype.Size = function() {};
// Path length or string length
Functions.prototype.Length = function() {};
// Type of relationship
Functions.prototype.Type = function() {};
// Node id
Functions.prototype.Id = function() {};
Functions.prototype.Coalesce = function() {};
// First element in a list
Functions.prototype.Head = function() {};
// Last element in a list.
Functions.prototype.Last = function() {};
Functions.prototype.Timestamp = function() {};
// The starting node of a relationship
Functions.prototype.StartNode = function(relationship) {};
// The end node of a relationship
Functions.prototype.EndNode = function(relationship) {};
Functions.prototype.Properties = function() {};
Functions.prototype.ToINt = function() {};
Functions.prototype.ToFloat = function() {};

// List functions
Functions.prototype.Nodes = function() {};
Functions.prototype.Relationships = function() {};
Functions.prototype.Labels = function() {};
Functions.prototype.Keys = function() {};
Functions.prototype.Extract = function() {};
Functions.prototype.Filter = function() {};
Functions.prototype.Tail = function() {};
Functions.prototype.Range = function() {};
Functions.prototype.Reduce = function() {};

// Math functions
Functions.prototype.Abs = function() {};
Functions.prototype.Ceil = function() {};
Functions.prototype.Floor = function() {};
Functions.prototype.Round = function() {};
Functions.prototype.Sign = function() {};
Functions.prototype.Rand = function() {};
// Logarithmic functions
Functions.prototype.Log = function() {};
Functions.prototype.Log10 = function() {};
Functions.prototype.Exp = function() {};
Functions.prototype.E = function() {};
Functions.prototype.Sqrt = function() {};
// Trigonometric function
Functions.prototype.Sin = function() {};
Functions.prototype.Cos = function() {};
Functions.prototype.Tan = function() {};
Functions.prototype.Cot = function() {};
Functions.prototype.Asin = function() {};
Functions.prototype.Acos = function() {};
Functions.prototype.Atan = function() {};
Functions.prototype.Atan2 = function() {};
Functions.prototype.PI = function() {};
Functions.prototype.Degrees = function() {};
Functions.prototype.Radians = function() {};
Functions.prototype.HaverSin = function() {};

// String functions
Functions.prototype.Replace = function() {};
Functions.prototype.Substring = function() {};
Functions.prototype.Left = function() {};
Functions.prototype.Right = function() {};
Functions.prototype.LTrim = function() {};
Functions.prototype.RTrim = function() {};
Functions.prototype.Trim = function() {};
Functions.prototype.Lower = function() {};
Functions.prototype.Upper = function() {};
Functions.prototype.Split = function() {};
Functions.prototype.Reverse = function() {};
Functions.prototype.ToString = function() {};

Functions.Create = function() {
  if (null === _instance) _instance = new Functions();
  return _instance;
};