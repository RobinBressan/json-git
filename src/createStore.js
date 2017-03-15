import { EventEmitter } from 'events';
import computeHash from './computeHash';

export default function createStore(snapshot = {}) {
    const emitter = new EventEmitter();
    const store = snapshot;

    return {
        keys() {
            return Object.keys(store);
        },

        write(data, forcedHash) {
            const hash = forcedHash || computeHash(data);
            store[hash] = data;

            emitter.emit('write', hash);

            return hash;
        },

        read(hash) {
            const entry = store[hash];

            if (!entry) {
                throw new Error(`Entry ${hash} not found.`);
            }

            return { ...entry };
        },

        subscribe(subscriber) {
            emitter.on('write', subscriber);
        },

        toJSON() {
            return { ...store };
        },

        unsubscribe(subscriber) {
            emitter.removeListener('write', subscriber);
        },
    };
}
