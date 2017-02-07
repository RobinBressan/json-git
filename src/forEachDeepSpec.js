import expect from 'expect';
import forEachDeep from './forEachDeep';

describe('forEachDeep()', () => {
    it('should call the visitor on each node with a value, key and path', () => {
        const sample = {
            foo: 'bar',
            foo2: [
                'hello',
                'you',
                {
                    data: 'here',
                },
            ],
        };

        const visitor = expect.createSpy();
        forEachDeep(sample, visitor);

        expect(visitor).toHaveBeenCalledWith('bar', 'foo', ['foo']);
        expect(visitor).toHaveBeenCalledWith([
            'hello',
            'you',
            {
                data: 'here',
            },
        ], 'foo2', ['foo2']);
        expect(visitor).toHaveBeenCalledWith('hello', 0, ['foo2', 0]);
        expect(visitor).toHaveBeenCalledWith('you', 1, ['foo2', 1]);
        expect(visitor).toHaveBeenCalledWith({
            data: 'here',
        }, 2, ['foo2', 2]);
        expect(visitor).toHaveBeenCalledWith('here', 'data', ['foo2', 2, 'data']);
    });
});
