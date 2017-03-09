
// Set dependencies
var domConfig = require('./dom-config');
var utils = require('./utils');
var debug = require('./debug');

// Module variables
var startsWithTag = utils.startsWithTag;
var endsWithTag = utils.endsWithTag;
var repeatString = utils.repeatString;
var createTextNode = utils.createTextNode;
var Node = domConfig.Node;
var log = debug.log;
var tableContainers = {'TABLE': 1, 'THEAD': 1, 'TBODY': 1, 'TR': 1};
var tableCells = {'TD': 1, 'TH': 1};

module.exports = {
    init: init,
    run: run,
    tableCells: tableCells
};

// Init module options
function init(config) {
    debug.init(config);
    utils.init(config);
}

// Turn tmp tags, created in tables outside table cells, into correct tags inside cells
function run(tag) {
    // Section was removed or is not closed, or is correct
    if (!tag.opened.node || !tag.closed || !isTmpTag(tag.opened)) return;
    log('-- fix table tag: ', tag);

    extendTmpTag(tag.opened, tag.closed);
}

// Extand tmp table tag to table cells, that are contained inside this tag
function extendTmpTag(opened, closed) {
    var next = opened.node;

    while (true) {
        next = next.nextSibling;
        if (next === closed.node) break;

        processNode(next);
    }

    startsWithTag(opened) && endsWithTag(opened) ?
        opened.node.parentElement.removeChild(opened.node) :
        cutNode(opened);

    startsWithTag(closed) && endsWithTag(closed) ?
        closed.node.parentElement.removeChild(closed.node) :
        cutNode(closed);

    function processNode(node) {
        if (node.nodeType !== Node.ELEMENT_NODE || !node.firstChild) return;

        if (!tableCells[node.nodeName]) {
            for (var i = 0; i < node.childNodes.length; i++) {
                processNode(node.childNodes[i]);
            }

            return;
        }

        node.insertBefore(createTextNode(opened.tag), node.firstChild);
        node.appendChild(createTextNode(closed.tag));
    }
}

// Determine if tag node belongs to table nodes area, where we can create only temporary tags
function isTmpTag(data) {
    return data.node.parentElement && !!tableContainers[data.node.parentElement.nodeName];
}

// Cut tag from it's containing text node, if this text node contains another tag text
// Tag is replaced by whitespaces, to not mess with indexes of other possible tags in text
function cutNode(data) {
    var text = data.node.nodeValue;
    data.node.nodeValue = text.substring(0, data.index) + repeatString(' ', data.tag.length) + text.substring(data.index + data.tag.length);
}
