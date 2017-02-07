import forEach from 'lodash.foreach';

export default function forEachDeep(input, visitor, path = []) {
    return forEach(input, (value, key) => {
        visitor(value, key, [...path, key]);
        if (typeof value !== 'object') {
            return;
        }

        forEachDeep(value, visitor, [...path, key]);
    });
}
