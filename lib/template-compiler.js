/**
 * @file vue 模板编译
 * @author sparklewhy@gmail.com
 */

var vueCompiler = require('vue-template-compiler');
var transpile = require('vue-template-es2015-compiler');
var assign = require('object-assign');

function toFunction(code) {
    return transpile('function render () {' + code + '}');
}

function rewriteAttr(el, rewriteAttrName, rewrite, context) {
    el.attrs.some(function (attrNode) {
        return rewrite(el, attrNode, rewriteAttrName, context);
    });
}

function getNodeTransformer(toTransformEle, rewrite, context) {
    return function (el) {
        for (var tag in toTransformEle) {

            if (el.tag === tag && el.attrs) {
                var attributes = toTransformEle[tag];
                if (typeof attributes === 'string') {
                    attributes = [attributes];
                }

                attributes.forEach(function (attrName) {
                    rewriteAttr(el, attrName, rewrite, context);
                });
            }
        }
    };
}

var DEFAULT_OPTIONS = {
    preserveWhitespace: true
};

/**
 * 编译 VUE 的模板，转成 render function
 *
 * @param {Object} context 模板编译上下文
 * @param {Object} opts 编译选项
 * @param {Object=} opts.transformEle 要转换处理的元素，可选
 * @param {Function=} opts.nodeRewrite 要转换元素的处理方法，可选，默认只是本地路径重写
 * @param {boolean|Function=} opts.urlRewrite 是否进行 url 重写，或者自定义的重写方法，可选
 * @param {string=} opts.urlRewriteTarget url 路径重写的目标文件路径
 * @param {Array.<Object>=} opts.modules 自定义的节点编译处理器选项
 * @param {Object|boolean=} opts.transformEle 要转换处理的元素
 * @return {Object}
 */
module.exports = function (context, opts) {
    opts = assign({}, DEFAULT_OPTIONS, opts);

    if (opts.transformEle && opts.nodeRewrite) {
        opts.modules || (opts.modules = []);
        opts.modules.push({
            postTransformNode: getNodeTransformer(
                opts.transformEle,
                opts.nodeRewrite,
                context
            )
        });
    }

    var compiled = vueCompiler.compile(context.content, opts);
    if (compiled.errors.length) {
        return {
            error: compiled.errors.join('\n'),
            render: 'function(){}',
            staticRenderFns: '[]'
        };
    }

    return {
        deps: context.deps,
        render: toFunction(compiled.render),
        staticRenderFns: '['
            + compiled.staticRenderFns.map(toFunction).join(',')
            + ']'
    };
};


