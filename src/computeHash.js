/* eslint-disable no-bitwise */
import Rusha from 'rusha';

const rusha = new Rusha();

export const EMPTY_HASH = '0000000000000000000000000000000000000000';

export default function computeHash(input) {
    const hash = rusha.digest(typeof input === 'object' ? JSON.stringify(input) : input);
    return hash;
}
