var tidy = require('../');

describe('Extending tags', function() {
    it('should extend opening tag up, to parent node of closing tag', function() {
        var input = `
            <div>
                <div>
                    <div>
                        <div>
                            Data{{#tag}}Data
                        </div>
                        <span>Data</span>
                        <span>Data</span>
                    </div>
                    <span>Data</span>
                    <span>Data</span>
                </div>
                <span>Data</span>
                <span>Data</span>
                {{/tag}}
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe(
            '<div>' +
                '<div>' +
                    '<div>' +
                        '<div>' +
                            'Data{{#tag}}Data' +
                            '{{/tag}}' +
                        '</div>' +
                        '{{#tag}}' +
                        '<span>Data</span>' +
                        '<span>Data</span>' +
                        '{{/tag}}' +
                    '</div>' +
                    '{{#tag}}' +
                    '<span>Data</span>' +
                    '<span>Data</span>' +
                    '{{/tag}}' +
                '</div>' +
                '{{#tag}}' +
                '<span>Data</span>' +
                '<span>Data</span>' +
                '{{/tag}}' +
            '</div>'
        );
    });

    it('should extend closing tag up, to parent node of opening tag', function() {
        var input = `
            <div>
                {{#tag}}
                <span>Data</span>
                <span>Data</span>
                <div>
                    <span>Data</span>
                    <span>Data</span>
                    <div>
                        <span>Data</span>
                        <span>Data</span>
                        <div>
                            Data{{/tag}}Data
                        </div>
                    </div>
                </div>
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe(
            '<div>' +
                '{{#tag}}' +
                '<span>Data</span>' +
                '<span>Data</span>' +
                '{{/tag}}' +
                '<div>' +
                    '{{#tag}}' +
                    '<span>Data</span>' +
                    '<span>Data</span>' +
                    '{{/tag}}' +
                    '<div>' +
                        '{{#tag}}' +
                        '<span>Data</span>' +
                        '<span>Data</span>' +
                        '{{/tag}}' +
                        '<div>' +
                            '{{#tag}}' +
                            'Data{{/tag}}Data' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>'
        );
    });

    it('should extend both tags up, to common ancestor', function() {
        var input = `
            <div>
                <div>
                    <div>
                        <div>
                            Data{{#tag}}Data
                        </div>
                        <span>Data</span>
                        <span>Data</span>
                    </div>
                    <span>Data</span>
                    <span>Data</span>
                </div>
                <span>Data</span>
                <span>Data</span>
                <div>
                    <span>Data</span>
                    <span>Data</span>
                    <div>
                        <span>Data</span>
                        <span>Data</span>
                        <div>
                            Data{{/tag}}Data
                        </div>
                    </div>
                </div>
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe(
            '<div>' +
                '<div>' +
                    '<div>' +
                        '<div>' +
                            'Data{{#tag}}Data' +
                            '{{/tag}}' +
                        '</div>' +
                        '{{#tag}}' +
                        '<span>Data</span>' +
                        '<span>Data</span>' +
                        '{{/tag}}' +
                    '</div>' +
                    '{{#tag}}' +
                    '<span>Data</span>' +
                    '<span>Data</span>' +
                    '{{/tag}}' +
                '</div>' +
                '{{#tag}}' +
                '<span>Data</span>' +
                '<span>Data</span>' +
                '{{/tag}}' +
                '<div>' +
                    '{{#tag}}' +
                    '<span>Data</span>' +
                    '<span>Data</span>' +
                    '{{/tag}}' +
                    '<div>' +
                        '{{#tag}}' +
                        '<span>Data</span>' +
                        '<span>Data</span>' +
                        '{{/tag}}' +
                        '<div>' +
                            '{{#tag}}' +
                            'Data{{/tag}}Data' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>'
        );
    });

    it('should extend both tags up, to common ancestor, and then remove top empty tag', function() {
        var input = `
            <div>
                <div>
                    <div>
                        <div>
                            Data{{#tag}}Data
                        </div>
                        <span>Data</span>
                        <span>Data</span>
                    </div>
                    <span>Data</span>
                    <span>Data</span>
                </div>
                <div>
                    <span>Data</span>
                    <span>Data</span>
                    <div>
                        <span>Data</span>
                        <span>Data</span>
                        <div>
                            Data{{/tag}}Data
                        </div>
                    </div>
                </div>
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe(
            '<div>' +
                '<div>' +
                    '<div>' +
                        '<div>' +
                            'Data{{#tag}}Data' +
                            '{{/tag}}' +
                        '</div>' +
                        '{{#tag}}' +
                        '<span>Data</span>' +
                        '<span>Data</span>' +
                        '{{/tag}}' +
                    '</div>' +
                    '{{#tag}}' +
                    '<span>Data</span>' +
                    '<span>Data</span>' +
                    '{{/tag}}' +
                '</div>' +
                '<div>' +
                    '{{#tag}}' +
                    '<span>Data</span>' +
                    '<span>Data</span>' +
                    '{{/tag}}' +
                    '<div>' +
                        '{{#tag}}' +
                        '<span>Data</span>' +
                        '<span>Data</span>' +
                        '{{/tag}}' +
                        '<div>' +
                            '{{#tag}}' +
                            'Data{{/tag}}Data' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>'
        );
    });
});
