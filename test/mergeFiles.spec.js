const {
    describe,
    it,
    beforeEach,
    afterEach,
    expect,
} = require("@jest/globals");
const path = require("path");
const fsPromises = require("fs").promises;
const xmldom = require("xmldom");
const { mergeFiles } = require("../index.js");

describe("mergeFiles", function () {
    let fixturePaths;
    beforeEach(() => {
        fixturePaths = {
            inputs: [
                path.join(__dirname, "fixtures", "1.xml"),
                path.join(__dirname, "fixtures", "2.xml"),
                path.join(__dirname, "fixtures", "3.xml"),
            ],
            output: path.join(__dirname, "fixtures", "output.xml"),
        };
    });

    afterEach(async () => {
        await fsPromises.unlink(fixturePaths.output);
    });

    async function assertOutput() {
        const contents = await fsPromises.readFile(fixturePaths.output, "utf8");
        const doc = new xmldom.DOMParser().parseFromString(
            contents,
            "text/xml"
        );
        const rootNode = doc.documentElement;
        const testSuiteNodes = rootNode.getElementsByTagName("testsuite");
        expect(testSuiteNodes).toHaveLength(4);

        expect(rootNode.tagName.toLowerCase()).toBe("testsuites");
        expect(rootNode.getAttribute("tests")).toBe("6");
        expect(rootNode.getAttribute("errors")).toBe("0");
        expect(rootNode.getAttribute("failures")).toBe("2");
    }

    it("merges xml reports (options passed)", async () => {
        await mergeFiles(fixturePaths.output, fixturePaths.inputs, {});
        await assertOutput();
    });

    it("merges xml reports (options omitted)", async () => {
        await mergeFiles(fixturePaths.output, fixturePaths.inputs);
        await assertOutput();
    });

    it("merges xml reports matching given glob pattern", async () => {
        await mergeFiles(fixturePaths.output, ["./**/fixtures/*.xml"]);
        await assertOutput();
    });

    it("produces an empty xml report when no files match given glob pattern", async () => {
        await mergeFiles(fixturePaths.output, [
            "./no/files/will/match/this/*.xml",
        ]);
        const contents = await fsPromises.readFile(fixturePaths.output, "utf8");
        const doc = new xmldom.DOMParser().parseFromString(
            contents,
            "text/xml"
        );
        const rootNode = doc.documentElement;
        const testSuiteNodes = rootNode.getElementsByTagName("testsuite");
        expect(testSuiteNodes).toHaveLength(0);
    });

    it("merges xml reports (options passed, callback style)", async () => {
        await new Promise((resolve, reject) => {
            mergeFiles(fixturePaths.output, fixturePaths.inputs, {}, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        await assertOutput();
    });

    it("merges xml reports (options omitted, callback style)", async () => {
        await new Promise((resolve, reject) => {
            mergeFiles(fixturePaths.output, fixturePaths.inputs, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        await assertOutput();
    });
});
