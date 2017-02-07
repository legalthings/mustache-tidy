// Config
+function() {
    var isBackend = typeof window === 'undefined' && typeof module !== 'undefined' && module.exports ? true : false;

    // Static variables
    mustacheTidy.isBackend = isBackend;
    mustacheTidy.replacableEmptyNodes = {'P': 1, 'DIV': 1, 'SPAN': 1, 'I': 1, 'EM': 1, 'STRONG': 1, 'LI': 1};
    mustacheTidy.tableContainers = {'TABLE': 1, 'THEAD': 1, 'TBODY': 1, 'TR': 1};
    mustacheTidy.tableCells = {'TD': 1, 'TH': 1};
    mustacheTidy.regs = {
        spaces: new RegExp('\\s+', 'g'),
        tagName: new RegExp('(?:[^"\']+|"[^"]+"|\'[^\']+\')', 'g'),
        tag: new RegExp('\\{\\{\\s*([#^/])([^}]*)\\}\\}', 'g')
    };

    if (!isBackend) return;

    // Set node.js dependencies
    var jsdom = require('jsdom');
    jsdom.defaultDocumentFeatures = {
        FetchExternalResources: false,
        ProcessExternalResources: false
    };

    var path = require('path');
    var root = process.cwd();
    var Node = require(path.resolve(root, 'node_modules/jsdom/lib/jsdom/living/generated/Node.js'));
    Node = Node.expose.Window.Node;

    mustacheTidy.Node = Node;
    mustacheTidy.jsdom = jsdom.jsdom;
    module.exports.mustacheTidy = mustacheTidy;
}();

// Base lib function
function mustacheTidy(html, debug) {
    var doc = null;
    var root = null;
    var Node = null;
    var returnResult = false;

    var notClosed = {};
    var wrongClosed = [];
    var currentOpened = [];
    var nodesWithPlaceholders = [];
    var tmpTableTags = {fromOpened: [], fromClosed: []};

    for (var i = 0; i < mustacheTidy.regs.length; i++) {
        mustacheTidy.regs[i].lastIndex = 0;
    };

    initDom();
    tidy(root);
    logResult(root);

    if (returnResult) {
        return mustacheTidy.isBackend ? root.lastChild.innerHTML : root.innerHTML;
    }

    return null;

    // Init dom tree depending on environment (node.js or browser)
    function initDom() {
        if (mustacheTidy.isBackend) {
            // In node.js we expect only string input
            doc = mustacheTidy.jsdom(html).defaultView.document;
            root = doc.documentElement;
            Node = mustacheTidy.Node;
            returnResult = true;
        } else {
            // On front-end input can be either string or DOM Node
            doc = document;
            Node = window.Node;

            if (typeof html === 'string') {
                returnResult = true;
                root = document.createElement('div');
                root.innerHTML = html;
            } else if (html instanceof Node) {
                root = html;
            } else {
                throw 'You should pass either a string with text/html to mustache-tidy, or DOM node, containing target html';
            }
        }
    }

    // Launch processing given html source
    function tidy() {
        var level = 0;

        tidyNode(root, level);
        hideInvalidTags();
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
        var regs = mustacheTidy.regs;
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

    // Handle opened mustache tag
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

        // Replace empty node with tag
        if (opened.node === closed.node) {
            log('single node, tidy not needed');
            return replaceEmptyNode(opened, closed);
        } else {
            replaceEmptyNode(opened);
            replaceEmptyNode(closed);
        }

        // Tag is aready positioned correctly
        if (opened.node.parentElement === closed.node.parentElement) return;

        var relation = opened.node.parentElement.compareDocumentPosition(closed.node.parentElement);

        if (relation & Node.DOCUMENT_POSITION_CONTAINS) {
            // Closing tag is in ancestor node of opening tag

            log('opened tag is contained inside closed');

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

            if (isTmpTag(opened.node)) saveTmpTag('fromOpened', opened.node, null);
            if (isTmpTag(closed.node)) saveTmpTag('fromClosed', null, closed.node);

            // If tag parts are still not on same level
            if (opened.level !== closed.level) {
                log('-------------- extend tag');
                extendTagForward(opened, closed);
            }
        } else if (relation & Node.DOCUMENT_POSITION_CONTAINED_BY) {
            // Opening tag is in ancestor node of closing tag

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

            if (isTmpTag(opened.node)) saveTmpTag('fromOpened', opened.node, null);
            if (isTmpTag(closed.node)) saveTmpTag('fromClosed', null, closed.node);

            // If tag parts are still not on same level
            if (opened.level !== closed.level) {
                log('-------------- extend tag');
                extendTagBack(opened, closed);
            }
        } else {
            // Opening and closing tags are not in parent nodes of each other
            // In here we first try to move tags to level of each other, and than - to common parent node
            // For this we pass additional parameter to 'moveTagUp...' functions

            log('opening and closing tags are not in parent nodes of each other');

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

            if (isTmpTag(opened.node)) saveTmpTag('fromOpened', opened.node, null);
            if (isTmpTag(closed.node)) saveTmpTag('fromClosed', null, closed.node);

            // Tags were not moved to common parent element, so we should extend them
            if (opened.node.parentElement !== closed.node.parentElement) {
                log('-------------- tags did not reach common parent element');
                extendSeparatedTagParts(opened, closed);
            }
        }

        handleTmpTags();
        removePlaceholders();
    }

    // Extend tag, if it's parts are in separate node trees
    function extendSeparatedTagParts(opened, closed) {
        var relation = opened.node.parentElement.compareDocumentPosition(closed.node.parentElement);
        var top = {};

        if (relation & Node.DOCUMENT_POSITION_CONTAINS) {
            log('-------------- extend tag forward');
            extendTagForward(opened, closed, top);
            removeEmptyTopTag(top.node, top.node.nextSibling, closed.tag);
        } else if (relation & Node.DOCUMENT_POSITION_CONTAINED_BY) {
            log('-------------- extend tag back');
            extendTagBack(opened, closed, top);
            removeEmptyTopTag(top.node, top.node.previousSibling, opened.tag);
        } else {
            // Tags are still in different node trees, so we extend both of them towards each other, to reach a common parent element

            if (opened.level >= closed.level) {
                log('-------------- extend tag both ways starting from closed');
                extendTagBack(opened, closed, top);
                log('------ extend forward');
                extendTagForward(opened, top);
                removeEmptyTopTag(top.node, top.node.previousSibling, opened.tag);
            } else {
                log('-------------- extend tag both ways starting from opened');
                extendTagForward(opened, closed, top);
                log('------ extend back');
                extendTagBack(top, closed);
                removeEmptyTopTag(top.node, top.node.nextSibling, closed.tag);
            }
        }
    }

    // After extending tag from separate node trees, remove possible empty node in common parent
    function removeEmptyTopTag(tagNode, tagSiblingNode, pairedTag) {
        var empty = tagSiblingNode && tagSiblingNode.nodeType === Node.TEXT_NODE && tagSiblingNode.nodeValue === pairedTag;
        if (!empty) return;

        tagNode.parentElement.removeChild(tagSiblingNode);
        tagNode.parentElement.removeChild(tagNode);

        // If empty top tags were marked as tmp, also remove this mark
        var tmpOpened = tmpTableTags.fromOpened;
        var tmpClosed = tmpTableTags.fromClosed;
        if (!tmpOpened.length || tmpOpened.closed) return;

        tmpOpened.pop();
        tmpClosed.pop();
    }

    // Correctly surround by tag all data that's nested inside it, to avoid partial nodes removal.
    // Moving up the node tree, from opened to closed
    function extendTagForward(opened, closed, topTag) {
        var tmpGroup = 'fromOpened';
        var level = opened.level;
        var parent = opened.node;
        var created = {opened: opened.node, closed: null};

        if (opened.node.nextSibling || !endsWithTag(opened)) {
            created.closed = createTextNode(closed.tag);
            opened.node.parentElement.appendChild(created.closed);
        }

        // Tag was marked as tmp on "move up/down" stage. Unmark, because we'll mark it again with it's completing tag
        if (tmpTableTags[tmpGroup].length) tmpTableTags[tmpGroup].pop();

        while (true) {
            level--;
            parent = parent.parentElement;

            if (!parent.nextSibling) continue;
            if (isTmpTag(created.opened)) saveTmpTag(tmpGroup, created.opened, created.closed);

            created.opened = createTextNode(opened.tag);
            parent.parentElement.insertBefore(created.opened, parent.nextSibling);
            if (topTag ? parent.parentElement.contains(closed.node) : level <= closed.level) break;

            created.closed = createTextNode(closed.tag);
            parent.parentElement.appendChild(created.closed);
        }

        // Save data of top created tag
        if (topTag) saveTopTag(topTag, created.opened, level, opened.tag);
        if (isTmpTag(created.opened)) saveTmpTag(tmpGroup, created.opened, null);
    }

    // Correctly surround by tag all data that's nested inside it, to avoid partial nodes removal.
    // Moving up the node tree, from closed to opened
    function extendTagBack(opened, closed, topTag) {
        var tmpGroup = 'fromClosed';
        var level = closed.level;
        var parent = closed.node.parentElement;
        var created = {opened: null, closed: closed.node};

        if (closed.node.previousSibling || !startsWithTag(closed)) {
            created.opened = createTextNode(opened.tag);
            parent.insertBefore(created.opened, parent.firstChild);
        }

        // Tag was marked as tmp on "move up/down" stage. Unmark, because we'll mark it again with it's completing tag
        if (tmpTableTags[tmpGroup].length) tmpTableTags[tmpGroup].pop();

        parent = closed.node;

        while (true) {
            level--;
            parent = parent.parentElement;

            if (!parent.previousSibling) continue;
            if (isTmpTag(created.closed)) saveTmpTag(tmpGroup, created.opened, created.closed);

            created.closed = createTextNode(closed.tag);
            parent.parentElement.insertBefore(created.closed, parent);
            if (topTag ? parent.parentElement.contains(opened.node) : level <= opened.level) break;

            created.opened = createTextNode(opened.tag);
            parent.parentElement.insertBefore(created.opened, parent.parentElement.firstChild);
        }

        // Save data of top created tag
        if (topTag) saveTopTag(topTag, created.closed, level, closed.tag);
        if (isTmpTag(created.closed)) saveTmpTag(tmpGroup, null, created.closed);
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

            if (!mustacheTidy.tableCells[node.nodeName]) {
                for (var i = 0; i < node.childNodes.length; i++) {
                    processNode(node.childNodes[i]);
                }

                return;
            }

            node.insertBefore(openedNode.cloneNode(), node.firstChild);
            node.appendChild(closedNode.cloneNode());
        }
    }

    // Determine if node belongs to table nodes area, where we can create only temporary tags
    function isTmpTag(node) {
        return !!mustacheTidy.tableContainers[node.parentElement.nodeName];
    }

    // Mark newly created tags as tmp, because they are created inside no-tags table area. They would be deleted afterwords
    function saveTmpTag(group, opened, closed) {
        tmpTableTags[group].push({
            opened: opened,
            closed: closed
        });
    }

    // Create text node with data based on existing tag node
    function updateTextNodeData(data) {
        data.index = 0;
        data.node = createTextNode(data.tag);
    }

    // Create text node
    function createTextNode(text) {
        return doc.createTextNode(text);
    }

    // Save data of top created tag, when extending tags that does not share common parent element
    function saveTopTag(data, node, level, tag) {
        data.index = 0;
        data.node = node;
        data.level = level;
        data.tag = tag;
    }

    // Replace moved tag with placeholder, to not change text node content length
    function replaceMovedTag(data) {
        var text = data.node.nodeValue;
        var size = data.tag.length;
        var placeholder = '{#' + repeatString('_', size - 4) + '#}';

        data.node.nodeValue = text.substring(0, data.index) + placeholder + text.substring(data.index + size);
        nodesWithPlaceholders.push({node: data.node, placeholder: placeholder});
    }

    // Remove placeholders after moving tags
    function removePlaceholders() {
        var data = null;
        while (data = nodesWithPlaceholders.pop()) {
            data.node.nodeValue = data.node.nodeValue.replace(data.placeholder, '');
        }
    }

    // Replace parent node with tag, if tag is empty and node does not contain other data
    function replaceEmptyNode(data, coupleData) {
        var node = data.node;
        var parent = node.parentElement;
        var tagText = coupleData ? data.tag + coupleData.tag : data.tag;

        // Simple check
        var skip =
            !parent ||
            parent === root ||
            !parent.parentElement ||
            parent.childNodes.length > 1 ||
            !mustacheTidy.replacableEmptyNodes[parent.nodeName];

        if (skip) return;

        var empty = tagText === node.nodeValue;

        // Check if inner tag content contains only spaces
        if (!empty) {
            var text = node.nodeValue;
            var inner = text.substring(0, data.index);
            inner += coupleData ?
                text.substring(data.index + data.tag.length, coupleData.index) + text.substring(coupleData.index + coupleData.tag.length) :
                text.substring(data.index + data.tag.length);

            empty = !inner.trim().length;
        }

        if (!empty) return;

        parent.parentElement.replaceChild(node, parent);
        data.level--;

        // There are element nodes in new parent, so it's definitely not empty. Stop processing
        if (node.parentElement.children.length) return;

        // Join moved node with possible sibling empty text nodes in new parent element, and them trim them
        node.parentElement.normalize();
        node.nodeValue = node.nodeValue.trim();
        replaceEmptyNode(data, coupleData);
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

    // Repeat some string 'count' times
    function repeatString(string, count) {
        return Array(count*1 + 1).join(string);
    }

    //================ Debug functions =================//
    //==================================================//

    // Replace not closed or wrongly closed tags with placeholders
    function hideInvalidTags() {
        if (!debug) return;

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

    // Logging
    function log() {
        if (!debug) return;

        console.log.apply(console, arguments);
    }

    // Log whole processed document
    function logResult(root) {
        if (!debug) return;
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
}
