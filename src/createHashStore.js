// @flow
import computeHash from './computeHash';
import type { Hash } from './computeHash';
import type { Store } from './createStore';

export type HashStore = Store;

export default function createHashStore(store: Store): Store {
    const {
        write,
        ...baseStore
    } = store;

    return {
        ...baseStore,
        write(data: Object): Hash {
            const hash: Hash = computeHash(data);
            write(hash, data);

            return hash;
        },

    };
}
