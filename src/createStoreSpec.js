import expect from 'expect';
import createStore from './createStore';

describe('createStore()', () => {
    let store;

    beforeEach(() => {
        store = createStore();
    });

    it('should write data when write() is called', () => {
        store.write('foo', { hello: 'world' });
        expect('foo').toBe(store.keys()[0]);
    });

    it('should return data when read() is called with a valid key', () => {
        store.write('foo', { hello: 'world' });
        expect(store.read('foo')).toEqual({ hello: 'world' });
    });

    it('should throw an error when read() is called with an invalid key', () => {
        store.write('foo', { hello: 'world' });
        expect(() => store.read('wrong')).toThrow(/Entry wrong not found/);
    });

    it('should return all keys when keys() is called', () => {
        store.write('foo', { hello: 'world' });
        store.write('bar', { hello2: 'world2' });

        expect(store.keys()).toEqual([
            'foo',
            'bar',
        ]);
    });

    it('should return all store content when toJSON() is called', () => {
        store.write('foo', { hello: 'world' });
        store.write('bar', { hello2: 'world2' });

        expect(store.toJSON()).toEqual({
            foo: {
                hello: 'world',
            },
            bar: {
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

    it('should notify any subscriber when something is written into the store', () => {
        const subscriber1 = expect.createSpy();
        store.subscribe(subscriber1);

        const subscriber2 = expect.createSpy();
        store.subscribe(subscriber2);

        store.write('foo', { hello: 'world' });
        expect(subscriber1).toHaveBeenCalledWith('foo');
        expect(subscriber2).toHaveBeenCalledWith('foo');

        store.unsubscribe(subscriber1);

        store.write('bar', { hello: 'earth' });
        expect(subscriber1.calls.length).toBe(1);
        expect(subscriber2).toHaveBeenCalledWith('bar');
        expect(subscriber2.calls.length).toBe(2);
    });

    it('should test if a hash exists when has() is called', () => {
        store.write('foo', { hello: 'world' });
        expect(store.has('foo')).toBe(true);
        expect(store.has('bar')).toBe(false);
    });
});
