/**
 * @file less 样式编译器
 * @author sparklewhy@gmail.com
 */

var ensureRequire = require('../ensure-require.js');
var assign = require('object-assign');
var path = require('path');

/**
 * 编译代码
 *
 * @param {string} data 要编译的代码数据
 * @param {string} filePath 代码所属的文件路径
 * @param {?Object} options 编译的选项
 * @param {Object=} options.babel babel 编译选项
 * @param {boolean|Object} sourceMap 是否输出 source map，或者之前输出的 source map
 * @return {{code: string, map: ?string, deps: ?Array.<string>}}
 */
function compile(data, filePath, options, sourceMap) {
    ensureRequire('less', 'less');

    options || (options = {});
    var opts = assign(
        {
            syncImport: true,
            relativeUrls: true,
            filename: path.basename(filePath)
        },
        exports.DEFAULT_OPTIONS || {},
        options.less || {}
    );

    // init import search paths
    var dir = path.dirname(filePath);
    var paths = [dir, process.cwd()];
    opts.paths = opts.paths
        ? opts.paths.concat(paths)
        : paths;

    // init source map configure
    if (sourceMap) {
        opts.sourceMap = assign({
            sourceMapFileInline: false
        }, opts.sourceMap);
    }

    var less = require('less');
    var result = {};
    less.render(data, opts, function (err, res) {
        if (err) {
            result.error = err;
            return;
        }

        if (typeof res === 'object') {
            result.deps = res.imports || [];

            if (sourceMap) {
                result.map = res.map;
            }
            result.code = res.css.toString();
        }
        else {
            result.code = res;
        }
    });

    if (result.error) {
        throw result.error;
    }
    return result;
}

module.exports = exports = compile;

exports.DEFAULT_OPTIONS = null;
