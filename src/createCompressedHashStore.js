// @flow
import memoize from 'lodash.memoize';
import type { HashStore } from './createHashStore';
import type { Hash } from './computeHash';
import compressObject from './compressObject';
import expandObject from './expandObject';

export type CompressedHashStore = HashStore;

export default function createCompressedHashStore(store: HashStore): CompressedHashStore {
    const {
        write,
        ...baseStore
    }: {
        write: (data: Object) => Hash,
    } = store;

    const compressedHashStore = {
        ...baseStore,
        write(data: Object, refHash: Hash): string {
            if (!refHash) {
                return write(data);
            }

            const parentData = compressedHashStore.read(refHash);

            if (typeof data !== typeof parentData) {
                return write(data);
            }

            return write(compressObject(parentData, data, `$$ref:${refHash}`));
        },

        read(hash) {
            return expandObject(store.read(hash), compressedHashStore);
        },
    };

    compressedHashStore.read = memoize(compressedHashStore.read);

    return compressedHashStore;
}
