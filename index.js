/**
 * @file 入口模块
 * @author sparklewhy@gmail.com
 */

var vueCompilerCore = require('vue-compiler-core');

var insertCssLibDir = null;
function getInsertCssLibDir() {
    if (insertCssLibDir != null) {
        return insertCssLibDir;
    }

    var pkgName = require('./package.json').name;
    var path = require('path');
    var corePath = path.join(__dirname, 'node_modules', 'vue-compiler-core');
    var result;
    try {
        require.resolve(corePath);
        result = path.join(pkgName, 'node_modules');
    }
    catch (ex) {
        result = '';
    }

    insertCssLibDir = result;

    return result;
}

var hotReloadApiDir = null;
function getHotReloadApiDir() {
    if (hotReloadApiDir != null) {
        return hotReloadApiDir;
    }

    var pkgName = require('./package.json').name;
    var path = require('path');
    var hotReloadApiPkg = 'vue-hot-reload-api';
    var corePath = path.join(__dirname, 'node_modules', hotReloadApiPkg);
    var result;
    try {
        require.resolve(corePath);
        result = path.join(pkgName, 'node_modules', hotReloadApiPkg);
    }
    catch (ex) {
        result = hotReloadApiPkg;
    }

    hotReloadApiDir = result;

    return result;
}

module.exports = exports = {
    compiler: vueCompilerCore.compiler,
    compile: function (filePath, content, options) {
        var assign = require('object-assign');
        var opts = assign({}, options, {
            insertCssLibDir: getInsertCssLibDir(),
            hotReloadApiDir: getHotReloadApiDir()
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
