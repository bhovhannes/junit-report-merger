const { DOMParser, XMLSerializer } = require("xmldom");

/**
 * Merges contents of given XML strings and returns resulting XML string.
 * @param {String[]} srcStrings   Array of strings to merge together.
 * @param {Object} [options]   Merge options. Currently unused.
 * @return {String}
 */
function mergeToString(srcStrings, options) {
    const {
        documentElement: combinedTestSuitesNode,
    } = new DOMParser().parseFromString(
        '<?xml version="1.0"?>\n<testsuites></testsuites>',
        "text/xml"
    );

    const attrs = {
        failures: 0,
        errors: 0,
        tests: 0,
    };

    srcStrings.forEach((srcString) => {
        const doc = new DOMParser().parseFromString(srcString, "text/xml");
        const nodes = doc.getElementsByTagName("testsuite"),
            nodeCount = nodes.length;
        for (let i = 0; i < nodeCount; ++i) {
            const testSuiteNode = nodes[i];
            for (const attr in attrs) {
                attrs[attr] += Number(testSuiteNode.getAttribute(attr));
            }
            combinedTestSuitesNode.appendChild(testSuiteNode);
        }
    });

    for (const attr in attrs) {
        combinedTestSuitesNode.setAttribute(attr, attrs[attr]);
    }

    let xmlString = new XMLSerializer().serializeToString(
        combinedTestSuitesNode
    );
    if (xmlString.indexOf("<?") !== 0) {
        xmlString = '<?xml version="1.0"?>\n' + xmlString;
    }

    return xmlString;
}

module.exports = { mergeToString };
