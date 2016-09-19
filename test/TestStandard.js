var should = require('should')
  , neo4jGraph = require('./boot')
  , Builder = require('../src/Builder')
  , Driver = require('../src/Driver/Driver')
  , configuration = require('./configuration')
  , builder = neo4jGraph.Builder;

describe('Test match functionality', function() {

  /**
   *
   */
  before(function() {
//    // Close and clean all available connections.
//    neo4jGraph.flushConnections();
//    configuration.bolt.type = Driver.DRIVER_TYPE_BOLT;
//    neo4jGraph.connect(configuration.bolt);
  });

  /**
   *
   */
  beforeEach(function() {
    // Build standard cypher to test connection.
    builder
      .reset();
  });

  /**
   * Merge a user (create one and then get the new one)
   */
  it('Test merge', function(done) {
    // Close and clean all available connections.
    neo4jGraph.flushConnections();
    configuration.bolt.type = Driver.DRIVER_TYPE_BOLT;
    configuration.bolt.connection = 'default';
    neo4jGraph.connect(configuration.bolt);

    // Create new user.
    builder
      .Merge('u', 'User', {firstName: 'Gabi', lastName: 'Glubsch', password: 'test'});

    neo4jGraph.execute({
      builder: builder,
      success: function(data) {
        should(data).be.not.null().and.be.an.Object();
        // Match the new user
        builder.reset().Match('u', 'User', {firstName: 'Gabi', lastName: 'Glubsch', password: 'test'});

        neo4jGraph.execute({
          builder: builder,
          success: function(data) {
            // Check the matched user.
            should(data).be.not.null().and.be.an.Object();
            should(data.u).be.not.null().and.be.an.Object();
            should(data.u.firstName).be.not.null().and.be.a.String().and.be.equal('Gabi');
            should(data.u.lastName).be.not.null().and.be.a.String().and.be.equal('Glubsch');
            should(data.u.password).be.not.null().and.be.a.String().and.be.equal('test');
            done();
          },
          error: function(e) {
            should(e).be.not.null().and.be.an.Object();
            should(e.error.message).be.not.undefined().and.be.a.String();
            done();
          },
          closeConnection: false
        });
        done();
      },
      error: function(e) {
        should(e).be.not.null().and.be.an.Object();
        should(e.error.message).be.not.undefined().and.be.a.String();
        done();
      },
      closeConnection: false
    });
  });

  /**
   *
   */
  it('Test the "match" method with Bolt', function(done) {
    builder
      .Match('u', 'User', {firstName: 'Gabi'}, false);

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
      closeConnection: false
    });
  });

  /**
   *
   */
  it('Test the "match" and "where"', function(done) {
    builder
      .Match('u', 'User', {}, false)
      .Where('u.firstName = {firstName}', {firstName: 'Gabi'});

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
      closeConnection: false
    });
  });

  /**
   *
   */
  it('Test the "match ... with ... merge ... related to ..."', function(done) {
    builder
      .Match('u', 'User', {}, false)
      .With(['u'])
      .Merge('u2', 'User', {firstName: 'Hermine', lastName: 'Grufford', username: 'hgruf', password: 'test'})
      .relate('r1', 'IS_FRIEND', {})
      .toNode('u', 'User', null);

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
      closeConnection: false
    });
  });

  /**
   *
   */
  it('Test the "start" with "match" and "set"', function(done) {
    builder
      .Start('u=nodes()', {})
      .Match('u')
      .Set('u.found = {found}, u.registered = {registered}', {found: true, registered: true});

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
      labelMap: {u: 'u'}
    });
  });

  /**
   *
   */
  it('Test "match", "relate" and "toNode"', function(done) {
    builder
      .Match('u', 'User', {}, false)
      .relate('r1', 'IS_FRIEND', {})
      .toNode('u2', 'User', {username: 'hgruf', password: 'test'});

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
      closeConnection: false
    });
  });

  /**
   *
   */
  it('Test "match" with "case"', function(done) {
    builder
      .Match('u', 'User', {})
      .Case()
      .When('hgruf', 'u.username')
      .Then(2)
      .When('Hermine', 'u.firstName')
      .Then(1)
      .Else(0)
      .End();

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
      labelMap: {u: 'u'}
    });
  });

  it('Test "match" with "return" and "functions" use.', function(done) {
    builder
      .Match('u', 'User', {})
      .Where('u.firstName = {firstName1} OR u.firstName = {firstName2}', {firstName1: "Hermine", firstName2: "Gabi"})
      .Return([
        builder.Functions.Size('u')
      ]);
    done();
  });

  it('', function(done) {
    done();
  });

});