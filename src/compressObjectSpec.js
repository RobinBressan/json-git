import cloneDeep from 'lodash.clonedeep';
import expect from 'expect';
import set from 'lodash.set';
import compressObject, { findSimilarPaths } from './compressObject';
import sample from './sample.json';

describe('compressObject()', () => {
    describe('findSimilarPaths()', () => {
        it('should find similar paths between two objects', () => {
            const next = cloneDeep(sample);

            set(next, ['0', 'friends', '0', 'name'], 'robin');
            set(next, ['0', 'friends', '0', 'metadata', 'list', '1', 'label'], 'other');
            set(next, ['1', 'friends', '0', 'id'], 99);
            set(next, ['1', 'friends', '0', 'name'], 'robin');

            expect(findSimilarPaths(sample, next)).toEqual([
                '2',
                '0/_id',
                '0/index',
                '0/guid',
                '0/isActive',
                '0/balance',
                '0/picture',
                '0/age',
                '0/eyeColor',
                '0/name',
                '0/gender',
                '0/company',
                '0/email',
                '0/phone',
                '0/address',
                '0/about',
                '0/registered',
                '0/latitude',
                '0/longitude',
                '0/tags',
                '0/friends/0/id',
                '0/friends/0/metadata/link',
                '0/friends/0/metadata/list/0',
                '0/friends/1',
                '0/friends/2',
                '0/greeting',
                '0/favoriteFruit',
                '1/_id',
                '1/index',
                '1/guid',
                '1/isActive',
                '1/balance',
                '1/picture',
                '1/age',
                '1/eyeColor',
                '1/name',
                '1/gender',
                '1/company',
                '1/email',
                '1/phone',
                '1/address',
                '1/about',
                '1/registered',
                '1/latitude',
                '1/longitude',
                '1/tags',
                '1/friends/1',
                '1/friends/2',
                '1/greeting',
                '1/favoriteFruit',
            ]);
        });
    });

    it('should compress an object and replace similar path with the given ref', () => {
        const left = {
            name: 'robin',
            friends: ['1', '2', '3'],
            locations: [
                { town: 'nowhere' },
                { town: 'nowhere again' },
            ],
            profile: {
                gravatar: 'http://',
            },
        };

        const right = {
            name: 'john',
            friends: ['1', '2', '3'],
            locations: [
                { town: 'here' },
                { town: 'nowhere again' },
            ],
            profile: {
                gravatar: 'http://',
            },
        };

        const ref = 'ref:ae3';

        expect(compressObject(left, right, ref)).toEqual({
            name: 'john',
            friends: 'ref:ae3',
            locations: [
                { town: 'here' },
                'ref:ae3',
            ],
            profile: 'ref:ae3',
        });
    });
});
