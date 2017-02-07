import expect from 'expect';
import computeHash from './computeHash';

describe('computeHash()', () => {
    it('should generate a hash based on its input', () => {
        expect(computeHash('master')).toMatch(/^[0-9a-f]{40}$/);
    });
});
