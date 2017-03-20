// @flow
import events from 'events';

export type StoreSubscriber = (key: string) => void;
export type Storage = {
    [k: string]: Object,
};
export type Store = Object;

export default function createStore(snapshot: Storage): Store {
    const emitter = new events.EventEmitter();
    const storage: Storage = snapshot || {};

    const store = {
        has(key: string): boolean {
            return !!storage[key];
        },

        keys(): Array<string> {
            return Object.keys(storage);
        },

        write(key: string, data: Object): void {
            storage[key] = data;

            emitter.emit('write', key);
        },

        read(key: string): Object {
            const entry = storage[key];

            if (!entry) {
                throw new Error(`Entry ${key} not found.`);
            }

            return { ...entry };
        },

        remove(key: string): void {
            if (!store.has(key)) {
                throw new Error(`Entry ${key} not found.`);
            }

            delete storage[key];
        },

        subscribe(subscriber: StoreSubscriber): void {
            emitter.on('write', subscriber);
        },

        toJSON(): Object {
            return { ...storage };
        },

        unsubscribe(subscriber: StoreSubscriber): void {
            emitter.removeListener('write', subscriber);
        },
    };

    return store;
}
