var tidy = require('../');

describe('Replacing empty dom nodes with containing tags', function() {

    it('should remove empty tag', function() {
        var input = `
            {{^tag}} {{/tag}}
        `;

        var result = tidy(input);
        expect(result).toBe('');
    });

    it('should recursively replace nodes for opening tag', function() {
        var input = `
            <div>
                <div>
                    <p>
                        {{#tag}}
                    </p>
                </div>
            </div>
            Data{{/tag}}
        `;

        var result = tidy(input);
        expect(result).toBe('{{#tag}}Data{{/tag}}');
    });

    it('should recursively replace nodes for closing tag', function() {
        var input = `
            {{#tag}}Data
            <div>
                <div>
                    <p>
                        {{/tag}}
                    </p>
                </div>
            </div>
        `;
        var result = tidy(input);
        expect(result).toBe('{{#tag}}Data{{/tag}}');
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
            Data
            <div>
                <div>
                    <p>
                        {{/tag}}
                    </p>
                </div>
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe('{{#tag}}Data{{/tag}}');
    });

    it('should recursively replace nodes for opening tag, and then remove tags as empty', function() {
        var input = `
            Data
            <div>
                <div>
                    <p>
                        {{#tag}}
                    </p>
                </div>
            </div>
            {{/tag}} Data
        `;

        var result = tidy(input);
        expect(result).toBe('Data Data');
    });

    it('should recursively replace nodes for closing tag, and then remove tags as empty', function() {
        var input = `
            Data {{#tag}}
            <div>
                <div>
                    <p>
                        {{/tag}}
                    </p>
                </div>
            </div>
            Data
        `;
        var result = tidy(input);
        expect(result).toBe('Data Data');
    });

    it('should recursively replace nodes for opening and closing tags, and then remove tags as empty', function() {
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
        expect(result).toBe('');
    });

    it('should recursively replace both tags nodes, untill common ancestor node, and then rise tag up', function() {
        var input = `
            <div>
                <div>
                    <p>
                        {{#tag}}
                    </p>
                </div>
                Data
                <div>
                    <p>
                        {{/tag}}
                    </p>
                </div>
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe('{{#tag}}<div>Data</div>{{/tag}}');
    });

    it('should recursively replace both tags nodes and root nodes, and then remove tags as empty', function() {
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
        expect(result).toBe('');
    });

    it('should recursively replace common tags nodes without data, and then remove tags as empty', function() {
        var input = `
            <div>
                Data
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
        expect(result).toBe('<div>Data</div>');
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
        expect(result).toBe('{{# foo }}<p>Data</p><p>Data</p>{{/ foo }}');
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
                {{#tag}}Data
            </div>
            <div>
                {{/tag}}
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe('{{#tag}}<div>Data</div>{{/tag}}');
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
        expect(result).toBe('{{#tag}}<div>Data</div>{{/tag}}');
    });

    it('should not replace tags node with outer following data, but should remove tags as empty', function() {
        var input = `
            <div>
                {{#tag}}{{/tag}}Data
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe('<div>Data</div>');
    });

    it('should not replace tags node with outer preciding data, but should remove tags as empty', function() {
        var input = `
            <div>
                Data{{#tag}}{{/tag}}
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe('<div>Data</div>');
    });

    it('should recursively replace both tags nodes and root nodes untill common ancestor, if closing tag has shorthand form', function() {
        var input = `
            <div>
                <div>
                    <p>
                        {{#tag}}
                    </p>
                </div>
                Data
                <div>
                    <p>
                        {{/}}
                    </p>
                </div>
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe('{{#tag}}<div>Data</div>{{/}}');
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
        expect(result).toBe('<div></div>');
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
        expect(result).toBe('{{#tag}}<a href="#"></a>{{/tag}}');
    });
});
