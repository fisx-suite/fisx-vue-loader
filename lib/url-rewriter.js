/**
 * @file url 重写
 * @author sparklewhy@gmail.com
 */

var util = require('./util');

module.exports = exports = function (url, context) {
    var customRewrite = context.urlRewrite;
    if (customRewrite === false) {
        return;
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
};
