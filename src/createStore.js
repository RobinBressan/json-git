import computeHash from './computeHash';

export default function createStore(snapshot = {}) {
    const store = snapshot;

    return {
        keys() {
            return Object.keys(store);
        },

        write(data) {
            const hash = computeHash(data);
            store[hash] = data;

            return hash;
        },

        read(hash) {
            const entry = store[hash];

            if (!entry) {
                throw new Error(`Entry ${hash} not found.`);
            }

            return { ...entry };
        },

        toJSON() {
            return { ...store };
        },
    };
}
