import expect from 'expect';
import createPatch from './createPatch';

describe('createPatch()', () => {
    it('should create a json patch', () => {
        const left = {
            foo: 'bar',
            foo2: 'bar2',
            foo3: {
                hello: 'world',
            },
        };

        const right = {
            foo2: 'bar',
            foo3: {
                hello: 'world',
                me: 'you',
            },
            foo4: {
                child: [
                    {
                        a: '1',
                    },
                ],
            },
        };

        const patch = createPatch(left, right);

        expect(patch).toEqual([
            { op: 'add', path: '/foo3/me', value: 'you' },
            { op: 'add', path: '/foo4/child/0/a', value: '1' },
            { op: 'remove', path: '/foo' },
            { op: 'replace', path: '/foo2', value: 'bar' },
        ]);
    });
});
