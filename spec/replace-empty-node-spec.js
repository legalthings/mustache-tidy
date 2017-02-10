var tidy = require('../');

describe('Replacing empty dom nodes with containing tags', function() {

    it('should recursively replace nodes for opening tag', function() {
        var input = `
            <div>
                <div>
                    <p>
                        {{#tag}}
                    </p>
                </div>
            </div>
            {{/tag}}
        `;

        var result = tidy(input);
        expect(result).toBe('{{#tag}}{{/tag}}');
    });

    it('should recursively replace nodes for closing tag', function() {
        var input = `
            {{#tag}}
            <div>
                <div>
                    <p>
                        {{/tag}}
                    </p>
                </div>
            </div>
        `;
        var result = tidy(input);
        expect(result).toBe('{{#tag}}{{/tag}}');
    });

    it('should recursively replace nodes for opening and closing tags', function() {
        var input = `
            <div>
                <div>
                    <p>
                        {{#tag}}
                    </p>
                </div>
            </div>
            <div>
                <div>
                    <p>
                        {{/tag}}
                    </p>
                </div>
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe('{{#tag}}{{/tag}}');
    });

    it('should recursively replace both tags nodes and root nodes', function() {
        var input = `
            <div>
                <div>
                    <div>
                        <p>
                            {{#tag}}
                        </p>
                    </div>
                    <div>
                        <p>
                            {{/tag}}
                        </p>
                    </div>
                </div>
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe('{{#tag}}{{/tag}}');
    });

    it('should recursively replace common tags nodes', function() {
        var input = `
            <div>
                <div>
                    <div>
                        <p>
                            {{#tag}} {{/tag}}
                        </p>
                    </div>
                </div>
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe('{{#tag}} {{/tag}}');
    });

    it('should replace tag nodes, if tags data is in separate node', function() {
        var input = `
            <p>{{#tag}}</p>
            <p>Data</p>
            <p>{{/tag}}</p>
        `;

        var result = tidy(input);
        expect(result).toBe('{{#tag}}<p>Data</p>{{/tag}}');
    });

    it('should correctly handle nested nodes', function() {
        var input = `
            <p>{{# foo }}</p>
            <p>Data</p>
            <p>{{# bar }} {{/ bar }}</p>
            <p>Data</p>
            <p>{{/ foo }}</p>
        `;

        var result = tidy(input);
        expect(result).toBe('{{# foo }}<p>Data</p>{{# bar }} {{/ bar }}<p>Data</p>{{/ foo }}');
    });

    it('should not replace single opening tag', function() {
        var input = `
            <div>
                {{#tag}}
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe('<div>{{#tag}}</div>');
    });

    it('should not replace single closing tag node', function() {
        var input = `
            <div>
                {{/tag}}
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe('<div>{{/tag}}</div>');
    });

    it('should not replace nodes for wrongly closing tag', function() {
        var input = `
            <div>
                {{#tag}}
            </div>
            <div>
                {{#tag2}}
            </div>
            <div>
                {{/tag}}
            </div>
            <div>
                {{/tag2}}
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe('<div>{{#tag}}</div>{{#tag2}}<div>{{/tag}}</div>{{/tag2}}');
    });

    it('should not replace opening tag node with data', function() {
        var input = `
            <div>
                Data{{#tag}}
            </div>
            <div>
                {{/tag}}
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe('<div>Data{{#tag}}</div>{{/tag}}');
    });

    it('should not replace closing tag node with data', function() {
        var input = `
            <div>
                {{#tag}}
            </div>
            <div>
                Data{{/tag}}
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe('{{#tag}}<div>Data{{/tag}}</div>');
    });

    it('should not replace root node with data', function() {
        var input = `
            <div>
                <div>
                    <div>
                        {{#tag}}
                    </div>
                    <div>
                        {{/tag}}
                    </div>
                </div>
                Data
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe('<div>{{#tag}}{{/tag}}Data</div>');
    });

    it('should not replace tags node with inner data', function() {
        var input = `
            <div>
                {{#tag}}Data{{/tag}}
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe('<div>{{#tag}}Data{{/tag}}</div>');
    });

    it('should not replace tags node with outer following data', function() {
        var input = `
            <div>
                {{#tag}}{{/tag}}Data
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe('<div>{{#tag}}{{/tag}}Data</div>');
    });

    it('should not replace tags node with outer preciding data', function() {
        var input = `
            <div>
                Data{{#tag}}{{/tag}}
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe('<div>Data{{#tag}}{{/tag}}</div>');
    });

    it('should not replace common tags node with data', function() {
        var input = `
            <div>
                <div>
                    <div>
                        <p>
                            {{#tag}} {{/tag}}
                        </p>
                    </div>
                </div>
                Data
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe('<div>{{#tag}} {{/tag}}Data</div>');
    });

    it('should recursively replace both tags nodes and root nodes, if closing tag has shorthand form', function() {
        var input = `
            <div>
                <div>
                    <div>
                        <p>
                            {{#tag}}
                        </p>
                    </div>
                    <div>
                        <p>
                            {{/}}
                        </p>
                    </div>
                </div>
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe('{{#tag}}{{/}}');
    });

    it('should not replace empty nodes, that do not contain tags', function() {
        var input = `
            <div>
            </div>
            <div>
                <p>
                    {{#tag}}
                </p>
                <p>
                    {{/tag}}
                </p>
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe('<div></div>{{#tag}}{{/tag}}');
    });

    it('should not replace unallowed nodes', function() {
        var input = `
            <a href="#">
                {{#tag}}
            </a>
            <p>
                {{/tag}}
            </p>
        `;

        var result = tidy(input);
        expect(result).toBe('<a href="#">{{#tag}}</a>{{/tag}}');
    });
});
