/**
 * @file vue 模板编译
 * @author sparklewhy@gmail.com
 */

var vueCompiler = require('vue-template-compiler');
var transpile = require('vue-template-es2015-compiler');

function toFunction(code) {
    return transpile('function render () {' + code + '}');
}

/**
 * 编译 VUE 的模板，转成 render function
 *
 * @param {string} template 要编译的模板
 * @param {Object=} opts 编译选项
 * @return {Object}
 */
module.exports = function (template, opts) {
    var compiled = vueCompiler.compile(template, opts);
    if (compiled.errors.length) {
        return {
            error: compiled.errors.join('\n'),
            render: 'function(){}',
            staticRenderFns: '[]'
        };
    }

    return {
        render: toFunction(compiled.render),
        staticRenderFns: '['
            + compiled.staticRenderFns.map(toFunction).join(',')
            + ']'
    };
};


