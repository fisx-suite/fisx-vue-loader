/**
 * @file 规范化模块路径
 * @author sparklewhy@gmail.com
 */

var path = require('path');
var util = require('./util');

function normalize(id) {
    return id.replace(/\\/g, '/');
}

module.exports = exports = normalize;

exports.lib = function (file) {
    var id = path.resolve(__dirname, file);
    return normalize(path.relative(process.cwd(), id));
};

exports.dep = function (dep) {
    // npm 2 or npm linked
    var id = path.resolve(__dirname, '../node_modules', dep);
    if (!util.isPathExists(id)) {
        // npm 3
        id = path.resolve(__dirname, '..', '..', dep);
    }

    return normalize(path.relative(process.cwd(), id));
};
