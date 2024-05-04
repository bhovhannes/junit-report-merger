const { create } = require('xmlbuilder2')
const { KNOWN_ATTRIBUTES } = require('./attributes.js')
const { isNumeric } = require('./helpers.js')
const {
  getNodeAttribute,
  findTestSuiteByName,
  isTestSuiteNode,
  isTestSuitesNode
} = require('./domHelpers.js')

/**
 * @typedef {{}} MergeStringsOptions
 */

/**
 * Merges contents of given XML strings and returns resulting XML string.
 * @param {String[]} srcStrings   Array of strings to merge together.
 * @param {MergeStringsOptions} [options]   Merge options. Currently unused.
 * @return {String}
 */
module.exports.mergeToString = function (srcStrings, options) {
  const targetDoc = create(
    {
      encoding: 'UTF-8'
    },
    {
      testsuites: {}
    }
  )

  srcStrings.forEach((srcString) => {
    function handleTestSuiteElement(visitorContext, builder) {
      const suiteName = getNodeAttribute(builder.node, 'name')
      const targetTestSuite = findTestSuiteByName(visitorContext.targetBuilder, suiteName)
      if (targetTestSuite) {
        // merge attributes from builder.node with targetTestSuite.node
        for (let srcAttr of builder.node.attributes) {
          const existingValue = getNodeAttribute(targetTestSuite.node, srcAttr.name)
          if (existingValue !== undefined) {
            if (
              srcAttr.name in KNOWN_ATTRIBUTES &&
              isNumeric(srcAttr.value) &&
              isNumeric(existingValue)
            ) {
              const { aggregator } = KNOWN_ATTRIBUTES[srcAttr.name]
              targetTestSuite.att(srcAttr.name, aggregator(existingValue, srcAttr.value))
            }
          } else {
            targetTestSuite.att(srcAttr.name, srcAttr.value)
          }
        }
        return targetTestSuite
      } else {
        visitorContext.targetBuilder.import(builder)
      }
    }

    function visitNodesRecursively(visitorContext, startingBuilder) {
      startingBuilder.each(
        (builder) => {
          const { node } = builder
          if (isTestSuiteNode(node)) {
            const childBuilder = handleTestSuiteElement(visitorContext, builder)
            if (childBuilder) {
              let targetBuilderBackup = visitorContext.targetBuilder
              visitorContext.targetBuilder = childBuilder
              visitNodesRecursively(visitorContext, builder)
              visitorContext.targetBuilder = targetBuilderBackup
            }
          } else {
            visitorContext.targetBuilder.import(builder)
          }
        },
        false,
        false
      )
    }

    let srcBuilder = create(srcString)
    if (!isTestSuitesNode(srcBuilder.root().node)) {
      srcBuilder = create(
        {
          encoding: 'UTF-8'
        },
        {
          testsuites: [srcBuilder.toObject()]
        }
      )
    }
    visitNodesRecursively(
      {
        currentPath: [],
        targetBuilder: targetDoc.root()
      },
      srcBuilder.root()
    )
  })

  const attributes = {}
  const attributeNames = []
  for (let attrName of Object.keys(KNOWN_ATTRIBUTES)) {
    if (KNOWN_ATTRIBUTES[attrName].rollup) {
      attributeNames.push(attrName)
    }
  }
  const testSuitesElement = targetDoc.root()
  testSuitesElement.each(
    ({ node }) => {
      if (isTestSuiteNode(node)) {
        for (let attrName of attributeNames) {
          const attrValue = getNodeAttribute(node, attrName)
          if (attrValue !== undefined && isNumeric(attrValue)) {
            const { aggregator } = KNOWN_ATTRIBUTES[attrName]
            attributes[attrName] = aggregator(attributes[attrName] || 0, attrValue)
          }
        }
      }
    },
    false,
    false
  )
  for (let attrName of attributeNames) {
    if (attrName in attributes) {
      testSuitesElement.att(attrName, attributes[attrName])
    }
  }

  return targetDoc.toString({
    allowEmptyTags: true,
    prettyPrint: true,
    noDoubleEncoding: true
  })
}
