import type { OperationEntry } from './types.js'

// The one place an operation is defined. The HTTP routes and the MCP tool list are both built by
// walking this array at run time (ADR 0004), so nothing else may describe an operation.
export const registry: readonly OperationEntry[] = [
  {
    name: 'get_account',
    method: 'GET',
    path: '/api/account',
    principals: ['agent', 'lifter'],
    input: { type: 'object', properties: {}, required: [] },
    output: {
      type: 'object',
      properties: {
        agent: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
        settings: {
          type: 'object',
          properties: {
            time_zone: { type: 'string' },
            display_unit: { type: 'string', enum: ['kg'] },
          },
          required: ['time_zone', 'display_unit'],
        },
        standing_notes: { type: 'array', items: { type: 'string' } },
      },
      required: ['agent', 'settings', 'standing_notes'],
    },
    errors: ['key_missing', 'key_unknown', 'lifter_only', 'internal'],
    summary: "Who you are talking to: the Account settings and the Lifter's standing notes.",
  },
]

export function entryByName(name: string): OperationEntry | undefined {
  return registry.find((entry) => entry.name === name)
}
