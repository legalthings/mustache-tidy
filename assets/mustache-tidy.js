var mustacheTidy =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.l = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };

/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};

/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};

/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 10);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {


var env = __webpack_require__(3);

// Set dependencies
if (!env.isFrontEnd) {
    var jsdom = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"jsdom\""); e.code = 'MODULE_NOT_FOUND';; throw e; }()));
    jsdom.defaultDocumentFeatures = {
        FetchExternalResources: false,
        ProcessExternalResources: false
    };

    var jsnode = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"jsdom/lib/jsdom/living/generated/Node.js\""); e.code = 'MODULE_NOT_FOUND';; throw e; }()));

    module.exports = {
        jsdom: jsdom.jsdom,
        Node: jsnode.expose.Window.Node
    }
} else {
    module.exports = {
        jsdom: null,
        Node: Node
    }
}


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {


// Set dependencies
var env = __webpack_require__(3);
var domConfig = __webpack_require__(0);
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


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {


// Set dependencies
var domConfig = __webpack_require__(0);
var debug = __webpack_require__(1);

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


/***/ }),
/* 3 */
/***/ (function(module, exports) {


// Determine if we are in browser or in node.js
module.exports = {
    isFrontEnd: typeof window !== 'undefined'
}


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {


// Set dependencies
var domConfig = __webpack_require__(0);
var utils = __webpack_require__(2);
var debug = __webpack_require__(1);

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
// If tags are created in tables outside table cells, mark tags as temporary
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
// If tags are created in tables outside table cells, mark tags as temporary
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


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {


// Set dependencies
var domConfig = __webpack_require__(0);
var utils = __webpack_require__(2);
var debug = __webpack_require__(1);

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


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {


// Set dependencies
var domConfig = __webpack_require__(0);
var utils = __webpack_require__(2);
var debug = __webpack_require__(1);

// Module variables
var Node = domConfig.Node;
var updateTextNodeData = utils.updateTextNodeData;
var startsWithTag = utils.startsWithTag;
var endsWithTag = utils.endsWithTag;
var repeatString = utils.repeatString;
var log = debug.log;
var root = null;
var tags = [];
var tagsByLevel = {};
var clearSpaces = [];
var spacesReg = null;

module.exports = {
    init: init,
    run: run
};

// Init module options
function init(config) {
    debug.init(config);
    utils.init(config);

    root = config.root;
    spacesReg = config.regs.spaces;
    tagsByLevel = {};
    clearSpaces = [];
}

// Perform improve on already fixed tags: push out from containing nodes and merging same tags sections
function run(improveTags) {
    tags = improveTags;

    for (var i = 0; i < tags.length; i++) {
        var tag = tags[i];
        log('-- improve tag: ', tag);

        // Section was removed or is not closed
        if (!tag.opened.node || !tag.closed) continue;

        var prevSame = getPrevSameTag(tag);
        if (prevSame) {
            // Tag is merged with previous same tag, and then we perform improve on result tag
            var newIdx = mergeTags(tag, prevSame);
            i = newIdx - 1;
            continue;
        }

        // Tag was moved up to another level. Repeat cycle for it again
        if (riseTag(tag)) i--;
    }

    // When merging tags sections, we replaced sibling tags with spaces. Now we remove those spaces
    for (var i = 0; i < clearSpaces.length; i++) {
        if (!clearSpaces[i]) continue;

        var node = clearSpaces[i];
        var text = node.nodeValue;

        text = text.replace(spacesReg, ' ').trim();
        if (node.startsWithSpace) text = ' ' + text;
        if (node.endsWithSpace) text = text + ' ';

        node.nodeValue = text;
    }
}

// Find previous sibling tag with same name for current tag
function getPrevSameTag(tag) {
    var levelTags = tagsByLevel[tag.opened.level];
    if (!levelTags || !levelTags.length) return null;

    var idx = levelTags.length - 1;

    // Get previous sibling tag on that level
    do {
        var prev = levelTags[idx];
        idx--;
    } while ((!prev.opened.node || prev === tag) && idx >= 0);

    // Check if it has same name as current tag
    var isSame = prev.opened.node && prev.opened.name === tag.opened.name && prev.opened.type === tag.opened.type;
    if (!isSame) return null;

    // Check if there is no data between tags
    var canMerge = false;
    if (tag.opened.node.previousSibling === prev.closed.node) {
        canMerge = startsWithTag(tag.opened) && endsWithTag(prev.closed);
    } else if (tag.opened.node === prev.closed.node) {
        var prevClosed = prev.closed.node.nodeValue.substring(prev.closed.index, tag.opened.index);
        canMerge = prevClosed.trim().length === prev.closed.tag.length;
    }

    return canMerge ? prev : null;
}

// Merge tag with it's previous same name sibling
function mergeTags(tag, prev) {
    log('-- merge with:', prev);

    startsWithTag(tag.opened) && endsWithTag(tag.opened) ?
        tag.opened.node.parentElement.removeChild(tag.opened.node) :
        cutNode(tag.opened, true);

    startsWithTag(prev.closed) && endsWithTag(prev.closed) ?
        prev.closed.node.parentElement.removeChild(prev.closed.node) :
        cutNode(prev.closed, true);

    for (var name in tag.closed) {
        prev.closed[name] = tag.closed[name];
    }

    tag.opened.node = null;
    tag.closed.node = null;

    return prev.opened.improveKey;
}

// Rise tag up from it's containing node, if all node's data is inside this tag
function riseTag(tag) {
    var level = tag.opened.level;

    while (canRise(tag)) {
        rise(tag);
    }

    var newLevel = tag.opened.level;
    var rised = level !== newLevel;
    if (!tagsByLevel[newLevel]) tagsByLevel[newLevel] = [];

    if (rised) {
        // Mark that tag was removed from level
        var oldLevelTags = tagsByLevel[level];
        if (oldLevelTags && oldLevelTags.length) {
            var last = oldLevelTags[oldLevelTags.length - 1];
            if (last === tag) oldLevelTags.pop();
        }

        // Mark that tag was added to new level
        tagsByLevel[newLevel].push(tag);
    } else {
        // Add tag to it's current level, if it is processed first time
        var length = tagsByLevel[level].length;
        var last = length ? tagsByLevel[level][length - 1] : null;
        if (!last || last !== tag) tagsByLevel[level].push(tag);
    }

    return rised;
}

// Perform rise
function rise(tag) {
    var opened = tag.opened;
    var closed = tag.closed;
    var parent = opened.node.parentElement;
    var newParent = parent.parentElement;

    // Rise opened tag
    if (!endsWithTag(opened)) cutNode(opened);
    newParent.insertBefore(opened.node, parent);

    // Rise closed tag
    if (!startsWithTag(closed)) cutNode(closed);
    parent.nextSibling ?
        newParent.insertBefore(closed.node, parent.nextSibling) :
        newParent.appendChild(closed.node);

    opened.level--;
    closed.level--;
}

// Determine if we need to rise tag section up from it's parent node
function canRise(tag) {
    var opened = tag.opened;
    var closed = tag.closed;
    var parent = opened.node.parentElement;

    return parent &&
        parent !== root &&
        parent.parentElement &&
        startsWithTag(opened) &&
        endsWithTag(closed) &&
        !opened.node.previousSibling &&
        !closed.node.nextSibling;
}

// Cut tag from it's containing text node, if this text node contains another text
// Tag is replaced by spaces, to not mess with indexes of other possible tags in text
function cutNode(data, remove) {
    var node = data.node;
    var text = node.nodeValue;

    if (typeof node.startsWithSpace === 'undefined') {
        node.startsWithSpace = !text.substring(0, 1).trim().length;
    }

    if (typeof node.endsWithSpace === 'undefined') {
        node.endsWithSpace = !text.substr(-1).trim().length;
    }

    node.nodeValue = text.substring(0, data.index) + repeatString(' ', data.tag.length) + text.substring(data.index + data.tag.length);
    clearSpaces.push(data.node);

    if (!remove) updateTextNodeData(data);
}


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {


// Set dependencies
var domConfig = __webpack_require__(0);
var utils = __webpack_require__(2);
var debug = __webpack_require__(1);

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


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {


// Set dependencies
var domConfig = __webpack_require__(0);
var debug = __webpack_require__(1);

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


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

var map = {
	"./debug": 1,
	"./debug.js": 1,
	"./dom-config": 0,
	"./dom-config.js": 0,
	"./env": 3,
	"./env.js": 3,
	"./extend-tags": 4,
	"./extend-tags.js": 4,
	"./fix-table-tags": 5,
	"./fix-table-tags.js": 5,
	"./improve-tags": 6,
	"./improve-tags.js": 6,
	"./move-tags": 7,
	"./move-tags.js": 7,
	"./replace-empty-node": 8,
	"./replace-empty-node.js": 8,
	"./utils": 2,
	"./utils.js": 2
};
function webpackContext(req) {
	return __webpack_require__(webpackContextResolve(req));
};
function webpackContextResolve(req) {
	var id = map[req];
	if(!(id + 1)) // check for number
		throw new Error("Cannot find module '" + req + "'.");
	return id;
};
webpackContext.keys = function webpackContextKeys() {
	return Object.keys(map);
};
webpackContext.resolve = webpackContextResolve;
module.exports = webpackContext;
webpackContext.id = 9;


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {


// Set dependencies
var domConfig = script('dom-config');
var utils = script('utils');
var debug = script('debug');
var env = script('env');
var replaceEmptyNode = script('replace-empty-node');
var moveTags = script('move-tags');
var extendTags = script('extend-tags');
var fixTableTags = script('fix-table-tags');
var improveTags = script('improve-tags');

// Module variables
var jsdom = domConfig.jsdom;
var Node = domConfig.Node;
var repeatString = utils.repeatString;
var startsWithTag = utils.startsWithTag;
var endsWithTag = utils.endsWithTag;
var log = debug.log;

//'startSpaces' and 'endSpaces' also match \u00a0, that is a representation of &nbsp; in textNode.nodeValue
var regs = {
    spaces: new RegExp('\\s+', 'g'),
    startSpaces: new RegExp('^\\s+'),
    endSpaces: new RegExp('\\s+$'),
    tagName: new RegExp('(?:[^"\']+|"[^"]+"|\'[^\']+\')', 'g'),
    tag: new RegExp('\\{\\{\\s*([#^/])([^}]*)\\}\\}', 'g')
};

module.exports = mustacheTidy;

// Require script
function script(module) {
    return __webpack_require__(9)("./" + module);
}

// Base lib function
function mustacheTidy(html, options) {
    if (typeof html !== 'string' && !(html instanceof Node)) return null;

    var doc = null;
    var root = null;
    var returnResult = false;

    var step;
    var improve;
    var notClosed;
    var wrongClosed;
    var currentOpened;

    initDom();
    initVars('1:tidy');
    tidy();
    if (root instanceof Node) root.normalize();

    initVars('2:improve');
    tidy();
    improveTags.run(improve);

    initVars('3:fix-tables');
    tidy();

    debug.hideInvalidTags(notClosed, wrongClosed);
    debug.logResult(root);

    return returnResult ? root.innerHTML : null;

    // Init variables and modules
    function initVars(doStep) {
        for (var i = 0; i < regs.length; i++) {
            regs[i].lastIndex = 0;
        }

        step = doStep;
        improve = [];
        notClosed = {};
        wrongClosed = [];
        currentOpened = [];

        debug.init(options);
        utils.init(options);
        replaceEmptyNode.init(options);
        moveTags.init(options);
        extendTags.init(options);
        fixTableTags.init(options);
        improveTags.init(options);
    }

    // Init dom tree
    function initDom() {
        if (env.isFrontEnd) {
            // On front-end input can be either string or DOM Node
            doc = document;

            if (typeof html === 'string') {
                returnResult = true;
                root = document.createElement('div');
                root.innerHTML = html;
            } else {
                root = html;
            }
        } else {
            // In node.js we expect only string input
            doc = jsdom(html).defaultView.document;
            root = doc.documentElement.lastChild;
            returnResult = true;
        }

        if (!options) options = {};
        options.doc = doc;
        options.root = root;
        options.regs = regs;
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
        node.nodeValue = smartTrim(node.nodeValue);

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
        var data = {
            name: name,
            type: match[1],
            tag: match[0],
            node: node,
            index: match.index,
            level: level,
            openedKey: currentOpened.length
        };

        // Register tag as opened
        if (typeof notClosed[name] === 'undefined') notClosed[name] = [];
        if (step === '2:improve') {
            data.improveKey = improve.length;
            improve.push({opened: data});
        }
        notClosed[name].push(data);
        currentOpened.push(name);

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

            if (step === '1:tidy') {
                tidyTag({opened: opened, closed: data});
            } else if (step === '2:improve') {
                improve[opened.improveKey].closed = data;
            } else if (step === '3:fix-tables') {
                fixTableTags.run({opened: opened, closed: data});
            }
        }
    }

    // Perform tidy on mustache tag section
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

        if (opened.node.parentElement !== closed.node.parentElement) {
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
        }

        moveTags.removePlaceholders();
        removeEmptyTag(opened, closed);
    }

    // If tag section holds no data, remove it
    function removeEmptyTag(opened, closed) {
        var text = null;

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

    // Trim text, leaving single start and ending spaces
    function smartTrim(text) {
        var hasStartSpace = !!regs.startSpaces.exec(text);
        var hasEndSpace = !!regs.endSpaces.exec(text);

        text = text.trim();
        if (!text.length) return '';

        if (hasStartSpace) text = ' ' + text;
        if (hasEndSpace) text = text + ' ';

        return text;
    }
}


/***/ })
/******/ ]);