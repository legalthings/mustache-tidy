var webpack = require('webpack');
var filename = 'mustache-tidy.js';
var plugins = [
    new webpack.IgnorePlugin(/jsdom/)
];

module.exports = function(env) {
    if (env === 'prod') {
        filename = 'mustache-tidy.min.js';
        plugins.push(new webpack.optimize.UglifyJsPlugin());
    };

    return {
        entry: './index.js',
        output: {
            path: './assets',
            filename: filename,
            library: 'mustacheTidy'
        },
        node: {
            fs: "empty",
            net: "empty",
            child_process: "empty",
            tls: "empty"
        },
        plugins: plugins
    };
}
