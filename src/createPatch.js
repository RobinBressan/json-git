import get from 'lodash.get';
import has from 'lodash.has';
import forEachDeep from './forEachDeep';

export default function createPatch(left, right) {
    const paths = [];
    const patch = [];

    forEachDeep(right, (value, key, path) => {
        const absolutePath = `/${path.join('/')}`;
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

    forEachDeep(left, (value, key, path) => {
        const absolutePath = `/${path.join('/')}`;

        if (paths.includes(absolutePath)) {
            return;
        }

        patch.push({
            op: 'remove',
            path: absolutePath,
        });
    });

    return patch.sort((a, b) => {
        if (a.op < b.op) {
            return -1;
        }

        if (a.op > b.op) {
            return 1;
        }

        return 0;
    });
}
