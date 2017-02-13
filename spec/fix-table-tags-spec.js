var tidy = require('../');

describe('Extending tags', function() {
    it('should fix table tags, when opening tag is out of table, and closing is inside table', function() {
        var input = `
            {{^tag}}
            <div>Data</div>
            <div>Data</div>
            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Data</th>
                        <th></th>
                        <th>Data</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Data</td>
                        <td>Data</td>
                        <td></td>
                        <td>Data</td>
                    </tr>
                    <tr>
                        <td>
                            <span>Data</span>
                            <span>Data</span>
                        </td>
                        <td>{{/tag}}</td>
                        <td></td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
        `;

        var result = tidy(input);
        expect(result).toBe(
            '{{^tag}}' +
            '<div>Data</div>' +
            '<div>Data</div>' +
            '{{/tag}}' +
            '<table>' +
                '<thead>' +
                    '<tr>' +
                        '<th>{{^tag}}Data{{/tag}}</th>' +
                        '<th>{{^tag}}Data{{/tag}}</th>' +
                        '<th></th>' +
                        '<th>{{^tag}}Data{{/tag}}</th>' +
                    '</tr>' +
                '</thead>' +
                '<tbody>' +
                    '<tr>' +
                        '<td>{{^tag}}Data{{/tag}}</td>' +
                        '<td>{{^tag}}Data{{/tag}}</td>' +
                        '<td></td>' +
                        '<td>{{^tag}}Data{{/tag}}</td>' +
                    '</tr>' +
                    '<tr>' +
                        '<td>' +
                            '{{^tag}}' +
                            '<span>Data</span>' +
                            '<span>Data</span>' +
                            '{{/tag}}' +
                        '</td>' +
                        '<td></td>' +
                        '<td></td>' +
                        '<td></td>' +
                    '</tr>' +
                '</tbody>' +
            '</table>'
        );
    });

    it('should fix table tags, when closing tag is out of table, and opening is inside table', function() {
        var input = `
            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Data</th>
                        <th>{{^tag}}</th>
                        <th>Data</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Data</td>
                        <td>Data</td>
                        <td></td>
                        <td>Data</td>
                    </tr>
                    <tr>
                        <td>
                            <span>Data</span>
                            <span>Data</span>
                        </td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
            <div>Data</div>
            <div>Data</div>
            {{/tag}}
        `;

        var result = tidy(input);
        expect(result).toBe(
            '<table>' +
                '<thead>' +
                    '<tr>' +
                        '<th>Data</th>' +
                        '<th>Data</th>' +
                        '<th></th>' +
                        '<th>{{^tag}}Data{{/tag}}</th>' +
                    '</tr>' +
                '</thead>' +
                '<tbody>' +
                    '<tr>' +
                        '<td>{{^tag}}Data{{/tag}}</td>' +
                        '<td>{{^tag}}Data{{/tag}}</td>' +
                        '<td></td>' +
                        '<td>{{^tag}}Data{{/tag}}</td>' +
                    '</tr>' +
                    '<tr>' +
                        '<td>' +
                            '{{^tag}}' +
                            '<span>Data</span>' +
                            '<span>Data</span>' +
                            '{{/tag}}' +
                        '</td>' +
                        '<td></td>' +
                        '<td></td>' +
                        '<td></td>' +
                    '</tr>' +
                '</tbody>' +
            '</table>' +
            '{{^tag}}' +
            '<div>Data</div>' +
            '<div>Data</div>' +
            '{{/tag}}'
        );
    });

    it('should fix table tags, when tags are in different table rows', function() {
        var input = `
            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>
                            <span>
                                Data
                                <em>{{^tag}}Data</em>
                            </span>
                            <span>Data</span>
                            <span>Data</span>
                        </th>
                        <th></th>
                        <th>Data</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Data</td>
                        <td>Data</td>
                        <td></td>
                        <td>Data</td>
                    </tr>
                    <tr>
                        <td>
                            <span>Data</span>
                            <span>Data</span>
                        </td>
                        <td>{{/tag}}</td>
                        <td></td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
        `;

        var result = tidy(input);
        expect(result).toBe(
            '<table>' +
                '<thead>' +
                    '<tr>' +
                        '<th>Data</th>' +
                        '<th>' +
                            '<span>' +
                                'Data' +
                                '{{^tag}}' +
                                '<em>Data</em>' +
                                '{{/tag}}' +
                            '</span>' +
                            '{{^tag}}' +
                            '<span>Data</span>' +
                            '<span>Data</span>' +
                            '{{/tag}}' +
                        '</th>' +
                        '<th></th>' +
                        '<th>{{^tag}}Data{{/tag}}</th>' +
                    '</tr>' +
                '</thead>' +
                '<tbody>' +
                    '<tr>' +
                        '<td>{{^tag}}Data{{/tag}}</td>' +
                        '<td>{{^tag}}Data{{/tag}}</td>' +
                        '<td></td>' +
                        '<td>{{^tag}}Data{{/tag}}</td>' +
                    '</tr>' +
                    '<tr>' +
                        '<td>' +
                            '{{^tag}}' +
                            '<span>Data</span>' +
                            '<span>Data</span>' +
                            '{{/tag}}' +
                        '</td>' +
                        '<td></td>' +
                        '<td></td>' +
                        '<td></td>' +
                    '</tr>' +
                '</tbody>' +
            '</table>'
        );
    });
});
