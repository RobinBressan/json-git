import expect from 'expect';
import buildMergePatch from './buildMergePatch';

describe('buildMergePatch()', () => {
    it('should always return targetBranch patch if no resolver is provided', () => {
        const currentBranchPatch = [
            { op: 'remove', path: '/foo' },
            { op: 'add', path: '/foo2', value: 'bar2' },
        ];

        const targetBranchPatch = [
            { op: 'replace', path: '/foo', value: 'bar' },
            { op: 'add', path: '/foo3', value: 'bar3' },
        ];

        expect(buildMergePatch(currentBranchPatch, targetBranchPatch)).toEqual([
            { op: 'replace', path: '/foo', value: 'bar' },
            { op: 'add', path: '/foo3', value: 'bar3' },
        ]);
    });

    it('should generate a patch and deal with potential conflicts if a resolver is provided', () => {
        const currentBranchPatch = [
            { op: 'remove', path: '/foo' },
            { op: 'add', path: '/foo2', value: 'bar2' },
        ];

        const targetBranchPatch = [
            { op: 'replace', path: '/foo', value: 'bar' },
            { op: 'add', path: '/foo3', value: 'bar3' },
        ];

        const resolver = expect.createSpy((currentBranchPayload, targetBranchPayload, reject) => {
            reject();
        }).andCallThrough();

        expect(buildMergePatch(currentBranchPatch, targetBranchPatch, resolver)).toEqual([
            { op: 'add', path: '/foo3', value: 'bar3' },
        ]);

        expect(resolver.calls[0].arguments[0]).toEqual({ op: 'replace', path: '/foo', value: 'bar' });
        expect(resolver.calls[0].arguments[1]).toEqual({ op: 'remove', path: '/foo' });
    });
});
