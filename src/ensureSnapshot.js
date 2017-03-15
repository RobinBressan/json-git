export default function ensureSnapshot(snapshot) {
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
