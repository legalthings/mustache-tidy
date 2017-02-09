
// Set dependencies
var jsdom = require('jsdom');
jsdom.defaultDocumentFeatures = {
    FetchExternalResources: false,
    ProcessExternalResources: false
};

var Node = require('../node_modules/jsdom/lib/jsdom/living/generated/Node.js');

module.exports = {
    jsdom: jsdom.jsdom,
    Node: Node.expose.Window.Node,
    repeatString: repeatString
}

// Repeat some string 'count' times
function repeatString(string, count) {
    return Array(count*1 + 1).join(string);
}
