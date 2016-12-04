/**
 * @file coffee 编译器
 * @author sparklewhy@gmail.com
 */

var requireModule = require('../require');
var assign = require('object-assign');

/**
 * 编译代码
 *
 * @param {string} data 要编译的代码数据
 * @param {string} filePath 代码所属的文件路径
 * @param {?Object} options 编译的选项
 * @param {Object=} options.babel babel 编译选项
 * @param {boolean|Object} sourceMap 是否输出 source map，或者之前输出的 source map
 * @return {string|{code: string, map: ?Object}}
 */
function compile(data, filePath, options, sourceMap) {
    requireModule.ensure('coffee', ['coffee-script']);

    options || (options = {});
    var opts = assign(
        {
            bar: true,
            sourceMap: !!sourceMap
        },
        exports.DEFAULT_OPTIONS || {},
        options.coffee || {}
    );

    var coffee = requireModule('coffee-script');
    var result = coffee.compile(data, opts);

    if (opts.sourceMap) {
        return {
            code: result.js,
            map: result.v3SourceMap
        };
    }

    return result;
}

module.exports = exports = compile;

exports.DEFAULT_OPTIONS = null;
