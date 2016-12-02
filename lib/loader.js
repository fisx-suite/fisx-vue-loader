/**
 * @file vue 组件文件  loader
 * @author sparklewhy@gmail.com
 */

var Emitter = require('events').EventEmitter;

var parse = require('./parser');
var processor = require('./processor');
var generator = require('./generator');

var resolvedPartsCache = Object.create(null);

module.exports = exports = new Emitter();

function checkChange(prev, curr, isTemplate) {
    var prevOutput = prev && prev.output;
    var currOutput = curr && curr.output;

    if (isTemplate) {
        if ((!prevOutput && currOutput)
            || (prevOutput || !currOutput)
        ) {
            return true;
        }

        if (!prevOutput && !currOutput) {
            return false;
        }

        return prevOutput.render === currOutput.render
            && prevOutput.staticRenderFns === currOutput.staticRenderFns;
    }

    if (typeof prevOutput !== 'string') {
        prevOutput && (prevOutput = prevOutput.code);
    }

    if (typeof currOutput !== 'string') {
        currOutput && (currOutput = currOutput.code);
    }

    return prevOutput === currOutput;
}

/**
 * 编译 vue 组件
 *
 * @param {string} filePath 编译文件路径
 * @param {string} content 编译文件内容
 * @param {Object} options 编译文件选项
 * @param {boolean=} options.isProduction 是否是生产环境，可选，默认 false，即开发环境
 * @param {boolean=} options.isServer 是否是服务器环境运行，可选，默认 false
 * @param {boolean=} options.extractStyle 是否提取样式文件，而不是内联方式，可选，默认 false
 * @param {string|function(string):string=} options.insertCSSPath 自定义内联 css
 *        代码路径
 * @param {string|function(string):string} options.hotReloadAPIPath 自定义热加载 api
 *        代码路径
 * @param {Object} options.template 模板编译选项
 * @param {string=} options.template.lang 模板编译的语言，可选，
 *        优先级低于代码里设置的 lang 属性
 * @param {string=} options.template.compile vue 模板编译选项,可选，
 *        比如, {preserveWhitespace: true}
 * @param {Object} options.script 脚本编译选项
 * @param {string=} options.script.lang 脚本编译的语言，可选，
 *        优先级低于代码里设置的 lang 属性
 * @param {Object} options.style 样式编译选项
 * @param {string=} options.style.lang 样式编译的语言，可选，
 *        优先级低于代码里设置的 lang 属性
 * @param {Object|Array=} options.style.postcss 样式编译 postcss 处理选项，如果为数组
 *        等价于{postcss: {plugins: []}}
 * @param {Array} options.styles.postcss.plugins postcss 使用的插件，只支持同步的
 * @param {Object} options.styles.postcss.options postcss 的选项
 * @return {Object}
 */
exports.compile = function (filePath, content, options) {
    options || (options = {});
    var needSourceMap = options.sourceMap;

    // generate css scope id
    var id = 'data-v-' + generator.generateFileId(filePath);

    // parse the component into parts
    var parts = parse(filePath, content, needSourceMap);
    var resolvedParts = {
        id: id,
        parseParts: parts,
        filePath: filePath,
        content: content,
        template: processor.processTemplate(
            parts.template, filePath,
            options.template || {}, needSourceMap
        ),
        script: processor.processScript(
            parts.script, filePath,
            options.script || {}, needSourceMap
        ),
        styles: parts.styles.map(function (style) {
            return processor.processStyle(
                style, filePath,
                id, options.style || {},
                needSourceMap
            );
        })
    };

    // 输出编译出错信息
    var logger = options.log || {
        error: function (msg) {
            console.error(msg);
        }
    };
    [
        resolvedParts.template,
        resolvedParts.script
    ].concat(
        resolvedParts.styles
    ).forEach(
        function (item) {
            item.error && logger.error(item.error);
        }
    );

    // check whether script/template has changed
    var prevParts = resolvedPartsCache[id] || {};
    resolvedPartsCache[id] = resolvedParts;

    var scriptChanged = checkChange(
        resolvedParts.script, prevParts.script
    );
    var templateChanged = checkChange(
        resolvedParts.template, prevParts.template
    );

    return generator(resolvedParts, {
        scriptChanged: scriptChanged,
        templateChanged: templateChanged
    }, options);
};

exports.compiler = require('./compiler');








