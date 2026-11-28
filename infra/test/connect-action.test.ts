import { dsqlDeps } from '../../api/src/db/connection.js'
import { connectAction } from '../lib/spine-stack.js'

// The IAM action a Lambda needs follows from which auth-token method api/src/db/connection.ts calls
// for its role: the admin method needs dsql:DbConnectAdmin and the ordinary one dsql:DbConnect. If the
// stack grants the wrong one, every connection is refused and the template looks fine.
//
// This runs connection.ts's own choice, through a stand-in signer that says which method it was
// asked for, and sets that against the action `connectAction` gives. It does not ask connectAction
// what connectAction should say.
const calls: string[] = []

vi.mock('@aws-sdk/dsql-signer', () => ({
  DsqlSigner: class {
    getDbConnectAdminAuthToken = async () => {
      calls.push('admin')
      return 'fake-admin-auth-token'
    }
    getDbConnectAuthToken = async () => {
      calls.push('ordinary')
      return 'fake-auth-token'
    }
  },
}))

// AWS's own pairing of an auth-token method with the IAM action that permits it.
const ACTION_FOR = { admin: 'dsql:DbConnectAdmin', ordinary: 'dsql:DbConnect' } as const

const methodUsedFor = async (role: string): Promise<'admin' | 'ordinary'> => {
  calls.length = 0
  await dsqlDeps({
    host: 'fake-cluster.dsql.invalid',
    region: 'fake-region-1',
    role,
  }).mintAuthToken()
  expect(calls).toHaveLength(1)
  return calls[0] as 'admin' | 'ordinary'
}

describe('connectAction follows what connection.ts actually does', () => {
  test.each(['admin', 'app', 'reader', 'Admin', 'administrator', ''])(
    'for the role %j the action is the one its auth-token method needs',
    async (role) => {
      expect(connectAction(role)).toBe(ACTION_FOR[await methodUsedFor(role)])
    },
  )

  test('the stand-in does tell the two methods apart', async () => {
    expect(await methodUsedFor('admin')).toBe('admin')
    expect(await methodUsedFor('app')).toBe('ordinary')
  })
})
