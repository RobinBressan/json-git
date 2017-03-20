// @flow
import cloneDeep from 'lodash.clonedeep';
import get from 'lodash.get';
import has from 'lodash.has';
import set from 'lodash.set';
import unset from 'lodash.unset';
import createRejecter from './createRejecter';

import type { Patch } from './createPatch';

export type Resolver = (payload: Object, value: mixed, reject: () => void) => void;

export default function applyPatch(patch: Patch, data: Object, resolver: Resolver) {
    const output = cloneDeep(data);

    patch.forEach((payload: Object) : void => {
        const path = payload.path.slice(1).split('/');

        switch (payload.op) {
        case 'add':
            if (resolver && has(output, path)) {
                const rejecter = createRejecter();
                resolver(payload, get(output, path), rejecter.reject);

                if (rejecter.rejected) {
                    return;
                }
            }

            set(output, path, payload.value);
            break;

        case 'replace':
            if (resolver && !has(output, path)) {
                const rejecter = createRejecter();
                resolver(payload, undefined, rejecter.reject);

                if (rejecter.rejected) {
                    return;
                }
            }

            set(output, path, payload.value);
            break;

        case 'remove':
            unset(output, path, payload.value);
            break;

        default:
            throw new Error(`Unsupported operation ${payload.op}`);
        }
    });

    return output;
}
