/**
 * @file vue 模板编译
 * @author sparklewhy@gmail.com
 */

var vueCompiler = require('vue-template-compiler');
var transpile = require('vue-template-es2015-compiler');
var assign = require('object-assign');
var util = require('./util');
var urlRewrite = require('./url-rewriter');

function toFunction(code) {
    return transpile('function render () {' + code + '}');
}

var DEFAULT_TRANSFORM_TO_REQUIRE = {
    img: 'src'
};

function rewriteEleUrl(el, attrNode, name, context) {
    if (attrNode.name !== name) {
        return;
    }

    var value = attrNode.value;
    var isStatic = value.charAt(0) === '"'
        && value.charAt(value.length - 1) === '"';
    if (!isStatic) {
        return;
    }

    var url = value.substring(1, value.length - 1);
    var rebaseUrl = urlRewrite(url, context);
    if (rebaseUrl === false || rebaseUrl == null) {
        return;
    }

    attrNode.value = '"' + rebaseUrl + '"';
    return true;
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
 * @param {string} filePath 模板所在文件路径
 * @param {string} template 要编译的模板
 * @param {Object=} opts 编译选项
 * @param {Object=} opts.transformEle 要转换处理的元素，可选，默认 img.src
 * @param {Function=} opts.nodeRewrite 要转换元素的处理方法，可选，默认只是本地路径重写
 * @param {boolean|Function=} opts.urlRewrite 是否进行 url 重写，或者自定义的重写方法，可选
 * @param {string=} opts.urlRewriteTarget url 路径重写的目标文件路径
 * @return {Object}
 */
module.exports = function (filePath, template, opts) {
    opts || (opts = {});
    var toTransformEle = assign(
        {},
        DEFAULT_TRANSFORM_TO_REQUIRE,
        opts.transformEle || {}
    );

    var context = {
        filePath: filePath,
        content: template,
        deps: [],
        resolvePath: function (url) {
            return util.resolvePath(url, filePath);
        },
        rebasePath: function (url, rebaseTargetFile) {
            return util.rebasePath(url, filePath, rebaseTargetFile);
        },
        urlRewrite: opts.urlRewrite,
        urlRewriteTarget: opts.urlRewriteTarget
    };
    var compileOpts = assign({}, DEFAULT_OPTIONS, opts || {});
    if (!Array.isArray(compileOpts.modules)) {
        compileOpts.modules = [];
    }
    compileOpts.modules.push({
        postTransformNode: getNodeTransformer(
            toTransformEle,
            opts.nodeRewrite || rewriteEleUrl,
            context
        )
    });

    var compiled = vueCompiler.compile(template, compileOpts);
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


