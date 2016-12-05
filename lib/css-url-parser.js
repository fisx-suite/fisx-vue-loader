/**
 * @file 解析 css 文件 url 工具方法
 * @author sparklewhy@gmail.com
 */

module.exports = exports = {};

/**
 * 用于提取样式中 url 属性值里包含的链接
 *
 * @const
 * @type {RegExp}
 */
var CSS_URL_REGEXP = exports.CSS_URL_REGEXP = /url\s*\(\s*(['"]?)([^'"\)]+)\1\s*\)/g;

/**
 * 提取 import 样式的正则
 *
 * @const
 * @type {RegExp}
 */
var IMPORT_REGEXP = exports.CSS_IMPORT_REGEXP = /@import\s+(?:url\s*\(\s*)?(['"]?)([^'"\)]+)\1(?:\s*\))?([^;]*);/g;

/**
 * ie alphaimageloader 引用的资源提取正则
 *
 * @const
 * @type {RegExp}
 */
var SRC_REGEXP = exports.SRC_REGEXP = /\bsrc\s*=\s*('|")([^'"\s\)]+)\1/g;

/**
 * 提取 image-set 非 url() 方式的样式
 *
 * @const
 * @type {RegExp}
 */
var IMAGE_SET_REGEXP = exports.IMAGE_SET_REGEXP = /image-set\(\s*(['"][\s\S]*?)\)/g;

/**
 * 获取替换方法
 *
 * @param {Function} replacer 替换处理器方法
 * @return {Function}
 */
function getReplacer(replacer) {
    return function (found) {
        var result = replacer.apply(this, arguments);
        if (result == null || result === false) {
            return found.match;
        }

        return found.match.replace(found.url, result);
    };
}

/**
 * 解析样式内容引用的 url 资源
 *
 * @param {string} content 样式内容
 * @param {function(Object):string} replacer 碰到解析到的 url 要执行的替换逻辑
 * @return {string}
 */
exports.parseURLResource = function (content, replacer) {
    var urlRegexp = /(['"])([^'"]+)\1/g;
    replacer = getReplacer(replacer);

    return content.replace(CSS_URL_REGEXP, function (match, quot, url) {
        return replacer({
            match: match,
            url: url
        });
    }).replace(SRC_REGEXP, function (match, quot, url) {
        return replacer({
            match: match,
            url: url
        });
    }).replace(IMAGE_SET_REGEXP, function (match, imgSet) {
        var result;
        var urls = [];
        while ((result = urlRegexp.exec(imgSet))) {
            if (urls.indexOf(result[2]) === -1) {
                urls.push(result[2]);
            }
        }

        return replacer({
            match: match,
            url: urls
        });
    }).replace(IMPORT_REGEXP, function (match, quot, url) {
        return replacer({
            importStyle: true,
            match: match,
            url: url
        });
    });
};
