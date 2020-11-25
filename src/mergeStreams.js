const { normalizeArgs, readableToString } = require("./helpers.js");
const { mergeToString } = require("./mergeToString.js");

/**
 * Reads multiple streams, merges their contents and write into the given stream.
 * @param {WriteStream} destStream   A stream which will be used to write the merge result.
 * @param {ReadStream[]} srcStreams   Streams which will be used to read data from.
 * @param {Object} [options]   Merge options. Currently unused.
 * @param {Function} [cb]   Callback function which will be called at completion. Will receive error as first argument if any.
 */
function mergeStreams(destStream, srcStreams, options, cb) {
    const { callback, normalizedOptions, returnValue } = normalizeArgs(
        options,
        cb
    );

    Promise.all(srcStreams.map(readableToString)).then((srcStrings) => {
        let destString = mergeToString(srcStrings, options);
        destStream.on("error", callback);
        destStream.write(destString, "utf8", callback);
    }, callback);

    return returnValue;
}

module.exports = { mergeStreams };
