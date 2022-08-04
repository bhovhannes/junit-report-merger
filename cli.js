#!/usr/bin/env node

const { Command } = require('commander')
const pkg = require('./package.json')
const { mergeFiles } = require('./src/mergeFiles.js')

function getProgram() {
  const program = new Command()
  program.version(pkg.version)
  program.description(
    pkg.description +
      '\n\n' +
      'Example (combines a.xml and b.xml into target.xml):\n  jrm target.xml a.xml b.xml' +
      '\n\n' +
      'Example (glob patterns to match input files):\n  jrm ./results/combined.xml "./results/units/*.xml" "./results/e2e/*.xml"'
  )
  program.arguments('<destination> <sources...>')
  return program
}

const program = getProgram()
program.action(async function (destination, sources) {
  const destFilePath = destination
  const srcFilePathsOrGlobPatterns = sources

  let processedFileCount = 0
  await mergeFiles(destFilePath, srcFilePathsOrGlobPatterns, {
    onFileMatched: () => {
      ++processedFileCount
    }
  })
  process.stdout.write(`Done. ${processedFileCount} files processed.\n`)
  if (processedFileCount === 0) {
    process.stdout.write(`Provided input file patterns did not matched any file.\n`)
  }
})
program.parseAsync().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
