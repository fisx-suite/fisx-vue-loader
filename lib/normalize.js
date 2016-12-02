/**
 * @file 规范化模块路径
 * @author sparklewhy@gmail.com
 */

var path = require('path');
var util = require('./util');

var pkgName = require('../package.json').name;

exports.lib = function (file) {
    return util.normalizePath(path.join(pkgName, 'lib', file));
};

exports.dep = function (dep) {
    var filePath = path.resolve(__dirname, '../node_modules', dep);
    var id;
    if (util.isPathExists(filePath)) {
        // npm 2 or npm linked
        id = path.join(pkgName, 'node_modules', dep);
    }
    else {
        // npm 3
        id = dep;
    }

    return util.normalizePath(id);
};
