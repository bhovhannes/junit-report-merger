function normalizeArgs(options, cb) {
    let effectiveOptions = options || {};
    let callback;
    if (typeof cb === "function") {
        callback = cb;
    } else if (typeof options === "function" && !cb) {
        effectiveOptions = {};
        callback = options;
    }

    let returnValue;
    if (!callback) {
        returnValue = new Promise((resolve, reject) => {
            callback = (err, value) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(value);
                }
            };
        });
    }

    return {
        callback,
        effectiveOptions,
        returnValue,
    };
}

async function readableToString(readable) {
    let result = "";
    for await (const chunk of readable) {
        result += chunk;
    }
    return result;
}

module.exports = {
    normalizeArgs,
    readableToString,
};
