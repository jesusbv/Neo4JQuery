/**
 *
 * @constructor
 */
var Aggregation = function() {
  this.COUNT = 1;
  this.SUM = 2;
  this.AVG = 3;
  this.STDEV = 4;
  this.STDEVP = 5;
  this.MAX = 6;
  this.MIN = 7;
  this.COLLECT = 8;
  this.PERCENTILE_DISC = 9;
  this.PERCENTILE_CONT = 10;

  this.aggregation = [];
};

/**
 *
 * @param funcId
 * @param expression
 * @param distinct
 * @param value
 * @returns {Aggregation}
 */
Aggregation.prototype.AggregateResultsBy = function(funcId, expression, distinct, value) {
  expression = expression || null;
  distinct = (distinct);
  value = value || null;

  var me = this
    , aggregation = '';

  switch (funcId) {
    case me.COUNT:
      aggregation = ' count';
      break;
    case me.SUM:
      aggregation = ' sum';
      break;
    case me.AVG:
      aggregation = ' avg';
      break;
    case me.STDEV:
      aggregation = ' stdev';
      break;
    case me.STDEVP:
      aggregation = ' stdevp';
      break;
    case me.MAX:
      aggregation = ' max';
      break;
    case me.MIN:
      aggregation = ' min';
      break;
    case me.COLLECT:
      aggregation = ' collect';
      break;
    case me.PERCENTILE_DISC:
      aggregation = ' percentileDisc';
      if (value) expression += ', ' + value;
      break;
    case me.PERCENTILE_CONT:
      aggregation = ' percentileCont';
      if (value) expression += ', ' + value;
      break;
  }

  me.aggregation.push(aggregation + '(' + ((distinct) ? ' DISTINCT' : '') + expression + ')');
  return this;
};

/**
 *
 * @returns {string}
 */
Aggregation.prototype.get = function() {
  return this.aggregation.join(', ');
};

/**
 *
 * @returns {Aggregation}
 */
Aggregation.prototype.reset = function() {
  this.aggregation.length = 0;
  this.aggregation = [];
  return this;
};

/**
 *
 * @returns {Aggregation}
 */
Aggregation.instance = function() {
  return new Aggregation();
};

module.exports = Aggregation;