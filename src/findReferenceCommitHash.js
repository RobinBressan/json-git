import intersection from 'lodash.intersection';
import { EMPTY_HASH } from './computeHash';

function buildHistory(head, commitStore) {
    const history = [];

    let currentHead = head;
    while (currentHead !== EMPTY_HASH) {
        history.push(currentHead);
        currentHead = commitStore.read(currentHead).parent;
    }

    return history;
}

export default function findReferenceCommitHash(leftHead, rightHead, commitStore) {
    return intersection(
        buildHistory(leftHead, commitStore),
        buildHistory(rightHead, commitStore),
    ).pop();
}
