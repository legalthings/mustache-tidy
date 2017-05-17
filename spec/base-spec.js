var tidy = require('../');

describe('Basic html processing', function() {
    it('should not change html without tags', function() {
        var input = `
            <div>
                Data
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe('<div> Data </div>');
    });

    it('should not handle single opening tag', function() {
        var input = `
            <div>
                {{#tag}}
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe('<div> {{#tag}} </div>');
    });

    it('should not handle single closing tag', function() {
        var input = `
            <div>
                {{/tag}}
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe('<div> {{/tag}} </div>');
    });

    it('should correctly handle input edge cases', function() {
        var input = null;
        var result = tidy(input);
        expect(result).toBe(null);

        input = false;
        result = tidy(input);
        expect(result).toBe(null);

        input = true;
        result = tidy(input);
        expect(result).toBe(null);

        input = 0;
        result = tidy(input);
        expect(result).toBe(null);

        input = [];
        result = tidy(input);
        expect(result).toBe(null);

        input = {};
        result = tidy(input);
        expect(result).toBe(null);

        input = '';
        result = tidy(input);
        expect(result).toBe('');

        input = '0';
        result = tidy(input);
        expect(result).toBe('0');

        input = 'data';
        result = tidy(input);
        expect(result).toBe('data');
    });

    it('should correctly handle &nbsp; tags', function() {
        var input = `
            <div>
                {{ foo&nbsp; }}
                <p>
                    <span>Data</span>
                    {{ &nbsp;#bar&nbsp; }}
                    <span>Data</span>
                </p>
                <span>Data</span>
                {{&nbsp;/bar&nbsp;}}
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe(
            '<div>' +
                ' {{ foo&nbsp; }} ' +
                '<p>' +
                    '<span>Data</span>' +
                    ' {{ &nbsp;#bar&nbsp; }} ' +
                    '<span>Data</span>' +
                    '{{&nbsp;/bar&nbsp;}}' +
                '</p>' +
                '{{ &nbsp;#bar&nbsp; }}' +
                '<span>Data</span>' +
                ' {{&nbsp;/bar&nbsp;}} ' +
            '</div>'
        );
    });
});
