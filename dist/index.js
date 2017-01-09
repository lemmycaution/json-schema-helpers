'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.defineProperties = exports.parseSchema = undefined;

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function findSchemaDefinition($ref) {
  var definitions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  // Extract and use the referenced definition if we have it.
  var match = /#\/definitions\/(.*)$/.exec($ref);
  if (match && match[1] && definitions.hasOwnProperty(match[1])) {
    return definitions[match[1]];
  }
  // No matching definition found, that's an error (bogus schema?)
  throw new Error('Could not find a definition for ' + $ref + '.');
}

function parseSubSchema(subSchema, schema) {
  if (subSchema['$ref']) {
    subSchema = parseSchema(findSchemaDefinition(subSchema['$ref'], schema['definitions']));
  } else if (subSchema['type'] === 'array') {
    if (subSchema['items']['$ref']) {
      subSchema['items'] = parseSchema(findSchemaDefinition(subSchema['items']['$ref'], schema['definitions']));
    } else {
      subSchema['items'] = parseSchema(subSchema['items']);
    }
    if (!(subSchema['items'] instanceof Array)) subSchema['items'] = [subSchema['items']];
  }
  return subSchema;
}

function parseSchema(orgSchema) {
  var schema = JSON.parse(JSON.stringify(orgSchema));
  if (schema['properties']) {
    _underscore2.default.each(schema['properties'], function (subSchema, subSchemaName) {
      schema['properties'][subSchemaName] = parseSubSchema(subSchema, schema);
    });
  }
  return schema;
}

function defineProperty(property, data, key, value) {
  Object.defineProperty(data, key, {
    enumerable: true,
    configurable: false,
    writable: !property.readOnly,
    value: value
  });
  return data[key];
}

function defineProperties(schema) {
  var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  _underscore2.default.each(schema.properties, function (property, key) {
    var value = void 0;

    switch (property.type) {
      case 'object':
        value = defineProperties(property, data[key] || {});
        break;
      case 'array':
        value = data[key] || [];
        break;
      default:
        value = data[key] || null;
        break;
    }
    defineProperty(property, data, key, value);
  });
  return JSON.parse(JSON.stringify(data));
}

exports.parseSchema = parseSchema;
exports.defineProperties = defineProperties;
