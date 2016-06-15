var configuration = require('./configuration')
  , neo4jquery = require('../src/neo4jquery').singleton(configuration);

module.exports = neo4jquery;