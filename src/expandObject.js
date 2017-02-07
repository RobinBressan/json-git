import cloneDeep from 'lodash.clonedeep';
import set from 'lodash.set';
import get from 'lodash.get';
import memoize from 'lodash.memoize';
import forEachDeep from './forEachDeep';

export default function expandObject(object, compressedStore) {
    const output = cloneDeep(object);
    const read = memoize(compressedStore.read);

    forEachDeep(output, (value, key, path) => {
        if (typeof value !== 'string') {
            return;
        }

        const matches = value.match(/\$\$ref:(.+)/);

        if (!matches) {
            return;
        }

        const refHash = matches[1];
        const refValue = get(read(refHash), path);

        set(output, path, refValue);
    });

    return output;
}
