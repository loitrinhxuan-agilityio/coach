import { catalogue } from '../errors/catalogue.js'
import { entryByName, registry } from './index.js'
import type { Schema } from './types.js'

const snakeCase = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/

// Every field name at every depth of a schema, so the check follows the schema as it grows.
function fieldNames(schema: Schema): string[] {
  if (schema.type === 'object') {
    return Object.entries(schema.properties).flatMap(([name, field]) => [
      name,
      ...fieldNames(field),
    ])
  }
  if (schema.type === 'array') return fieldNames(schema.items)
  return []
}

test('the registry holds exactly one entry', () => {
  expect(registry).toHaveLength(1)
  expect(registry[0]?.name).toBe('get_account')
})

test('get_account declares both principals', () => {
  expect(entryByName('get_account')?.principals).toEqual(['agent', 'lifter'])
})

test('every error a code names exists in the catalogue', () => {
  for (const entry of registry) {
    expect(entry.errors.length).toBeGreaterThan(0)
    for (const code of entry.errors) {
      expect(Object.keys(catalogue)).toContain(code)
    }
  }
})

test('the path carries no version segment', () => {
  for (const entry of registry) {
    expect(entry.path.split('/')).not.toContainEqual(expect.stringMatching(/^v\d+$/))
  }
})

test('every name and field is snake_case', () => {
  for (const entry of registry) {
    expect(entry.name).toMatch(snakeCase)
    for (const name of [...fieldNames(entry.input), ...fieldNames(entry.output)]) {
      expect(name).toMatch(snakeCase)
    }
  }
  expect(fieldNames(registry[0]?.output as Schema)).toEqual([
    'agent',
    'name',
    'settings',
    'time_zone',
    'display_unit',
    'standing_notes',
  ])
})

test('entryByName finds an entry and returns undefined for an unknown name', () => {
  expect(entryByName('get_account')).toBe(registry[0])
  expect(entryByName('no_such_operation')).toBeUndefined()
})
