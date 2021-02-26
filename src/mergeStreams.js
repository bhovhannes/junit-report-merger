const { normalizeArgs, readableToString } = require('./helpers.js')
const { mergeToString } = require('./mergeToString.js')

/**
 * @typedef {{}} MergeStreamsOptions
 *
 * @callback TMergeStreamsCallback
 * @param {Error} [err]  Error if any
 * @return {void}
 *
 *
 * @callback MergeStreamsCallbackStyle
 * @param {import('stream').Writable} destStream   A stream which will be used to write the merge result.
 * @param {import('stream').Readable[]} srcStreams   Streams which will be used to read data from.
 * @param {MergeStreamsOptions} options   Merge options. Currently unused.
 * @param {TMergeStreamsCallback} cb   Callback function which will be called at completion. Will receive error as first argument if any.
 * @return {void}
 *
 * @callback MergeStreamsPromiseStyle
 * @param {import('stream').Writable} destStream   A stream which will be used to write the merge result.
 * @param {import('stream').Readable[]} srcStreams   Streams which will be used to read data from.
 * @param {MergeStreamsOptions} [options]   Merge options. Currently unused.
 * @return {Promise<void>}
 *
 * @typedef {MergeStreamsCallbackStyle & MergeStreamsPromiseStyle} MergeStreamsFn
 *
 * @type {MergeStreamsFn}
 */
module.exports.mergeStreams = function (destStream, srcStreams, options, cb) {
  const { callback, normalizedOptions, returnValue } = normalizeArgs(options, cb)

  Promise.all(srcStreams.map(readableToString)).then((srcStrings) => {
    let destString = mergeToString(srcStrings, options)
    destStream.on('error', callback)
    destStream.write(destString, 'utf8', callback)
  }, callback)

  return returnValue
}
