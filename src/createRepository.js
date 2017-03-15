import { EventEmitter } from 'events';
import cloneDeep from 'lodash.clonedeep';
import isEqual from 'lodash.isequal';
import applyPatch from './applyPatch';
import buildMergePatch from './buildMergePatch';
import createPatch from './createPatch';
import createStore from './createStore';
import createCompressedStore from './createCompressedStore';
import ensureSnapshot from './ensureSnapshot';
import findReferenceCommitHash from './findReferenceCommitHash';
import { EMPTY_HASH } from './computeHash';

export default function createRepository(snapshot) {
    const emitter = new EventEmitter();

    let commits = {};
    let trees = {};
    let refs = {
        branch: {
            value: 'master',
        },
        heads: {
            master: EMPTY_HASH,
        },
    };

    if (snapshot && ensureSnapshot(snapshot)) {
        commits = snapshot.commits;
        trees = snapshot.trees;
        refs = {
            ...refs,
            ...snapshot.refs,
        };
    }

    const commitStore = createStore(commits);
    const refStore = createStore(refs);
    const treeStore = createCompressedStore(createStore(trees));

    function getCurrentBranch() {
        return refStore.read('branch').value;
    }

    function moveDetachedHead(commitHash) {
        refStore.write({
            head: commitHash,
        }, 'detached');
    }

    function moveHead(branch, commitHash) {
        const previousHeads = refStore.read('heads');
        refStore.write({
            ...previousHeads,
            [branch]: commitHash,
        }, 'heads');
    }

    function hasDetachedHead() {
        return refStore.has('detached');
    }

    function hasHead(branch) {
        return !!refStore.read('heads')[branch];
    }

    function getDetachedHead() {
        return refStore.read('detached').head;
    }

    function getHead(branch) {
        return refStore.read('heads')[branch];
    }

    function removeDetachedHead() {
        refStore.remove('detached');
    }

    function removeHead(branch) {
        const previousHeads = refStore.read('heads');
        delete previousHeads[branch];

        refStore.write({ ...previousHeads }, 'heads');
    }

    function updateBranch(branch) {
        refStore.write({
            value: branch,
        }, 'branch');
    }

    refStore.subscribe(() => emitter.emit('write', {
        head: hasDetachedHead() ? getDetachedHead() : getHead(getCurrentBranch()),
    }));

    const repository = {
        get branch() {
            if (hasDetachedHead()) {
                throw new Error(`You are in detached mode on ${getDetachedHead()}`);
            }

            return getCurrentBranch();
        },

        get branches() {
            return Object.keys(refStore.read('heads'));
        },

        get detached() {
            return hasDetachedHead();
        },

        get head() {
            return hasDetachedHead() ? getDetachedHead() : getHead(repository.branch);
        },

        get log() {
            return commitStore.toJSON();
        },

        get tree() {
            if (repository.head === EMPTY_HASH) {
                throw new Error("There isn't a tree yet. You must do your first commit for that.");
            }

            const commit = commitStore.read(repository.head);
            return cloneDeep(treeStore.read(commit.treeHash));
        },

        apply(patch, resolver) {
            return applyPatch(patch, repository.tree, resolver);
        },

        commit(author, message, tree) {
            if (typeof author !== 'string' || author.length === 0) {
                throw new Error('Author is mandatory');
            }

            if (typeof message !== 'string' || message.length === 0) {
                throw new Error('Message is mandatory');
            }

            let lastTreeHash = null;
            if (repository.head !== EMPTY_HASH) {
                lastTreeHash = commitStore.read(repository.head).treeHash;

                if (!tree || isEqual(treeStore.read(lastTreeHash), tree)) {
                    throw new Error('No changes to commit');
                }
            }

            const treeHash = treeStore.write(cloneDeep(tree), lastTreeHash);
            const commitHash = commitStore.write({
                author,
                date: (new Date()).toISOString(),
                message,
                treeHash,
                parent: repository.head,
            });

            if (hasDetachedHead()) {
                moveDetachedHead(commitHash);
            } else {
                moveHead(repository.branch, commitHash);
            }

            return commitHash;
        },

        checkout(target, create = false) {
            if (commitStore.has(target)) {
                moveDetachedHead(target);

                return repository;
            }

            if (create) {
                if (hasHead(target)) {
                    throw new Error(`Branch ${target} already exists.`);
                }

                moveHead(target, repository.head);
            } else if (!hasHead(target)) {
                throw new Error(`Branch ${target} does not exists.`);
            }

            updateBranch(target);

            if (hasDetachedHead()) {
                removeDetachedHead();
            }

            return repository;
        },

        deleteBranch(branch) {
            if (!hasHead(branch)) {
                throw new Error(`Branch ${branch} doesn't exist`);
            }

            if (repository.branch === branch) {
                throw new Error('You cannot delete the current branch');
            }

            if (branch === 'master') {
                throw new Error('You cannot delete the master branch');
            }

            removeHead(branch);
        },

        diff(left, right) {
            const leftCommit = commitStore.read(getHead(left) || left);
            const rightCommit = commitStore.read(getHead(right) || right);

            return createPatch(
                treeStore.read(leftCommit.treeHash),
                treeStore.read(rightCommit.treeHash),
            );
        },

        merge(author, target, resolver) {
            if (!commitStore.has(target) && !hasHead(target)) {
                throw new Error(`Branch ${target} doesn't exist`);
            }

            const targetHead = commitStore.has(target) ? target : getHead(target);

            const refCommitHash = findReferenceCommitHash(
                repository.head,
                targetHead,
                commitStore,
            );

            const mergePatch = buildMergePatch(
                repository.diff(refCommitHash, repository.head),
                repository.diff(refCommitHash, targetHead),
                resolver,
            );

            return repository.commit(
                author,
                `Merge of ${target} into ${repository.branch}`,
                repository.apply(mergePatch),
            );
        },

        revert(author, commitHash, resolver) {
            if (typeof author !== 'string' || author.length === 0) {
                throw new Error('Author is mandatory');
            }

            const commit = commitStore.read(commitHash);

            if (commit.parent === EMPTY_HASH) {
                throw new Error("You can't revert the first commit.");
            }

            const patch = repository.diff(commitHash, commit.parent);

            return repository.commit(
                author,
                `Revert of commit ${commitHash}`,
                repository.apply(patch, resolver),
            );
        },

        subscribe(subscriber) {
            emitter.on('write', subscriber);
        },

        unsubscribe(subscriber) {
            emitter.removeListener('write', subscriber);
        },

        toJSON() {
            return {
                commits: commitStore.toJSON(),
                refs: refStore.toJSON(),
                trees: treeStore.toJSON(),
            };
        },
    };

    return repository;
}
