/**
 * @file url 重写
 * @author sparklewhy@gmail.com
 */

var util = require('./util');

function rewriteUrl(url, context) {
    var customRewrite = context.urlRewrite;
    if (customRewrite === false) {
        return false;
    }
    else if (typeof customRewrite === 'function') {
        return customRewrite(url, context);
    }

    if (!util.isLocalPath(url)) {
        return url;
    }

    var deps = context.deps;
    var filePath = context.filePath;
    var absPath = util.resolvePath(url, filePath);
    if (deps.indexOf(absPath) === -1) {
        deps.push(absPath);
    }
    return util.rebasePath(
        url, filePath,
        context.urlRewriteTarget || 'default'
    );
}

module.exports = exports = function (urls, match, context) {
    if (!Array.isArray(urls)) {
        urls = [urls];
    }

    urls.forEach(function (url) {
        var result = rewriteUrl(url, context);
        if (result == null || result === false) {
            return;
        }

        match = match.replace(url, result);
    });
    return match;
};
