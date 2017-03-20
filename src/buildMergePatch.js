// @flow
import createRejecter from './createRejecter';

export default function buildMergePatch(
    currentBranchPatch: Object,
    targetBranchPatch: Object,
    resolver: ?Function,
) {
    const currentBranchPatchByPaths: Object = currentBranchPatch.reduce(
        (indexed: Object, payload: Object) => ({
            ...indexed,
            [payload.path]: payload,
        }), {});

    return targetBranchPatch.filter((payload: Object) => {
        const conflictPayload: Object = currentBranchPatchByPaths[payload.path];

        if (!resolver || !conflictPayload) {
            return true;
        }

        const rejecter: Object = createRejecter();
        resolver(payload, conflictPayload, rejecter.reject);

        return !rejecter.rejected;
    });
}
