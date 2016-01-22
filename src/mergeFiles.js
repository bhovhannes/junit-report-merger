/*
 * @license MIT http://www.opensource.org/licenses/mit-license.php
 * @author  Hovhannes Babayan <bhovhannes at gmail dot com>
 */

var fs = require('fs');
var mergeStreams = require('./mergeStreams');

/**
 * Reads multiple files, merges their contents and write into the given file.
 * @param {String} destFilePath   Where the output should be stored. Denotes a path to file. If file already exists, it will be overwritten.
 * @param {String[]} srcFilePaths   Paths to the files which should be merged.
 * @param {Object} [options]   Merge options. Currently unused.
 * @param {Function} cb   Callback function which will be called at completion. Will receive error as first argument if any.
 */
function mergeFiles(destFilePath, srcFilePaths, options, cb) {
    var srcStreams = srcFilePaths.map(function (srcFilePath) {
        return fs.createReadStream(srcFilePath, {
            flags: 'r',
            encoding: 'utf8',
            autoClose: true
        });
    });
    var destStream = fs.createWriteStream(destFilePath, {
        flags: 'w',
        defaultEncoding: 'utf8',
        autoClose: true
    });
    mergeStreams(destStream, srcStreams, options, cb);
}

module.exports = mergeFiles;
