"use strict";

var should = require('should')
  , neo4jGraph = require('./boot')
  , Builder = require('../src/Builder')
  , Driver = require('../src/Driver/Driver')
  , configuration = require('./configuration')
  , builder = neo4jGraph.Builder;

configuration.rest.type = Driver.DRIVER_TYPE_HTTP;

/**
 *
 */
describe('Test REST driver', function() {

  before(function() {
    // Close and clean all available connections.
    neo4jGraph.flushConnections();
    neo4jGraph.connect(configuration.rest);
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

  /**
   *
   */
  it('Test stable connection with default name', function(done) {
    neo4jGraph.execute({
      builder: builder,
      success: function(data) {
        should(data).be.not.null().and.be.an.Object();
        done();
      },
      error: function(e) {
        should(e).be.null().and.be.not.an.Object();
        done();
      },
      closeConnection: false,
      labelMap: {n: 'count(n)'}
    });
  });

  /**
   *
   */
  it ('Test connection error (with custom name)', function(done) {
    configuration.rest.connection = 'readOnlyConnection';
    neo4jGraph.flushConnections();
    neo4jGraph.connect(configuration.rest);

    neo4jGraph.execute({
      builder: builder,
      success: function(data) {
        should(data).be.null().and.not.be.an.Object();
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

  /**
   *
   */
  it ('Test stable connection (with custom name)', function(done) {
    neo4jGraph.execute({
      builder: builder,
      success: function(data) {
        should(data).be.not.null().and.be.an.Object();
        done();
      },
      error: function(e) {
        should(e).be.null();
        done();
      },
      connection: 'readOnlyConnection',
      closeConnection: false,
      labelMap: {n: 'count(n)'}
    });
  });
});