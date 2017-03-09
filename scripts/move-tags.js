
// Set dependencies
var domConfig = require('./dom-config');
var utils = require('./utils');
var debug = require('./debug');

// Module variables
var updateTextNodeData = utils.updateTextNodeData;
var startsWithTag = utils.startsWithTag;
var endsWithTag = utils.endsWithTag;
var isDataElement = utils.isDataElement;
var isFullDataElement = utils.isFullDataElement;
var repeatString = utils.repeatString;
var Node = domConfig.Node;
var log = debug.log;
var nodesWithPlaceholders = [];

module.exports = {
    init: init,
    handleCaseClosedIsAncestor: handleCaseClosedIsAncestor,
    handleCaseOpenedIsAncestor: handleCaseOpenedIsAncestor,
    handleCaseSeparateTrees: handleCaseSeparateTrees,
    removePlaceholders: removePlaceholders
};

// Init module options
function init(config) {
    debug.init(config);
    utils.init(config);

    nodesWithPlaceholders = [];
}

// Move tags in case when closing tag is in ancestor node of opening
// If tags are moved inside table outside table cells, mark tags as temporary
function handleCaseClosedIsAncestor(opened, closed) {
    log('closing tag is in ancestor node of opening tag');

    // Try to move opening tag up
    if (startsWithTag(opened) && !isDataElement(opened.node.previousSibling)) {
        log('--------------- move opened tag up outside');
        moveTagUpBackword(opened, closed.level);
    } else if (endsWithTag(opened) && !isDataElement(opened.node.nextSibling)) {
        log('--------------- move opened tag up inside');
        moveTagUpForward(opened, closed.level);
    }

    // If still necessary, try to move closing tag down
    if (opened.level !== closed.level && startsWithTag(closed) && closed.node.previousSibling.contains(opened.node)) {
        log('--------------- move closed tag down inside');
        moveTagDownBackword(closed, opened.level, opened.node);
    }
}

// Move tags in case when opening tag is in ancestor node of closing
// If tags are moved inside table outside table cells, mark tags as temporary
function handleCaseOpenedIsAncestor(opened, closed) {
    log('closed tag is contained inside open');

    // Try to move closing tag up
    if (endsWithTag(closed) && !isFullDataElement(closed.node.nextSibling)) {
        log('--------------- move closed tag up outside');
        moveTagUpForward(closed, opened.level);
    } else if (startsWithTag(closed) && !isDataElement(closed.node.previousSibling)) {
        log('--------------- move closed tag up inside');
        moveTagUpBackword(closed, opened.level);
    }

    // If still necessary, try to move opening tag down
    if (opened.level !== closed.level && endsWithTag(opened) && opened.node.nextSibling.contains(closed.node)) {
        log('--------------- move opened tag down inside');
        moveTagDownForward(opened, closed.level, closed.node);
    }
}

// Move tags in case when they are not in ancestor nodes of each other
// In here we first try to move tags to level of each other, and than - to common parent node
// For this we pass additional parameter to 'moveTagUp...' functions
// If tags are moved inside table outside table cells, mark tags as temporary
function handleCaseSeparateTrees(opened, closed) {
    log('opening and closing tags are not in ancestor nodes of each other');

    // Try to move opening tag up
    if (startsWithTag(opened) && !isDataElement(opened.node.previousSibling)) {
        log('--------------- move opened tag up outside');
        moveTagUpBackword(opened, closed.level, closed.node);
    } else if (endsWithTag(opened) && !isDataElement(opened.node.nextSibling)) {
        log('--------------- move opened tag up inside');
        moveTagUpForward(opened, closed.level, closed.node);
    }

    // Try to move closing tag up
    if (endsWithTag(closed) && !isFullDataElement(closed.node.nextSibling)) {
        log('--------------- move closed tag up outside');
        moveTagUpForward(closed, opened.level, opened.node);
    } else if (startsWithTag(closed) && !isDataElement(closed.node.previousSibling)) {
        log('--------------- move closed tag up inside');
        moveTagUpBackword(closed, opened.level, opened.node);
    }
}

// Move tag down along nodes chain, that contain another part of tag, towards end of document
function moveTagDownForward(data, toLevel, toNode) {
    var descendant = data.node.nextSibling;

    while (data.level < toLevel && descendant.contains(toNode)) {
        data.level++;
        descendant = descendant.firstChild;
    }

    if (data.node.nodeValue.length !== data.tag.length) {
        replaceMovedTag(data);
        updateTextNodeData(data);
    }

    var parent = descendant.parentElement;
    parent.insertBefore(data.node, parent.firstChild);
}

// Move tag down along nodes chain, that contain another part of tag, towards beginning of document
function moveTagDownBackword(data, toLevel, toNode) {
    var descendant = data.node.previousSibling;

    while (data.level < toLevel && descendant.contains(toNode)) {
        data.level++;
        descendant = descendant.lastChild;
    }

    if (data.node.nodeValue.length !== data.tag.length) {
        replaceMovedTag(data);
        updateTextNodeData(data);
    }

    descendant.parentElement.appendChild(data.node);
}

// Move tag node up the node tree, backwords
function moveTagUpBackword(data, toLevel, toNode) {
    var ancestor = data.node;

    do {
        data.level--;
        ancestor = ancestor.parentElement;
    } while ((data.level > toLevel || (toNode && !ancestor.parentElement.contains(toNode))) && !isDataElement(ancestor.previousSibling));

    if (data.node.nodeValue.length !== data.tag.length) {
        replaceMovedTag(data);
        updateTextNodeData(data);
    }

    ancestor.parentElement.insertBefore(data.node, ancestor);
}

// Move tag node up the node tree, forward
function moveTagUpForward(data, toLevel, toNode) {
    var ancestor = data.node;

    do {
        data.level--;
        ancestor = ancestor.parentElement;
    } while ((data.level > toLevel || (toNode && !ancestor.parentElement.contains(toNode))) && !isFullDataElement(ancestor.nextSibling));

    if (data.node.nodeValue.length !== data.tag.length) {
        replaceMovedTag(data);
        updateTextNodeData(data);
    }

    var grandpa = ancestor.parentElement;
    var next = ancestor.nextSibling;
    next ? grandpa.insertBefore(data.node, next) : grandpa.appendChild(data.node);
}

// Remove placeholders after moving tags
function removePlaceholders() {
    var data = null;
    while (data = nodesWithPlaceholders.pop()) {
        data.node.nodeValue = data.node.nodeValue.replace(data.placeholder, '');
    }
}

// Replace moved tag with placeholder, to not change text node content length
function replaceMovedTag(data) {
    var text = data.node.nodeValue;
    var size = data.tag.length;
    var placeholder = '{#' + repeatString('_', size - 4) + '#}';

    data.node.nodeValue = text.substring(0, data.index) + placeholder + text.substring(data.index + size);
    nodesWithPlaceholders.push({node: data.node, placeholder: placeholder});
}
