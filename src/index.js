function findSchemaDefinition ($ref, definitions = {}) {
  // Extract and use the referenced definition if we have it.
  const match = /#\/definitions\/(.*)$/.exec($ref)
  if (match && match[1] && definitions.hasOwnProperty(match[1])) {
    return definitions[match[1]]
  }
  // No matching definition found, that's an error (bogus schema?)
  throw new Error(`Could not find a definition for ${$ref}.`)
}

function parseSubSchema (subSchema, schema) {
  if (subSchema['$ref']) {
    subSchema = parseSchema(
      findSchemaDefinition(subSchema['$ref'], schema['definitions'])
   )
  }
  if (schema['properties']) {
    subSchema = parseSchema(subSchema)
  }
  if (subSchema['type'] === 'array') {
    if (subSchema['items']['$ref']) {
      subSchema['items'] = parseSchema(
        findSchemaDefinition(subSchema['items']['$ref'], schema['definitions'])
     )
    } else {
      subSchema['items'] = parseSchema(subSchema['items'])
    }
  }
  return subSchema
}

function parseSchema (orgSchema) {
  let schema = JSON.parse(JSON.stringify(orgSchema))
  if (schema['properties']) {
    for (let subSchemaName in schema['properties']) {
      schema['properties'][subSchemaName] = parseSubSchema(schema['properties'][subSchemaName], schema)
    }
  }
  return schema
}

function defineProperty (property, data, key, value) {
  Object.defineProperty(data, key, {
    enumerable: true,
    configurable: false,
    writable: !property.readOnly,
    value: value
  })
  return data[key]
}

function defineProperties (schema, data = {}) {
  for (let key in schema.properties) {
    let property = schema.properties[key]
    let value
    switch (property.type) {
      case 'object':
        value = defineProperties(property, data[key] || property.default || {})
        break
      case 'array':
        value = data[key] || property.default || []
        break
      default:
        value = data[key] || property.default || undefined
        break
    }
    defineProperty(property, data, key, value)
  }
  return JSON.parse(JSON.stringify(data))
}

export {parseSchema, defineProperties}
