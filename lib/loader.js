/**
 * @file vue 组件文件  loader
 * @author sparklewhy@gmail.com
 */

var Emitter = require('events').EventEmitter;
var Promise = require('bluebird');

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
        prevOutput && (prevOutput = prevOutput.content);
    }

    if (typeof currOutput !== 'string') {
        currOutput && (currOutput = currOutput.content);
    }

    return prevOutput === currOutput;
}

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
        template: null,
        script: null,
        styles: []
    };

    var logger = options.log || {
        error: function (msg) {
            console.error(msg);
        }
    };
    return Promise.all([
        processor.processTemplate(
            parts.template, filePath,
            options.template, needSourceMap
        ),
        processor.processScript(
            parts.script, filePath,
            options.script, needSourceMap
        )
    ].concat(
        parts.styles.map(function (style) {
            return processor.processStyle(
                style, filePath,
                id, options.style,
                needSourceMap
            );
        }))
    ).finally(
        function (data) {
            data.forEach(function (item) {
                if (item.error) {
                    logger.error(item.error);
                }
            });
        }
    ).then(
        function (data) {
            resolvedParts.template = data[0];
            resolvedParts.script = data[1];
            resolvedParts.styles = data.slice(2);

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
        }
    );
};










