// @flow
import cloneDeep from 'lodash.clonedeep';
import set from 'lodash.set';
import get from 'lodash.get';
import memoize from 'lodash.memoize';
import forEachDeep from './forEachDeep';

import type { Hash } from './computeHash';

export default function expandObject(object: Object, compressedStore: Object): Object {
    const output: Object = cloneDeep(object);
    const read: (key: string) => Object = memoize(compressedStore.read);

    forEachDeep(output, (value: mixed, key: string, path: string) => {
        if (typeof value !== 'string') {
            return;
        }

        const matches: ?Array<string> = value.match(/\$\$ref:(.+)/);

        if (!matches) {
            return;
        }

        const refHash: Hash = matches[1];
        const refValue: mixed = get(read(refHash), path);

        set(output, path, refValue);
    });

    return output;
}
