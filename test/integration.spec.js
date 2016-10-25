var chai = require('chai');
var path = require('path');
var fs = require('fs');
var _async = require('async');
var xmldom = require('xmldom');
var JUnitReportMerger = require('../index');

describe('integration tests', function() {

    var fixturePaths = {
        inputs: [],
        output: null
    };

    beforeEach(function() {
        fixturePaths.inputs = [
            path.join(__dirname, 'fixtures', '1.xml'),
            path.join(__dirname, 'fixtures', '2.xml'),
            path.join(__dirname, 'fixtures', '3.xml')
        ];
        fixturePaths.output = path.join(__dirname, 'fixtures', 'output.xml');
    });

    afterEach(function(done) {
        fs.unlink(fixturePaths.output, done);
    });

    it('should merge 3 xml reports without errors', function(done) {
        _async.waterfall(
            [
                _async.apply(JUnitReportMerger.mergeFiles,
                    fixturePaths.output,
                    fixturePaths.inputs,
                    {}
                ),
                _async.apply(fs.readFile,
                    fixturePaths.output,
                    {
                        encoding: 'utf8'
                    }
                ),
                function(contents, cb) {
                    var doc = new xmldom.DOMParser().parseFromString(contents, 'text/xml');
                    var rootNode = doc.documentElement;

                    var testSuiteNodes = rootNode.getElementsByTagName('testsuite');
                    chai.expect(testSuiteNodes.length).to.equal(4);

                    chai.expect(rootNode.tagName.toLowerCase()).to.equal('testsuites');
                    chai.expect(rootNode.getAttribute('tests')).to.equal('6');
                    chai.expect(rootNode.getAttribute('errors')).to.equal('0');
                    chai.expect(rootNode.getAttribute('failures')).to.equal('2');
                    cb();
                }
            ],
            done
        );
    });

    it('should support optional options', function (done) {
        JUnitReportMerger.mergeFiles(fixturePaths.output, fixturePaths.inputs, done);
    });

    it('should create subdirs if they don\'t exist', function (done) {
        fixturePaths.output = path.join(__dirname, 'fixtures', 'foo', 'bar', 'output.xml');
        JUnitReportMerger.mergeFiles(fixturePaths.output, fixturePaths.inputs, {}, done);
    });
});
