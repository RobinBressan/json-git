export default function ensureSnapshot(snapshot) {
    if (!snapshot.stores) {
        return false;
    }
    if (!snapshot.stores.commit || !snapshot.stores.tree) {
        return false;
    }

    if (!snapshot.refs) {
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

    if (!snapshot.refs.heads[snapshot.refs.branch]) {
        return false;
    }

    return true;
}
