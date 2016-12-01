/**
 * @file css browser loader
 *       Refer from https://github.com/vuejs/vueify/blob/master/lib/insert-css.js
 * @author sparklewhy@gmail.com
 */

var inserted = exports.cache = {};

function noop() {}

exports.insert = function (css) {
    if (inserted[css]) {
        return noop;
    }

    inserted[css] = true;
    var elem = document.createElement('style');
    elem.setAttribute('type', 'text/css');

    if ('textContent' in elem) {
        elem.textContent = css;
    }
    else {
        elem.styleSheet.cssText = css;
    }

    document.getElementsByTagName('head')[0].appendChild(elem);

    return function () {
        document.getElementsByTagName('head')[0].removeChild(elem);
        inserted[css] = false;
    };
};
