/**
 * @file Vue 组件里各个部分的处理器
 * @author sparklewhy@gmail.com
 */

var path = require('path');
var fs = require('fs');
var Promise = require('Promise');

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

function processVuePart(part, filePath, opts, needSourceMap) {
    if (!part) {
        return Promise.resolve();
    }

    var source = getContent(part, filePath);
    source.raw = part;
    if (source.error) {
        return Promise.reject(source);
    }

    var compile = compiler.findCompiler(part.lang);
    if (!compile) {
        source.output = source.data;
        return Promise.resolve(source);
    }

    return compile(
        source.data, filePath,
        opts, needSourceMap ? part.map : false
    ).then(
        function (data) {
            source.output = data;
            return source;
        }
    ).catch(function (err) {
        // report babel error codeframe
        source.error = err.codeFrame ? err.codeFrame : err;
        return source;
    });
}

exports.processTemplate = function (part, filePath, opts, needSourceMap) {
    return processVuePart(part, filePath, opts, needSourceMap).then(
        function (result) {
            if (!result || result.error) {
                return result;
            }

            var output = result.output;
            var map;
            if (typeof output !== 'string') {
                output = output.content;
                map = output.map;
            }
            return compileTemplate(output, opts).then(
                function (data) {
                    if (data.error) {
                        result.error = data.error;
                    }
                    else {
                        map && (data.map = map);
                        result.output = data;
                    }

                    return result;
                }
            );
        }
    );
};

exports.processScript = function (part, filePath, opts, needSourceMap) {
    opts || (opts = {});
    part.lang || (part.lang = opts.babel ? 'babel' : null);
    return processVuePart(part, filePath, opts, needSourceMap);
};

exports.processStyle = function (part, filePath, id, opts, needSourceMap) {
    return processVuePart(part, filePath, opts, needSourceMap).then(
        function (result) {
            if (!result || result.error) {
                return result;
            }

            var output = result.output;
            if (typeof output !== 'string') {
                output = output.content.toString();
            }
            output = output.trim();
            return rewriteStyle(id, output, part.scoped, opts, output.map).then(
                function (data) {
                    if (data.error) {
                        result.error = data.error;
                    }
                    else {
                        result.output = data;
                    }

                    return result;
                }
            );
        }
    );
};



