/**
 * Aggregate using sum.
 *
 * @example sumAggregator(3, 9) == 12
 *
 * @param a
 * @param b
 *
 * @returns {number}
 */
function sumAggregator(a, b) {
  return Number(a) + Number(b)
}

/**
 * Aggregate using Math.max.
 *
 * @example maxAggregator(3, 9) == 9
 *
 * @param a
 * @param b
 *
 * @returns {number}
 */
function maxAggregator(a, b) {
  return Math.max(Number(a), Number(b))
}

module.exports = {
  sumAggregator,
  maxAggregator
}
