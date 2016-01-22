/*
 * @license MIT http://www.opensource.org/licenses/mit-license.php
 * @author  Hovhannes Babayan <bhovhannes at gmail dot com>
 */

var _async = require('async');
var mergeToString = require('./mergeToString');

/**
 * Reads multiple streams, merges their contents and write into the given stream.
 * @param {WriteStream} destStream   A stream which will be used to write the merge result.
 * @param {ReadStream[]} srcStreams   Streams which will be used to read data from.
 * @param {Object} [options]   Merge options. Currently unused.
 * @param {Function} cb   Callback function which will be called at completion. Will receive error as first argument if any.
 */
function mergeStreams(destStream, srcStreams, options, cb) {
    _async.waterfall(
        [
            _async.apply(_async.map,
                srcStreams,
                function (readable, cb) {
                    readable.setEncoding('utf8');
                    var srcString = '';
                    readable.on('error', cb);
                    readable.on('data', function(chunk) {
                        srcString += chunk;
                    });
                    readable.on('end', function () {
                        cb(null, srcString);
                    });
                }
            ),
            function (srcStrings, cb) {
                var destString = mergeToString(srcStrings, options);
                destStream.on('error', cb);
                destStream.write(destString, 'utf8');
                cb();
            }
        ],
        cb
    );
}

module.exports = mergeStreams;
