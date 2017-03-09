
// Set dependencies
var domConfig = require('./dom-config');
var utils = require('./utils');
var debug = require('./debug');

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

        clearSpaces[i].nodeValue = clearSpaces[i].nodeValue.replace(spacesReg, ' ').trim();
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
// Tag is replaced by whitespaces, to not mess with indexes of other possible tags in text
function cutNode(data, remove) {
    var text = data.node.nodeValue;
    data.node.nodeValue = text.substring(0, data.index) + repeatString(' ', data.tag.length) + text.substring(data.index + data.tag.length);
    clearSpaces.push(data.node);
    if (!remove) updateTextNodeData(data);
}
