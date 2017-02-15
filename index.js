
// Set dependencies
var domConfig = script('dom-config');
var utils = script('utils');
var debug = script('debug');
var replaceEmptyNode = script('replace-empty-node');
var moveTags = script('move-tags');
var extendTags = script('extend-tags');

// Module variables
var jsdom = domConfig.jsdom;
var Node = domConfig.Node;
var repeatString = utils.repeatString;
var startsWithTag = utils.startsWithTag;
var endsWithTag = utils.endsWithTag;
var log = debug.log;
var regs = {
    spaces: new RegExp('\\s+', 'g'),
    tagName: new RegExp('(?:[^"\']+|"[^"]+"|\'[^\']+\')', 'g'),
    tag: new RegExp('\\{\\{\\s*([#^/])([^}]*)\\}\\}', 'g')
};

module.exports = mustacheTidy;

// Require script
function script(module) {
    return require('./scripts/' + module);
}

// Base lib function
function mustacheTidy(html, options) {
    var doc = null;
    var root = null;

    var notClosed = {};
    var wrongClosed = [];
    var currentOpened = [];
    var tmpTableTags = {fromOpened: [], fromClosed: []};

    for (var i = 0; i < regs.length; i++) {
        regs[i].lastIndex = 0;
    }

    init();
    tidy(root);
    debug.logResult(root);

    return root.lastChild.innerHTML;

    // Init dom tree
    function init() {
        doc = jsdom(html).defaultView.document;
        root = doc.documentElement;

        if (!options) options = {};
        options.doc = doc;

        debug.init(options);
        utils.init(options);
        replaceEmptyNode.init(options);
        moveTags.init(options);
        extendTags.init(options);
    }

    // Launch processing given html source
    function tidy() {
        var level = 0;

        tidyNode(root, level);
    }

    // Perform tidy on single DOM node
    function tidyNode(node, level) {
        if (node.nodeType === Node.TEXT_NODE) return tidyTextNode(node, level);
        if (node.nodeType !== Node.ELEMENT_NODE) return;

        level++;

        // Convert kids collection to non-live array, because we can remove empty text nodes when iterating
        // If we use live collection, in that case we'll not iterate correctly
        var kids = Array.prototype.slice.call(node.childNodes);
        for (var i = 0; i < kids.length; i++) {
            tidyNode(kids[i], level);
        }
    }

    // Perform tidy on single text DOM node
    function tidyTextNode(node, level) {
        node.nodeValue = node.nodeValue.trim();

        // Remove empty text nodes
        if (!node.nodeValue.length && node.parentElement) {
            node.parentElement.removeChild(node);
            return;
        }

        var prev = node.nodeValue;
        regs.tag.lastIndex = 0;

        while (true) {
            // We might have removed previous tag from this text on previous iteration, so we reduce start regexp position
            if (prev.length !== node.nodeValue.length) regs.tag.lastIndex -= prev.length - node.nodeValue.length;
            prev = node.nodeValue;

            var match = regs.tag.exec(node.nodeValue);
            if (!match || (!match[2].length && match[1] !== '/')) break;

            // Remove spaces in tag name, if they are not inside quotes (so not belonging to string literals)
            match[2] = match[2].replace(regs.tagName, function(match) {
                var first = match.substring(0, 1);
                return first !== '"' && first !== "'" ? match.replace(regs.spaces, '') : match;
            });

            match[1] !== '/' ?
                handleOpenedTag(node, match, level) :
                handleClosedTag(node, match, level);
        }
    }

    // Handle opened mustache tag. Just mark it as opened and save basic data
    function handleOpenedTag(node, match, level) {
        var name = match[2];

        // Register tag as opened
        currentOpened.push(name);

        var data = {
            node: node,
            tag: match[0],
            index: match.index,
            level: level,
            openedKey: currentOpened.length - 1
        };

        if (typeof notClosed[name] === 'undefined') notClosed[name] = [];
        notClosed[name].push(data);

        log('opened: ', name);
    }

    // Handle closed mustache tag
    function handleClosedTag(node, match, level) {
        var name = match[2];
        var data = {
            node: node,
            tag: match[0],
            index: match.index,
            level: level
        };

        // Shorthand closed tag is used
        if (!name.length && currentOpened.length) {
            name = currentOpened[currentOpened.length - 1];
        }

        // Register tag as wrong closed (have no opened tag)
        if (typeof notClosed[name] === 'undefined' || !name.length) {
            wrongClosed.push({
                closed: data
            });

            return;
        }

        // Tag is closed, so stop tracking it
        var opened = notClosed[name].pop();
        if (!notClosed[name].length) delete notClosed[name];

        // Register tag as wrong closed (closed not in turn)
        if (name !== currentOpened[currentOpened.length - 1]) {
            log('remove wrong closed "' + name + '" from stack: ', currentOpened[opened.openedKey]);

            currentOpened[opened.openedKey] = null;
            wrongClosed.push({
                opened: opened,
                closed: data
            });
        } else {
            // Tag is closed correctly, so launch tidy for it
            do {
                log('pop last element from opened stack: ', currentOpened[currentOpened.length - 1]);

                currentOpened.pop();
            } while (currentOpened[currentOpened.length - 1] === null);

            log('closed: ', name);

            tidyTag({
                opened: opened,
                closed: data
            });
        }
    }

    // Perform tidy on mustache tag
    function tidyTag(data) {
        log('======= start tidy: ', data.opened.tag, data.closed.tag);

        var opened = data.opened;
        var closed = data.closed;

        if (opened.node !== closed.node) {
            replaceEmptyNode.run(opened, closed, 'opened');
            replaceEmptyNode.run(closed, opened, 'closed');
        }

        if (opened.node === closed.node) {
            replaceEmptyNode.run(opened, closed, 'both');
        }

        // Tag is aready positioned correctly
        if (opened.node.parentElement === closed.node.parentElement) {
            return removeEmptyTag(opened, closed);
        }

        var relation = opened.node.parentElement.compareDocumentPosition(closed.node.parentElement);

        if (relation & Node.DOCUMENT_POSITION_CONTAINS) {

            // Closing tag is in ancestor node of opening tag
            moveTags.handleCaseClosedIsAncestor(opened, closed);
            if (opened.level !== closed.level) extendTags.extendTagForward(opened, closed);

        } else if (relation & Node.DOCUMENT_POSITION_CONTAINED_BY) {

            // Opening tag is in ancestor node of closing tag
            moveTags.handleCaseOpenedIsAncestor(opened, closed);
            if (opened.level !== closed.level) extendTags.extendTagBack(opened, closed);

        } else {

            // Tags are not in ancestor nodes of each other
            moveTags.handleCaseSeparateTrees(opened, closed);
            if (opened.node.parentElement !== closed.node.parentElement) extendTags.extendSeparatedTagParts(opened, closed);
        }

        moveTags.removePlaceholders();
        removeEmptyTag(opened, closed);
    }

    // If tag section holds no data, remove it
    function removeEmptyTag(opened, closed) {
        var text = null;

        log('removing nodes: ', opened, closed, opened.node, closed.node);

        // Tags are in same text node
        if (opened.node === closed.node) {
            text = opened.node.nodeValue;
            var inner = text.substring(opened.index + opened.tag.length, closed.index);
            if (!inner.trim().length) {
                opened.node.nodeValue = text.substring(0, opened.index) + text.substring(closed.index + closed.tag.length);
                opened.node = closed.node = null;
            }

            return;
        }

        var parent = opened.node.parentElement;
        var empty = parent && opened.node.nextSibling === closed.node && endsWithTag(opened) && startsWithTag(closed);
        if (!empty) return;

        // Tags are in different text nodes
        startsWithTag(opened) ?
            parent.removeChild(opened.node) :
            opened.node.nodeValue = opened.node.nodeValue.substring(0, opened.index);

        endsWithTag(closed) ?
            parent.removeChild(closed.node) :
            closed.node.nodeValue = closed.node.nodeValue.substring(closed.index + closed.tag.length);

        opened.node = closed.node = null;
    }
}
