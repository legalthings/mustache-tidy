
var isFrontEnd = typeof window !== 'undefined';

// Set dependencies
if (!isFrontEnd) {
    var jsdom = require('jsdom');
    jsdom.defaultDocumentFeatures = {
        FetchExternalResources: false,
        ProcessExternalResources: false
    };

    var jsnode = require('jsdom/lib/jsdom/living/generated/Node.js');

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
