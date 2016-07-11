var Driver = require('../src/Driver/Driver');

module.exports = {
  bolt: {
    server: "192.168.2.101",
    user: "neo4j",
    password: "neo4j",
    port: 7475
  },
  rest: {
    server: "192.168.2.101",
    protocol: 'http:',
    endpoint: "/db/data/",
//    user: "neo4j",
//    password: "neo4j",
    port: 7474
  },
  type: Driver.DRIVER_TYPE_BOLT
};