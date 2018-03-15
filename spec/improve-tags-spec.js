var tidy = require('../');

describe('Improving tags', function() {
    it('should recursively rise tag up from parent nodes, together with containing tags, untill data is met', function() {
        var input = `
            <div>
                <div>
                    <div>
                        {{^outer}}
                        <div>
                            {{#foo}}
                                {{^bar}}
                                    {{#tag}}Data{{/tag}}
                                {{/}}
                            {{/foo}}
                        </div>
                        {{/}}
                    </div>
                </div>
                Data
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe(
            '<div>' +
                ' {{^outer}} ' +
                '{{#foo}}' +
                '{{^bar}}' +
                '{{#tag}}' +
                '<div>' +
                    '<div>' +
                        '<div>' +
                            ' Data ' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '{{/tag}}' +
                '{{/}}' +
                '{{/foo}}' +
                ' {{/}} ' +
                ' Data ' +
            '</div>'
        );
    });

    it('should merge same tags and then recursively rise tag up from parent nodes, untill data is met', function() {
        var input = `
            <div>
                <div>
                    <div>
                        <div>
                            {{#tag}}Data 1{{/tag}}
                            {{#tag}}Data 2{{/tag}}
                        </div>
                    </div>
                </div>
                Data
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe(
            '<div>' +
                '{{#tag}}' +
                '<div>' +
                    '<div>' +
                        '<div>' +
                            ' Data 1 Data 2 ' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '{{/tag}}' +
                ' Data ' +
            '</div>'
        );
    });

    it('should merge same tags with different closing tag style, and then recursively rise tag up from parent nodes', function() {
        var input = `
            <div>
                <div>
                    <div>
                        {{#tag}}Data 1{{/tag}}
                        {{#tag}}Data 2{{/}}
                    </div>
                </div>
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe('{{#tag}}<div><div><div> Data 1 Data 2 </div></div></div>{{/}}');
    });

    it('should merge all same tags while recursively rising tag up from parent nodes', function() {
        var input = `
            <div>
                {{#tag}}Data 1{{/tag}}
                {{#tag}}Data 2{{/tag}}
                <div>
                    {{#tag}}Data 1{{/tag}}
                    {{#tag}}Data 2{{/tag}}
                    <div>
                        {{#tag}}Data 1{{/tag}}
                        {{#tag}}Data 2{{/tag}}
                    </div>
                </div>
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe(
            '{{#tag}}' +
            '<div>' +
                ' Data 1 Data 2 ' +
                '<div>' +
                    ' Data 1 Data 2 ' +
                    '<div>' +
                        ' Data 1 Data 2 ' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '{{/tag}}'
        );
    });

    it('should not merge same tags of different type', function() {
        var input = `
            <div>
                <div>
                    <div>
                        {{^tag}}Data 1{{/tag}}{{#tag}}Data 2{{/tag}}
                    </div>
                </div>
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe(
            '<div>' +
                '<div>' +
                    '<div>' +
                        ' {{^tag}}Data 1{{/tag}}{{#tag}}Data 2{{/tag}} ' +
                    '</div>' +
                '</div>' +
            '</div>'
        );
    });

    it('should not merge different tags', function() {
        var input = `
            <div>
                <div>
                    <div>
                        {{#tag}}Data 1{{/tag}}{{#foo}}Data 2{{/foo}}
                    </div>
                </div>
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe(
            '<div>' +
                '<div>' +
                    '<div>' +
                        ' {{#tag}}Data 1{{/tag}}{{#foo}}Data 2{{/foo}} ' +
                    '</div>' +
                '</div>' +
            '</div>'
        );
    });

    it('should merge two extended sections and rise result from parent node, with outer tag', function() {
        var input = `
            <div>
                {{^outer}}
                {{#tag}}
                <span>Data</span>
                <div>
                    <span>Data</span>
                    <span>Data</span>
                    <div>
                        <span>Data</span>
                        <span>Data</span>
                        {{/}}
                        {{#tag}}
                        <span>Data</span>
                        <span>Data</span>
                    </div>
                    <span>Data</span>
                    <span>Data</span>
                </div>
                <span>Data</span>
                {{/tag}}
                {{/outer}}
            </div>
        `;

        var result = tidy(input);
        expect(result).toBe(
            '{{^outer}}' +
            ' {{#tag}} ' +
            '<div>' +
                '<span>Data</span>' +
                '<div>' +
                    '<span>Data</span>' +
                    '<span>Data</span>' +
                    '<div>' +
                        '<span>Data</span>' +
                        '<span>Data</span>' +
                        '<span>Data</span>' +
                        '<span>Data</span>' +
                    '</div>' +
                    '<span>Data</span>' +
                    '<span>Data</span>' +
                '</div>' +
                '<span>Data</span>' +
            '</div>' +
            ' {{/tag}} ' +
            '{{/outer}}'
        );
    });
});
