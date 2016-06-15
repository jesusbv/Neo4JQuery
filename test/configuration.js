var Driver = require('../src/Driver/Driver');

module.exports = {
  server: "bolt://192.168.2.101",
//  server: "bolt://192.168.101.87",
  endpoint: "/db/data/",
//  user: "neo4j",
  user: "root",
//  password: "macmon",
  password: "FamilyTreeGraph",
  port: 7475,
  type: Driver.DRIVER_TYPE_BOLT
};