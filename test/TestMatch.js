"use strict";

var should = require('should')
  , ring = require('ring')
  , configuration = require('./configuration')
  , LinkedList = require('node-linkedlist')
  , neo4jquery = require('../src/neo4jquery').singleton()
  , Builder = neo4jquery.Builder;

describe('Test match functionality', function() {
  beforeEach(function(done) {
    neo4jquery.connect(configuration);
    Builder.reset();
    done();
  });

  afterEach(function(done) {
    neo4jquery.close('default');
    done();
  });

  it('Test the match method and relate to other nodes.', function(done) {
    Builder.reset()
      .Match('u', 'User', {})
      .relate('r', 'HAS_PHONE_NUMBER', {})
      .toNode('p', 'PhoneNumber', {})
      .relate('r2', 'HAS_NO_PHONE_NUMBER', {})
      .toNode('u2', 'User');

    neo4jquery.execute({
      builder: Builder,
      cache: false,
      success: function(resultList) {
        should(ring.instance(resultList, LinkedList)).be.not.null().and.be.a.Boolean().and.be.true();
//        should(resultList.size).be.equal(2);
        var first = resultList.first();
        console.log(first);

        /**
         * A neo4j-driver record looks like the below structure.
         * The field "_fields" holds an array with the results. That can be a node or a relationship.
         * So to get information from the result set one has to handle indexes in an array.
         * Both objects holds a property "properties" with the needed information.
         * The id of the object is placed in "identity.low".
         * The label of a node you can grab from the property "label" but from a relationship the property is called "type".
         */
        /**
         * Record {
         * _fields: [
         *    Node {
         *        identity: Integer {
         *          low: 0,
         *           high: 0
         *        },
         *        labels: [
         *          'User'
         *        ],
         *        properties: {
         *          password: Integer {
         *            low: 34,
         *            high: 0
         *          }
         *        }
         *      }
         *    ]
         *  }
         */
        done();
      },
      error: function(err) {
        console.log(err);
        done();
      }
    });
  });
});