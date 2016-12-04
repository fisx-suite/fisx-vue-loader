/**
 * @file babel 编译器
 * @author sparklewhy@gmail.com
 */

var fs = require('fs');
var path = require('path');
var assign = require('object-assign');
var requireModule = require('../require');
var util = require('../util');

/**
 * 读取 babel 配置
 *
 * @return {?Object}
 */
function readBabelConfig() {
    var babelRcFile = path.resolve(process.cwd(), '.babelrc');
    if (util.isPathExists(babelRcFile)) {
        return JSON.parse(fs.readFileSync(babelRcFile, 'utf-8'));
    }

    var pkgFile = path.resolve(process.cwd(), 'package.json');
    if (util.isPathExists(pkgFile)) {
        return require(pkgFile).babel;
    }
}

/**
 * 编译代码
 *
 * @param {string} data 要编译的代码数据
 * @param {string} filePath 代码所属的文件路径
 * @param {?Object} options 编译的选项
 * @param {Object=} options.babel babel 编译选项
 * @param {boolean|Object} sourceMap 是否输出 source map，或者之前输出的 source map
 * @return {{code: string, map: ?Object}}
 */
function compile(data, filePath, options, sourceMap) {
    requireModule.ensure('babel', ['babel-core']);

    options || (options = {});
    var babel = requireModule('babel-core');
    var opts = assign(
        {
            comments: false,
            filename: filePath,
            sourceMaps: !!sourceMap,
            inputSourceMap: typeof sourceMap === 'object'
                ? sourceMap : null
        },
        exports.DEFAULT_OPTIONS || {},
        readBabelConfig() || {},
        options.babel || {}
    );

    return babel.transform(data, opts);
}

module.exports = exports = compile;

exports.DEFAULT_OPTIONS = null;
