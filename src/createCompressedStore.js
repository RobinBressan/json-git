import memoize from 'lodash.memoize';
import compressObject from './compressObject';
import expandObject from './expandObject';

export default function createCompressedStore(store) {
    const compressedStore = {
        keys() {
            return store.keys();
        },

        write(data, refHash) {
            if (!refHash) {
                return store.write(data);
            }

            const parentData = compressedStore.read(refHash);

            if (typeof data !== typeof parentData) {
                return store.write(data);
            }

            return store.write(compressObject(parentData, data, `$$ref:${refHash}`));
        },

        read(hash) {
            return expandObject(store.read(hash), compressedStore);
        },

        toJSON() {
            return store.toJSON();
        },
    };

    compressedStore.read = memoize(compressedStore.read);

    return compressedStore;
}
