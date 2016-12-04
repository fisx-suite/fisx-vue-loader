/**
 * @file stylus 样式编译器
 * @author sparklewhy@gmail.com
 */

var requireModule = require('../require');
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
 * @return {{code: string, map: ?Object, deps: ?Array.<string>}}
 */
function compile(data, filePath, options, sourceMap) {
    requireModule.ensure('stylus', 'stylus');

    options || (options = {});
    var opts = assign(
        {
            filename: path.basename(filePath)
        },
        exports.DEFAULT_OPTIONS || {},
        options.stylus || {}
    );

    // init import search paths
    var dir = path.dirname(filePath);
    var paths = [dir];
    opts.paths = opts.paths
        ? opts.paths.concat(paths)
        : paths;

    // init source map configure
    if (sourceMap) {
        opts.sourcemap = assign({
            comment: true,
            inline: false
        }, opts.sourcemap);
    }

    var stylus = requireModule('stylus');
    var stylusUse = opts.use;
    delete opts.use;

    var defineOpt = opts.define || {url: stylus.resolver()};
    delete opts.define;

    // init setting
    var renderer = stylus(data);
    Object.keys(opts).forEach(function (key) {
        renderer.set(key, opts[key]);
    });

    // init use and define
    renderer.use(function (style) {
        if (typeof stylusUse === 'function') {
            stylusUse(style);
        }

        Object.keys(defineOpt).forEach(function (name) {
            style.define(name, defineOpt[name]);
        });
    });

    var result = {};

    // 初始化依赖
    result.deps = renderer.deps() || [];

    renderer.render(function (err, css) {
        if (err) {
            result.error = err;
            return;
        }

        if (sourceMap) {
            result.map = renderer.sourcemap;
        }

        result.code = css;
    });

    if (result.error) {
        throw result.error;
    }

    return result;
}

module.exports = exports = compile;

exports.DEFAULT_OPTIONS = null;
