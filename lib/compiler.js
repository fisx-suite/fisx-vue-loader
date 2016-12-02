/**
 * @file 编译器定义
 * @author sparklewhy@gmail.com
 */

var builtinCompiler = require('./compilers/index');

module.exports = exports = {};

/**
 * 查询编译器
 *
 * @param {string} type 要查询的编译器类型
 * @return {?Function}
 */
exports.findCompiler = function (type) {
    return builtinCompiler[type];
};

/**
 * 注册自定义的编译器
 *
 * @param {string} type 编译器类型
 * @param {Function} compiler 编译器
 * @param {Object=} defaultOptions 默认的编译选项
 */
exports.registerCompiler = function (type, compiler, defaultOptions) {
    builtinCompiler[type] = compiler;
    compiler.DEFAULT_OPTIONS = defaultOptions;
};
