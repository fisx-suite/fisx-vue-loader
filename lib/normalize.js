/**
 * @file 规范化模块路径
 * @author sparklewhy@gmail.com
 */

var fs = require('fs');
var path = require('path');

function normalize(id) {
    return id.replace(/\\/g, '/');
}

exports.lib = function (file) {
    var id = path.resolve(__dirname, file);
    return normalize(path.relative(process.cwd(), id));
};

exports.dep = function (dep) {
    // npm 2 or npm linked
    var id = path.resolve(__dirname, '../node_modules', dep);
    if (!fs.existsSync(id)) {
        // npm 3
        id = path.resolve(__dirname, dep);
    }

    return normalize(path.relative(process.cwd(), id));
};
