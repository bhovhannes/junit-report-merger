const { normalizeArgs, readableToString } = require('./helpers.js')
const { mergeToString } = require('./mergeToString.js')

/**
 * @typedef {Object} MergeStreamsOptions
 * @property {boolean} sumTime  Aggregate testsuite time with sum instead of max
 *
 * @callback TMergeStreamsCallback
 * @param {Error} [err]  Error if any
 * @return {void}
 *
 *
 * @callback MergeStreamsCallbackStyle
 * @param {import('stream').Writable} destStream   A stream which will be used to write the merge result.
 * @param {import('stream').Readable[]} srcStreams   Streams which will be used to read data from.
 * @param {MergeStreamsOptions} options   Merge options.
 * @param {TMergeStreamsCallback} cb   Callback function which will be called at completion. Will receive error as first argument if any.
 * @return {void}
 *
 * @callback MergeStreamsPromiseStyle
 * @param {import('stream').Writable} destStream   A stream which will be used to write the merge result.
 * @param {import('stream').Readable[]} srcStreams   Streams which will be used to read data from.
 * @param {MergeStreamsOptions} [options]   Merge options.
 * @return {Promise<void>}
 *
 * @typedef {MergeStreamsCallbackStyle & MergeStreamsPromiseStyle} MergeStreamsFn
 *
 * @type {MergeStreamsFn}
 */
module.exports.mergeStreams = function (destStream, srcStreams, options, cb) {
  const { callback, normalizedOptions, returnValue } = normalizeArgs(options, cb)

  Promise.all(srcStreams.map(readableToString))
    .then(async (srcStrings) => {
      let destString = await mergeToString(srcStrings, {
        sumTime: normalizedOptions?.sumTime ?? false
      })
      destStream.on('error', callback)
      destStream.write(destString, 'utf8', callback)
    })
    .catch(callback)

  return returnValue
}
