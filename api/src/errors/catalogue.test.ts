import { catalogue, errorBody, statusFor } from './catalogue.js'
import type { ErrorCode } from './types.js'
import { OperationError } from './types.js'

const codes: ErrorCode[] = [
  'key_missing',
  'key_unknown',
  'lifter_only',
  'invalid_request',
  'not_found',
  'internal',
]

test('every code has a fix sentence', () => {
  for (const code of codes) {
    const fix = errorBody(code, 'req-1').error.fix
    expect(typeof fix).toBe('string')
    expect(fix.length).toBeGreaterThan(0)
  }
  expect(Object.keys(catalogue).sort()).toEqual([...codes].sort())
})

test('no fix string interpolates anything', () => {
  for (const code of codes) {
    const fix = errorBody(code, 'req-1').error.fix
    expect(fix).not.toContain('${')
    expect(fix).not.toContain('{{')
    expect(fix).not.toContain('%s')
  }
})

test('every code maps to a status', () => {
  expect(codes.map(statusFor)).toEqual([401, 401, 403, 400, 404, 500])
})

test('errorBody shape', () => {
  const body = errorBody('invalid_request', 'req-1', 'reps')
  expect(Object.keys(body)).toEqual(['error'])
  expect(Object.keys(body.error)).toEqual(['code', 'fix', 'field', 'request_id'])
  expect(body.error.code).toBe('invalid_request')
  expect(body.error.field).toBe('reps')
  expect(body.error.request_id).toBe('req-1')
})

test('field defaults to null, never undefined', () => {
  const body = errorBody('not_found', 'req-2')
  expect(body.error.field).toBeNull()
  expect('field' in body.error).toBe(true)
})

test('the fix is the same constant whatever the request', () => {
  expect(errorBody('key_unknown', 'a').error.fix).toBe(errorBody('key_unknown', 'b', 'x').error.fix)
})

test('OperationError carries its code and optional field', () => {
  const err = new OperationError('invalid_request', 'reps')
  expect(err).toBeInstanceOf(Error)
  expect(err.code).toBe('invalid_request')
  expect(err.field).toBe('reps')
  expect(new OperationError('internal').field).toBeUndefined()
})
