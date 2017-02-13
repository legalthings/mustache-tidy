
// Set dependencies
var domConfig = require('./dom-config');
var debug = require('./debug');

//Module variables
var doc = null;
var log = debug.log;
var Node = domConfig.Node;

module.exports = {
    init: init,
    repeatString: repeatString,
    updateTextNodeData: updateTextNodeData,
    createTextNode: createTextNode,
    startsWithTag: startsWithTag,
    endsWithTag: endsWithTag,
    isDataElement: isDataElement,
    isFullDataElement: isFullDataElement
}

// Init module options
function init(config) {
    debug.init(config);
    doc = config.doc;
}

// Repeat some string 'count' times
function repeatString(string, count) {
    return Array(count*1 + 1).join(string);
}

// Create text node with data based on existing tag node
function updateTextNodeData(data, level) {
    data.index = 0;
    data.node = createTextNode(data.tag);

    if (typeof level !== 'undefined') data.level = level;
}

// Create text node
function createTextNode(text) {
    return doc.createTextNode(text);
}

// Determine if text node starts with tag
function startsWithTag(data) {
    return data.index === 0 ||
        !data.node.nodeValue.substring(0, data.index).trim().length;
}

// Determine if text node ends with tag
function endsWithTag(data) {
    var text = data.node.nodeValue;
    var tagEnd = data.index + data.tag.length;

    return text.length === tagEnd || !text.substring(tagEnd).trim().length;
}

// Determine if element is non-skippabe by tag, e.g. it is relevant for text information
function isDataElement(node) {
    return node && node.nodeType !== Node.COMMENT_NODE;
}

// Determine if element is non-skippabe by tag, e.g. it is relevant for text information
// This function is used in places where empty text nodes were not deleted
function isFullDataElement(node) {
    if (!isDataElement(node)) return false;

    return node.nodeType === Node.TEXT_NODE && !node.nodeValue.trim().length ?
        (node.nextSibling ? isFullDataElement(node.nextSibling) : false) :
        true;
}
