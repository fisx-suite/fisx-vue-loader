/**
 * @file Vue 组件里各个部分的处理器
 * @author sparklewhy@gmail.com
 */

var path = require('path');
var fs = require('fs');

var compiler = require('./compiler');
var compileTemplate = require('./template-compiler');
var rewriteStyle = require('./style-rewriter');

module.exports = exports = {};

function loadSrc(src, filePath) {
    var dir = path.dirname(filePath);
    var srcPath = path.resolve(dir, src);
    try {
        var content = fs.readFileSync(srcPath, 'utf-8');
        return {
            src: src,
            filePath: srcPath,
            data: content
        };
    }
    catch (e) {
        return {
            src: src,
            filePath: srcPath,
            error: 'Failed to load src: "'
                + src + '" from file: "' + filePath + '"'
        };
    }
}

function getContent(part, filePath) {
    return part.src
        ? loadSrc(part.src, filePath)
        : {data: part.content};
}

/**
 * 处理 vue 组件部分
 *
 * @param {Object} part 要处理的组件部分
 * @param {string} filePath 处理的文件路径
 * @param {Object} opts 处理选项
 * @param {boolean=} needSourceMap 是否需要生成 source map
 * @return {?Object}
 */
function processVuePart(part, filePath, opts, needSourceMap) {
    if (!part) {
        return;
    }

    var source = getContent(part, filePath);
    source.raw = part;
    if (source.error) {
        return source;
    }

    var compile = compiler.findCompiler(part.lang || opts.lang);
    if (!compile) {
        source.output = source.data;
        return source;
    }

    try {
        var result = compile(
            source.data, filePath,
            opts, needSourceMap ? (part.map || true) : false
        );
        source.output = result;
    }
    catch (ex) {
        // report babel error codeframe
        source.error = ex.codeFrame ? ex.codeFrame : ex;
    }

    return source;
}

exports.processTemplate = function (part, filePath, opts, needSourceMap) {
    var result = processVuePart(part, filePath, opts, needSourceMap);
    if (!result || result.error) {
        return result;
    }

    var output = result.output;
    var map;
    if (typeof output !== 'string') {
        output = output.content;
        map = output.map;
    }

    var compileResult = compileTemplate(output, opts.compile || {});
    if (compileResult.error) {
        result.error = compileResult.error;
    }
    else {
        map && (compileResult.map = map);
        result.output = compileResult;
    }

    return result;
};

exports.processScript = function (part, filePath, opts, needSourceMap) {
    opts || (opts = {});
    part.lang || (part.lang = opts.babel ? 'babel' : null);
    return processVuePart(part, filePath, opts, needSourceMap);
};

exports.processStyle = function (part, filePath, id, opts, needSourceMap) {
    var result = processVuePart(part, filePath, opts, needSourceMap);
    if (!result || result.error) {
        return result;
    }

    var output = result.output;
    if (typeof output !== 'string') {
        output = output.content.toString();
    }
    output = output.trim();

    var data = rewriteStyle(id, output, part.scoped, opts, output.map);
    if (data.error) {
        result.error = data.error;
    }
    else {
        result.output = data;
    }

    return result;
};



