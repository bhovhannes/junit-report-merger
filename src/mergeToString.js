/*
 * @license MIT http://www.opensource.org/licenses/mit-license.php
 * @author  Hovhannes Babayan <bhovhannes at gmail dot com>
 */

var xmldom = require('xmldom');

/**
 * Merges contents of given XML strings and returns resulting XML string.
 * @param {String[]} srcStrings   Array of strings to merge together.
 * @param {Object} [options]   Merge options. Currently unused.
 * @return {String}
 */
function mergeToString(srcStrings, options) {
    var DOMParser = xmldom.DOMParser,
        XMLSerializer = xmldom.XMLSerializer;

    var combinedTestsDoc = new DOMParser().parseFromString('<?xml version="1.0"?>\n<testsuites></testsuites>', 'text/xml');
    var combinedTestSuitesNode = combinedTestsDoc.documentElement;

    var failures = 0,
        errors = 0,
        tests = 0;

    function docIteratorFn(testSuiteNode) {
        var testsAttr = testSuiteNode.getAttribute('tests');
        if (testsAttr) {
            tests += parseInt(testsAttr, 10);
        }

        var failuresAttr = testSuiteNode.getAttribute('failures');
        if (failuresAttr) {
            failures += parseInt(failuresAttr, 10);
        }

        var errorsAttr = testSuiteNode.getAttribute('errors');
        if (errorsAttr) {
            errors += parseInt(errorsAttr, 10);
        }
        combinedTestSuitesNode.appendChild(testSuiteNode);
    }

    srcStrings.forEach(function(srcString) {
        var doc = new DOMParser().parseFromString(srcString, 'text/xml');
        var nodes = doc.getElementsByTagName('testsuite'),
            nodeCount = nodes.length;

        for(var i=0; i<nodeCount; ++i) {
            docIteratorFn(nodes[i]);
        }
    });

    combinedTestSuitesNode.setAttribute('tests', tests);
    combinedTestSuitesNode.setAttribute('failures', failures);
    combinedTestSuitesNode.setAttribute('errors', errors);

    var xmlString = new XMLSerializer().serializeToString(combinedTestSuitesNode);
    if (xmlString.indexOf('<?') !== 0) {
        xmlString = '<?xml version="1.0"?>\n' + xmlString;
    }

    return xmlString;
}

module.exports = mergeToString;
