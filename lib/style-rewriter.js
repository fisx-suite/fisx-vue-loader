/**
 * @file 样式重写
 * @author sparklewhy@gmail.com
 */

var postcss = require('postcss');
var cache = require('lru-cache')(100);
var assign = require('object-assign');

var cssUrlParser = require('./css-url-parser');
var urlRewrite = require('./url-rewriter');
var scopedCssPlugin = require('./scope-css-plugin');

function handleUrlRewrite(context, root) {
    root.walkAtRules(function (rule) {
        if (rule.type === 'atrule' && rule.name === 'import') {
            var value = rule.params;
            var importPrefix = '@import ';
            rule.params = cssUrlParser.parseImportResource(
                importPrefix + value,
                function (match, url) {
                    var result = urlRewrite(
                        url, match,
                        context
                    );
                    return result.replace(importPrefix, '');
                }
            );
        }
    });

    root.walkDecls(function (decl) {
        decl.value = cssUrlParser.parseURLResource(
            decl.value,
            function (match, url) {
                return urlRewrite(url, match, context);
            }
        );
    });
}

function rewriteUrl(context) {
    var handler = handleUrlRewrite.bind(this, context);
    return postcss.plugin('rewrite-url', function () {
        return handler;
    });
}

function isObject(val) {
    return val && typeof val === 'object';
}

/**
 * 样式重写
 *
 * @param {string} filePath 样式所在文件路径
 * @param {string} id 样式 id
 * @param {string} css 样式内容
 * @param {boolean} scoped 是否支持 scoped
 * @param {Object} options 选项
 * @param {Object} map 之前的 source map
 * @param {boolean|Function=} opts.urlRewrite 是否进行 url 重写，或者自定义的重写方法，可选
 * @param {string=} opts.urlRewriteTarget url 路径重写的目标文件路径
 * @return {Object}
 */
module.exports = function (filePath, id, css, scoped, options, map) {
    var key = id + '!!' + css;
    var val = cache.get(key);
    if (val) {
        return val;
    }

    var plugins = [];
    var opts = {
        map: map ? {inline: false, annotation: false, prev: map} : false
    };

    var postcssOpts = options.postcss;
    if (postcssOpts instanceof Array) {
        plugins = postcssOpts.slice();
    }
    else if (typeof postcssOpts === 'function') {
        plugins = postcssOpts.call(this, this);
    }
    else if (isObject(postcssOpts)) {
        plugins = postcssOpts.plugins || [];

        var customOpts = postcssOpts.options;
        var mapOpts = opts.map;
        if (isObject(customOpts.map)) {
            mapOpts = isObject(mapOpts)
                ? assign({}, customOpts.map, mapOpts)
                : customOpts.map;
        }

        opts = assign(opts, customOpts);
        isObject(mapOpts) && (opts.map !== false) && (opts.map = mapOpts);
    }

    // scoped css rewrite
    if (scoped) {
        plugins.push(scopedCssPlugin(postcss, id));
    }

    var context = {
        deps: [],
        filePath: filePath,
        urlRewrite: opts.urlRewrite,
        urlRewriteTarget: opts.urlRewriteTarget
    };
    plugins.push(rewriteUrl(context));

    try {
        var res = postcss(plugins).process(css, opts).stringify();
        var result = {
            map: res.map && res.map.toJSON(),
            code: res.css,
            deps: context.deps
        };

        cache.set(key, result);

        return result;
    }
    catch (ex) {
        return {
            error: ex.stack || ex.toString()
        };
    }
};

