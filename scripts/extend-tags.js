
// Set dependencies
var domConfig = require('./dom-config');
var utils = require('./utils');
var debug = require('./debug');

// Module variables
var updateTextNodeData = utils.updateTextNodeData;
var createTextNode = utils.createTextNode;
var startsWithTag = utils.startsWithTag;
var endsWithTag = utils.endsWithTag;
var Node = domConfig.Node;
var log = debug.log;

module.exports = {
    init: init,
    extendSeparatedTagParts: extendSeparatedTagParts,
    extendTagForward: extendTagForward,
    extendTagBack: extendTagBack
};

// Init module options
function init(config) {
    debug.init(config);
    utils.init(config);
}

// Extend tag, if it's parts are in separate node trees
function extendSeparatedTagParts(opened, closed) {
    var relation = opened.node.parentElement.compareDocumentPosition(closed.node.parentElement);

    if (relation & Node.DOCUMENT_POSITION_CONTAINS) {
        extendTagForward(opened, closed, true);
    } else if (relation & Node.DOCUMENT_POSITION_CONTAINED_BY) {
        extendTagBack(opened, closed, true);
    } else {
        // Tags are still in different node trees, so we extend both of them towards each other, to reach a common parent element

        if (opened.level >= closed.level) {
            log('-------------- extend tag both ways starting from closed');
            extendTagBack(opened, closed, true);
            extendTagForward(opened, closed);
        } else {
            log('-------------- extend tag both ways starting from opened');
            extendTagForward(opened, closed, true);
            extendTagBack(opened, closed);
        }
    }
}

// Correctly surround by tag all data that's nested inside it, to avoid partial nodes removal.
// Moving up the node tree, from opened to closed
function extendTagForward(opened, closed, tillCommonAncestor) {
    log('-------------- extend tag forward');

    var level = opened.level;
    var parent = opened.node;
    var newClosed = null;

    if (opened.node.nextSibling || !endsWithTag(opened)) {
        newClosed = createTextNode(closed.tag);
        opened.node.parentElement.appendChild(newClosed);
    }

    while (true) {
        level--;
        parent = parent.parentElement;

        if (!parent.nextSibling) continue;

        updateTextNodeData(opened, level);
        parent.parentElement.insertBefore(opened.node, parent.nextSibling);
        if (tillCommonAncestor ? parent.parentElement.contains(closed.node) : level <= closed.level) break;

        newClosed = createTextNode(closed.tag);
        parent.parentElement.appendChild(newClosed);
    }
}

// Correctly surround by tag all data that's nested inside it, to avoid partial nodes removal.
// Moving up the node tree, from closed to opened
function extendTagBack(opened, closed, tillCommonAncestor) {
    log('-------------- extend tag back');

    var level = closed.level;
    var parent = closed.node.parentElement;
    var newOpened = null;

    if (closed.node.previousSibling || !startsWithTag(closed)) {
        newOpened = createTextNode(opened.tag);
        parent.insertBefore(newOpened, parent.firstChild);
    }

    parent = closed.node;

    while (true) {
        level--;
        parent = parent.parentElement;

        if (!parent.previousSibling) continue;

        updateTextNodeData(closed, level);
        parent.parentElement.insertBefore(closed.node, parent);
        if (tillCommonAncestor ? parent.parentElement.contains(opened.node) : level <= opened.level) break;

        newOpened = createTextNode(opened.tag);
        parent.parentElement.insertBefore(newOpened, parent.parentElement.firstChild);
    }
}
