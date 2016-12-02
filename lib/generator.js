/**
 * @file vue 组件编译后代码生成器
 * @author sparklewhy@gmail.com
 */

var path = require('path');
var hash = require('hash-sum');
var SourceMap = require('source-map');

var splitRegExp = /\r?\n/g;
var STYLE_MODULE_VAR_NAME = '__fisx_style_dispose__';

// determine dynamic script paths
var normalize = require('./normalize');
var DEFAULT_HOT_RELOAD_API_PATH = normalize.dep('vue-hot-reload-api');
var DEFAULT_INSERT_CSS_PATH = normalize.lib('insert-css');

function getCode(part) {
    var output = part && part.output;
    if (typeof output !== 'string') {
        output && (output = output.code);
    }
    return output || '';
}

/**
 * 输出 source map 文件名
 *
 * @param {string} filePath 文件路径
 * @param {string} content 文件内容
 * @return {string}
 */
function generateSourceMapFileName(filePath, content) {
    return path.basename(filePath)
        + '?' + hash(filePath + content);
}

function generateCodeSourceMap(filePath, content, generated, output) {
    // hot-reload source map busting
    var hashedFilename = generateSourceMapFileName(filePath, content);
    var map = new SourceMap.SourceMapGenerator();
    map.setSourceContent(hashedFilename, content);
    map._hashedFilename = hashedFilename;

    if (!generated.output) {
        return map;
    }

    // check input source map from babel/coffee etc
    var code = getCode(generated);
    var inMap = generated.output.map;
    var inMapConsumer = inMap && new SourceMap.SourceMapConsumer(inMap);

    var generatedOffset = (output ? output.split(splitRegExp).length : 0) + 1;
    code.split(splitRegExp).forEach(function (line, index) {
        var ln = index + 1;
        var originalLine = inMapConsumer
            ? inMapConsumer.originalPositionFor({line: ln, column: 0}).line
            : ln;

        if (!originalLine) {
            return;
        }

        map.addMapping({
            source: hashedFilename,
            generated: {
                line: ln + generatedOffset,
                column: 0
            },
            original: {
                line: originalLine,
                column: 0
            }
        });
    });

    return map;
}

function addTemplateSourceMap(content, template, output, generated, map) {
    var startLineNo = output.split(splitRegExp).length;
    var endLineNo = startLineNo + generated.split(splitRegExp).length;
    var originalTplLineStartNo = content
        .slice(0, template.raw.start)
        .split(splitRegExp).length;

    for (; startLineNo < endLineNo; startLineNo++) {
        map.addMapping({
            source: map._hashedFilename,
            generated: {
                line: startLineNo,
                column: 0
            },
            original: {
                line: originalTplLineStartNo,
                column: 0
            }
        });
    }
}

function generateStyle(source, options) {
    var styles = source.styles;
    if (options.isServer || !styles || styles.length) {
        return;
    }

    var styleCode = [];
    styles.forEach(function (item, index) {
        styleCode[index] = getCode(item);
    });
    styleCode = styleCode.join('\n');

    var filePath = source.filePath;
    var result = {
        filePath: filePath,
        raw: styles,
        content: styleCode
    };
    if (!options.extractCSS) {
        var insertCSSPath = options.insertCSSPath;
        if (typeof insertCSSPath === 'function') {
            insertCSSPath = insertCSSPath(DEFAULT_INSERT_CSS_PATH);
        }
        insertCSSPath || (insertCSSPath = DEFAULT_INSERT_CSS_PATH);

        result.output = 'var ' + STYLE_MODULE_VAR_NAME + ' = require("'
            + insertCSSPath + '").insert(' + JSON.stringify(styleCode) + ')\n';
    }

    return result;
}

function generateScript(source, output, options) {
    var script = source.script;
    if (!script) {
        return;
    }

    var code = getCode(script);
    var map = null;
    var filePath = source.filePath;
    if (options.sourceMap) {
        map = generateCodeSourceMap(filePath, source.content, script, output);
    }

    // babel 6 compat
    var generated = ';(function(){\n' + code + '\n})()\n'
        + 'if (module.exports.__esModule) module.exports = module.exports.default\n';

    // in case the user exports with Vue.extend
    generated += 'var __vue__options__ = (typeof module.exports === "function"'
        + '? module.exports.options'
        + ': module.exports)\n';

    return {
        filePath: filePath,
        raw: script,
        content: code,
        output: generated,
        map: map
    };
}

function generateTemplate(source, output, map, options) {
    var template = source.template;
    if (!template) {
        return;
    }

    var generated = '';
    if (!options.isProduction && !options.isServer) {
        generated += 'if (__vue__options__.functional) {console.error("'
            + '[fisx-vue] functional components are not supported and '
            + 'should be defined in plain js files using render functions.'
            + '")}\n';
    }

    generated += '__vue__options__.render = ' + template.output.render + '\n'
        + '__vue__options__.staticRenderFns = ' + template.output.staticRenderFns
        + '\n';

    if (map) {
        addTemplateSourceMap(source.content, template, output, generated, map);
    }

    return {
        filePath: source.filePath,
        raw: template,
        content: template.output,
        output: generated,
        map: map
    };
}

function generateHotReloadCode(source, changeInfo, options) {
    var hotReloadAPIPath = options.hotReloadAPIPath;
    if (typeof hotReloadAPIPath === 'function') {
        hotReloadAPIPath = hotReloadAPIPath(DEFAULT_HOT_RELOAD_API_PATH);
    }
    hotReloadAPIPath || (hotReloadAPIPath = DEFAULT_HOT_RELOAD_API_PATH);

    var hasStyle = source.styles && source.styles.length;
    var id = source.id;

    var disposeStyleCode = hasStyle && !options.extractCSS
        ? '  module.hot.dispose(' + STYLE_MODULE_VAR_NAME + ')\n'
        : '';
    var updateCode = changeInfo.scriptChanged
        ? '    hotAPI.reload("' + id + '", __vue__options__)\n'
        : (changeInfo.templateChanged
        ? '    hotAPI.rerender("' + id + '", __vue__options__)\n'
        : '');

    var codes = [
        'if (module.hot) {(function () {',
        '  var hotAPI = require("' + hotReloadAPIPath + '")\n',
        '  hotAPI.install(require("vue"), true)\n',
        '  if (!hotAPI.compatible) return\n',
        '  module.hot.accept()\n',
        // remove style tag on dispose
        disposeStyleCode,
        '  if (!module.hot.data) {\n',
        // initial insert
        '    hotAPI.createRecord("' + id + '", __vue__options__)\n',
        '  } else {\n',
        updateCode,
        '  }\n',
        '})()}'
    ];

    return codes.join('');
}

module.exports = exports = function (source, changeInfo, options) {
    var output = '';
    var id = source.id;

    // generate style
    var result = generateStyle(
        source, options
    );
    result && result.output && (output += result.output);

    // script
    result = generateScript(
        source, output, options
    );
    result && (output += result.output);
    var map = result && result.map;

    // template
    result = generateTemplate(
        source, output, map, options
    );
    result && (output += result.output);

    // scoped CSS id
    // check for scoped style nodes
    var hasScopedStyle = source.parseParts.styles.some(function (style) {
        return style.scoped;
    });
    if (hasScopedStyle) {
        output += '__vue__options__._scopeId = "' + id + '"\n';
    }

    // hot reload
    var isProduction = options.isProduction;
    var isServer = options.isServer;
    if (!isProduction && !isServer) {
        output += generateHotReloadCode(source, changeInfo, options);
    }

    return {
        map: map && map.toString(),
        output: output
    };
};

exports.generateSourceMapFileName = generateSourceMapFileName;

var fileIdCache = Object.create(null);

/**
 * utility for generating a uid for each component file
 * used in scoped CSS rewriting
 *
 * @param {string} filePath 生成 id 的文件路径
 * @return {string}
 */
exports.generateFileId = function (filePath) {
    return fileIdCache[filePath] || (fileIdCache[filePath] = hash(filePath));
};
