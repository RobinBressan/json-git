import expect from 'expect';
import findReferenceCommitHash from './findReferenceCommitHash';
import { EMPTY_HASH } from './computeHash';

describe('findReferenceCommitHash()', () => {
    it('should return the common ancestor of two branches', () => {
        const head = 'ae0';
        const head1 = 'ae1';
        const head2 = 'ae2';
        const head3 = EMPTY_HASH;
        const head4 = 'ae4';

        const commitStore = {
            read: hash => ({
                [head]: {
                    parent: head1,
                },
                [head1]: {
                    parent: head2,
                },
                [head2]: {
                    parent: head3,
                },
                [head4]: {
                    parent: head2,
                },
            }[hash]),
        };

        expect(findReferenceCommitHash(head, head4, commitStore)).toBe(head2);
    });
});
