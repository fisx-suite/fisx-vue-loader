/**
 * @file 确保要使用依赖可用的工具方法
 * @author sparklewhy@gmail.com
 */

/**
 * 确保要使用的依赖已经可用
 *
 * @param {string} name 要使用的依赖名称
 * @param {string|Array} deps 具体依赖清单，['less'] or 'less'
 *        or ['babel-core', ['babel-runtime', 'babel-runtime/core-js']]
 *        如果元素为数组，第一个参数为要安装的 npm 模块名称，第二个参数为要 require 的入口模块
 *        对于未指定入口模块的 npm 模块，需要通过该形式来指定
 * @throw Error
 */
module.exports = function (name, deps) {
    var missing = [];

    if (typeof deps === 'string') {
        deps = [deps];
    }

    for (var i = 0, len = deps.length; i < len; i++) {
        var mis;
        var req = deps[i];
        if (typeof req === 'string') {
            mis = req;
        }
        else {
            mis = req[1];
            req = req[0];
        }

        try {
            require.resolve(req);
        }
        catch (e) {
            missing.push(mis);
        }
    }

    if (missing.length > 0) {
        var message = 'You are trying to use "' + name + '". ';
        var npmInstall = 'npm install --save-dev ' + missing.join(' ');

        if (missing.length > 1) {
            var last = missing.pop();
            message += missing.join(', ') + ' and ' + last + ' are ';
        }
        else {
            message += missing[0] + ' is ';
        }

        message += 'missing.\n\nTo install run:\n' + npmInstall;
        throw new Error(message);
    }
};

