function sumAggregator(a, b) {
  return Number(a) + Number(b)
}

function maxAggregator(a, b) {
  return Math.max(Number(a), Number(b))
}

/**
 * We use https://github.com/windyroad/JUnit-Schema/blob/master/JUnit.xsd as a reference.
 *
 * `rollup: true`  - means that attribute will be aggregated for "testsuite"
 *                         elements and applied to the root "testsuites" element.
 *
 * `rollup: false` - means that attribute will be aggregated only for "testsuite" elements.
 *
 * Attributes not in this list won't be aggregated.
 */
module.exports.KNOWN_ATTRIBUTES = {
  tests: {
    aggregator: sumAggregator,
    rollup: true
  },
  failures: {
    aggregator: sumAggregator,
    rollup: true
  },
  errors: {
    aggregator: sumAggregator,
    rollup: true
  },
  skipped: {
    aggregator: sumAggregator,
    rollup: true
  },
  time: {
    // usually, reports are being generated in a parallel, so using "sum" aggregator here can be wrong.
    aggregator: maxAggregator,
    rollup: true
  },
  assertions: {
    aggregator: sumAggregator,
    rollup: false
  },
  warnings: {
    aggregator: sumAggregator,
    rollup: false
  }
}
