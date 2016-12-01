/**
 * @file vue 单文件组件的解析器
 * @author sparklewhy@gmail.com
 */

var compiler = require('vue-template-compiler');
var cache = require('lru-cache')(100);
var hash = require('hash-sum');
var SourceMapGenerator = require('source-map').SourceMapGenerator;
var generator = require('./generator');

var splitRegExp = /\r?\n/g;
var emptyRegExp = /^(?:\/\/)?\s*$/;

function generateSourceMap(fileName, source, generatedContent) {
    var map = new SourceMapGenerator();
    map.setSourceContent(fileName, source);

    generatedContent.split(splitRegExp).forEach(function (line, index) {
        if (!emptyRegExp.test(line)) {
            map.addMapping({
                source: fileName,
                original: {
                    line: index + 1,
                    column: 0
                },
                generated: {
                    line: index + 1,
                    column: 0
                }
            });
        }
    });

    return map.toJSON();
}

function initSourceMap(output, content, fileNameWithHash) {
    // source-map cache busting for hot-reloadded modules
    if (output.script && !output.script.src) {
        output.script.map = generateSourceMap(
            fileNameWithHash,
            content,
            output.script.content
        );
    }

    if (output.styles) {
        output.styles.forEach(function (style) {
            if (style.src) {
                return;
            }

            style.map = generateSourceMap(
                fileNameWithHash,
                content,
                style.content
            );
        });
    }
}

/**
 * 解析 单文件 vue 组件
 *
 * @param {string} fileName 文件名
 * @param {string} content 文件内容
 * @param {boolean=} needSourceMap 是否需要生成 source map，可选，默认 false
 * @return {Object}
 */
function parse(fileName, content, needSourceMap) {
    var cacheKey = hash(fileName + content);
    var output = cache.get(cacheKey);

    if (output) {
        return output;
    }

    output = compiler.parseComponent(content, {pad: true});
    needSourceMap && initSourceMap(
        output, content,
        generator.generateSourceMapFileName(fileName, content)
    );

    cache.set(cacheKey, output);

    return output;
}

module.exports = exports = parse;
