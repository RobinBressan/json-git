// @flow
import get from 'lodash.get';
import has from 'lodash.has';
import forEachDeep from './forEachDeep';

type Operation =
    { op: 'add', path: string, value: any } |
    { op: 'replace', path: string, value: any } |
    { op: 'remove', path: string }
    ;

export type Patch = Array<Operation>;

export default function createPatch(left: Object, right: Object) {
    const paths = [];
    const patch = [];

    forEachDeep(right, (value: any, key: string, path: Array<string>) => {
        const absolutePath: string = `/${path.join('/')}`;
        paths.push(absolutePath);

        if (typeof value === 'object') {
            return;
        }

        if (!has(left, path)) {
            patch.push({
                op: 'add',
                path: absolutePath,
                value,
            });
            return;
        }

        if (get(left, path) === value) {
            return;
        }

        patch.push({
            op: 'replace',
            path: absolutePath,
            value,
        });
    });

    forEachDeep(left, (value: any, key: string, path: Array<string>) => {
        const absolutePath: string = `/${path.join('/')}`;

        if (paths.includes(absolutePath)) {
            return;
        }

        patch.push({
            op: 'remove',
            path: absolutePath,
        });
    });

    return patch.sort((a: Operation, b: Operation) => {
        if (a.op < b.op) {
            return -1;
        }

        if (a.op > b.op) {
            return 1;
        }

        return 0;
    });
}
