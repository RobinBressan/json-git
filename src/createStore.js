import { EventEmitter } from 'events';
import computeHash from './computeHash';

export default function createStore(snapshot = {}) {
    const emitter = new EventEmitter();
    const storage = snapshot;

    const store = {
        keys() {
            return Object.keys(storage);
        },

        write(data, forcedHash) {
            const hash = forcedHash || computeHash(data);
            storage[hash] = data;

            emitter.emit('write', hash);

            return hash;
        },

        read(hash) {
            const entry = storage[hash];

            if (!entry) {
                throw new Error(`Entry ${hash} not found.`);
            }

            return { ...entry };
        },

        subscribe(subscriber) {
            emitter.on('write', subscriber);
        },

        toJSON() {
            return { ...storage };
        },

        unsubscribe(subscriber) {
            emitter.removeListener('write', subscriber);
        },
    };

    return store;
}
