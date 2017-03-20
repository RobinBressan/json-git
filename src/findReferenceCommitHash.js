// @flow
import intersection from 'lodash.intersection';
import { EMPTY_HASH } from './computeHash';

import type { Hash } from './computeHash';
import type { HashStore } from './createHashStore';

function buildHistory(head: Hash, commitStore: HashStore) {
    const history = [];

    let currentHead = head;
    while (currentHead !== EMPTY_HASH) {
        history.push(currentHead);
        currentHead = commitStore.read(currentHead).parent;
    }

    return history;
}

export default function findReferenceCommitHash(
    leftHead: Hash,
    rightHead: Hash,
    commitStore: HashStore,
): Hash {
    return intersection(
        buildHistory(leftHead, commitStore),
        buildHistory(rightHead, commitStore),
    ).pop();
}
