import expect from 'expect';
import createRepository from './createRepository';
import { EMPTY_HASH } from './computeHash';

describe('createRepository()', () => {
    let repository;

    beforeEach(() => {
        repository = createRepository();
    });

    it('should build a repository with a master branch and a default head', () => {
        expect(repository.branch).toBe('master');
        expect(repository.head).toBe(EMPTY_HASH);
    });

    it('should trigger an error when trying to read tree without any commits', () => {
        expect(() => repository.tree).toThrow(/There isn't a tree yet. You must do your first commit for that./);
    });

    it('should expose a commit() method to create a new commit', () => {
        const commitHash = repository.commit('robin', 'I commit', {
            foo: 'bar',
            child: {
                bar: 'foo',
            },
        });

        expect(repository.head).toBe(commitHash);
        expect(repository.tree).toEqual({
            foo: 'bar',
            child: {
                bar: 'foo',
            },
        });

        expect(repository.log[commitHash].parent).toBe(EMPTY_HASH);
        expect(repository.log[commitHash].author).toBe('robin');
        expect(repository.log[commitHash]).toIncludeKeys(['date', 'treeHash']);

        const nextCommitHash = repository.commit('robin', 'I commit', {
            foo: 'bar2',
            child: {
                bar: 'foo2',
            },
        });

        expect(repository.head).toBe(nextCommitHash);
        expect(repository.tree).toEqual({
            foo: 'bar2',
            child: {
                bar: 'foo2',
            },
        });

        expect(repository.log[nextCommitHash].parent).toBe(commitHash);
    });

    it('should expose a checkout() method to create/change branch', () => {
        const firstCommitHash = repository.commit('robin', 'I commit', {
            foo: 'bar',
            child: {
                bar: 'foo',
            },
        });

        repository.checkout('dev', true);

        expect(repository.branch).toBe('dev');

        const secondCommitHash = repository.commit('robin', 'I commit', {
            foo: 'bar2',
            child: {
                bar: 'foo2',
            },
        });

        expect(repository.log[secondCommitHash].parent).toEqual(firstCommitHash);

        const nextCommitHash = repository.commit('robin', 'I commit', {
            foo: 'bar3',
            child: {
                bar: 'foo2',
            },
        });

        expect(repository.log[nextCommitHash].parent).toEqual(secondCommitHash);

        repository.checkout('master');

        expect(repository.branch).toBe('master');

        const lastCommitHash = repository.commit('robin', 'I commit', {
            foo: 'bar4',
            child: {
                bar: 'foo4',
            },
        });

        expect(repository.log[lastCommitHash].parent).toEqual(firstCommitHash);
    });

    it('should expose a checkout() method to checkout a commit in detached mode', () => {
        repository.commit('robin', 'I commit', {
            foo: 'bar',
            child: {
                bar: 'foo',
            },
        });

        const secondCommitHash = repository.commit('robin', 'I commit', {
            foo: 'bar2',
            child: {
                bar: 'foo2',
            },
        });

        const thirdCommitHash = repository.commit('robin', 'I commit', {
            foo: 'bar3',
            child: {
                bar: 'foo3',
            },
        });

        repository.checkout(secondCommitHash);

        expect(repository.tree).toEqual({
            foo: 'bar2',
            child: {
                bar: 'foo2',
            },
        });
        expect(repository.head).toBe(secondCommitHash);
        expect(repository.detached).toBe(true);

        const fourthCommitHash = repository.commit('robin', 'I commit', {
            foo: 'bar4',
            child: {
                bar: 'foo4',
            },
        });

        expect(repository.log[fourthCommitHash].parent).toEqual(secondCommitHash);

        repository.checkout('master');

        expect(repository.branch).toBe('master');
        expect(repository.detached).toBe(false);
        expect(repository.tree).toEqual({
            foo: 'bar3',
            child: {
                bar: 'foo3',
            },
        });
        expect(repository.head).toBe(thirdCommitHash);

        const lastCommitHash = repository.commit('robin', 'I commit', {
            foo: 'bar4',
            child: {
                bar: 'foo4',
            },
        });

        expect(repository.log[lastCommitHash].parent).toEqual(thirdCommitHash);
    });

    it('should trigger an error when trying to checkout an unknown branch', () => {
        expect(() => repository.checkout('dev')).toThrow(/Branch dev does not exists./);
    });

    it('should trigger an error when trying to create a known branch', () => {
        expect(() => repository.checkout('master', true)).toThrow(/Branch master already exists./);
    });

    it('should return all commits when getting log attribute', () => {
        const firstCommitHash = repository.commit('robin', 'I commit', {
            foo: 'bar',
            child: {
                bar: 'foo',
            },
        });

        const secondCommitHash = repository.commit('robin', 'I commit', {
            foo: 'bar2',
            child: {
                bar: 'foo2',
            },
        });

        expect(repository.log).toInclude({
            [firstCommitHash]: {
                author: 'robin',
                parent: EMPTY_HASH,
            },
            [secondCommitHash]: {
                author: 'robin',
                parent: firstCommitHash,
            },
        });
    });

    it('should return the full repository data when toJSON() is called', () => {
        const firstCommitHash = repository.commit('robin', 'I commit', {
            foo: 'bar',
            child: {
                bar: 'foo',
            },
        });

        const secondCommitHash = repository.commit('robin', 'I commit', {
            foo: 'bar2',
            child: {
                bar: 'foo',
            },
        });

        const data = repository.toJSON();
        const treeHashes = Object.keys(data.trees);

        expect(repository.toJSON()).toEqual({
            refs: {
                branch: {
                    value: 'master',
                },
                heads: {
                    master: secondCommitHash,
                },
            },
            commits: {
                [firstCommitHash]: {
                    author: 'robin',
                    date: data.commits[firstCommitHash].date,
                    message: 'I commit',
                    parent: EMPTY_HASH,
                    treeHash: treeHashes[0],
                },
                [secondCommitHash]: {
                    author: 'robin',
                    date: data.commits[secondCommitHash].date,
                    message: 'I commit',
                    parent: firstCommitHash,
                    treeHash: treeHashes[1],
                },
            },
            trees: {
                [treeHashes[0]]: {
                    foo: 'bar',
                    child: {
                        bar: 'foo',
                    },
                },
                [treeHashes[1]]: {
                    foo: 'bar2',
                    child: `$$ref:${treeHashes[0]}`,
                },
            },
        });
    });

    it('should load an existing repository when a snapshot is given to createRepository', () => {
        const snapshot = JSON.parse('{"refs":{"branch":{"value":"master"},"heads":{"master":"ddd0ed1cc"}},"commits":{"1ad2fa1c":{"author":"robin","date":"2017-02-03T16:29:24.836Z","message":"I commit","treeHash":"20d2a220c","parent":"0000000000"},"ddd0ed1cc":{"author":"robin","date":"2017-02-03T16:29:24.836Z","message":"I commit","treeHash":"b1a13bdd0c","parent":"1ad2fa1c"}},"trees":{"20d2a220c":{"foo":"bar","child":{"bar":"foo"}},"b1a13bdd0c":{"foo":"bar2","child":{"bar":"foo2"}}}}');
        repository = createRepository(snapshot);

        expect(repository.branch).toBe('master');
        expect(repository.head).toBe('ddd0ed1cc');
        expect(repository.tree).toEqual({
            foo: 'bar2',
            child: {
                bar: 'foo2',
            },
        });
    });

    it('should throw an error if we commit the same tree as head', () => {
        repository.commit('robin', 'I commit', {
            foo: 'bar',
            child: {
                bar: 'foo',
            },
        });

        expect(() => repository.commit('robin', 'I commit', {
            foo: 'bar',
            child: {
                bar: 'foo',
            },
        })).toThrow(/No changes to commit/);
    });

    it('should return a json patch when diff() is called', () => {
        const firstCommitHash = repository.commit('robin', 'I commit', {
            foo: 'bar',
            child: {
                bar: 'foo',
            },
        });

        repository.checkout('dev', true);

        repository.commit('robin', 'I commit', {
            foo: 'bar',
            child: {
                bar: 'foo2',
            },
        });

        repository.checkout('master');

        repository.commit('robin', 'I commit', {
            child: {
                bar: 'foo',
            },
        });

        expect(repository.diff('master', 'dev')).toEqual([
            { op: 'add', path: '/foo', value: 'bar' },
            { op: 'replace', path: '/child/bar', value: 'foo2' },
        ]);

        expect(repository.diff(firstCommitHash, 'dev')).toEqual([
            { op: 'replace', path: '/child/bar', value: 'foo2' },
        ]);
    });

    it('should revert the changes introduced by a commit when revert() is called', () => {
        repository.commit('robin', 'I commit', {
            foo: 'bar',
            child: {
                bar: 'foo',
            },
        });

        const revertHash = repository.commit('robin', 'I commit', {
            foo: 'bar',
            child: {
                bar: 'foo2',
            },
        });

        repository.commit('robin', 'I commit', {
            foo: 'bar',
            child: {
                bar: 'foo2',
                hello: 'world',
            },
        });

        repository.revert('robin', revertHash);

        expect(repository.tree).toEqual({
            foo: 'bar',
            child: {
                bar: 'foo',
                hello: 'world',
            },
        });

        expect(repository.log[repository.head].message).toBe(`Revert of commit ${revertHash}`);
    });

    it('should merge the target branch into the current when merge() is called', () => {
        repository.commit('robin', 'I commit', {
            foo: 'bar',
            child: {
                bar: 'foo',
            },
        });

        repository.checkout('dev', true);

        repository.commit('robin', 'I commit', {
            foo: 'bar2',
            child: {
                bar: 'foo2',
                hello: 'world',
            },
        });

        repository.checkout('master');

        repository.commit('robin', 'I commit', {
            child: {
                bar: 'foo',
            },
            its: 'me',
        });

        repository.merge('robin', 'dev');

        expect(repository.tree).toEqual({
            foo: 'bar2',
            child: {
                bar: 'foo2',
                hello: 'world',
            },
            its: 'me',
        });

        expect(repository.log[repository.head].message).toBe('Merge of dev into master');
    });

    it('should merge the target branch into the current when merge() is called and call the resolver on any conflict', () => {
        repository.commit('robin', 'I commit', {
            foo: 'bar',
            child: {
                bar: 'foo',
            },
        });

        repository.checkout('dev', true);

        repository.commit('robin', 'I commit', {
            foo: 'bar2',
            child: {
                bar: 'foo2',
            },
        });

        repository.checkout('master');

        repository.commit('robin', 'I commit', {
            child: {
                bar: 'foo',
            },
        });

        repository.merge('robin', 'dev', (devPayload, masterPayload, reject) => {
            // we have a conflict for /foo
            // master want to remove it but dev want to replace it
            // we reject so master wins
            reject();
        });

        expect(repository.tree).toEqual({
            child: {
                bar: 'foo2',
            },
        });
    });

    it('should return list of all branches when branches() is called', () => {
        repository.commit('robin', 'I commit', {
            foo: 'bar',
            child: {
                bar: 'foo',
            },
        });

        repository.checkout('dev', true);

        expect(repository.branches).toEqual([
            'master',
            'dev',
        ]);
    });

    it('should delete a branch when deleteBranch() is called', () => {
        repository.commit('robin', 'I commit', {
            foo: 'bar',
            child: {
                bar: 'foo',
            },
        });

        repository.checkout('dev', true);

        expect(() => repository.deleteBranch('dev')).toThrow(/You cannot delete the current branch/);
        expect(() => repository.deleteBranch('master')).toThrow(/You cannot delete the master branch/);
        expect(repository.branches).toEqual([
            'master',
            'dev',
        ]);

        repository.checkout('master');
        repository.deleteBranch('dev');

        expect(repository.branches).toEqual([
            'master',
        ]);
    });

    it('should notify any subscriber when something is written into the repository', () => {
        const subscriber1 = expect.createSpy();
        repository.subscribe(subscriber1);

        const subscriber2 = expect.createSpy();
        repository.subscribe(subscriber2);

        const commitHash = repository.commit('robin', 'I commit', {
            foo: 'bar',
            child: {
                bar: 'foo',
            },
        });

        expect(subscriber1).toHaveBeenCalledWith({ head: commitHash });
        expect(subscriber2).toHaveBeenCalledWith({ head: commitHash });

        repository.unsubscribe(subscriber1);

        const commitHash2 = repository.commit('robin', 'I commit', {
            foo: 'bar2',
            child: {
                bar: 'foo',
            },
        });

        expect(subscriber1.calls.length).toBe(1);
        expect(subscriber2).toHaveBeenCalledWith({ head: commitHash2 });
        expect(subscriber2.calls.length).toBe(2);
    });
});
