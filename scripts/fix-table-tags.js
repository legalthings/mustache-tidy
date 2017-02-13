
// Set dependencies
var domConfig = require('./dom-config');
var utils = require('./utils');
var debug = require('./debug');

// Module variables
var Node = domConfig.Node;
var log = debug.log;
var tmpTableTags = null;
var tableContainers = {'TABLE': 1, 'THEAD': 1, 'TBODY': 1, 'TR': 1};
var tableCells = {'TD': 1, 'TH': 1};

module.exports = {
    init: init,
    handleTmpTags: handleTmpTags,
    isTmpTag: isTmpTag,
    saveTmpTags: saveTmpTags,
    saveTmpTag: saveTmpTag,
    unmarkTmpTagAfterMove: unmarkTmpTagAfterMove
};

// Init module options
function init(config) {
    debug.init(config);
    utils.init(config);

    tmpTableTags = {fromOpened: [], fromClosed: []};
}

// Turn tmp tags, created in tables outside table cells, into correct tags inside cells
function handleTmpTags() {
    if (!tmpTableTags.fromOpened.length && !tmpTableTags.fromClosed.length) return;

    var fromOpened = tmpTableTags.fromOpened;
    var fromClosed = tmpTableTags.fromClosed;

    // Handle tags created when extending opening tag
    for (var i = 0; i < fromOpened.length - 1; i++) {
        extendTmpTag(fromOpened[i].opened, fromOpened[i].closed);
    }

    if (fromOpened.length) {
        var last = fromOpened[fromOpened.length - 1];
        if (last.closed) {
            extendTmpTag(last.opened, last.closed);
        } else {
            var lastBack = fromClosed.pop();
            extendTmpTag(last.opened, lastBack.closed);
        }
    }

    // Handle tags created when extending closing tag
    for (var i = 0; i < fromClosed.length; i++) {
        extendTmpTag(fromClosed[i].opened, fromClosed[i].closed);
    }

    fromOpened.length = 0;
    fromClosed.length = 0;
}

// Extand tmp table tag to table cells, that are contained inside this tag
function extendTmpTag(openedNode, closedNode) {
    var next = openedNode;
    var j = 0;

    while (true) {
        next = next.nextSibling;
        if (next === closedNode) break;

        processNode(next);
        if (++j === 4) func();
    }

    openedNode.parentElement.removeChild(openedNode);
    closedNode.parentElement.removeChild(closedNode);

    function processNode(node) {
        if (node.nodeType !== Node.ELEMENT_NODE || !node.firstChild) return;

        if (!tableCells[node.nodeName]) {
            for (var i = 0; i < node.childNodes.length; i++) {
                processNode(node.childNodes[i]);
            }

            return;
        }

        node.insertBefore(openedNode.cloneNode(), node.firstChild);
        node.appendChild(closedNode.cloneNode());
    }
}

// Determine if tag node belongs to table nodes area, where we can create only temporary tags
function isTmpTag(data) {
    return !!tableContainers[data.node.parentElement.nodeName];
}

// After moving tags, mark them as tmp, because they are created inside no-tags table area. They would be deleted afterwords
function saveTmpTags(opened, closed) {
    if (isTmpTag(opened)) saveTmpTag('fromOpened', opened.node, null);
    if (isTmpTag(closed)) saveTmpTag('fromClosed', null, closed.node);
}

// When extending tags, mark newly created tags as tmp, because they are created inside no-tags table area. They would be deleted afterwords
function saveTmpTag(group, openedNode, closedNode) {
    tmpTableTags[group].push({
        opened: openedNode,
        closed: closedNode
    });
}

// When moving tag, we could have saved it as tmp tag, without paired tag. If extend is still needed, we unsave it to save again with its paired tag
function unmarkTmpTagAfterMove(tmpGroup) {
    if (tmpTableTags[tmpGroup].length) tmpTableTags[tmpGroup].pop();
}
