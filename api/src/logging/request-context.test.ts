import { currentRequestId, runWithRequestId } from './request-context.js'

describe('the request context', () => {
  test('there is no request id outside a request', () => {
    expect(currentRequestId()).toBeNull()
  })

  test('the id is visible to everything the request awaits, and returns what it ran', async () => {
    const seen = await runWithRequestId('request-1', async () => {
      await Promise.resolve()
      await new Promise((resolve) => setTimeout(resolve, 1))
      return currentRequestId()
    })
    expect(seen).toBe('request-1')
  })

  test('it is gone once the request is, and an inner request does not outlive itself', async () => {
    await runWithRequestId('outer', async () => {
      await runWithRequestId('inner', async () => undefined)
      expect(currentRequestId()).toBe('outer')
    })
    expect(currentRequestId()).toBeNull()
  })

  test('requests in flight together each keep their own id', async () => {
    const read = (id: string, wait: number) =>
      runWithRequestId(id, async () => {
        await new Promise((resolve) => setTimeout(resolve, wait))
        return currentRequestId()
      })
    expect(await Promise.all([read('slow', 10), read('fast', 1)])).toEqual(['slow', 'fast'])
  })
})
