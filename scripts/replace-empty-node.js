
// Set dependencies
var domConfig = require('./dom-config');
var debug = require('./debug');

// Static variable
var Node = domConfig.Node;
var log = debug.log;
var root = null;
var replacableNodes = {'P': 1, 'DIV': 1, 'SPAN': 1, 'I': 1, 'EM': 1, 'STRONG': 1, 'LI': 1};

module.exports = {
    init: init,
    run: replaceEmptyNode
};

// Init module options
function init(config) {
    debug.init(config);

    root = config.root;
}

// Replace parent node with tag, if tag is empty and node does not contain other data
function replaceEmptyNode(data, coupleData, mode) {
    var node = data.node;
    var parent = node.parentElement;
    var tagText = mode === 'both' ? data.tag + coupleData.tag : data.tag;

    // Simple check
    var skip =
        !parent ||
        parent === root ||
        !parent.parentElement ||
        parent.childNodes.length > 1 ||
        !replacableNodes[parent.nodeName];

    if (skip) return;

    var empty = tagText === node.nodeValue.trim();

    // Check if tag text node contains only tag(s) and spaces
    if (!empty && mode === 'both') {
        var text = node.nodeValue;
        var inner = text.substring(0, data.index) +
            text.substring(data.index + data.tag.length, coupleData.index) +
            text.substring(coupleData.index + coupleData.tag.length);

        empty = !inner.trim().length;
    }

    if (!empty) return;

    parent.parentElement.replaceChild(node, parent);
    data.level--;

    // There are element nodes in new parent, so it's definitely not empty. Do not perform recursive replace
    if (node.parentElement.children.length) return;

    // Join moved node with possible sibling empty text nodes in new parent element
    // Node.normalize() can not be used here, because it can destroy current references to text nodes with tags
    var tagsMerged = mergeTextNodes(data, coupleData, mode);
    mode = tagsMerged ? 'both' : mode;

    replaceEmptyNode(data, coupleData, mode);
}

// Remove all empty text nodes, that are siblings of given text node
// Also if other tag node is now sibling, merge it
// When merging, update references to tags nodes, if they are changed
function mergeTextNodes(data, coupleData, mode) {
    var prev = data.node;
    var next = data.node;
    var tagsMerged = mode === 'both' ? true : false;
    var remove = [];

    while (true) {
        prev = prev.previousSibling;
        if (!prev || prev.nodeType !== Node.TEXT_NODE) break;

        if (prev === coupleData.node) {
            tagsMerged = true;
            data.index += prev.nodeValue.length;
            data.node.nodeValue = prev.nodeValue + data.node.nodeValue;
            coupleData.node = data.node;
        } else if (prev.nodeValue.trim().length) {
            break;
        }

        remove.push(prev);
    }

    while (true) {
        next = next.nextSibling;
        if (!next || next.nodeType !== Node.TEXT_NODE) break;

        if (next === coupleData.node) {
            tagsMerged = true;
            coupleData.index += data.node.nodeValue.length;
            data.node.nodeValue = data.node.nodeValue + next.nodeValue;
            coupleData.node = data.node;
        } else if (next.nodeValue.trim().length) {
            break;
        }

        remove.push(next);
    }

    var parent = data.node.parentElement;
    for (var i = 0; i < remove.length; i++) {
        parent.removeChild(remove[i]);
    }

    return tagsMerged;
}
