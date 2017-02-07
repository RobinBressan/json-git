import expect from 'expect';
import expandObject from './expandObject';

describe('expandObject()', () => {
    const data = {
        '12f3dffff': {
            foo: 'bar',
        },
        '3bc3d1322': {
            foo: '$$ref:12f3dffff',
            foo2: 'bar2',
            foo4: [
                'hello',
            ],
        },
    };

    it('should resolve all references and return consolidated data', () => {
        const store = {
            read: key => expandObject(data[key], store), // we simulate the recursive read
        };

        expect(expandObject({
            foo: '$$ref:3bc3d1322',
            foo2: '$$ref:3bc3d1322',
            foo3: 'bar3',
            foo4: [
                '$$ref:3bc3d1322',
                'you',
            ],
        }, store)).toEqual({
            foo: 'bar',
            foo2: 'bar2',
            foo3: 'bar3',
            foo4: [
                'hello',
                'you',
            ],
        });
    });
});
