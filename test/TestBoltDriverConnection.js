"use strict";

var should = require('should')
  , neo4jGraph = require('./boot')
  , builder = neo4jGraph.Builder
  , Builder = require('../src/Builder')
  , Driver = require('../src/Driver/Driver')
  , configuration = require('./configuration');

configuration.bolt.type = Driver.DRIVER_TYPE_BOLT;

/**
 *
 */
describe('Test Bold driver', function() {

  /**
   *
   */
  before(function() {
    // Close and clean all available connections.
    neo4jGraph.flushConnections();
    neo4jGraph.connect(configuration.bolt);
  });

  /**
   *
   */
  beforeEach(function() {
    // Build standard cypher to test connection.
    builder
      .reset()
      .Match('n', '', {}, false);
  });

  it('Test stable connection with default name', function(done) {
    neo4jGraph.execute({
      builder: builder,
      success: function(data) {
        should(data).be.not.null().and.be.an.Object();
        done();
      },
      error: function(e) {
        should(e).be.not.null().and.be.an.Object();
        should(e.error.message).be.not.undefined().and.be.a.String();
        done();
      },
      closeConnection: false,
      labelMap: {n: 'count(n)'}
    });
  });

  it('Test connection error with custom name', function(done) {
    neo4jGraph.flushConnections();
    configuration.bolt.connection = 'readOnlyConnection';
    neo4jGraph.connect(configuration.bolt);

    neo4jGraph.execute({
      builder: builder,
      success: function(data) {
        should(data).be.not.null().and.be.an.Object();
        done();
      },
      error: function(e) {
        should(e).be.not.null().and.be.an.Object();
        should(e.error.message).be.not.undefined().and.be.a.String();
        done();
      },
      connection: 'default',
      closeConnection: false,
      labelMap: {n: 'count(n)'}
    });
  });

  it('Test stable connection with custom name', function(done) {
    configuration.bolt.connection = 'readOnlyConnection';

    neo4jGraph.execute({
      builder: builder,
      success: function(data) {
        should(data).be.not.null().and.be.an.Object();
        done();
      },
      error: function(error) {
        should(e).be.not.null().and.be.an.Object();
        should(e.error.message).be.not.undefined().and.be.a.String();
        done();
      },
      connection: 'readOnlyConnection',
      closeConnection: true,
      labelMap: {n: 'count(n)'}
    });
  });
});