import type { ErrorCode } from './types.js'

// One entry per code: the HTTP status and the fix sentence. The fix is a constant, never built
// from the request, so the wording of every error lives here and nowhere else.
export const catalogue: Record<ErrorCode, { status: number; fix: string }> = {
  key_missing: {
    status: 401,
    fix: 'Send the Key in an `Authorization: Bearer` header on every call.',
  },
  key_unknown: {
    status: 401,
    fix: 'Use the Key the Lifter gave you, exactly as it was issued.',
  },
  lifter_only: {
    status: 403,
    fix: 'Only the Lifter can do this, signed in on the website. Tell them so rather than retrying.',
  },
  invalid_request: {
    status: 400,
    fix: "Check the named field against the operation's schema and send the call again.",
  },
  not_found: {
    status: 404,
    fix: 'Ask the product what exists before acting on it.',
  },
  internal: {
    status: 500,
    fix: 'Try once more. If it fails again, give the Lifter the request id.',
  },
}

export function statusFor(code: ErrorCode): number {
  return catalogue[code].status
}

export function errorBody(code: ErrorCode, requestId: string, field?: string) {
  return {
    error: {
      code,
      fix: catalogue[code].fix,
      field: field ?? null,
      request_id: requestId,
    },
  }
}
