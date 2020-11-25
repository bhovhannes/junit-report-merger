const fs = require("fs");
const fastGlob = require("fast-glob");
const { normalizeArgs } = require("./helpers.js");
const { mergeStreams } = require("./mergeStreams.js");

/**
 * Reads multiple files, merges their contents and write into the given file.
 * @param {String} destFilePath   Where the output should be stored. Denotes a path to file. If file already exists, it will be overwritten.
 * @param {String[]} srcFilePathsOrGlobPatterns   Paths to the files which should be merged or glob patterns to find them.
 * @param {Object} [options]   Merge options. Currently unused.
 * @param {Function} [cb]   Callback function which will be called at completion. Will receive error as first argument if any.
 */
function mergeFiles(destFilePath, srcFilePathsOrGlobPatterns, options, cb) {
    const { callback, normalizedOptions, returnValue } = normalizeArgs(
        options,
        cb
    );

    fastGlob(srcFilePathsOrGlobPatterns, { dot: true }).then((srcFilePaths) => {
        const srcStreams = srcFilePaths.map(function (srcFilePath) {
            return fs.createReadStream(srcFilePath, {
                flags: "r",
                encoding: "utf8",
                autoClose: true,
            });
        });
        const destStream = fs.createWriteStream(destFilePath, {
            flags: "w",
            defaultEncoding: "utf8",
            autoClose: true,
        });
        mergeStreams(destStream, srcStreams, normalizedOptions, callback);
    }, callback);

    return returnValue;
}

module.exports = { mergeFiles };
