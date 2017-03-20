import expect from 'expect';
import createCompressedHashStore from './createCompressedHashStore';

describe('createCompressedHashStore()', () => {
    let store;
    let compressedHashStore;

    beforeEach(() => {
        store = {
            keys: expect.createSpy(),
            read: expect.createSpy(),
            toJSON: expect.createSpy(),
            write: expect.createSpy(),
        };
        compressedHashStore = createCompressedHashStore(store);
    });

    it('should first compress data and then give it to its store when write() is called', () => {
        store.read.andReturn({
            foo: 'bar',
        });
        store.write.andReturn('b4a');

        const hash = compressedHashStore.write({
            foo: 'bar',
            foo2: 'bar2',
        }, 'ae3');

        expect(store.read).toHaveBeenCalledWith('ae3');
        expect(store.write).toHaveBeenCalledWith({
            foo: '$$ref:ae3',
            foo2: 'bar2',
        });
        expect(hash).toBe('b4a');
    });

    it('should first expand data and then return it when read() is called', () => {
        store.read = expect.createSpy((hash) => {
            if (hash === 'ae3') {
                return {
                    foo: 'bar',
                };
            }

            return {
                foo: '$$ref:ae3',
                foo2: 'bar2',
            };
        }).andCallThrough();

        const data = compressedHashStore.read('b4a');

        expect(store.read).toHaveBeenCalledWith('b4a');
        expect(store.read).toHaveBeenCalledWith('ae3');
        expect(data).toEqual({
            foo: 'bar',
            foo2: 'bar2',
        });
    });

    it('should call store.keys() when keys() is called', () => {
        store.keys.andReturn(['foo']);

        expect(compressedHashStore.keys()).toEqual(['foo']);
    });

    it('should call store.toJSON() when toJSON() is called', () => {
        store.toJSON.andReturn(['foo']);

        expect(compressedHashStore.toJSON()).toEqual(['foo']);
    });
});
