/**
 * @file 为 scoped css 添加 id 插件
 * @author sparklewhy@gmail.com
 */

var selectorParser = require('postcss-selector-parser');

function rewriteSelector(wrapId, node) {
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
                    attribute: wrapId
                })
            );
        });
    }).process(node.selector).result;
}

function addIdPlugin(postcss, wrapId) {
    var selectorRewrite = rewriteSelector.bind(this, wrapId);
    return postcss.plugin('add-id', function () {
        return function (root) {
            root.each(selectorRewrite);
        };
    });
}

module.exports = exports = addIdPlugin;
