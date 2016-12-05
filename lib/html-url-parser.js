/**
 * @file 解析 html 文件 工具方法
 * @author sparklewhy@gmail.com
 */

var assign = require('object-assign');

module.exports = exports = {};

/**
 * 获取 html 属性值提取的正则，只处理包含引号括起来的属性值
 *
 * @param {string} attrName 属性名
 * @param {boolean=} mulilineValue 是否允许多行属性值
 * @return {RegExp}
 */
exports.getAttrRegexp = function (attrName, mulilineValue) {
    var attrValue = mulilineValue ? '[\\s\\S]' : '.';
    return new RegExp('(\\s+' + attrName + '\\s*)=\\s*(\'|")(' + attrValue + '+?)\\2', 'i');
};

/**
 * 获取 Start Tag 提取正则
 *
 * @param {string} tag 标签名称
 * @param {boolean=} hasClose 是否包含关闭标签，可选，默认 false
 * @param {boolean=} closeOptional 是否闭合标签可选，默认 false
 * @return {RegExp}
 */
exports.getTagRegexp = function (tag, hasClose, closeOptional) {
    var end = hasClose ? '([\\s\\S]*?)(?:<\\/' + tag + '>)' : '';
    if (hasClose && closeOptional) {
        end = '(?:' + end + ')?';
    }
    return new RegExp('(<!--[\\s\\S]*?)(?:-->|$)|<' + tag + '([^>]*?)\\/?>' + end, 'ig');
};

/**
 *
 * 图片元素正则
 *
 * @const
 * @type {RegExp}
 */
var IMG_REGEXP = exports.IMG_REGEXP = exports.getTagRegexp('img');

/**
 *
 * Picture Source 元素正则
 *
 * @const
 * @type {RegExp}
 */
var SOURCE_REGEXP = exports.SOURCE_REGEXP = exports.getTagRegexp('source');

/**
 * 获取属性值解析器
 *
 * @inner
 * @param {Array.<string|Object>} attrs 要解析的属性数组
 * @param {Object=} customAttrParser 定制属性值解析器，可选
 * @return {Array.<RegExp>}
 */
function getAttrParser(attrs, customAttrParser) {
    attrs || (attrs = []);
    if (!Array.isArray(attrs)) {
        attrs = [attrs];
    }

    var result = [];
    var map = {};
    customAttrParser || (customAttrParser = {});
    for (var i = 0, len = attrs.length; i < len; i++) {
        var item = attrs[i];
        if (typeof item === 'string') {
            item = {name: item};
        }
        var name = item.name.toLowerCase();
        if (map[name]) {
            continue;
        }

        map[name] = true;
        item = assign({}, customAttrParser[name] || {}, item);
        result.push({
            reg: exports.getAttrRegexp(name, item.multiline),
            parse: item.parse
        });
    }

    return result;
}

function replaceAttrValue(attrParser, attr, replacer) {
    var result = attrParser.reg.exec(attr);
    var value = result && result[3];
    if (value) {
        if (typeof attrParser.parse === 'function') {
            value = attrParser.parse(value);
        }
        attr = attr.replace(result[0], replacer({
            match: result[0],
            value: value
        }));
    }
    return attr;
}

/**
 * 解析属性值
 *
 * @inner
 * @param {Array.<Object>} attrParsers 属性解析器
 * @param {string} attrs 要解析的属性信息
 * @param {string} match 当前匹配到的字符串
 * @param {Function} replacer 自定义属性值替换方法
 * @return {string}
 */
function parseAttrValue(attrParsers, attrs, match, replacer) {
    attrs && attrParsers.forEach(function (parser) {
        attrs = replaceAttrValue(parser, attrs, replacer);
    });

    return attrs;
}

/**
 * 将 srcset 属性值转成数组形式
 *
 * @param {string} value 要转换的值
 * @return {Array.<string>}
 */
function convertSrcSetAttrValueToArr(value) {
    var srcArr = [];
    var srcImgs = value.split(',');
    for (var i = 0, len = srcImgs.length; i < len; i++) {
        var src = srcImgs[i].trim().split(' ')[0];
        if (src && srcArr.indexOf(src) === -1) {
            srcArr.push(src);
        }
    }
    return srcArr;
}

/**
 * 解析 html 引用的图片
 *
 * @inner
 * @param {string} content html 文件内容
 * @param {RegExp} pattern 匹配图片元素的正则
 * @param {function(Object):string} replacer 碰到解析到的图片元素要执行的替换逻辑
 * @param {string|Array.<string>} toParseAttrs 要解析的属性
 * @return {string}
 */
function parseImgUrl(content, pattern, replacer, toParseAttrs) {
    toParseAttrs || (toParseAttrs = ['src', 'srcset']);
    var attrParsers = getAttrParser(toParseAttrs, {
        srcset: {
            parse: convertSrcSetAttrValueToArr,
            multiline: true
        }
    });

    return content.replace(pattern, function (match, comment, attr) {
        if (comment) {
            return match;
        }

        var result = match;
        var oldAttr = attr;
        attr = parseAttrValue(attrParsers, attr, result, replacer);
        if (attr !== oldAttr) {
            result = match.replace(oldAttr, attr);
        }
        return result;
    });
}

exports.srcset2Arr = convertSrcSetAttrValueToArr;

/**
 * 解析 html 引用的图片
 *
 * @param {string} content html 文件内容
 * @param {function(Object):string} replacer 碰到解析到的图片元素要执行的替换逻辑
 * @param {string|Array.<string>=} toParseAttrs 要解析的属性
 * @return {string}
 */
exports.parseImgUrl = function (content, replacer, toParseAttrs) {
    return parseImgUrl(content, IMG_REGEXP, replacer, toParseAttrs);
};

/**
 * 解析 html Picture Source 引用的图片
 *
 * @param {string} content html 文件内容
 * @param {function(Object):string} replacer 碰到解析到的图片元素要执行的替换逻辑
 * @param {string|Array.<string>=} toParseAttrs 要解析的属性
 * @return {string}
 */
exports.parsePictureSourceUrl = function (content, replacer, toParseAttrs) {
    return parseImgUrl(content, SOURCE_REGEXP, replacer, toParseAttrs);
};

/**
 * 解析指定 tag 的属性值
 *
 * @param {string} content html 文件内容
 * @param {string|{name: string, close: true}} tag 要解析的 tag，通过 `close` 明确指定标签必须闭合
 * @param {string|Array.<string>} toParseAttrs 要解析的属性
 * @param {function(Object):string} replacer 碰到解析到的属性要执行的替换逻辑
 * @return {string}
 */
exports.parseTagAttr = function (content, tag, toParseAttrs, replacer) {
    var hasCloseTag;
    if (tag && typeof tag === 'object') {
        hasCloseTag = tag.close;
        tag = tag.name;
    }

    if (/^img$/i.test(tag)) {
        return exports.parseImgUrl(content, replacer, toParseAttrs);
    }

    if (/^source$/i.test(tag)) {
        return exports.parsePictureSourceUrl(content, replacer, toParseAttrs);
    }

    var tagRegexp = exports.getTagRegexp(tag, hasCloseTag);
    var attrParsers = getAttrParser(toParseAttrs);

    return content.replace(tagRegexp, function (match, comment, attr) {
        if (comment) {
            return;
        }

        var oldAttr = attr;
        attr = parseAttrValue(attrParsers, attr, match, replacer);
        if (attr !== oldAttr) {
            match = match.replace(oldAttr, attr);
        }
        return match;
    });
};
