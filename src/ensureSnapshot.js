// @flow
import type { Hash } from './computeHash';
import type { Storage } from './createStore';

type Refs = {
    branch: {
        value: string,
    },
    detached?: {
        head: Hash,
    },
    heads: {
        [k: string]: Hash,
    }
};

export type Snapshot = {
    refs: Refs,
    commits: Storage,
    trees: Storage,
};

export default function ensureSnapshot(snapshot: Snapshot): boolean {
    if (!snapshot.refs) {
        return false;
    }

    if (!snapshot.commits) {
        return false;
    }

    if (!snapshot.trees) {
        return false;
    }

    if (!snapshot.refs.branch) {
        return false;
    }

    if (!snapshot.refs.heads) {
        return false;
    }

    if (!snapshot.refs.heads.master) {
        return false;
    }

    if (!snapshot.refs.heads[snapshot.refs.branch.value]) {
        return false;
    }

    return true;
}
