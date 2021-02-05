#!/usr/bin/env node

const { mergeFiles } = require("./src/mergeFiles.js");

const [, , destFilePath, ...srcFilePathsOrGlobPatterns] = process.argv;

(async () => {
    try {
        let processedFileCount = 0;
        await mergeFiles(destFilePath, srcFilePathsOrGlobPatterns, {
            onFileMatched: () => {
                ++processedFileCount;
            },
        });
        console.log(`Done. ${processedFileCount} files processed.`);
        if (processedFileCount === 0) {
            console.log(
                "Provided input file patterns did not matched any file."
            );
        }
    } catch (err) {
        console.error(err);
        process.exitCode = 1;
    }
})();
