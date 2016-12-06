var expect = require('expect.js');
var loader = require('../../index');
var fs = require('fs');

describe('Vue2 Loader', function () {
    it('should compile', function () {
        var filePath = 'test/fixtures/a.vue';
        var content = fs.readFileSync(filePath).toString();
        var result = loader.compile(filePath, content, {
            script: {
                lang: 'babel'
            },
            template: {
                // compileToRender: false
            },
            sourceMap: true
        });
        // console.log(result);
    });
});
