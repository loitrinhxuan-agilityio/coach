import { spawnSync } from 'node:child_process'
import { createHash, randomBytes } from 'node:crypto'
import { authenticate } from '../api/src/auth/authenticate.js'
import { memoryRepository } from '../api/src/repository/memory.js'
import type { Repository } from '../api/src/repository/types.js'
import { mintKey } from './mint-key-core.js'

// Two things are replaced so that a guarantee can be tested by breaking it.
//
// node:crypto keeps every real function and wraps randomBytes in a spy that, unless a test says
// otherwise, still returns real random bytes. A test can then fix the bytes and know the exact Key
// the script will produce, which is how "the Key reaches no other place" is checked: the Key is
// known before it is minted.
//
// node:fs and node:fs/promises keep every real function too, each wrapped in a spy. The script has
// no use for the file system, so the claim "it writes the Key to no file" is tested as "it calls no
// file system function at all", which cannot be satisfied by writing somewhere the test did not think
// to look.
const fsCalls = vi.hoisted(() => [] as string[])

vi.mock('node:crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:crypto')>()
  return { ...actual, randomBytes: vi.fn(actual.randomBytes) }
})

function spyOnEveryFunction<T extends object>(module: T, prefix: string): T {
  const wrapped: Record<string, unknown> = {}
  for (const [name, value] of Object.entries(module)) {
    if (typeof value === 'function') {
      wrapped[name] = (...args: unknown[]) => {
        fsCalls.push(`${prefix}${name}`)
        return (value as (...a: unknown[]) => unknown)(...args)
      }
    } else if (value !== null && typeof value === 'object' && name === 'promises') {
      wrapped[name] = spyOnEveryFunction(value, `${prefix}promises.`)
    } else {
      wrapped[name] = value
    }
  }
  return wrapped as T
}

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  const wrapped = spyOnEveryFunction(actual, 'fs.')
  return { ...wrapped, default: wrapped }
})
vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>()
  const wrapped = spyOnEveryFunction(actual, 'fs/promises.')
  return { ...wrapped, default: wrapped }
})

// FIXTURE, never issued and never a credential: a six-byte pattern repeated, which is why the Key
// below visibly repeats. The bytes are chosen so that base64 and base64url disagree: base64 of them
// has '+', '/' and a trailing '=', and base64url has '-' and '_' and no padding.
const FIXED_BYTES = Buffer.from(
  'fbffbeef3e3ffbffbeef3e3ffbffbeef3e3ffbffbeef3e3ffbffa4f42222e5e0',
  'hex',
)
const FIXED_SUFFIX = '-_--7z4_-_--7z4_-_--7z4_-_--7z4_-_-k9CIi5eA'
const FIXED_KEY = `alc_live_${FIXED_SUFFIX}`

const sha256Hex = (text: string): string => createHash('sha256').update(text).digest('hex')

type Run = { code: number; stdout: string; stderr: string }

async function mint(args: string[], repo: Repository): Promise<Run> {
  let stdout = ''
  let stderr = ''
  const code = await mintKey(args, {
    repo,
    stdout: (text) => {
      stdout += text
    },
    stderr: (text) => {
      stderr += text
    },
  })
  return { code, stdout, stderr }
}

// The line the Key is printed on. The script prints the Key alone on the first line.
const keyLine = (stdout: string): string => stdout.split('\n')[0] ?? ''

const countOf = (haystack: string, needle: string): number => haystack.split(needle).length - 1

// Wraps a repository so a test can see every write that reaches it, and what it was given.
function watched(inner: Repository) {
  const inserts: unknown[] = []
  const calls: unknown[][] = []
  const repo: Repository = {
    findKeyByHash: (hash) => {
      calls.push(['findKeyByHash', hash])
      return inner.findKeyByHash(hash)
    },
    findKeyByName: (name) => {
      calls.push(['findKeyByName', name])
      return inner.findKeyByName(name)
    },
    insertKey: (row) => {
      inserts.push(row)
      calls.push(['insertKey', row])
      return inner.insertKey(row)
    },
    getSettings: () => inner.getSettings(),
  }
  return { repo, inserts, calls }
}

// What every test here shares: a Key is never in the second stream, and never anywhere when no Key
// was made.
function expectNoKeyAnywhereElse(run: Run, key: string) {
  expect(run.stderr).not.toContain(key)
  expect(run.stderr).not.toContain(key.slice('alc_live_'.length))
}

const randomBytesSpy = vi.mocked(randomBytes)

const { randomBytes: realRandomBytes } =
  await vi.importActual<typeof import('node:crypto')>('node:crypto')

beforeEach(() => {
  // mockClear would leave a value queued with mockReturnValueOnce for the next test to find. Reset
  // drops it, and the passthrough to real random bytes is put back.
  randomBytesSpy.mockReset()
  randomBytesSpy.mockImplementation(((size: number) => realRandomBytes(size)) as never)
  fsCalls.length = 0
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('the Key', () => {
  test('is alc_live_ followed by 32 random bytes, base64url', async () => {
    const run = await mint(['owner'], memoryRepository())

    expect(run.code).toBe(0)
    // 32 bytes are 43 base64url characters: no padding, and none of the base64-only characters.
    expect(keyLine(run.stdout)).toMatch(/^alc_live_[A-Za-z0-9_-]{43}$/)
    const suffix = keyLine(run.stdout).slice('alc_live_'.length)
    const bytes = Buffer.from(suffix, 'base64url')
    expect(bytes).toHaveLength(32)
    expect(bytes.toString('base64url')).toBe(suffix)
  })

  test('takes its 32 bytes from node:crypto randomBytes, and encodes them as base64url', async () => {
    randomBytesSpy.mockReturnValueOnce(FIXED_BYTES as never)

    const run = await mint(['owner'], memoryRepository())

    expect(randomBytesSpy).toHaveBeenCalledTimes(1)
    expect(randomBytesSpy).toHaveBeenCalledWith(32)
    // The Key is exactly the prefix and what node:crypto handed over. Plain base64 of these bytes has
    // '+', '/' and '=' in it, so this also fails on any other encoding.
    expect(keyLine(run.stdout)).toBe(FIXED_KEY)
  })

  test('leaves bytes queued and unused, to be found by the next test if they are not reset', async () => {
    randomBytesSpy.mockReturnValueOnce(FIXED_BYTES as never)
    // A name that is refused never reaches randomBytes, so the queued value is still there.
    await mint([''], memoryRepository())
    expect(randomBytesSpy).not.toHaveBeenCalled()
  })

  test('a value queued by the test before does not outlive it', async () => {
    const run = await mint(['owner'], memoryRepository())

    expect(keyLine(run.stdout)).not.toBe(FIXED_KEY)
  })

  test('is different every time, and so is its hash', async () => {
    const repo = memoryRepository()
    const first = await mint(['one'], repo)
    const second = await mint(['two'], repo)

    expect(keyLine(first.stdout)).not.toBe(keyLine(second.stdout))
    expect(sha256Hex(keyLine(first.stdout))).not.toBe(sha256Hex(keyLine(second.stdout)))
  })

  test('is the credential that authentication accepts, for the name it was minted under', async () => {
    const repo = memoryRepository()
    const run = await mint(['owner-agent'], repo)

    // Through the real authenticate, so a hash in a different encoding, or of a different string,
    // fails here and not in a deployment nobody can mint a second Key for.
    const principal = await authenticate({ authorization: `Bearer ${keyLine(run.stdout)}` }, repo)

    expect(principal.agent_name).toBe('owner-agent')
    expect(principal.kind).toBe('agent')
  })
})

describe('what is written', () => {
  test('only the sha256 is written; the Key is not', async () => {
    randomBytesSpy.mockReturnValueOnce(FIXED_BYTES as never)
    const { repo, inserts, calls } = watched(memoryRepository())

    const run = await mint(['owner'], repo)

    // One write, with exactly these two fields: a third field, or the Key in place of the hash, fails.
    expect(inserts).toStrictEqual([{ name: 'owner', key_sha256: sha256Hex(FIXED_KEY) }])
    expect(inserts[0]).toHaveProperty('key_sha256', expect.stringMatching(/^[0-9a-f]{64}$/))
    // And nothing at all that reached the repository, in any call, contains the Key or its bytes.
    const everything = JSON.stringify(calls)
    expect(everything).not.toContain(FIXED_KEY)
    expect(everything).not.toContain(FIXED_SUFFIX)
    expect(everything).not.toContain(FIXED_BYTES.toString('hex'))
    expect(everything).not.toContain(FIXED_BYTES.toString('base64'))
    expect(run.code).toBe(0)
  })

  test('the stored hash is the sha256 of the whole Key string, prefix included', async () => {
    randomBytesSpy.mockReturnValueOnce(FIXED_BYTES as never)
    const repo = memoryRepository()
    await mint(['owner'], repo)

    expect(await repo.findKeyByHash(sha256Hex(FIXED_KEY))).toMatchObject({ name: 'owner' })
    // Hashing only the random part, or the bytes, would store a hash no request can ever match.
    expect(await repo.findKeyByHash(sha256Hex(FIXED_SUFFIX))).toBeNull()
    expect(
      await repo.findKeyByHash(createHash('sha256').update(FIXED_BYTES).digest('hex')),
    ).toBeNull()
  })
})

describe('what is printed', () => {
  test('the Key is printed once, to stdout, with a line saying it cannot be shown again', async () => {
    randomBytesSpy.mockReturnValueOnce(FIXED_BYTES as never)
    const stdoutWrite = vi.spyOn(process.stdout, 'write')
    const stderrWrite = vi.spyOn(process.stderr, 'write')
    const consoles = (['log', 'info', 'warn', 'error', 'debug'] as const).map((method) =>
      vi.spyOn(console, method),
    )

    const run = await mint(['owner'], memoryRepository())

    expect(run.code).toBe(0)
    expect(countOf(run.stdout, FIXED_KEY)).toBe(1)
    // The suffix counts too, so a second copy without the prefix is caught as well.
    expect(countOf(run.stdout, FIXED_SUFFIX)).toBe(1)
    expect(run.stdout).toMatch(/cannot be shown again/i)
    expectNoKeyAnywhereElse(run, FIXED_KEY)
    // The script writes through the two streams it was given and through nothing else.
    expect(stdoutWrite).not.toHaveBeenCalled()
    expect(stderrWrite).not.toHaveBeenCalled()
    for (const spy of consoles) expect(spy).not.toHaveBeenCalled()
  })

  test('the Key reaches no file: no file system function is called at all', async () => {
    const before = fsCalls.length
    await mint(['owner'], memoryRepository())
    const failed = await mint(
      ['owner'],
      memoryRepository({ keys: [{ name: 'owner', key_sha256: 'x' }] }),
    )

    expect(failed.code).not.toBe(0)
    expect(fsCalls.slice(before)).toStrictEqual([])
  })

  test('the file-system spy sees a call that is made, so its silence above means something', async () => {
    const { readFileSync } = await import('node:fs')
    readFileSync(new URL(import.meta.url))
    expect(fsCalls).toContain('fs.readFileSync')
    const { readFile } = await import('node:fs/promises')
    await readFile(new URL(import.meta.url))
    expect(fsCalls).toContain('fs/promises.readFile')
  })

  // Everything the two files may import, use of `process`, and a short list of globals that could
  // carry the Key somewhere. An allowlist and not a list of what is forbidden, so that a way of
  // reaching a file nobody thought of (a dynamic import, process.getBuiltinModule) is refused by
  // default. What it cannot see is what the allowed imports do, so the file-system test above is
  // there as well.
  describe('the source of the script', () => {
    const codeOf = async (file: string): Promise<string> => {
      const { readFileSync } = await vi.importActual<typeof import('node:fs')>('node:fs')
      return readFileSync(new URL(`./${file}`, import.meta.url), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '')
    }
    const importsOf = (code: string): string[] =>
      [...code.matchAll(/(?:\bfrom|\bimport|\brequire)\s*\(?\s*['"]([^'"]+)['"]/g)].map(
        (m) => m[1] ?? '',
      )
    const dynamic =
      /\bimport\s*\(|\brequire\b|\beval\b|\bFunction\b|\bglobalThis\b|\bconsole\b|\bfetch\b|\bWebSocket\b|\bXMLHttpRequest\b/

    test('mint-key-core.ts imports only node:crypto and two repository files, and never uses process', async () => {
      const code = await codeOf('mint-key-core.ts')

      expect(importsOf(code).sort()).toStrictEqual([
        '../api/src/repository/errors.js',
        '../api/src/repository/types.js',
        'node:crypto',
      ])
      expect(code).not.toMatch(dynamic)
      expect(code).not.toMatch(/\bprocess\b/)
    })

    test('mint-key.ts imports only the core and the database layer, and uses process for four things', async () => {
      const code = await codeOf('mint-key.ts')

      expect(importsOf(code).sort()).toStrictEqual([
        '../api/src/repository/dsql.js',
        './mint-key-core.js',
      ])
      expect(code).not.toMatch(dynamic)
      const uses = [
        ...code.matchAll(/\bprocess\b(?!\.argv\b|\.stdout\.write\(|\.stderr\.write\(|\.exit\()/g),
      ]
      expect(uses).toStrictEqual([])
    })

    test('mint-key.ts wires stdout to process.stdout, stderr to process.stderr, and the real repository', async () => {
      const code = (await codeOf('mint-key.ts')).replace(/\s+/g, ' ')
      const wiring = (stream: string) =>
        new RegExp(`${stream}: \\(text\\) => process\\.${stream}\\.write\\(text\\),`)

      // Each stream is written by exactly one wiring line, and each line names its own stream. A swap,
      // or a second write of the same text to the other stream, no longer matches.
      expect(code).toMatch(wiring('stdout'))
      expect(code).toMatch(wiring('stderr'))
      expect(code.match(/process\.stdout\.write\(text\)/g)).toHaveLength(1)
      expect(code.match(/process\.stderr\.write\(text\)/g)).toHaveLength(1)
      expect(code).toMatch(/mintKey\(process\.argv\.slice\(2\), \{/)
      expect(code).toMatch(/repo: dsqlRepository\(\),/)
    })

    test('the check itself sees what it is meant to see', () => {
      expect(
        importsOf("import { a } from 'x'\nconst b = await import('y')\nrequire('z')"),
      ).toStrictEqual(['x', 'y', 'z'])
    })
  })
})

describe('a name that already exists', () => {
  test('exits non-zero, writes nothing, and prints no Key', async () => {
    randomBytesSpy.mockReturnValueOnce(FIXED_BYTES as never)
    const seeded = memoryRepository({ keys: [{ name: 'owner', key_sha256: sha256Hex('older') }] })
    const original = await seeded.findKeyByName('owner')
    const { repo, inserts } = watched(seeded)

    const run = await mint(['owner'], repo)

    expect(run.code).not.toBe(0)
    expect(inserts).toStrictEqual([])
    expect(run.stdout).toBe('')
    expect(run.stderr).toContain('a Key named owner already exists')
    expectNoKeyAnywhereElse(run, FIXED_KEY)
    // The existing Key is untouched, and the new one was not stored under any hash.
    expect(await seeded.findKeyByName('owner')).toStrictEqual(original)
    expect(await seeded.findKeyByHash(sha256Hex('older'))).toStrictEqual(original)
    expect(await seeded.findKeyByHash(sha256Hex(FIXED_KEY))).toBeNull()
  })

  test('is also refused when the database refuses it after the check passed (the race)', async () => {
    randomBytesSpy.mockReturnValueOnce(FIXED_BYTES as never)
    const seeded = memoryRepository({ keys: [{ name: 'owner', key_sha256: sha256Hex('older') }] })
    // The other mint's row was not there when this one looked, and is there when it writes.
    const racing: Repository = { ...seeded, findKeyByName: async () => null }

    const run = await mint(['owner'], racing)

    expect(run.code).not.toBe(0)
    expect(run.stdout).toBe('')
    expect(run.stderr).toContain('a Key named owner already exists')
    expectNoKeyAnywhereElse(run, FIXED_KEY)
    expect(await seeded.findKeyByHash(sha256Hex(FIXED_KEY))).toBeNull()
  })

  test('a failure that is not a duplicate is a failure too, and prints no Key', async () => {
    randomBytesSpy.mockReturnValueOnce(FIXED_BYTES as never)
    const broken: Repository = {
      ...memoryRepository(),
      insertKey: async () => {
        throw new Error('connection reset')
      },
    }

    const run = await mint(['owner'], broken)

    expect(run.code).not.toBe(0)
    expect(run.stdout).toBe('')
    expect(run.stderr).toContain('connection reset')
    // Not misreported as a duplicate.
    expect(run.stderr).not.toContain('a Key named owner already exists')
    expectNoKeyAnywhereElse(run, FIXED_KEY)
  })

  test('a write that fails with an unknown outcome says the name may now be taken, and what to do', async () => {
    randomBytesSpy.mockReturnValueOnce(FIXED_BYTES as never)
    const timedOut: Repository = {
      ...memoryRepository(),
      insertKey: async () => {
        throw new Error('timed out after COMMIT')
      },
    }

    const run = await mint(['owner'], timedOut)

    expect(run.code).toBe(1)
    // The row may exist, so "no Key was made" would be false, and it is not said.
    expect(run.stderr).not.toMatch(/no Key was made/i)
    expect(run.stderr).toContain('timed out after COMMIT')
    expect(run.stderr).toContain('may have been stored')
    expect(run.stderr).toContain('The name owner may now be taken')
    expect(run.stderr).toMatch(/already exists, it does, and a new name is needed/)
    expect(run.stdout).toBe('')
    expectNoKeyAnywhereElse(run, FIXED_KEY)
  })

  test('a print that fails after the write says the Key is stored, lost, and the name taken', async () => {
    randomBytesSpy.mockReturnValueOnce(FIXED_BYTES as never)
    const repo = memoryRepository()
    let stderr = ''

    const code = await mintKey(['owner'], {
      repo,
      stdout: () => {
        throw new Error('EPIPE')
      },
      stderr: (text) => {
        stderr += text
      },
    })

    expect(code).toBe(1)
    expect(stderr).not.toMatch(/no Key was made/i)
    expect(stderr).toContain('was stored but could not be printed (EPIPE)')
    expect(stderr).toContain('The name owner is taken')
    expect(stderr).not.toContain(FIXED_SUFFIX)
    // And it is true: the row is there.
    expect(await repo.findKeyByName('owner')).not.toBeNull()
  })

  test('a duplicate refusal and a failed lookup are certain, and say no Key was made', async () => {
    const seeded = memoryRepository({ keys: [{ name: 'owner', key_sha256: sha256Hex('older') }] })
    const raced = await mint(['owner'], { ...seeded, findKeyByName: async () => null })
    const lookup = await mint(['owner'], {
      ...memoryRepository(),
      findKeyByName: async () => {
        throw new Error('connection reset')
      },
    })

    expect(raced.stderr).toContain('no Key was made: a Key named owner already exists')
    expect(raced.stderr).not.toMatch(/may have been stored|may now be taken/)
    expect(lookup.stderr).toContain('no Key was made: connection reset')
    expect(lookup.stderr).not.toMatch(/may have been stored|may now be taken/)
  })

  test('a lookup that fails is a failure too, and stores nothing', async () => {
    const { repo, inserts } = watched({
      ...memoryRepository(),
      findKeyByName: async () => {
        throw new Error('connection reset')
      },
    })

    const run = await mint(['owner'], repo)

    expect(run.code).not.toBe(0)
    expect(inserts).toStrictEqual([])
    expect(run.stdout).toBe('')
  })
})

describe('what the script is given', () => {
  test.each([
    ['no name', []],
    ['two names', ['one', 'two']],
    ['an empty name', ['']],
    ['a blank name', ['   ']],
    ['a name with spaces at the ends', [' owner ']],
    ['a name with a newline in it', ['owner\nKey: forged']],
  ])('%s is refused with a usage line, and nothing is written', async (_label, args) => {
    const { repo, calls } = watched(memoryRepository())

    const run = await mint(args, repo)

    expect(run.code).toBe(2)
    expect(run.stdout).toBe('')
    expect(run.stderr).toMatch(/usage/i)
    expect(calls).toStrictEqual([])
    expect(randomBytesSpy).not.toHaveBeenCalled()
  })

  test('a Key given as the name is refused, and is not repeated back', async () => {
    const { repo, calls } = watched(memoryRepository())

    const run = await mint(['alc_live_notarealkeyjustafixture'], repo)

    expect(run.code).toBe(2)
    expect(run.stdout).toBe('')
    // It would otherwise be stored in plain text as a name, and sit in the shell history either way.
    expect(run.stderr).not.toContain('notarealkeyjustafixture')
    expect(calls).toStrictEqual([])
  })
})

// The entry point is a different file from the logic, run as the Owner will run it, in a real
// process. It cannot reach a database here, so these cover what is true before one is reached:
// that it runs at all, and that it ends non-zero with nothing on stdout when it cannot go on.
describe('the entry point', () => {
  const tsx = new URL('../node_modules/tsx/dist/cli.mjs', import.meta.url).pathname
  const entry = new URL('./mint-key.ts', import.meta.url).pathname
  const run = (args: string[], env: Record<string, string>) =>
    spawnSync(process.execPath, [tsx, entry, ...args], {
      env: { PATH: process.env.PATH ?? '', ...env },
      encoding: 'utf8',
      timeout: 30_000,
    })

  test('stops without a database setting, names which one, and prints nothing to stdout', () => {
    const result = run(['owner'], {})

    expect(result.status).toBe(1)
    expect(result.stdout).toBe('')
    expect(result.stderr).toContain('no Key was made: DSQL_ENDPOINT is not set')
  })

  test('runs the script: a missing name is a usage error, exit 2, before any connection', () => {
    const result = run([], {
      DSQL_ENDPOINT: 'example.invalid',
      AWS_REGION: 'us-east-1',
      DSQL_DB_ROLE: 'admin',
    })

    expect(result.status).toBe(2)
    expect(result.stdout).toBe('')
    expect(result.stderr).toMatch(/usage/i)
  })
})
