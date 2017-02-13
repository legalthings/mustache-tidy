var tidy = require('../');

describe('Basic html processing', function() {
    it('should not change html without tags', function() {
        var input = `
            <div>
                Data
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe('<div>Data</div>');
    });

    it('should not change correct tags in same text node', function() {
        var input = `
            <div>
                {{#tag}}Data{{/tag}}
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe('<div>{{#tag}}Data{{/tag}}</div>');
    });

    it('should not change correct tags in different text nodes', function() {
        var input = `
            <div>
                {{#tag}}
                <span>Data</span>
                {{/tag}}
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe('<div>{{#tag}}<span>Data</span>{{/tag}}</div>');
    });

    it('should remove empty tags', function() {
        var input = `
            {{^tag}} {{/tag}}
        `;

        var result = tidy(input);
        expect(result).toBe('');
    });
});
