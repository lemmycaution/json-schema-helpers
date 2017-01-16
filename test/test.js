import assert from 'assert'
import { defineProperties, parseSchema } from '../src/index'


describe('parseSchema', function() {
  it('should normalize $ref in given schema', function() {
    let schema = {
      definitions: {
        address: {
          type: "object",
          properties: {
            city: {
              type: 'string'
            }
          }
        }
      },
      properties: {
        billing_address: {
          "$ref": "#/definitions/address"
        },
        shipping_addresses: {
          type: "array",
          items: {
            "$ref": "#/definitions/address"
          }
        }
      }
    }
    let parsedSchema = parseSchema(schema)
    assert.equal(parsedSchema.properties.billing_address.properties.city.type, 'string')
    assert.equal(parsedSchema.properties.shipping_addresses.items.properties.city.type, 'string')
  })
  it('should deal with complex schemas', function () {
    let schema = require('./schema.json')
    let parsedSchema = parseSchema(schema)
    assert.equal(parsedSchema.properties.profile.properties.addresses.type, 'array')
    assert.equal(parsedSchema.properties.profile.properties.addresses.items.properties.name.type, 'string')
    assert.equal(parsedSchema.properties.profile.properties.identities.properties.photo.type, 'string')
    assert.equal(parsedSchema.properties.service.properties.services.properties.interpreter.items instanceof Object, true)
  })
})

describe('defineProperties', function() {
  it('should generate primitive data types', function() {
    let schema = {
      properties: {
        name: {
          type: 'string'
        },
        age: {
          type: 'number'
        },
        hasSchema: {
          type: 'boolean'
        }
      }
    }
    assert.equal(defineProperties(schema, {name: 'my name'}).name, 'my name')
    assert.equal(defineProperties(schema, {age: 12}).age, 12)
    assert.equal(defineProperties(schema, {hasSchema: true}).hasSchema, true)
    assert.equal(defineProperties(schema, {}).name, null)
  })
  it('should generate nested objects', function() {
    let schema = {
      properties: {
        location: {
          type: 'object',
          properties: {
            map: {
              type: 'string'
            },
            point: {
              type: 'object',
              properties: {
                lat: {
                  type: 'number'
                },
                lon: {
                  type: 'number'
                },
              }
            }
          }
        }
      }
    }
    
    assert.equal(defineProperties(schema, {location: {point: {lat: 1}}}).location.point.lat, 1)
    assert.equal(defineProperties(schema, {location: {map: 'google'}}).location.map, 'google')
    assert.equal(defineProperties(schema, {}).location.map, null)
    assert.equal(defineProperties(schema, {}).location.point.lat, null)
  })
  it('should generate arrays', function() {
    let schema = {
      properties: {
        classes: {
          type: 'array',
          items: {
            type: 'text'
          }
        }
      }
    }
    
    assert.equal(defineProperties(schema, {classes: ['A1']}).classes[0], 'A1')
    assert.equal(defineProperties(schema, {}).classes.length, 0)
  })
  it('should deal with complex schemas', function () {
    let schema = require('./schema.json')
    let parsedSchema = parseSchema(schema)
    assert.equal(defineProperties(parsedSchema, {}).profile.emails.length, 0)
  })
})