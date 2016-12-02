/**
 * @file 内建的编译器定义
 * @author sparklewhy@gmail.com
 */

module.exports = {
    coffee: require('./coffee'),
    babel: require('./babel'),
    less: require('./less'),
    sass: require('./sass'),
    scss: require('./sass'),
    stylus: require('./stylus'),
    jade: require('./jade'),
    pug: require('./pug')
};
