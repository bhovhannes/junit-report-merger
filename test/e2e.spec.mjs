import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest'
import path from 'node:path'
import fsPromises from 'node:fs/promises'
import fs from 'node:fs'
import { XMLParser } from 'fast-xml-parser'
import { Writable, Readable } from 'node:stream'
import { mergeFiles, mergeStreams } from '../index.js'

describe('e2e', function () {
  let fixturePaths
  beforeEach(() => {
    fixturePaths = {
      inputs: [
        path.join(__dirname, 'fixtures', 'm1.xml'),
        path.join(__dirname, 'fixtures', 'm2.xml'),
        path.join(__dirname, 'fixtures', 'm3.xml')
      ],
      output: path.join(__dirname, 'output', 'actual-combined-1-3.xml')
    }
  })

  async function assertOutput() {
    const contents = await fsPromises.readFile(fixturePaths.output, { encoding: 'utf8' })
    const parser = new XMLParser({
      ignoreAttributes: false,
      preserveOrder: true,
      parseTagValue: false,
      parseAttributeValue: false
    })
    const doc = parser.parse(contents)

    // Find testsuites node
    let testSuitesNode = null
    for (const node of doc) {
      if (node.testsuites !== undefined) {
        testSuitesNode = node
        break
      }
    }

    expect(testSuitesNode).toBeTruthy()
    expect(testSuitesNode.testsuites).toHaveLength(4)

    const attrs = testSuitesNode[':@'] || {}
    expect(attrs).toEqual(expect.objectContaining({
      '@_tests': '6',
      '@_errors': '0',
      '@_failures': '2'
    }))
  }

  describe('mergeFiles', function () {
    afterEach(async () => {
      await fsPromises.unlink(fixturePaths.output)
    })

    it('merges xml reports (options passed)', async () => {
      await mergeFiles(fixturePaths.output, fixturePaths.inputs, {})
      await assertOutput()
    })

    it('merges xml reports (options omitted)', async () => {
      await mergeFiles(fixturePaths.output, fixturePaths.inputs)
      await assertOutput()
    })

    it('merges xml reports matching given glob pattern', async () => {
      await mergeFiles(fixturePaths.output, ['./**/fixtures/m*.xml'])
      await assertOutput()
    })

    it('calls onFileMatched for each matching file', async () => {
      const onFileMatched = vi.fn()
      await mergeFiles(fixturePaths.output, ['./**/fixtures/m*.xml'], {
        onFileMatched
      })
      expect(onFileMatched.mock.calls).toEqual([
        [
          {
            filePath: 'test/fixtures/m1.xml'
          }
        ],
        [
          {
            filePath: 'test/fixtures/m2.xml'
          }
        ],
        [
          {
            filePath: 'test/fixtures/m3.xml'
          }
        ]
      ])
      await assertOutput()
    })

    it('produces an empty xml report when no files match given glob pattern', async () => {
      await mergeFiles(fixturePaths.output, ['./no/files/will/match/this/*.xml'])
      const contents = await fsPromises.readFile(fixturePaths.output, { encoding: 'utf8' })
      const parser = new XMLParser({
        ignoreAttributes: false,
        preserveOrder: true
      })
      const doc = parser.parse(contents)
      let testSuitesNode = null
      for (const node of doc) {
        if (node.testsuites !== undefined) {
          testSuitesNode = node
          break
        }
      }
      expect(testSuitesNode.testsuites).toHaveLength(0)
    })

    it('merges xml reports (options passed, callback style)', async () => {
      await new Promise((resolve, reject) => {
        mergeFiles(fixturePaths.output, fixturePaths.inputs, {}, (err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })

      await assertOutput()
    })

    it('merges xml reports (options omitted, callback style)', async () => {
      await new Promise((resolve, reject) => {
        mergeFiles(fixturePaths.output, fixturePaths.inputs, (err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })

      await assertOutput()
    })

    it('preserves empty tags', async () => {
      await mergeFiles(
        fixturePaths.output,
        [path.join(__dirname, 'fixtures', 'with-empty-tag.xml')],
        {}
      )

      const contents = await fsPromises.readFile(fixturePaths.output, { encoding: 'utf8' })
      expect(contents).toContain('</testcase>')
    })

    it('correctly merges empty reports', async () => {
      await mergeFiles(
        fixturePaths.output,
        [
          path.join(__dirname, 'fixtures', 'empty.xml'),
          path.join(__dirname, 'fixtures', 'spaces.xml')
        ],
        {}
      )

      const contents = await fsPromises.readFile(fixturePaths.output, { encoding: 'utf8' })
      expect(contents).toBe(
        '<?xml version="1.0" encoding="UTF-8"?>\n' + '<testsuites></testsuites>'
      )
    })

    it('preserves xml entities', async () => {
      await mergeFiles(
        fixturePaths.output,
        [path.join(__dirname, 'fixtures', 'with-entity-char.xml')],
        {}
      )

      const contents = await fsPromises.readFile(fixturePaths.output, { encoding: 'utf8' })
      expect(contents).toContain('failure attr with ]]&gt;')
      expect(contents).toContain('failure message with ]]&gt;')
    })

    it('preserves xml entities in attributes', async () => {
      await mergeFiles(
        fixturePaths.output,
        [path.join(__dirname, 'fixtures', 'with-entities-in-attributes.xml')],
        {}
      )

      const contents = await fsPromises.readFile(fixturePaths.output, { encoding: 'utf8' })
      expect(contents).toContain('SingleSemicolon(&amp;)')
      expect(contents).toContain('DoubleSemicolon(&amp;;)')
    })

    it('merges m*.xml files into one, matching predefined snapshot', async () => {
      await mergeFiles(fixturePaths.output, fixturePaths.inputs)
      const actualContents = await fsPromises.readFile(fixturePaths.output, { encoding: 'utf8' })
      const expectedContents = await fsPromises.readFile(
        path.join(__dirname, 'fixtures', 'expected', 'expected-combined-1-3.xml'),
        'utf8'
      )
      const parser = new XMLParser({
        ignoreAttributes: false,
        preserveOrder: false,
        parseTagValue: false,
        parseAttributeValue: true
      })
      expect(parser.parse(actualContents)).toEqual(parser.parse(expectedContents))
    })

    it.each([
      { fixtureFolder: path.join('testsuite-merging', '1') },
      { fixtureFolder: path.join('testsuite-merging', '2') },
      { fixtureFolder: path.join('testsuite-merging', '3') },
      { fixtureFolder: path.join('testsuite-merging', '4') },
      { fixtureFolder: path.join('testsuite-merging', '5') }
    ])(
      'combines similar testsuite elements ("$fixtureFolder/file*.xml" -> "$fixtureFolder/expected.xml")',
      async ({ fixtureFolder }) => {
        const expectedOutputPath = path.join(__dirname, 'fixtures', fixtureFolder, 'expected.xml')
        fixturePaths.inputs = [path.join(__dirname, 'fixtures', fixtureFolder, 'file*.xml')]
        await mergeFiles(fixturePaths.output, fixturePaths.inputs)
        const actualContents = await fsPromises.readFile(fixturePaths.output, { encoding: 'utf8' })
        const expectedContents = await fsPromises.readFile(expectedOutputPath, { encoding: 'utf8' })
        const parser = new XMLParser({
          ignoreAttributes: false,
          preserveOrder: false,
          parseTagValue: false,
          parseAttributeValue: true
        })
        expect(parser.parse(actualContents)).toEqual(parser.parse(expectedContents))
      }
    )
  })

  describe('mergeStreams', function () {
    let destStream
    let destBuffer

    beforeEach(() => {
      destBuffer = []
      destStream = new Writable({
        write(chunk, encoding, callback) {
          destBuffer.push(chunk.toString())
          callback()
        }
      })
    })

    function createReadableFromString(str) {
      return Readable.from([str])
    }

    function getDestString() {
      return destBuffer.join('')
    }

    it('merges multiple streams (promise style)', async () => {
      const srcStreams = [
        fs.createReadStream(path.join(__dirname, 'fixtures', 'm1.xml')),
        fs.createReadStream(path.join(__dirname, 'fixtures', 'm2.xml'))
      ]

      await mergeStreams(destStream, srcStreams, {})

      const result = getDestString()
      expect(result).toContain('<testsuites')
      expect(result).toContain('</testsuites>')
    })

    it('merges multiple streams (options omitted, promise style)', async () => {
      const srcStreams = [
        fs.createReadStream(path.join(__dirname, 'fixtures', 'm1.xml')),
        fs.createReadStream(path.join(__dirname, 'fixtures', 'm2.xml'))
      ]

      await mergeStreams(destStream, srcStreams)

      const result = getDestString()
      expect(result).toContain('<testsuites')
    })

    it('merges multiple streams (callback style)', async () => {
      const srcStreams = [
        fs.createReadStream(path.join(__dirname, 'fixtures', 'm1.xml')),
        fs.createReadStream(path.join(__dirname, 'fixtures', 'm2.xml'))
      ]

      await new Promise((resolve, reject) => {
        mergeStreams(destStream, srcStreams, {}, (err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })

      const result = getDestString()
      expect(result).toContain('<testsuites')
    })

    it('merges multiple streams (options omitted, callback style)', async () => {
      const srcStreams = [
        fs.createReadStream(path.join(__dirname, 'fixtures', 'm1.xml')),
        fs.createReadStream(path.join(__dirname, 'fixtures', 'm2.xml'))
      ]

      await new Promise((resolve, reject) => {
        mergeStreams(destStream, srcStreams, (err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })

      const result = getDestString()
      expect(result).toContain('<testsuites')
    })

    it('handles stream read errors', async () => {
      const errorStream = new Readable({
        read() {
          this.destroy(new Error('Stream read error'))
        }
      })

      const srcStreams = [errorStream]

      await expect(mergeStreams(destStream, srcStreams, {})).rejects.toThrow('Stream read error')
    })

    it('handles destination stream write errors', async () => {
      const errorDestStream = new Writable({
        write(chunk, encoding, callback) {
          callback(new Error('Write error'))
        }
      })

      const srcStreams = [
        createReadableFromString(
          '<?xml version="1.0" encoding="UTF-8"?>\n<testsuites></testsuites>'
        )
      ]

      await expect(mergeStreams(errorDestStream, srcStreams, {})).rejects.toThrow('Write error')
    })
  })

  describe('cli', function () {
    it('merges xml reports', async () => {
      const { exec } = await import('node:child_process')
      const stdout = await new Promise((resolve, reject) => {
        exec(
          'node ./cli.js ./test/output/actual-combined-1-3.xml "./test/**/m1.xml" "./test/**/m?.xml"',
          function (error, stdout, stderr) {
            if (error) {
              reject(error)
            } else {
              resolve(stdout)
            }
          }
        )
      })
      expect(stdout).toMatch('3 files processed')
      expect(stdout).not.toMatch('Provided input file patterns did not matched any file.')
      await assertOutput()
    })

    it('provides meaningful message if no input files can be found', async () => {
      const { exec } = await import('node:child_process')
      const stdout = await new Promise((resolve, reject) => {
        exec(
          'node ./cli.js ./test/output/actual-combined-1-3.xml "./does-not-exist/**/x1.xml"',
          function (error, stdout, stderr) {
            if (error) {
              reject(error)
            } else {
              resolve(stdout)
            }
          }
        )
      })
      expect(stdout).toMatch('0 files processed')
      expect(stdout).toMatch('Provided input file patterns did not matched any file.')
    })
  })
})
