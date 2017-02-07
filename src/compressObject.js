import cloneDeep from 'lodash.clonedeep';
import get from 'lodash.get';
import isEqual from 'lodash.isequal';
import set from 'lodash.set';
import forEachDeep from './forEachDeep';

export const PATH_SEPARATOR = '/';

function compact(list) {
    return Object.keys(list).filter((item) => {
        let keep = true;
        item.split(PATH_SEPARATOR).reduce((previous, next) => {
            const path = previous.concat(next);
            keep = !list[previous.join(PATH_SEPARATOR)];
            return path;
        }, []);

        return keep;
    });
}

export function findSimilarPaths(left, right) {
    const paths = {};
    forEachDeep(right, (rightValue, key, path) => {
        if (!isEqual(rightValue, get(left, path))) {
            return;
        }
        paths[path.join(PATH_SEPARATOR)] = true; // we do not use an array for performance issue
    });

    return compact(paths);
}

export default function compressObject(left, right, ref) {
    const output = cloneDeep(right);

    findSimilarPaths(left, output)
        .map(path => path.split(PATH_SEPARATOR))
        .map(path => set(output, path, ref));

    return output;
}
