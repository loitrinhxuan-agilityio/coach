#!/usr/bin/env node
// Checks migration SQL against the constructs Aurora DSQL rejects or this project holds back:
//   node tools/check-dsql-sql.mjs <migrations directory>
// Exit 0: nothing on the list was found. Exit 1: a finding, or a check that could not be done (no
// .sql files, an unreadable path). Exit 2: wrong usage. It is a guard, not a proof of acceptance; see
// dsql-sql.mjs for what it reads, what it refuses and what it does not cover.
//
// This file runs main() unconditionally. There is deliberately no "only when run directly" test on
// the path: comparing the script's path with its real path made an earlier version exit 0, silently
// checking nothing, whenever it was reached through a symlink.

import { checkDirectory } from './dsql-sql.mjs'

function main(args) {
  if (args.length !== 1) {
    console.error('usage: node tools/check-dsql-sql.mjs <migrations directory>')
    return 2
  }
  const { files, findings, problems } = checkDirectory(args[0])

  for (const problem of problems) console.error(`problem: ${problem}`)
  for (const item of findings) {
    console.error(`${item.file}: [${item.tier}] ${item.rule}: ${item.why}`)
    if (item.statement !== '') console.error(`    ${item.statement}`)
  }

  if (problems.length > 0 || findings.length > 0) {
    console.error(
      `${files} migration ${files === 1 ? 'file' : 'files'} checked, ${findings.length} ${findings.length === 1 ? 'finding' : 'findings'}, ${problems.length} ${problems.length === 1 ? 'problem' : 'problems'}`,
    )
    return 1
  }
  console.log(
    `${files} migration ${files === 1 ? 'file' : 'files'} checked, 0 findings. This is a guard, not a proof of acceptance.`,
  )
  return 0
}

process.exitCode = main(process.argv.slice(2))
