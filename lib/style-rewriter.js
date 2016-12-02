/**
 * @file 样式重写
 * @author sparklewhy@gmail.com
 */

var postcss = require('postcss');
var selectorParser = require('postcss-selector-parser');
var cache = require('lru-cache')(100);
var assign = require('object-assign');

function addIdPlugin(currentId) {
    return postcss.plugin('add-id', function () {
        return function (root) {
            root.each(function rewriteSelector(node) {
                if (!node.selector) {
                    // handle media queries
                    if (node.type === 'atrule'
                        && node.name === 'media'
                    ) {
                        node.each(rewriteSelector);
                    }
                    return;
                }

                node.selector = selectorParser(function (selectors) {
                    selectors.each(function (selector) {
                        var node = null;

                        selector.each(function (n) {
                            if (n.type !== 'pseudo') {
                                node = n;
                            }
                        });

                        selector.insertAfter(
                            node,
                            selectorParser.attribute({
                                attribute: currentId
                            })
                        );
                    });
                }).process(node.selector).result;
            });
        };
    });
}

function trimPlugin() {
    return postcss.plugin('trim', function () {
        return function (css) {
            css.walk(function (node) {
                if (node.type === 'rule'
                    || node.type === 'atrule'
                ) {
                    node.raws.before = node.raws.after = '\n';
                }
            });
        };
    });
}

function isObject(val) {
    return val && typeof val === 'object';
}

/**
 * 样式重写
 *
 * @param {string} id 样式 id
 * @param {string} css 样式内容
 * @param {boolean} scoped 是否支持 scoped
 * @param {Object} options 选项
 * @param {Object} map 之前的 source map
 * @return {Object}
 */
module.exports = function (id, css, scoped, options, map) {
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
                ? assign(customOpts.map, mapOpts)
                : customOpts.map;
        }

        opts = assign(opts, customOpts);
        isObject(mapOpts) && (opts.map !== false) && (opts.map = mapOpts);
    }

    // scoped css rewrite
    if (scoped) {
        plugins.push(addIdPlugin(id));
    }
    plugins = [trimPlugin].concat(plugins);

    try {
        var res = postcss(plugins).process(css, opts);
        var result = {
            map: res.map && res.map.toJSON(),
            content: res.css
        };

        cache.set(key, result);

        return result;
    }
    catch (ex) {
        return {
            error: ex
        };
    }
};

