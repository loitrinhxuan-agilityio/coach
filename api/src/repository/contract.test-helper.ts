import type { Repository } from './types.js'

// The behaviour every Repository must have. The in-memory implementation runs it today; the Aurora
// DSQL implementation runs the same function against a real database, which is the only way the two
// are shown to agree. Hashes here are obviously fake.
export function repositoryContract(makeRepo: () => Repository): void {
  const hashOf = (label: string) => `fake-sha256-${label}`

  describe('the repository contract', () => {
    test('an unknown hash returns null', async () => {
      const repo = makeRepo()
      expect(await repo.findKeyByHash(hashOf('nobody'))).toBeNull()
    })

    test('an inserted Key is found by its hash', async () => {
      const repo = makeRepo()
      await repo.insertKey({ name: 'contract-agent', key_sha256: hashOf('a') })
      const found = await repo.findKeyByHash(hashOf('a'))
      expect(found?.name).toBe('contract-agent')
      expect(found?.id).toEqual(expect.any(String))
    })

    test('a lookup does not carry the hash back out', async () => {
      const repo = makeRepo()
      await repo.insertKey({ name: 'contract-agent', key_sha256: hashOf('a') })
      for (const found of [
        await repo.findKeyByHash(hashOf('a')),
        await repo.findKeyByName('contract-agent'),
      ]) {
        expect(found).not.toBeNull()
        expect(found).not.toHaveProperty('hash')
        expect(found).not.toHaveProperty('key_sha256')
        expect(Object.keys(found ?? {}).sort()).toEqual(['id', 'name'])
      }
    })

    test('an inserted Key is found by its name, and an unknown name returns null', async () => {
      const repo = makeRepo()
      await repo.insertKey({ name: 'contract-agent', key_sha256: hashOf('a') })
      expect((await repo.findKeyByName('contract-agent'))?.name).toBe('contract-agent')
      expect(await repo.findKeyByName('someone-else')).toBeNull()
    })

    test('both lookups find the same Key', async () => {
      const repo = makeRepo()
      await repo.insertKey({ name: 'contract-agent', key_sha256: hashOf('a') })
      expect(await repo.findKeyByName('contract-agent')).toEqual(
        await repo.findKeyByHash(hashOf('a')),
      )
    })

    test('two Keys stay distinct', async () => {
      const repo = makeRepo()
      await repo.insertKey({ name: 'first-agent', key_sha256: hashOf('1') })
      await repo.insertKey({ name: 'second-agent', key_sha256: hashOf('2') })
      const first = await repo.findKeyByHash(hashOf('1'))
      const second = await repo.findKeyByHash(hashOf('2'))
      expect(first?.name).toBe('first-agent')
      expect(second?.name).toBe('second-agent')
      expect(first?.id).not.toBe(second?.id)
    })

    test('inserting a name that already exists is rejected and changes nothing', async () => {
      const repo = makeRepo()
      await repo.insertKey({ name: 'contract-agent', key_sha256: hashOf('a') })
      await expect(
        repo.insertKey({ name: 'contract-agent', key_sha256: hashOf('b') }),
      ).rejects.toThrow()
      expect(await repo.findKeyByHash(hashOf('b'))).toBeNull()
      expect((await repo.findKeyByHash(hashOf('a')))?.name).toBe('contract-agent')
    })

    test('inserting a hash that already exists is rejected', async () => {
      const repo = makeRepo()
      await repo.insertKey({ name: 'first-agent', key_sha256: hashOf('a') })
      await expect(
        repo.insertKey({ name: 'second-agent', key_sha256: hashOf('a') }),
      ).rejects.toThrow()
      expect(await repo.findKeyByName('second-agent')).toBeNull()
    })

    test('getSettings returns null or a complete row, never a default', async () => {
      const settings = await makeRepo().getSettings()
      if (settings !== null) {
        expect(settings.time_zone).toEqual(expect.any(String))
        expect(settings.display_unit).toBe('kg')
      }
    })
  })
}
