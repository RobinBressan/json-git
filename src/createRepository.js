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
    let commits = {};
    let trees = {};
    let refs = {
        branch: 'master',
        heads: {
            master: EMPTY_HASH,
        },
    };

    if (snapshot && ensureSnapshot(snapshot)) {
        commits = snapshot.stores.commit;
        trees = snapshot.stores.tree;
        refs = {
            ...refs,
            ...snapshot.refs,
        };
    }

    const commitStore = createStore(commits);
    const treeStore = createCompressedStore(createStore(trees));

    function moveHead(branch, commitHash) {
        refs.heads[branch] = commitHash;
    }

    function hasHead(branch) {
        return !!refs.heads[branch];
    }

    function getHead(branch) {
        return refs.heads[branch];
    }

    const repository = {
        get branch() {
            return refs.branch;
        },

        get branches() {
            return Object.keys(refs.heads);
        },

        get head() {
            return refs.heads[repository.branch];
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

            moveHead(repository.branch, commitHash);

            return commitHash;
        },

        checkout(nextBranch, create = false) {
            if (create) {
                if (hasHead(nextBranch)) {
                    throw new Error(`Branch ${nextBranch} already exists.`);
                }

                moveHead(nextBranch, repository.head);
            } else if (!hasHead(nextBranch)) {
                throw new Error(`Branch ${nextBranch} does not exists.`);
            }

            refs.branch = nextBranch;

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

            delete refs.heads[branch];
        },

        diff(left, right) {
            const leftCommit = commitStore.read(refs.heads[left] || left);
            const rightCommit = commitStore.read(refs.heads[right] || right);

            return createPatch(
                treeStore.read(leftCommit.treeHash),
                treeStore.read(rightCommit.treeHash),
            );
        },

        merge(author, branch, resolver) {
            if (!hasHead(branch)) {
                throw new Error(`Branch ${branch} doesn't exist`);
            }

            const refCommitHash = findReferenceCommitHash(
                repository.head,
                getHead(branch),
                commitStore,
            );

            const mergePatch = buildMergePatch(
                repository.diff(refCommitHash, repository.head),
                repository.diff(refCommitHash, getHead(branch)),
                resolver,
            );

            return repository.commit(
                author,
                `Merge of ${branch} into ${repository.branch}`,
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

        toJSON() {
            return {
                refs: { ...refs },
                stores: {
                    commit: commitStore.toJSON(),
                    tree: treeStore.toJSON(),
                },
            };
        },
    };

    return repository;
}
