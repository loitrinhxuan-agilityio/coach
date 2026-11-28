import { repositoryContract } from './contract.test-helper.js'
import { memoryRepository } from './memory.js'

repositoryContract(() => memoryRepository())

describe('the in-memory repository', () => {
  test('a seeded Key is found by its hash and by its name', async () => {
    const repo = memoryRepository({ keys: [{ name: 'seeded-agent', key_sha256: 'fake-sha256-s' }] })
    expect((await repo.findKeyByHash('fake-sha256-s'))?.name).toBe('seeded-agent')
    expect((await repo.findKeyByName('seeded-agent'))?.name).toBe('seeded-agent')
  })

  test('a seeded Key cannot be inserted again', async () => {
    const repo = memoryRepository({ keys: [{ name: 'seeded-agent', key_sha256: 'fake-sha256-s' }] })
    await expect(
      repo.insertKey({ name: 'seeded-agent', key_sha256: 'fake-sha256-t' }),
    ).rejects.toThrow()
  })

  test('getSettings returns null when no row was seeded', async () => {
    expect(await memoryRepository().getSettings()).toBeNull()
  })

  test('getSettings returns the seeded row', async () => {
    const repo = memoryRepository({ settings: { time_zone: 'Etc/UTC', display_unit: 'kg' } })
    expect(await repo.getSettings()).toEqual({ time_zone: 'Etc/UTC', display_unit: 'kg' })
  })

  test('two repositories do not share Keys', async () => {
    const one = memoryRepository()
    const two = memoryRepository()
    await one.insertKey({ name: 'only-in-one', key_sha256: 'fake-sha256-1' })
    expect(await two.findKeyByName('only-in-one')).toBeNull()
  })
})
