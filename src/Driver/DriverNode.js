"use strict";

var _ = require('underscore')
  , async = require('async')
  , ring = require('ring')
  , Bolt = require('./Bolt')
  , Rest = require('./Rest');
   
var DriverNode = function() {
  this._name = null;
  this._driver = null;
  this._next = null;
  this._previous = null;
};

DriverNode.prototype.setName = function(connectionName) {
  if (typeof connectionName === 'string') {
    this._name = connectionName;
  }

  return this;
};

DriverNode.prototype.getName = function() {
  return this._name;
};
/**
 *
 * @param driver {Bolt|Rest}
 * @returns {DriverNode}
 */
DriverNode.prototype.setDriver = function(driver) {
  if (ring.instance(driver, Bolt) || ring.instance(driver, Rest)) {
    this._driver = driver;
  }
  return this;
};

/**
 *
 * @returns {null|DriverNode}
 */
DriverNode.prototype.getDriver = function() {
  return this._driver;
};

/**
 * Set a specific object to be the previous object in a chain.
 *
 * @param previousNode {ListNode}
 * @returns {ListNode}
 */
DriverNode.prototype.setPrevious = function(previousNode) {
  this._previous = previousNode;
  return this;
};

/**
 * Get the previous object.
 *
 * @returns {ListNode}
 */
DriverNode.prototype.previous = function() {
  return this._previous;
};

/**
 * Set a specific object to be the next in the chain.
 *
 * @param nextNode {ListNode}
 * @returns {ListNode}
 */
DriverNode.prototype.setNext = function(nextNode) {
  this._next = nextNode;
  return this;
};

/**
 * Get the next object in the chain.
 *
 * @returns {ListNode}
 */
DriverNode.prototype.next = function() {
  return this._next;
};


/**
 *
 * @returns {boolean}
 */
DriverNode.prototype.hasPrevious = function() {
  return (this._previous !== null);
};


/**
 *
 * @returns {boolean}
 */
DriverNode.prototype.hasNext = function() {
  return (this._next !== null);
};

DriverNode.Create = function(driver) {
  var node = new DriverNode();
  if (driver !== null) node.setDriver(driver);
  return node;
};

module.exports = DriverNode;