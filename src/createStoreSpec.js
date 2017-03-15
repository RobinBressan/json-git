import expect from 'expect';
import createStore from './createStore';

describe('createStore()', () => {
    let store;

    beforeEach(() => {
        store = createStore();
    });

    it('should write data and return its key when write() is called', () => {
        const hash = store.write({ hello: 'world' });
        expect(hash).toBe(store.keys()[0]);
    });

    it('should return data when read() is called with a valid key', () => {
        const hash = store.write({ hello: 'world' });
        expect(store.read(hash)).toEqual({ hello: 'world' });
    });

    it('should throw an error when read() is called with an invalid key', () => {
        store.write({ hello: 'world' });
        expect(() => store.read('wrong')).toThrow(/Entry wrong not found/);
    });

    it('should return all keys when keys() is called', () => {
        const hash1 = store.write({ hello: 'world' });
        const hash2 = store.write({ hello2: 'world2' });

        expect(store.keys()).toEqual([
            hash1,
            hash2,
        ]);
    });

    it('should return all store content when toJSON() is called', () => {
        const hash1 = store.write({ hello: 'world' });
        const hash2 = store.write({ hello2: 'world2' });

        expect(store.toJSON()).toEqual({
            [hash1]: {
                hello: 'world',
            },
            [hash2]: {
                hello2: 'world2',
            },
        });
    });

    it('should init the store if a snapshot is given', () => {
        const localStore = createStore({
            ae3: {
                hello: 'world',
            },
        });

        expect(localStore.read('ae3')).toEqual({
            hello: 'world',
        });
    });

    it('should write data with the given hash if provided', () => {
        const hash = store.write({ hello: 'world' }, 'forcedHash');
        expect(hash).toBe('forcedHash');
        expect(store.keys()[0]).toBe('forcedHash');
        expect(store.read('forcedHash')).toEqual({ hello: 'world' });
    });

    it('should notify any subscriber when something is written into the store', () => {
        const subscriber1 = expect.createSpy();
        store.subscribe(subscriber1);

        const subscriber2 = expect.createSpy();
        store.subscribe(subscriber2);

        const hash = store.write({ hello: 'world' });
        expect(subscriber1).toHaveBeenCalledWith(hash);
        expect(subscriber2).toHaveBeenCalledWith(hash);

        store.unsubscribe(subscriber1);

        const hash2 = store.write({ hello: 'earth' });
        expect(subscriber1.calls.length).toBe(1);
        expect(subscriber2).toHaveBeenCalledWith(hash2);
        expect(subscriber2.calls.length).toBe(2);
    });
});
