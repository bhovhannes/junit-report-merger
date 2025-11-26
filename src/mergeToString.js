const { XMLParser, XMLBuilder } = require('fast-xml-parser')
const { KNOWN_ATTRIBUTES } = require('./attributes.js')
const { isNumeric } = require('./helpers.js')

/**
 * @typedef {{}} MergeStringsOptions
 */

const parserOptions = {
  ignoreAttributes: false,
  preserveOrder: true,
  commentPropName: '#comment',
  cdataPropName: '#cdata',
  trimValues: false,
  parseTagValue: false,
  parseAttributeValue: false,
  ignoreDeclaration: false,
  allowBooleanAttributes: true
}

const builderOptions = {
  ignoreAttributes: false,
  preserveOrder: true,
  commentPropName: '#comment',
  cdataPropName: '#cdata',
  format: true,
  indentBy: '    ',
  suppressEmptyNode: false,
  suppressBooleanAttributes: false
}

function getAttributes(node) {
  if (node[':@']) {
    return node[':@']
  }
  return {}
}

function setAttributes(node, attrs) {
  node[':@'] = attrs
}

function getTagName(node) {
  for (const key in node) {
    if (key !== ':@' && key !== '#text' && key !== '#comment' && key !== '#cdata') {
      return key
    }
  }
  return null
}

function getChildren(node) {
  const tagName = getTagName(node)
  if (tagName && Array.isArray(node[tagName])) {
    return node[tagName]
  }
  return []
}

function isTestSuiteNode(node) {
  const tagName = getTagName(node)
  return tagName === 'testsuite'
}

function isTestSuitesNode(node) {
  const tagName = getTagName(node)
  return tagName === 'testsuites'
}

function findTestSuiteByName(targetChildren, suiteName) {
  for (const child of targetChildren) {
    if (isTestSuiteNode(child)) {
      const attrs = getAttributes(child)
      if (attrs['@_name'] === suiteName) {
        return child
      }
    }
  }
  return null
}

function mergeAttributes(targetAttrs, srcAttrs, attrName) {
  const srcValue = srcAttrs[attrName]
  const targetValue = targetAttrs[attrName]

  const attrNameWithoutPrefix = attrName.replace('@_', '')

  if (targetValue !== undefined) {
    if (
      attrNameWithoutPrefix in KNOWN_ATTRIBUTES &&
      isNumeric(srcValue) &&
      isNumeric(targetValue)
    ) {
      const { aggregator } = KNOWN_ATTRIBUTES[attrNameWithoutPrefix]
      targetAttrs[attrName] = String(aggregator(targetValue, srcValue))
    }
  } else {
    targetAttrs[attrName] = srcValue
  }
}

function mergeTestSuitesRecursively(targetChildren, srcChildren) {
  for (const srcChild of srcChildren) {
    if (isTestSuiteNode(srcChild)) {
      const srcAttrs = getAttributes(srcChild)
      const suiteName = srcAttrs['@_name']
      const targetSuite = findTestSuiteByName(targetChildren, suiteName)

      if (targetSuite) {
        // Merge attributes
        const targetAttrs = getAttributes(targetSuite)
        for (const attrName in srcAttrs) {
          mergeAttributes(targetAttrs, srcAttrs, attrName)
        }

        // Recursively merge children
        const targetSuiteChildren = getChildren(targetSuite)
        const srcSuiteChildren = getChildren(srcChild)

        mergeTestSuitesRecursively(targetSuiteChildren, srcSuiteChildren)
      } else {
        // Add new test suite
        targetChildren.push(srcChild)
      }
    } else {
      // Not a testsuite node, just add it
      targetChildren.push(srcChild)
    }
  }
}

function calculateRollupAttributes(targetChildren) {
  const attributes = {}
  const attributeNames = []

  for (let attrName of Object.keys(KNOWN_ATTRIBUTES)) {
    if (KNOWN_ATTRIBUTES[attrName].rollup) {
      attributeNames.push(attrName)
    }
  }

  for (const child of targetChildren) {
    if (isTestSuiteNode(child)) {
      const attrs = getAttributes(child)
      for (const attrName of attributeNames) {
        const attrKey = '@_' + attrName
        const attrValue = attrs[attrKey]
        if (attrValue !== undefined && isNumeric(attrValue)) {
          const { aggregator } = KNOWN_ATTRIBUTES[attrName]
          attributes[attrKey] = aggregator(attributes[attrKey] || 0, attrValue)
        }
      }
    }
  }

  return attributes
}

/**
 * Merges contents of given XML strings and returns resulting XML string.
 * @param {String[]} srcStrings   Array of strings to merge together.
 * @param {MergeStringsOptions} [options]   Merge options. Currently unused.
 * @return {Promise<String>}
 */
module.exports.mergeToString = async function (srcStrings, options) {
  const parser = new XMLParser(parserOptions)

  // Initialize target document
  const targetDoc = [
    {
      '?xml': [
        {
          '#text': ''
        }
      ],
      ':@': {
        '@_version': '1.0',
        '@_encoding': 'UTF-8'
      }
    },
    {
      testsuites: []
    }
  ]

  const targetTestSuitesNode = targetDoc[1]
  const targetChildren = targetTestSuitesNode.testsuites

  // Process each source XML
  for (const srcString of srcStrings) {
    const trimmed = srcString.trim()
    if (!trimmed) continue

    const srcDoc = parser.parse(trimmed)

    // Find the root element (skip XML declaration)
    let srcRootNode = null
    for (const node of srcDoc) {
      if (isTestSuitesNode(node)) {
        srcRootNode = node
        break
      }
      // If root is testsuite, wrap it in testsuites
      if (isTestSuiteNode(node)) {
        srcRootNode = {
          testsuites: [node]
        }
        break
      }
    }

    if (!srcRootNode) continue

    const srcChildren = getChildren(srcRootNode)
    mergeTestSuitesRecursively(targetChildren, srcChildren)
  }

  // Calculate and set rollup attributes
  const rollupAttrs = calculateRollupAttributes(targetChildren)
  if (Object.keys(rollupAttrs).length > 0) {
    setAttributes(targetTestSuitesNode, rollupAttrs)
  }

  // Build the output XML
  const builder = new XMLBuilder(builderOptions)
  return builder.build(targetDoc)
}
