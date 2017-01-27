'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
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
  }
  if (schema['properties']) {
    subSchema = parseSchema(subSchema);
  }
  if (subSchema['type'] === 'array') {
    if (subSchema['items']['$ref']) {
      subSchema['items'] = parseSchema(findSchemaDefinition(subSchema['items']['$ref'], schema['definitions']));
    } else {
      subSchema['items'] = parseSchema(subSchema['items']);
    }
  }
  return subSchema;
}

function parseSchema(orgSchema) {
  var schema = JSON.parse(JSON.stringify(orgSchema));
  if (schema['properties']) {
    for (var subSchemaName in schema['properties']) {
      schema['properties'][subSchemaName] = parseSubSchema(schema['properties'][subSchemaName], schema);
    }
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

  for (var key in schema.properties) {
    var property = schema.properties[key];
    var value = void 0;
    switch (property.type) {
      case 'object':
        value = defineProperties(property, data[key] || property.default || {});
        break;
      case 'array':
        value = data[key] || property.default || [];
        break;
      default:
        value = data[key] || property.default || undefined;
        break;
    }
    defineProperty(property, data, key, value);
  }
  return JSON.parse(JSON.stringify(data));
}

exports.parseSchema = parseSchema;
exports.defineProperties = defineProperties;
