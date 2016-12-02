var expect = require('expect.js');
var normalize = require('../../lib/normalize');

describe('Normalize Utilities', function () {
    it('should normalize lib path', function () {
        var result = normalize.lib('a');
        expect(result).to.eql('lib/a');

        result = normalize.lib('a\\b');
        expect(result).to.eql('lib/a/b');
    });

    it('should normalize dep path', function () {
        var result = normalize.dep('a/c');
        expect(result).to.eql('../a/c');

        result = normalize.dep('a\\c');
        expect(result).to.eql('../a/c');

        result = normalize.dep('vue-hot-reload-api');
        expect(result).to.eql('node_modules/vue-hot-reload-api');
    });
});
