import expect from 'expect';
import createRejecter from './createRejecter';

describe('createRejecter()', () => {
    it('should set rejected to true when reject is called', () => {
        const rejecter = createRejecter();

        expect(rejecter.rejected).toBe(false);
        rejecter.reject();
        expect(rejecter.rejected).toBe(true);
    });
});
