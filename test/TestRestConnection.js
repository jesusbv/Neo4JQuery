"use strict";

var should = require('should')
  , neo4jGraph = require('./boot')
  , Builder = require('../src/Builder')
  , Driver = require('../src/Driver/Driver')
  , configuration = require('./configuration');

describe('Test REST driver', function() {

  it('Test stable connection with default name', function(done) {
    neo4jGraph.flushList();

    configuration.rest.type = Driver.DRIVER_TYPE_HTTP;
    neo4jGraph.connect(configuration.rest);

    var builder = neo4jGraph.Builder;

    should(builder).be.not.null().and.be.instanceof(Builder);

    builder
      .reset()
      .Match('n', '', {}, false);

    neo4jGraph.execute({
      builder: builder,
      success: function(data) {
        should(data).be.not.null().and.be.an.Object();
        done();
      },
      error: function(error) {
        console.log(error);
        done();
      },
      closeConnection: false,
      labelMap: {n: 'count(n)'}
    });
  });

  it ('Test connection error (with custom name)', function(done) {
    neo4jGraph.flushList();

    configuration.rest.connection = 'readOnlyConnection';
    configuration.rest.type = Driver.DRIVER_TYPE_HTTP;

    neo4jGraph.connect(configuration.rest);

    var builder = neo4jGraph.Builder;

    should(builder).be.not.null().and.be.instanceof(Builder);

    builder
      .reset()
      .Match('n', '', {}, false);

    neo4jGraph.execute({
      builder: builder,
      success: function(data) {
        should(data).be.not.null().and.be.an.Object();

        done();
      },
      error: function(error) {
//        console.log(error);
        done();
      },
      connection: 'default',
      closeConnection: false,
      labelMap: {n: 'count(n)'}
    });
  });

  it ('Test stable connection (with custom name)', function(done) {
    neo4jGraph.flushList();

    configuration.rest.connection = 'readOnlyConnection';
    configuration.rest.type = Driver.DRIVER_TYPE_HTTP;

    neo4jGraph.connect(configuration.rest);

    var builder = neo4jGraph.Builder;

    should(builder).be.not.null().and.be.instanceof(Builder);

    builder
      .reset()
      .Match('n', '', {}, false);

    neo4jGraph.execute({
      builder: builder,
      success: function(data) {
        should(data).be.not.null().and.be.an.Object();

        done();
      },
      error: function(error) {
        console.log(error);
        done();
      },
      connection: 'readOnlyConnection',
      closeConnection: false,
      labelMap: {n: 'count(n)'}
    });
  });
});