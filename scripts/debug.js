
// Set dependencies
var env = require('./env');
var domConfig = require('./dom-config');
var Node = domConfig.Node;

module.exports = {
    init: init,
    log: log,
    logResult: logResult,
    hideInvalidTags: hideInvalidTags
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
    if (env.isFrontEnd) return console.log.apply(console, arguments);

    // Debug for text dom nodes in node.js
    var args = Array.prototype.slice.apply(arguments);
    for (var i = 0; i < args.length; i++) {
        if (args[i] === null || typeof args[i] !== 'object' || typeof args[i].nodeType === 'undefined' || typeof args[i].node === 'undefined') continue;

        if (args[i].node && typeof args[i].node === 'object' && args[i].node.nodeType === Node.TEXT_NODE) {
            args[i].node = '"' + args[i].node.nodeValue + '"';
        } else if (args[i].nodeType === Node.TEXT_NODE) {
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

// Replace not closed or wrongly closed tags with placeholders, to see that they were not processed
function hideInvalidTags(notClosed, wrongClosed) {
    if (!options.debug) return;

    var data = null;

    for (var name in notClosed) {
        data = notClosed[name];

        for (var i = 0; i < data.length; i++) {
            hideTag(data[i]);
        }
    }

    for (var i = 0; i < wrongClosed.length; i++) {
        data = wrongClosed[i];

        hideTag(data.closed);
        if (data.opened) hideTag(data.opened);
    }

    // Do replace
    function hideTag(data) {
        var node = data.node;
        var text = node.nodeValue;
        var index = data.index;
        var length = data.tag.length;

        node.nodeValue = text.substring(0, index + 1) + '#' + text.substr(index + 2, length - 4) + '#' + text.substring(index - 1 + length);

        log('replace ->', text, '<- with ->', node.nodeValue);
    }
}

// Repeat some string 'count' times
function repeatString(string, count) {
    return Array(count*1 + 1).join(string);
}
