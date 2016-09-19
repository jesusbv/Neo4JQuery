var _instance = null
  , Error = function() {};

/**
 *
 * @param code
 * @param additionalInformation
 */
Error.prototype.getByCode = function(code, additionalInformation) {
  code = (parseInt(code) >= 0) ? parseInt(code) : Error.COMMON_CODE_NOT_AVAILABLE;
  additionalInformation = additionalInformation || {};

  var error = {
    message: messages[code],
    code: code
  };

  return _.extend(error, additionalInformation);
};

/**
 *
 * @param message
 * @param code
 * @param additionalInformation
 */
Error.buildError = function(message, code, additionalInformation) {
  message = message || null;
  var error = Error.getByCode(code, additionalInformation);
  if (null !== message) error.message = message;
  return error;
};

Error.instance = function() {
  if(_instance === null) _instance = new Error();
  return _instance;
};
Error.COMMON_CODE_NOT_AVAILABLE = 0;
Error.COMMON_ERROR_MESSAGE = 10;
Error.COMMON_CONNECTION_NAME_NOT_KNOWN = 11;
Error.COMMON_NO_QUERY_GIVEN = 12;
Error.COMMON_TYPE_REST_DOES_NOT_SUPPORT_TRANSACTION = 13;


Error.BOLT_NO_CONNECTION_AVAILABLE = 1000;
Error.BOLT_GET_SESSION = 1001;
Error.BOLT_EXECUTE_CYPHER_QUERY = 1002;
Error.BOLT_TRANSACTION_COMMIT_FAILS = 1003;

Error.BUILDER_GENERIC_CASE_FIELD_MISSING = 1200;
Error.BUILDER_NO_WHEN_VALUE = 1201;
Error.BUILDER_THEN_CALLED_BEFORE_WHEN = 1202;
Error.BUILDER_END_CALLED_BEFORE_WHEN = 1203;

var messages = [];

messages[Error.COMMON_CODE_NOT_AVAILABLE] = 'No error message available.';
messages[Error.COMMON_ERROR_MESSAGE] = 'Error: Something went wrong.';

messages[Error.BOLT_NO_CONNECTION_AVAILABLE] = 'No connection to the database available. Please connect first.';
messages[Error.BOLT_GET_SESSION] = 'Error on getting bolt session.';
messages[Error.BOLT_EXECUTE_CYPHER_QUERY] = 'Querying the data was not successful.';

messages[Error.BUILDER_GENERIC_CASE_FIELD_MISSING] = 'Field is missing on generic case.';
messages[Error.BUILDER_NO_WHEN_VALUE] = 'No value given.';
messages[Error.BUILDER_THEN_CALLED_BEFORE_WHEN] = 'CASE method "Then" called before "When".';
messages[Error.BUILDER_END_CALLED_BEFORE_WHEN] = 'CASE method "End" called before "When" or "Then".';
messages[Error.COMMON_NO_QUERY_GIVEN] = 'No query to execute given.';
messages[Error.BOLT_TRANSACTION_COMMIT_FAILS] = 'Error on execute transactions commit.';
messages[Error.COMMON_TYPE_REST_DOES_NOT_SUPPORT_TRANSACTION] = 'This type does not support transactions: Neo4J Rest API';


module.exports = Error;