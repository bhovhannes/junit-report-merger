#!/usr/bin/env node

const { mergeFiles } = require("./src/mergeFiles.js");

const [, , destFilePath, ...srcFilePathsOrGlobPatterns] = process.argv;

(async () => {
    try {
        await mergeFiles(destFilePath, srcFilePathsOrGlobPatterns);
    } catch (err) {
        console.error(err);
        process.exitCode = 1;
    }
})();
