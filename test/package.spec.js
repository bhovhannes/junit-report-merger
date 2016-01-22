var chai = require('chai');
var JUnitReportMerger = require('../index');

describe('package', function() {

    it('should export an object', function() {
        chai.expect(JUnitReportMerger).to.be.an('Object');
    });
});
