// @flow
/* eslint-disable no-bitwise */
import Rusha from 'rusha';

const rusha = new Rusha();

export type Hash = string;
export const EMPTY_HASH: Hash = '0000000000000000000000000000000000000000';

export default function computeHash(input: mixed): Hash {
    const hash = rusha.digest(typeof input === 'object' ? JSON.stringify(input) : input);
    return hash;
}
