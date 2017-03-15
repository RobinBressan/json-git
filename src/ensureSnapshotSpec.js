import expect from 'expect';
import ensureSnapshot from './ensureSnapshot';

describe('ensureSnapshot()', () => {
    it('should return true if snapshot is valid', () => {
        const snapshot = {
            refs: {
                branch: {
                    value: 'master',
                },
                heads: {
                    master: '3ccef0caa',
                },
            },
            commits: {
                b3b0a30ea1: {
                    author: 'robin',
                    date: '2017-02-04T11:10:50.467Z',
                    ref: '12f3dffff',
                    parent: '0000000000',
                },
                bbabffa30f: {
                    author: 'robin',
                    date: '2017-02-04T11:10:50.516Z',
                    ref: '3bc3d1322',
                    parent: 'b3b0a30ea1',
                },
                '3ccef0caa': {
                    author: 'robin',
                    date: '2017-02-04T11:10:50.523Z',
                    ref: 'b1f2ba00b3',
                    parent: 'bbabffa30f',
                },
            },
            trees: {
                '12f3dffff': {
                    foo: 'bar',
                },
                '3bc3d1322': {
                    foo: '$$ref:12f3dffff',
                    foo2: 'bar2',
                },
                b1f2ba00b3: {
                    foo: '$$ref:3bc3d1322',
                    foo2: '$$ref:3bc3d1322',
                    foo3: 'bar3',
                },
            },
        };

        expect(ensureSnapshot(snapshot)).toBe(true);
    });

    it('should return false if snapshot does not have a commit store', () => {
        const snapshot = {
            refs: {
                branch: {
                    value: 'master',
                },
                heads: {
                    master: '3ccef0caa',
                },
            },
            trees: {
                '12f3dffff': {
                    foo: 'bar',
                },
                '3bc3d1322': {
                    foo: '$$ref:12f3dffff',
                    foo2: 'bar2',
                },
                b1f2ba00b3: {
                    foo: '$$ref:3bc3d1322',
                    foo2: '$$ref:3bc3d1322',
                    foo3: 'bar3',
                },
            },
        };

        expect(ensureSnapshot(snapshot)).toBe(false);
    });

    it('should return false if snapshot does not have a tree store', () => {
        const snapshot = {
            refs: {
                branch: {
                    value: 'master',
                },
                heads: {
                    master: '3ccef0caa',
                },
            },
            commits: {
                b3b0a30ea1: {
                    author: 'robin',
                    date: '2017-02-04T11:10:50.467Z',
                    ref: '12f3dffff',
                    parent: '0000000000',
                },
                bbabffa30f: {
                    author: 'robin',
                    date: '2017-02-04T11:10:50.516Z',
                    ref: '3bc3d1322',
                    parent: 'b3b0a30ea1',
                },
                '3ccef0caa': {
                    author: 'robin',
                    date: '2017-02-04T11:10:50.523Z',
                    ref: 'b1f2ba00b3',
                    parent: 'bbabffa30f',
                },
            },
        };

        expect(ensureSnapshot(snapshot)).toBe(false);
    });

    it('should return false if snapshot refs is invalid', () => {
        const snapshot = {
            refs: {
                branch: {
                    value: 'dev',
                },
                heads: {
                    master: '3ccef0caa',
                },
            },
            commits: {
                b3b0a30ea1: {
                    author: 'robin',
                    date: '2017-02-04T11:10:50.467Z',
                    ref: '12f3dffff',
                    parent: '0000000000',
                },
                bbabffa30f: {
                    author: 'robin',
                    date: '2017-02-04T11:10:50.516Z',
                    ref: '3bc3d1322',
                    parent: 'b3b0a30ea1',
                },
                '3ccef0caa': {
                    author: 'robin',
                    date: '2017-02-04T11:10:50.523Z',
                    ref: 'b1f2ba00b3',
                    parent: 'bbabffa30f',
                },
            },
            trees: {
                '12f3dffff': {
                    foo: 'bar',
                },
                '3bc3d1322': {
                    foo: '$$ref:12f3dffff',
                    foo2: 'bar2',
                },
                b1f2ba00b3: {
                    foo: '$$ref:3bc3d1322',
                    foo2: '$$ref:3bc3d1322',
                    foo3: 'bar3',
                },
            },
        };

        expect(ensureSnapshot(snapshot)).toBe(false);
    });
});
