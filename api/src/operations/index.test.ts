import { registry } from '../registry/index.js'
import { implementations } from './index.js'

describe('the registry and the implementations agree', () => {
  const registered = registry.map((entry) => entry.name).sort()
  const implemented = Object.keys(implementations).sort()

  test('every registry entry has an implementation', () => {
    const missing = registered.filter((name) => !implemented.includes(name))
    expect(missing).toEqual([])
  })

  test('every implementation has a registry entry', () => {
    // A function nothing can reach is dead code that looks like a feature.
    const orphaned = implemented.filter((name) => !registered.includes(name))
    expect(orphaned).toEqual([])
  })

  test('registry names are unique', () => {
    expect(new Set(registered).size).toBe(registered.length)
  })
})
