/**
 * @file 工具方法定义
 * @author sparklewhy@gmail.com
 */

var fs = require('fs');

module.exports = exports = {};

/**
 * 判断给定的文件路径是否存在
 *
 * @param {string} target 要判断的目标路径
 * @return {boolean}
 */
exports.isPathExists = function (target) {
    try {
        fs.statSync(target);
        return true;
    }
    catch (ex) {
        return false;
    }
};
