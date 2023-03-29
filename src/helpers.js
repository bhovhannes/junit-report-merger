function normalizeArgs(options, cb) {
  let normalizedOptions = options || {}
  let callback
  if (typeof cb === 'function') {
    callback = cb
  } else if (typeof options === 'function' && !cb) {
    normalizedOptions = {}
    callback = options
  }

  let returnValue
  if (!callback) {
    returnValue = new Promise((resolve, reject) => {
      callback = (err, value) => {
        if (err) {
          reject(err)
        } else {
          resolve(value)
        }
      }
    })
  }

  return {
    callback,
    normalizedOptions,
    returnValue
  }
}

async function readableToString(readable) {
  let result = ''
  for await (const chunk of readable) {
    result += chunk
  }
  return result
}

function isNumeric(str) {
  return !isNaN(str) && !isNaN(parseFloat(str))
}

module.exports = {
  normalizeArgs,
  readableToString,
  isNumeric
}
