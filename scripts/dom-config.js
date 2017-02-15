
// Set dependencies
var jsdom = require('jsdom');
jsdom.defaultDocumentFeatures = {
    FetchExternalResources: false,
    ProcessExternalResources: false
};

var Node = require('jsdom/lib/jsdom/living/generated/Node.js');

module.exports = {
    jsdom: jsdom.jsdom,
    Node: Node.expose.Window.Node
}
