
// Set dependencies
var utils = require('./utils');
var Node = utils.Node;
var repeatString = utils.repeatString;

module.exports = {
    init: init,
    log: log,
    logResult: logResult
}

// Static
var options = {};

// Init module options
function init(config) {
    options = config;
}

// Logging
function log() {
    if (!options.debug) return;

    var args = Array.prototype.slice.apply(arguments);
    for (var i = 0; i < args.length; i++) {
        if (typeof args[i] !== 'object' || typeof args[i].nodeType === 'undefined') continue;
        if (args[i].nodeType === Node.TEXT_NODE) {
            args[i] = '"' + args[i].nodeValue + '"';
        }
    }

    console.log.apply(console, args);
}

// Log whole processed document
function logResult(root) {
    if (!options.debug) return;
    var result = logNode(root);

    log('result html: ');
    log(result);

    function logNode(node, level) {
        if (!level) level = 0;
        if (node.nodeType === Node.TEXT_NODE) return levelIndent(level) + node.nodeValue + "\n";
        if (node.nodeType !== Node.ELEMENT_NODE) return '';

        var indent = levelIndent(level);
        var nodeName = node.nodeName.toLowerCase();
        var output = indent + '<' + nodeName + '>' + "\n";
        var kids = node.childNodes;
        level++;

        for (var i = 0; i < kids.length; i++) {
            output += logNode(kids[i], level);
        }

        return output + indent + '</' + nodeName + '>' + "\n";
    }

    function levelIndent(level) {
        return level ? repeatString(' ', level * 4) : '';
    }
}
