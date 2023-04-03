# junit-report-merger

[![NPM version][npm-version-image]][npm-url] [![NPM downloads][npm-downloads-image]][npm-url] [![codecov][codecov-image]][codecov-url] [![MIT License][license-image]][license-url]

Merges multiple JUnit XML reports into one.

Reporters of many testing frameworks generate JUnit XML reports. [`mocha-junit-reporter`](https://www.npmjs.com/package/mocha-junit-reporter), [`karma-junit-reporter`](https://www.npmjs.com/package/karma-junit-reporter) to name a few. Sometimes there is a need to combine multiple reports together in a single file. This is what `junit-report-merger` does.

`junit-report-merger` creates a new test results report in [JUnit XML format](#junit-xml-format) by collecting all `<testsuite>` elements from all XML reports and putting them together.

## CLI

Package provides a `jrm` binary, which you can use to merge multiple xml reports into one.  
In a nutshell it is a tiny wrapper around [mergeFiles](#mergefiles) api.

### Installing

#### Globally

```shell script
npm install -g junit-report-merger
```

In this case you'll be able to execute `jrm` binary from within your shell.

#### Locally

```shell script
npm install junit-report-merger --save-dev
```

In this case `jrm` binary will be available only inside `package.json` scripts:

```
scripts: {
    "merge-reports": "jrm combined.xml \"results/*.xml\""
}
```

### Usage

Assuming your JUnit test results are in `./results/units/` folder, and you want to get a combined test result file in `./results/combined.xml`:

```shell script
jrm ./results/combined.xml "./results/units/*.xml"
```

You can also specify multiple glob patterns:

```shell script
jrm ./results/combined.xml "./results/units/*.xml" "./results/e2e/*.xml"
```

**NOTE**  
Make sure to wrap each pattern with double quotes (`"`), otherwise your shell may try to expand it instead of passing to Node.js.

## API

Package exports a single object with the following methods.

[mergeFiles](#mergefiles) - Merges contents of multiple XML report files into a single XML report file.

[mergeStreams](#mergestreams) - Merges contents of multiple XML report streams into a single XML report stream.

[mergeToString](#mergetostring) - Merges multiple XML report strings into a single XML report string.

## Usage

```javascript
const path = require('path')
const { mergeFiles } = require('junit-report-merger')

const outputFile = path.join(__dirname, 'results', 'combined.xml')

const inputFiles = ['./results/units/*.xml', './results/e2e/*.xml']

try {
  await mergeFiles(outputFile, inputFiles)
  console.log('Merged, check ./results/combined.xml')
} catch (err) {
  console.error(error)
}
```

## `mergeFiles`

Signature:

```typescript
mergeFiles(
    destFilePath: string,
    srcFilePathsOrGlobPatterns: string[],
    options?: MergeFilesOptions
) => Promise<void>

mergeFiles(
    destFilePath: string,
    srcFilePathsOrGlobPatterns: string[],
    options: MergeFilesOptions,
    cb: (err?: Error) => void
) => void
```

Reads multiple files, merges their contents and write into the given file.

| Param                      | Type                                                 | Description                                                                                                      |
| -------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| destFilePath               | <code>string</code>                                  | Where the output should be stored. Denotes a path to file. If file already exists, it will be overwritten.       |
| srcFilePathsOrGlobPatterns | <code>string[]</code>                                | Paths to the files which should be merged. You can also specify glob patterns, such as `results/**/report-*.xml` |
| [options]                  | <code>[MergeFilesOptions](#mergefilesoptions)</code> | Merge options.                                                                                                   |
| [cb]                       | <code>(err?: Error) => void</code>                   | Callback function which will be called at completion. Will receive error as first argument if any.               |

Last argument - `cb` is a Node.js style callback function. If callback function is not passed, function will return a promise. That is, all the following variants will work:

```javascript
// options passed, callback style
mergeFiles(destFilePath, srcFilePaths, {}, (err) => {})

// options missing, callback style
mergeFiles(destFilePath, srcFilePaths, (err) => {})

// options passed, promise style
await mergeFiles(destFilePath, srcFilePaths, {})

// options missing, promise style
await mergeFiles(destFilePath, srcFilePaths)
```

### `MergeFilesOptions`

These are the options accepted by [`mergeFiles`](#mergefiles).

Signature:

```typescript
type MergeFilesOptions = {
    onFileMatched? (matchInfo: {
        filePath: string
    }) => void
}
```

#### `onFileMatched`

[`mergeFiles`](#mergefiles) calls function specified by the `onFileMatched` option once for each file matched by `srcFilePaths`, right before file processing begins.

## mergeStreams

Signature:

```typescript
mergeStreams(
    destStream: WritableStream,
    srcStreams: ReadableStream[],
    options?: {}
) => Promise<void>

mergeStreams(
    destStream: WritableStream,
    srcStreams: ReadableStream[],
    options: {},
    cb: (err?: Error) => void
) => void
```

Reads multiple streams, merges their contents and write into the given stream.

| Param      | Type                               | Description                                                                                        |
| ---------- | ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| destStream | <code>WritableStream</code>        | A stream which will be used to write the merge result.                                             |
| srcStreams | <code>ReadableStream[]</code>      | Streams which will be used to read data from.                                                      |
| [options]  | <code>object</code>                | Merge options. Currently unused.                                                                   |
| [cb]       | <code>(err?: Error) => void</code> | Callback function which will be called at completion. Will receive error as first argument if any. |

Last argument - `cb` is a Node.js style callback function. If callback function is not passed, function will return a promise. That is, all the following variants will work:

```javascript
// options passed, callback style
mergeStreams(destStream, srcStreams, {}, (err) => {})

// options missing, callback style
mergeStreams(destStream, srcStreams, (err) => {})

// options passed, promise style
await mergeStreams(destStream, srcStreams, {})

// options missing, promise style
await mergeStreams(destStream, srcStreams)
```

## mergeToString

Signature:

```typescript
mergeToString(
    srcStrings: string[],
    options?: {}
) => string
```

Merges given XML strings and returns the result.

| Param      | Type                  | Description                         |
| ---------- | --------------------- | ----------------------------------- |
| srcStrings | <code>string[]</code> | Array of strings to merge together. |
| [options]  | <code>object</code>   | Merge options. Currently unused.    |

## JUnit XML Format

Unfortunately, there is no official specification of JUnit XML file format.

The XML schema for the original JUnit XML format is [here](https://github.com/windyroad/JUnit-Schema/blob/master/JUnit.xsd).

Over the time, various CI tools and test management software augmented original format with their own properties.  
The most comprehensive overview of the format is put together by folks at Testmo [here](https://github.com/testmoapp/junitxml).
`jrm` produces output conforming to that format and accepts files conforming to that format.

## License

MIT (http://www.opensource.org/licenses/mit-license.php)

[license-image]: http://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: LICENSE
[npm-url]: https://www.npmjs.org/package/junit-report-merger
[npm-version-image]: https://img.shields.io/npm/v/junit-report-merger.svg?style=flat
[npm-downloads-image]: https://img.shields.io/npm/dm/junit-report-merger.svg?style=flat
[codecov-url]: https://codecov.io/gh/bhovhannes/junit-report-merger
[codecov-image]: https://codecov.io/gh/bhovhannes/junit-report-merger/branch/master/graph/badge.svg?token=iJvUUKrgzB
