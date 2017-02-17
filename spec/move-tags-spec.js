var tidy = require('../');

describe('Moving tags', function() {
    it('should move opening tag up, to parent node of closing tag, and then rise section up from parent node', function() {
        var input = `
            <div>
                <div>
                    <div>
                        <p>{{#tag}}Data</p>
                    </div>
                </div>
                {{/tag}}
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe(
            '{{#tag}}' +
            '<div>' +
                '<div>' +
                    '<div>' +
                        '<p>Data</p>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '{{/tag}}'
        );
    });

    it('should move closing tag up, to parent node of opening tag, and then rise section up from parent node', function() {
        var input = `
            <div>
                {{#tag}}
                <div>
                    <div>
                        <p>Data{{/tag}}</p>
                    </div>
                </div>
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe(
            '{{#tag}}' +
            '<div>' +
                '<div>' +
                    '<div>' +
                        '<p>Data</p>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '{{/tag}}'
        );
    });

    it('should move opening tag up, till data, and then closing tag down, till new parent node of opening', function() {
        var input = `
            <div>
                <div>
                    Data
                    <div>
                        <p>{{#tag}}Data</p>
                    </div>
                </div>
                {{/tag}}
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe(
            '<div>' +
                '<div>' +
                    'Data{{#tag}}' +
                    '<div>' +
                        '<p>Data</p>' +
                    '</div>' +
                    '{{/tag}}' +
                '</div>' +
            '</div>'
        );
    });

    it('should move closing tag up, till data, and then opening tag down, till new parent node of closing', function() {
        var input = `
            <div>
                {{#tag}}
                <div>
                    <div>
                        <p>Data{{/tag}}</p>
                    </div>
                    Data
                </div>
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe(
            '<div>' +
                '<div>' +
                    '{{#tag}}' +
                    '<div>' +
                        '<p>Data</p>' +
                    '</div>' +
                    '{{/tag}}Data' +
                '</div>' +
            '</div>'
        );
    });

    it('should move both tags up to common ancestor node, outside of tag section, and then rise from parent node', function() {
        var input = `
            <div>
                <div>
                    <div>
                        <p>{{#tag}}Data</p>
                    </div>
                </div>
                <div>
                    <div>
                        <p>Data{{/tag}}</p>
                    </div>
                </div>
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe(
            '{{#tag}}' +
            '<div>' +
                '<div>' +
                    '<div>' +
                        '<p>Data</p>' +
                    '</div>' +
                '</div>' +
                '<div>' +
                    '<div>' +
                        '<p>Data</p>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '{{/tag}}'
        );
    });

    it('should move both tags up to common ancestor node, inside tag section', function() {
        var input = `
            <div>
                <div>
                    <div>
                        <p>Data{{#tag}}</p>
                    </div>
                </div>
                Data
                <div>
                    <div>
                        <p>{{/tag}}Data</p>
                    </div>
                </div>
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe(
            '<div>' +
                '<div>' +
                    '<div>' +
                        '<p>Data</p>' +
                    '</div>' +
                '</div>' +
                '{{#tag}}' +
                'Data' +
                '{{/tag}}' +
                '<div>' +
                    '<div>' +
                        '<p>Data</p>' +
                    '</div>' +
                '</div>' +
            '</div>'
        );
    });

    it('should move both tags up to common ancestor node, inside tag section, and then remove tags as empty', function() {
        var input = `
            <div>
                <div>
                    <div>
                        <p>Data{{#tag}}</p>
                    </div>
                </div>
                <div>
                    <div>
                        <p>{{/tag}}Data</p>
                    </div>
                </div>
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe(
            '<div>' +
                '<div>' +
                    '<div>' +
                        '<p>Data</p>' +
                    '</div>' +
                '</div>' +
                '<div>' +
                    '<div>' +
                        '<p>Data</p>' +
                    '</div>' +
                '</div>' +
            '</div>'
        );
    });

    it('should correctly work with replacing empty nodes', function() {
        var input = `
            <p>{{# foo }}</p>
            <p>Data 1</p>
            <p>{{/ foo }} {{^ foo }}</p>
            <p>Data 2</p>
            <p>{{/ foo }}</p>
            <p>{{# bar }}Data 3{{/ bar }}</p>
        `;

        var result = tidy(input);
        expect(result).toBe(
            '{{# foo }}' +
            '<p>Data 1</p>' +
            '{{/ foo }} {{^ foo }}' +
            '<p>Data 2</p>' +
            '{{/ foo }}' +
            '{{# bar }}<p>Data 3</p>{{/ bar }}'
        );
    });
});
