// @flow
import events from 'events';
import cloneDeep from 'lodash.clonedeep';
import isEqual from 'lodash.isequal';
import applyPatch from './applyPatch';
import buildMergePatch from './buildMergePatch';
import createPatch from './createPatch';
import createStore from './createStore';
import createHashStore from './createHashStore';
import createCompressedHashStore from './createCompressedHashStore';
import ensureSnapshot from './ensureSnapshot';
import findReferenceCommitHash from './findReferenceCommitHash';
import { EMPTY_HASH } from './computeHash';

import type { CompressedHashStore } from './createCompressedHashStore';
import type { Hash } from './computeHash';
import type { HashStore } from './createHashStore';
import type { Patch } from './createPatch';
import type { Snapshot } from './ensureSnapshot';
import type { Storage, Store } from './createStore';

type Commit = {
    author: string,
    date: string,
    message: string,
    treeHash: Hash,
    parent: Hash,
};
type Resolver = (payload: Object, value: mixed, reject: () => void) => void;
type Subscriber = (payload: Object) => void;

export default function createRepository(snapshot: Snapshot): Object {
    const emitter = new events.EventEmitter();

    let commits: Object = {};
    let trees: Object = {};
    let refs: Object = {
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

    const commitStore: HashStore = createHashStore(createStore(commits));
    const refStore: Store = createStore(refs);
    const treeStore: CompressedHashStore = createCompressedHashStore(createHashStore(createStore(trees)));

    function getCurrentBranch(): string {
        return refStore.read('branch').value;
    }

    function moveDetachedHead(commitHash: Hash): void {
        refStore.write('detached', {
            head: commitHash,
        });
    }

    function moveHead(branch: string, commitHash: Hash): void {
        const previousHeads: Object = refStore.read('heads');
        refStore.write('heads', {
            ...previousHeads,
            [branch]: commitHash,
        });
    }

    function hasDetachedHead(): boolean {
        return refStore.has('detached');
    }

    function hasHead(branch: string): boolean {
        return !!refStore.read('heads')[branch];
    }

    function getDetachedHead(): Hash {
        return refStore.read('detached').head;
    }

    function getHead(branch: string): Hash {
        return refStore.read('heads')[branch];
    }

    function removeDetachedHead(): void {
        refStore.remove('detached');
    }

    function removeHead(branch: string): void {
        const previousHeads = refStore.read('heads');
        delete previousHeads[branch];

        refStore.write('heads', { ...previousHeads });
    }

    function updateBranch(branch: string): void {
        refStore.write('branch', {
            value: branch,
        });
    }

    refStore.subscribe(() => {
        emitter.emit('write', {
            head: hasDetachedHead() ? getDetachedHead() : getHead(getCurrentBranch()),
        });
    });

    const repository = {
        // $FlowIssue - get/set properties not yet supported
        get branch() {
            if (hasDetachedHead()) {
                throw new Error(`You are in detached mode on ${getDetachedHead()} `);
            }

            return getCurrentBranch();
        },

        // $FlowIssue - get/set properties not yet supported
        get branches() {
            return Object.keys(refStore.read('heads'));
        },

        // $FlowIssue - get/set properties not yet supported
        get detached() {
            return hasDetachedHead();
        },

        // $FlowIssue - get/set properties not yet supported
        get head() {
            return hasDetachedHead() ? getDetachedHead() : getHead(repository.branch);
        },

        // $FlowIssue - get/set properties not yet supported
        get log(): Storage {
            return commitStore.toJSON();
        },

        // $FlowIssue - get/set properties not yet supported
        get tree() {
            if (repository.head === EMPTY_HASH) {
                throw new Error("There isn't a tree yet. You must do your first commit for that.");
            }

            const commit = commitStore.read(repository.head);
            return cloneDeep(treeStore.read(commit.treeHash));
        },

        apply(patch: Patch, resolver: ?Function): Object {
            // $FlowIssue - get/set properties not yet supported
            return applyPatch(patch, repository.tree, resolver);
        },

        commit(author: string, message: string, tree: Object): Hash {
            if (typeof author !== 'string' || author.length === 0) {
                throw new Error('Author is mandatory');
            }

            if (typeof message !== 'string' || message.length === 0) {
                throw new Error('Message is mandatory');
            }

            let lastTreeHash: ?Hash = null;
            if (repository.head !== EMPTY_HASH) {
                // $FlowIssue - get/set properties not yet supported
                lastTreeHash = commitStore.read(repository.head).treeHash;

                if (!tree || isEqual(treeStore.read(lastTreeHash), tree)) {
                    throw new Error('No changes to commit');
                }
            }

            const treeHash: Hash = treeStore.write(cloneDeep(tree), lastTreeHash);
            const commitHash: Hash = commitStore.write({
                author,
                date: (new Date()).toISOString(),
                message,
                treeHash,
                // $FlowIssue - get/set properties not yet supported
                parent: repository.head,
            });

            if (hasDetachedHead()) {
                moveDetachedHead(commitHash);
            } else {
                // $FlowIssue - get/set properties not yet supported
                moveHead(repository.branch, commitHash);
            }

            return commitHash;
        },

        checkout(target: string | Hash, create: boolean = false): void {
            if (commitStore.has(target)) {
                moveDetachedHead(target);

                return;
            }

            if (create) {
                if (hasHead(target)) {
                    throw new Error(`Branch ${target} already exists.`);
                }

                // $FlowIssue - get/set properties not yet supported
                moveHead(target, repository.head);
            } else if (!hasHead(target)) {
                throw new Error(`Branch ${target} does not exists.`);
            }

            updateBranch(target);

            if (hasDetachedHead()) {
                removeDetachedHead();
            }
        },

        deleteBranch(branch: string): void {
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

        diff(left: string | Hash, right: string | Hash): Patch {
            if (!commitStore.has(left) && !hasHead(left)) {
                throw new Error(`Branch ${left} doesn't exist`);
            }

            if (!commitStore.has(right) && !hasHead(right)) {
                throw new Error(`Branch ${right} doesn't exist`);
            }

            const leftHead: Hash = commitStore.has(left) ? left : getHead(left);
            const rightHead: Hash = commitStore.has(right) ? right : getHead(right);

            const leftCommit: Commit = commitStore.read(leftHead);
            const rightCommit: Commit = commitStore.read(rightHead);

            return createPatch(
                treeStore.read(leftCommit.treeHash),
                treeStore.read(rightCommit.treeHash),
            );
        },

        merge(author: string, target: string | Hash, resolver: ?Resolver): Hash {
            if (!commitStore.has(target) && !hasHead(target)) {
                throw new Error(`Branch ${target} doesn't exist`);
            }

            const targetHead: Hash = commitStore.has(target) ? target : getHead(target);

            const refCommitHash: Hash = findReferenceCommitHash(
                // $FlowIssue - get/set properties not yet supported
                repository.head,
                targetHead,
                commitStore,
            );

            const mergePatch: Patch = buildMergePatch(
                // $FlowIssue - get/set properties not yet supported
                repository.diff(refCommitHash, repository.head),
                // $FlowIssue - get/set properties not yet supported
                repository.diff(refCommitHash, targetHead),
                resolver,
            );

            return repository.commit(
                author,
                // $FlowIssue - get/set properties not yet supported
                `Merge of ${target} into ${repository.branch}`,
                repository.apply(mergePatch),
            );
        },

        revert(author: string, commitHash: Hash, resolver: ?Resolver): Hash {
            if (typeof author !== 'string' || author.length === 0) {
                throw new Error('Author is mandatory');
            }

            const commit: Commit = commitStore.read(commitHash);

            if (commit.parent === EMPTY_HASH) {
                throw new Error("You can't revert the first commit.");
            }

            const patch: Patch = repository.diff(commitHash, commit.parent);

            return repository.commit(
                author,
                `Revert of commit ${commitHash}`,
                repository.apply(patch, resolver),
            );
        },

        subscribe(subscriber: Subscriber): void {
            emitter.on('write', subscriber);
        },

        unsubscribe(subscriber: Subscriber): void {
            emitter.removeListener('write', subscriber);
        },

        toJSON(): Snapshot {
            return {
                commits: commitStore.toJSON(),
                refs: refStore.toJSON(),
                trees: treeStore.toJSON(),
            };
        },
    };

    return repository;
}
