const { describe, it, beforeEach, afterEach, expect } = require('@jest/globals')
const path = require('path')
const fsPromises = require('fs').promises
const { create } = require('xmlbuilder2')
const { mergeFiles } = require('../index.js')

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

  afterEach(async () => {
    await fsPromises.unlink(fixturePaths.output)
  })

  async function assertOutput() {
    const contents = await fsPromises.readFile(fixturePaths.output, { encoding: 'utf8' })
    const doc = create(contents).root()
    expect(doc.node.childNodes).toHaveLength(4)

    expect(doc.node.nodeName.toLowerCase()).toBe('testsuites')
    const foundAttrs = {}
    for (const attrNode of doc.node.attributes) {
      const name = attrNode.name
      if (['tests', 'errors', 'failures'].includes(name)) {
        foundAttrs[name] = attrNode.value
      }
    }
    expect(foundAttrs).toEqual({
      tests: '6',
      errors: '0',
      failures: '2'
    })
  }

  describe('mergeFiles', function () {
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
      const onFileMatched = jest.fn()
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
      expect(create(contents).root().node.childNodes).toHaveLength(0)
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
      expect(create(actualContents).toObject()).toEqual(create(expectedContents).toObject())
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
        expect(create(actualContents).toObject()).toEqual(create(expectedContents).toObject())
      }
    )
  })

  describe('cli', function () {
    it('merges xml reports', async () => {
      const stdout = await new Promise((resolve, reject) => {
        const { exec } = require('child_process')
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
      const stdout = await new Promise((resolve, reject) => {
        const { exec } = require('child_process')
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
