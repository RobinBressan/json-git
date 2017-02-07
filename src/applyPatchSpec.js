import expect from 'expect';
import applyPatch from './applyPatch';

describe('applyPatch()', () => {
    it('should update an object with a json patch', () => {
        const patch = [
            { op: 'add', path: '/foo3/me', value: 'you' },
            { op: 'add', path: '/foo4/child/0/a', value: '1' },
            { op: 'remove', path: '/foo' },
            { op: 'replace', path: '/foo2', value: 'bar' },
        ];

        const data = {
            foo: 'bar',
            foo2: 'bar2',
            foo3: {
                hello: 'world',
            },
        };

        expect(applyPatch(patch, data)).toEqual({
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
        });
    });

    it('should provide a resolver if we want to review conflits', () => {
        const patch = [
            { op: 'replace', path: '/foo3/me', value: 'you' },
            { op: 'add', path: '/foo4/child/0/a', value: '1' },
            { op: 'remove', path: '/foo' },
            { op: 'replace', path: '/foo2', value: 'bar' },
            { op: 'add', path: '/foo4/child', value: '2' },
        ];

        const data = {
            foo: 'bar',
            foo2: 'bar2',
            foo3: {
                hello: 'world',
            },
        };

        function resolver(payload, currentValue, reject) {
            switch (payload.path) {
            case '/foo3/me':
                reject();
                break;
            case '/foo4/child':
                // do nothing : we accept the change
                break;
            default:

            }
        }

        expect(applyPatch(patch, data, resolver)).toEqual({
            foo2: 'bar',
            foo3: {
                hello: 'world',
            },
            foo4: {
                child: '2',
            },
        });
    });
});
