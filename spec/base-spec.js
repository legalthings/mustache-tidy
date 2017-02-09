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
});
