const fs = require('node:fs')
const { glob } = require('tinyglobby')
const { normalizeArgs } = require('./helpers.js')
const { mergeToString } = require('./mergeToString.js')

/**
 * @typedef {Object} MatchInfo  Describes a single file match which will be processed
 * @property {string} filePath   Path to the file
 *
 * @callback MergeFilesCallback
 * @param {MatchInfo} matchInfo
 * @returns {void}
 *
 * @typedef {Object} MergeFilesOptions
 * @property {MergeFilesCallback} [onFileMatched]  A callback function which will be called for the each match
 *
 * @callback TMergeFilesCompletionCallback
 * @param {Error} [err]  Error if any
 * @return {void}
 *
 *
 * @callback MergeFilesCallbackStyle Reads multiple files, merges their contents and write into the given file.
 * @param {String} destFilePath   Where the output should be stored. Denotes a path to file. If file already exists, it will be overwritten.
 * @param {String[]} srcFilePathsOrGlobPatterns   Paths to the files which should be merged or glob patterns to find them.
 * @param {MergeFilesOptions} options   Merge options.
 * @param {TMergeFilesCompletionCallback} cb   Callback function which will be called at completion. Will receive error as first argument if any.
 * @return {void}
 *
 * @callback MergeFilesPromiseStyle Reads multiple files, merges their contents and write into the given file.
 * @param {String} destFilePath   Where the output should be stored. Denotes a path to file. If file already exists, it will be overwritten.
 * @param {String[]} srcFilePathsOrGlobPatterns   Paths to the files which should be merged or glob patterns to find them.
 * @param {MergeFilesOptions} [options]   Merge options. Currently unused.
 * @return {Promise<void>}
 *
 * @typedef {MergeFilesCallbackStyle & MergeFilesPromiseStyle} MergeFilesFn
 *
 * @type {MergeFilesFn}
 */
module.exports.mergeFiles = function (destFilePath, srcFilePathsOrGlobPatterns, options, cb) {
  const { callback, normalizedOptions, returnValue } = normalizeArgs(options, cb)

  glob(srcFilePathsOrGlobPatterns, { dot: true, expandDirectories: false })
    .then(async (srcFilePaths) => {
      const srcStrings = []

      for (const srcFilePath of srcFilePaths) {
        if (normalizedOptions.onFileMatched) {
          normalizedOptions.onFileMatched({
            filePath: srcFilePath
          })
        }

        const content = await fs.promises.readFile(srcFilePath, 'utf8')
        srcStrings.push(content)
      }

      const mergedContent = await mergeToString(srcStrings, {})
      await fs.promises.writeFile(destFilePath, mergedContent, 'utf8')

      callback()
    })
    .catch(callback)

  return returnValue
}
