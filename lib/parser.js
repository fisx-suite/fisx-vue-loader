/**
 * @file vue 单文件组件的解析器
 * @author sparklewhy@gmail.com
 */

var compiler = require('vue-template-compiler');

/**
 * 解析 单文件 vue 组件
 *
 * @param {string} fileName 文件名
 * @param {string} content 文件内容
 * @return {Object}
 */
function parse(fileName, content) {
    var result = compiler.parseComponent(content, {pad: true});
    result.filePath = fileName;
    result.content = content;
    return result;
}

module.exports = exports = parse;
