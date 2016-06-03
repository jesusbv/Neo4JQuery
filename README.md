<h1>Neo4jQuery</h1>

Tool that handles cypher syntax as method calls.

<h2>What is Neo4jQuery?</h2>

<i>Neo4JQuery</i> is an implementation made to to use the query language <i>Cypher</i> of the graph database <i>Neo4J</i> only.

<h2>Why Neo4jQuery</h2>

The library provides the strength of <i>Cypher</i> to use batch functionality like multiple matches and merges and creating relationships
in one query.

It is also made to be more like programming a <i>Cypher</i> query than have lots of <i>Cypher</i> strings in the code which could be confusing.

Therefor you have lots of methods available in the query builder object which can be chained and is looking like a real <i>Cypher</i> command
in the end.

<h2>How to use</h2>

<h3>Import into your own <i>NodeJS</i> project</h3>

- Add the <i>neo4jquery</i> module to the dependencies list in your project <i>package.json</i> file.
- Execute `npm install` to pull the module and install it in your project.

<h3>Install globally</h3>

- If you need it globally use __npm -g install neo4jquery__.

<h3>... and then</h3>

- Also install a driver module like `seraph` via __npm install seraph__ (The driver needs a method query with parameter 'query', 'parameter' and 'callback').
- Import both, <i>seraph</i> and <i>Neo4JQuery</i>, with <i>require</i> and connect to your <i>Neo4J</i> graph database.

<h3>Quick example to get connection</h3>
```javascript
var seraph = require("seraph")({
      server: "http://127.0.0.1:7474",
      endpoint: "/data/graph.db",
      user: "testuser",
      pass: "testpass"
      })
  , graph = require("neo4jquery").setConnection(seraph);

```

<h2>Documentation</h2>

<h3>Graph</h3>
<a name="setConnection" />
<h4>setConnection(connection)</h4>

Sets a driver which is connected to a <i>Neo4J</i> database.
The only requirement is that the driver implements a method called 'query'.

<strong>Arguments</strong>

* `connection` (object) - A driver with a connection to a Neo4J database

<strong>Example</strong>

```javascript
var graph = require("neo4jquery").setConnection(<driver object>);
```

<a name="query" />
<h4>Query(query, parameters, callback)</h4>

Executes a passed-in query directly. Using parameters for parameterized cypher queries.

<strong>Arguments</strong>

* `query` (string) - The cypher query to be executed.
* `parameters` (object) - Parameters for parameterized queries.
* `callback` (function) - Callback function with parameters 'error' and 'array list'.

<strong>Example</strong>

```javascript
var graph = require("neo4jquery").setConnection(<driver object>)
  , query = "MATCH (n:Node {field1: {v1}})-[r1:IS_LABEL]-(n2:Node2 {field2: {v2}}) RETURN n"
  , parameters = {v1: "value1", v2: "value2"}

  graph.Query(query, parameters, function(err, list) {
      if (err || void 0 === list) {
        callback(err, void 0);
      } else {
        // some stuff here with list
        var user = list[0];
      }
    });
```

<a name="call" />
<h4>Call(domain[, procedureName], callback)</h4>

Calls a stored procedure in the graph database (available at v3.0 of Neo4J).
It is also possible to pass-in the two parts of the procedure name only in domain like `domain = 'com.example.test.lib.hasRelation()'`.

<strong>Arguments</strong>

* `domain` (string) - The domain part of the stored procedure like 'com.example.test.lib'.
* `procedureName` (string) - The name of the procedure as function call ('hasRelation()').
* `callback` (function) - Callback function with parameters 'error' and result as array list.

<strong>Example</strong>

```javascript
var graph = require("neo4jquery").setConnection(<driver object>)
  , domain = "com.example.test.lib"
  , procedureName = "hasRelation()";

  graph.Call(domain, procedureName, function(err, list) {
      if (err || void 0 === list) {
        callback(err, void 0);
      } else {
        // some stuff here with list
        var user = list[0];
      }
    });
```

Or you can shorten the call by using this:

```javascript
var graph = require("neo4jquery").setConnection(<driver object>)
  , completeProcedureName = "com.example.test.lib.hasRelation()";

  graph.Call(completeProcedureName, function(err, list) {
      if (err || void 0 === list) {
        callback(err, void 0);
      } else {
        // some stuff here with list
        var user = list[0];
      }
    });
```

<a name="builder" />
<h4>Builder</h4>

The Cypher builder object.

<strong>Arguments</strong>

* No arguments

<strong>Example</strong>

```javascript
var graph = require("neo4jquery").setConnection(<driver object>)
  , builder = graph.Builder;

  ...
  ...
```

<a name="run" />
<h4>run(builder[, cached], callback)</h4>

Sets conditions to find specific nodes or relationships.

<strong>Arguments</strong>

* `builder` (Builder) - Cypher query builder object.
* `cached` (bool) - Flag to use the last cypher query.
* `callback` (function) - The callback function. Parameter of this function are first an error object and second an array as resultset.

<strong>Example</strong>

```javascript
var graph = require("neo4jquery").setConnection(<driver object>)
  , builder = graph.Builder();

  builder
    .reset()
    .Match('n', 'User')
    .Where("n.username={username} and n.password={password}", {username: "testuser", password: "testpass"})

  graph.run(builder, false, function(err, list) {
    if (err || void 0 === list) {
      callback(err, void 0);
    } else {
      /**
       * list is here [{u: {username:..., password:..., fieldN:...}}]
       */
      // some stuff here with list
      var user = list[0];
    }
  });
```

<a name="execute" />
<h4>execute(options)</h4>

Executes the query and returns result set.

<strong>Arguments</strong>

* `options` (Object) - An config object with needed settings.
- `builder` (Builder) - The Cypher query builder you created the query with.
- `cached` (boolean) - Flag set to false for default. Set to true Neo4JQuery will use the last cached query for execution.
- `aliases` (Object) - Setting with aliases for the returned result placeholder
- `success` (function) - Callback function used if query was successful.
- `error` (function) - Callback function used if query was unsuccessful.

<strong>Example</strong>

```javascript
var graph = require("neo4jquery").setConnection(<driver object>)
  , builder = graph.Builder();

    builder
      .reset()
      .Match('u', 'User', {username: "testuser", password: "testpass"});

    graph.execute({
      builder: builder,
      cached: false,
      aliases: {
        u: 'user'
      },
      success: function(results) {
        /**
         * results is here [{user: {username:..., password:..., fieldN:...}}]
         */
      },
      error: function(err) {...}
    });
```

<h3>Cypher Builder

<a name="reset" />
<h4>reset()</h4>

Resets the builder object (inclusive cached query). Should be used to be as first method in the chain when you get the builder object.

<strong>Arguments</strong>

* No arguments

<strong>Example</strong>

```javascript
var graph = require("neo4jquery").setConnection(<driver object>)
  , builder = graph.Builder();

  builder.reset();
```

<a name="match" />
<h4>Match(placeholder, label, optional, parameters)</h4>
Matches data specified through labels and parameters and bound to the placeholder.

<strong>Arguments</strong>

* `placeholder` (string) - The placeholder of the node or relationship.
* `label` (string) - The labels which are assigned to nodes.
* `optional` (boolean) - Flag to use 'OPTIONAL MATCH'. Default is `false`.
* `parameters` (object) - Parameters to filter nodes.

<strong>Example</strong>

```javascript
var graph = require("neo4jquery").setConnection(<driver object>)
  , builder = graph.Builder();

  builder
    .reset()
    .Match('n', 'node', false, {field1: '...', field2: '...'});

  graph.execute({
    builder: builder,
    cached: false,
    aliases: {
      n: 'node'
    },
    success: function(results) {
      /**
       * results is here [{node: {field1:..., field2:..., fieldN:...}}]
       */
     },
    error: function(err) {...}
  });
```

<a name="optionalmatch" />
<h4>OptionalMatch(placeholder, label, parameters)</h4>

Matches data specified through labels and parameters and bound to the placeholder.
If there is no information found the placeholder will be null.

<strong>Arguments</strong>

* `placeholder` (string) - The placeholder of the node or relationship.
* `label` (string) - The labels which are assigned to nodes.
* `optional` (boolean) - Flag to use 'OPTIONAL MATCH'. Default is `false`.
* `parameters` (object) - Parameters to filter nodes.

<strong>Example</strong>

```javascript
var graph = require("neo4jquery").setConnection(<driver object>)
  , builder = graph.Builder();

  builder
    .reset()
    .OptionalMatch('n', 'node', {field1: '...', field2: '...'});

  graph.execute({
    builder: builder,
    cached: false,
    aliases: {
      n: 'node'
    },
    success: function(results) {
      /**
       * "results" is here [{node: {field1:..., field2:..., fieldN:...}}]
       * If there was no match the result is an empty array.
       */
     },
    error: function(err) {...}
  });
```

<a name="merge" />
<h4>Merge(placeholder, label, parameters)</h4>
Try to create and insert new node with given parameters and label.

<strong>Arguments</strong>

* `placeholder` (string) - The placeholder of the node.
* `label` (string) - The labels which are assigned to the node.
* `parameters` (object) - Parameters of the node.

<strong>Example</strong>

```javascript
var graph = require("neo4jquery").setConnection(<driver object>)
  , builder = graph.Builder();

  builder
    .reset()
    .Merge('u', 'User', {field1: '...', field2: '...', createdAt: 120987654321});

  graph.execute({
    builder: builder,
    cached: false,
    aliases: {
      u: 'user'
    },
    success: function(results) {
      /**
       * "results" is here [{user: {field1:..., field2:..., createdAt: 120987654321}}]
       */
    },
    error: function(err) {...}
  });
```

<a name="mergerelationship" />
<h4>MergeRelationShip(nodes, placeholder, label, parameters)</h4>
Try connect two nodes with a relationship with given information.


<strong>Arguments</strong>

* `nodes` (array) - The placeholder of the nodes which has to be connected with each other.
* `placeholder` (string) - The placeholder of the relationship.
* `label` (string) - The labels which are assigned to the relationship.
* `parameters` (object) - Parameters of the relationship.

<strong>Example</strong>

```javascript
// Here the first value in the nodes array points to the second value 
// via relationship 'ASSIGNED_WITH_EACH_OTHER'!
var graph = require("neo4jquery").setConnection(<driver object>)
  , builder = graph.Builder();

  builder
    .reset()
    .Match('u', 'User', false, {field1: ..., field2: ...})
    .With(['u'])
    .Merge('n', 'Node', false, {field3: '...', field4: '...', createdAt: 120987654321})
    .With(['u', 'n'])
    .MergeRelationShip(['n', 'u'], 'r', 'ASSIGNED_WITH_EACH_OTHER', {field5: '...', field6: '...'});

  graph.execute({
    builder: builder,
    cached: false,
    aliases: {
      u: 'user',
      n: 'node',
      r: 'relation'
    },
    success: function(results) {
      /**
       * "results" is here:
          [
            {user: {field1:..., field2:..., createdAt: 120987654321}},
            {node: {field3: '...', field4: '...', createdAt: 120987654321}},
            {relation: {field5: '...', field6: '...'}}
          ]
       */
    },
    error: function(err) {...}
  });
```

<a name="oncreate" />
<h4>onCreate(command)</h4>
Event used with _Merge_ to be executed if _Merge_ creates a new node/relationship.


<strong>Arguments</strong>

* `command` (string) - The command like _SET_ followed by what to do.

<strong>Example</strong>

```javascript
var graph = require("neo4jquery").setConnection(<driver object>)
  , builder = graph.Builder();

  builder
    .reset()
    .Merge('u', 'User', {field1: ..., field2: ...})
    .relate('r1', 'GUESSED_RELATIONSHIP')
    .toNode('n', 'Note', {field3: ..., field4: ...})
    .onCreate('SET u.createdAt=timestamp(), n.createdAt=timestamp()');

  graph.execute({
    builder: builder,
    cached: false,
    aliases: {
      u: 'user',
      n: 'node'
    },
    success: function(results) {
      /**
       * "results" is here:
       * [
       *   {user: {field1:..., field2:..., createdAt: 120987654321}},
       *   {node: {field3: '...', field4: '...', createdAt: 120987654321}}
       * ]
       */
    },
    error: function(err) {...}
  });
```

<a name="onmatch" />
<h4>onMatch(command)</h4>
Event used with _Merge_ to be executed if _Merge_ matches a node.


<strong>Arguments</strong>

* `command` (string) - The command like _SET_ followed by what to do.

<strong>Example</strong>

```javascript
var graph = require("neo4jquery").setConnection(<driver object>)
  , builder = graph.Builder();

  builder
    .reset()
    .Merge('u', 'User', {field1: ..., field2: ...})
    .relate('r1', 'GUESSED_RELATIONSHIP')
    .toNode('n', 'Note', {field3: ..., field4: ...})
    .onMatch('SET u.visited=timestamp(), n.visited=timestamp()');

  graph.execute({
    builder: builder,
    cached: false,
    aliases: {
      u: 'user',
      n: 'node'
    },
    success: function(results) {
      /**
       * "results" is here:
       * [
       *   {user: {field1:..., field2:..., createdAt: 120987654321}},
       *   {node: {field3: '...', field4: '...', createdAt: 120987654321}}
       * ]
       */
    },
    error: function(err) {...}
  });
```

<a name="delete" />
<h4>Delete(placeholder)</h4>
Deletes all the given nodes/relationships.
Please take care of the order of relationships and nodes you want to remove.

<strong>Arguments</strong>

* `placeholder` (string|array) - The placeholder of node/nodes to be deleted.

<strong>Example</strong>

```javascript
var graph = require("neo4jquery").setConnection(<driver object>)
  , builder = graph.Builder();

  builder
    .reset()
    .Match('u', 'User', {...})
    .relate('r1', 'RELATIONSHIP', {...})
    .toNode('u2', 'User', {...})
    .Delete(['r1', 'u', 'u2']);

  graph.execute({
    builder: builder,
    success: function(results) {
      /**
       * "results" is here:
       * []
       */
    },
    error: function(err) {...}
  });
```

<a name="with" />
<h4>With(placeholders)</h4>
Sets a driver which is connected to a Neo4j database. The only requirement is that the driver implements a method called 'query'.

<strong>Arguments</strong>

* `placeholders` (array) - An array with all placeholders which have to be connected with next cypher command.

<strong>Example</strong>

```javascript
var graph = require("neo4jquery").setConnection(<driver object>)
  , builder = graph.Builder();

  builder
    .reset()
    .Match('u', 'User', {username: 'neo4jqueryuser', password: 'password'})
    .With(['u'])
    .Match('u2', 'User', {username: 'neo4jqueryuser2', password: 'password'})
    .MergeRelationShip(['u', 'u2'], 'r', 'ASSIGNED_WITH_EACH_OTHER', {field1: '...', field2: '...'});

  graph.execute({
    builder: builder,
    cached: false,
    aliases: {
      u: 'user',
      u2: 'user2',
      r: 'relation'
    },
    success: function(results) {
      /**
       * "results" is here:
       * [
       *   {user: {username: 'neo4jqueryuser', password: 'password', fieldN: ...}},
       *   {user2: {username: 'neo4jqueryuser2', password: 'password', fieldN: ...}},
       *   {r: {field1: '...', field2: '...'}}
       * ]
       */
    },
    error: function(err) {...}
  });
```

<a name="where" />
<h4>Where(placeholder, parameter)</h4>

Sets conditions to find specific nodes or relationships.

<strong>Arguments</strong>

* `string` (string) - The conditions to filter nodes and/or relationships.
* `parameter` (object) - The parameters for prepared cypher statements provided by the NodeJS driver.

<strong>Example</strong>

```javascript
var graph = require("neo4jquery").setConnection(<driver object>)
  , builder = graph.Builder();

  builder
    .reset()
    .Match('u', 'User')
    .Where("u.username={username} and u.password={password}", {username: 'testuser', password: 'password'});

  graph.execute({
    builder: builder,
    cached: false,
    aliases: {
      u: 'user'
    },
    success: function(results) {
      /**
       * "results" is here:
       * [
       *   {user: {username: 'neo4jqueryuser', password: 'password', fieldN: ...}}
       * ]
       */
    },
    error: function(err) {...}
  });
```

<a name="set" />
<h4>Set(placeholder, parameter)</h4>

Sets given properties to a node or relationship.

<strong>Arguments</strong>

* `placeholder` (string) - The placeholder of the node or relationship.
* `parameter` (object) - All parameters to be set as properties in the node or relationship.

<strong>Example</strong>

```javascript
var graph = require("neo4jquery").setConnection(<driver object>)
  , builder = graph.Builder();

  builder
    .reset()
    .Match('u', 'User')
    .Where("u.username={username} and u.password={password}", {username: 'neo4jqueryuser', password: 'password'})
    .Set('u', {createdAt: 1440360134452, updatedAt: 1440360134452});

  graph.execute({
    builder: builder,
    cached: false,
    aliases: {
      u: 'user'
    },
    success: function(results) {
      /**
       * "results" is here:
       * [
       *   {user: {username: 'neo4jqueryuser', password: 'password', createdAt: 1440360134452, updatedAt: 1440360134452, fieldN: ...}}
       * ]
       */
    },
    error: function(err) {...}
  });
```

<a name="foreachcondition" />
<h4>ForeachCondition(condition, query)</h4>

Adds a cypher foreach loop to the query to update the nodes in a list.

<strong>Arguments</strong>

* `condition` (string) - The condition to iterate over a list of nodes.
* `query` (string) - The update command.

<strong>Example</strong>

```javascript
var graph = require("neo4jquery").setConnection(<driver object>)
  , builder = graph.Builder();

  builder
    .reset()
    .Match('u', 'User')
    .Where("u.updatedAt > {timestamp}", {timestamp: new Date().getTime() - 3600})
    .ForeachCondition('user IN u', 'SET user.visited=true');

  graph.execute({
    builder: builder,
    cached: false,
    aliases: {
      u: 'user'
    },
    success: function(results) {
      /**
       * "results" is here:
       * [
       *   {user: {username: 'neo4jqueryuser', password: 'password', createdAt: 1440360134452, updatedAt: 1440360134452, visited: true, fieldN: ...}},
       *   {user: {username: 'testuser', password: 'password2', createdAt: 1440360334112, updatedAt: 1440360334112, visited: true, fieldN: ...}},
       * ]
       */
    },
    error: function(err) {...}
  });
```

