import { currentRequestId } from './request-context.js'

// The line written where an error that is not an OperationError becomes `internal` (surfaces/shared.ts).
// Without it the only trace of such a fault is the request line's `outcome: internal`, and the
// source maps the stack ships for would have nothing to read. Like the retry line it is a second
// shape beside the request line (R16 fixes that one at six fields), and like both it is built from a
// fixed list: never a spread, never the error itself.
//
// It carries the error's `name`, the request's id and the stack's FRAMES, and never its `message`.
// A message can carry a value (a unique violation names the hash it rejected; a connection error
// names the host), and a stack's first line IS the message (and a message can run to several lines, some looking like
// frames), so the message is cut out of the stack first and only the frames of what remains are kept.
type FaultLogFields = { name: string | null; frames: string | null }

const NAME_LIMIT = 100
const FRAME = /^\s+at /

function framesOf(error: Error): string | null {
  if (typeof error.stack !== 'string') return null
  const text = error.stack.replace(error.message, '')
  const frames = text.split('\n').filter((line) => FRAME.test(line))
  return frames.length === 0 ? null : frames.join('\n')
}

export function describeFault(error: unknown): FaultLogFields {
  // A thrown string or object is a fault with no name or stack worth recording: what it says is
  // exactly what must not be logged.
  if (!(error instanceof Error)) return { name: null, frames: null }
  return { name: String(error.name).slice(0, NAME_LIMIT), frames: framesOf(error) }
}

export function logFault(error: unknown): void {
  const fault = describeFault(error)
  const line = {
    event: 'fault',
    request_id: currentRequestId(),
    name: fault.name,
    stack: fault.frames,
  }
  process.stdout.write(`${JSON.stringify(line)}\n`)
}
