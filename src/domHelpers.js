function getNodeAttribute(node, name) {
  for (const attrNode of node.attributes) {
    if (attrNode.name === name) {
      return attrNode.value
    }
  }
}

function isTestSuiteNode(node) {
  return node.nodeName.toLowerCase() === 'testsuite'
}

function findTestSuiteByName(builder, suiteName) {
  return builder.find(
    ({ node }) => isTestSuiteNode(node) && suiteName === getNodeAttribute(node, 'name'),
    false,
    false
  )
}

module.exports = {
  findTestSuiteByName,
  isTestSuiteNode,
  getNodeAttribute
}
