var configuration = require('./configuration')
  , seraph = require('seraph')(configuration)
  , neo4jquery = require('../src/neo4jquery').setConnection(seraph);

module.exports = neo4jquery;