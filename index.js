/**
 * @file 入口模块
 * @author sparklewhy@gmail.com
 */

var vueCompilerCore = require('vue-compiler-core');

module.exports = exports = {
    compiler: vueCompilerCore.compiler,
    compile: function (filePath, content, options) {
        var assign = require('object-assign');
        var opts = assign({}, options, {
            hostPkgName: require('./package.json').name
        });

        if (!opts.template) {
            opts.template = {};
        }
        if (opts.template.compileToRender !== false) {
            opts.template.compileToRender = require('./lib/template-compiler');
        }

        var parser = require('./lib/parser');
        var parts = vueCompilerCore.parse(filePath, content, parser);
        return vueCompilerCore.compile(parts, opts);
    },
    registerFisParser: vueCompilerCore.registerFisParser,
    registerParser: vueCompilerCore.registerParser
};
