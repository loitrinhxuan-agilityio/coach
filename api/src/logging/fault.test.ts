import { logFault } from './fault.js'
import { runWithRequestId } from './request-context.js'

// Calls logFault with stdout captured, and returns everything it wrote.
function capture(error: unknown, requestId?: string): string {
  const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
  try {
    if (requestId === undefined) logFault(error)
    else runWithRequestId(requestId, () => logFault(error))
    return write.mock.calls.map((call) => String(call[0])).join('')
  } finally {
    write.mockRestore()
  }
}

const SECRET = 'FAKE-SECRET-HASH-ba7816bf8f01cfea'

test('is one line with exactly event, request_id, name and stack', () => {
  const out = capture(new TypeError('boom'), 'req-0001')
  expect(out.split('\n')).toHaveLength(2)
  const line = JSON.parse(out)
  expect(Object.keys(line).sort()).toEqual(['event', 'name', 'request_id', 'stack'])
  expect(line.event).toBe('fault')
  expect(line.request_id).toBe('req-0001')
  expect(line.name).toBe('TypeError')
})

test('the stack is the frames, so it says where the fault was and not what it said', () => {
  const line = JSON.parse(capture(new Error('boom'), 'r'))
  expect(line.stack).toMatch(/^\s+at .*fault\.test\.ts/)
  expect(line.stack).not.toContain('boom')
  for (const frame of line.stack.split('\n')) expect(frame).toMatch(/^\s+at /)
})

test('a request_id is null outside a request', () => {
  expect(JSON.parse(capture(new Error('x'))).request_id).toBeNull()
})

test('a message that carries a secret never reaches the line, in the stack or anywhere', () => {
  const out = capture(new Error(`duplicate key value (${SECRET}) already exists`), 'r')
  expect(out).not.toContain(SECRET)
  expect(out).not.toContain('duplicate key')
})

test('nor does a message that runs to several lines, some of them shaped like frames', () => {
  const out = capture(new Error(`first\n    at wrapped (${SECRET}.js:1:1)\nlast`), 'r')
  expect(out).not.toContain(SECRET)
  expect(out).not.toContain('wrapped')
})

test('nor does a secret in a property the error carries, or in its cause', () => {
  const error = Object.assign(new Error('x', { cause: new Error(SECRET) }), {
    detail: SECRET,
    constraint: SECRET,
  })
  expect(capture(error, 'r')).not.toContain(SECRET)
})

test('a thrown string is logged as a fault with no name and no stack, and is not echoed', () => {
  const line = JSON.parse(capture(SECRET, 'r'))
  expect(line.name).toBeNull()
  expect(line.stack).toBeNull()
  expect(JSON.stringify(line)).not.toContain(SECRET)
})

test('an error with no stack is logged with a null stack', () => {
  const error = new Error('x')
  error.stack = undefined
  expect(JSON.parse(capture(error, 'r')).stack).toBeNull()
})

test('a very long name is cut', () => {
  const error = new Error('x')
  error.name = 'N'.repeat(5000)
  expect(JSON.parse(capture(error, 'r')).name).toHaveLength(100)
})
