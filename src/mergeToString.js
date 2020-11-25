const { DOMParser, XMLSerializer } = require("xmldom");

/**
 * Merges contents of given XML strings and returns resulting XML string.
 * @param {String[]} srcStrings   Array of strings to merge together.
 * @param {Object} [options]   Merge options. Currently unused.
 * @return {String}
 */
function mergeToString(srcStrings, options) {
    let combinedTestsDoc = new DOMParser().parseFromString(
        '<?xml version="1.0"?>\n<testsuites></testsuites>',
        "text/xml"
    );
    let combinedTestSuitesNode = combinedTestsDoc.documentElement;

    let failures = 0,
        errors = 0,
        tests = 0;

    function docIteratorFn(testSuiteNode) {
        let testsAttr = testSuiteNode.getAttribute("tests");
        if (testsAttr) {
            tests += parseInt(testsAttr, 10);
        }

        let failuresAttr = testSuiteNode.getAttribute("failures");
        if (failuresAttr) {
            failures += parseInt(failuresAttr, 10);
        }

        let errorsAttr = testSuiteNode.getAttribute("errors");
        if (errorsAttr) {
            errors += parseInt(errorsAttr, 10);
        }
        combinedTestSuitesNode.appendChild(testSuiteNode);
    }

    srcStrings.forEach(function (srcString) {
        let doc = new DOMParser().parseFromString(srcString, "text/xml");
        let nodes = doc.getElementsByTagName("testsuite"),
            nodeCount = nodes.length;

        for (let i = 0; i < nodeCount; ++i) {
            docIteratorFn(nodes[i]);
        }
    });

    combinedTestSuitesNode.setAttribute("tests", tests);
    combinedTestSuitesNode.setAttribute("failures", failures);
    combinedTestSuitesNode.setAttribute("errors", errors);

    let xmlString = new XMLSerializer().serializeToString(
        combinedTestSuitesNode
    );
    if (xmlString.indexOf("<?") !== 0) {
        xmlString = '<?xml version="1.0"?>\n' + xmlString;
    }

    return xmlString;
}

module.exports = { mergeToString };
