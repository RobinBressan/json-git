import createRejecter from './createRejecter';

export default function buildMergePatch(currentBranchPatch, targetBranchPatch, resolver) {
    const currentBranchPatchByPaths = currentBranchPatch.reduce((indexed, payload) => ({
        ...indexed,
        [payload.path]: payload,
    }), {});

    return targetBranchPatch.filter((payload) => {
        const conflictPayload = currentBranchPatchByPaths[payload.path];

        if (!resolver || !conflictPayload) {
            return true;
        }

        const rejecter = createRejecter();
        resolver(payload, conflictPayload, rejecter.reject);

        return !rejecter.rejected;
    });
}
