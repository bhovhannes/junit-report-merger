/*
 * @license MIT http://www.opensource.org/licenses/mit-license.php
 * @author  Hovhannes Babayan <bhovhannes at gmail dot com>
 */

const { mergeFiles } = require('./src/mergeFiles.js')
const { mergeStreams } = require('./src/mergeStreams.js')
const { mergeToString } = require('./src/mergeToString.js')

module.exports = {
  mergeFiles,
  mergeStreams,
  mergeToString
}
