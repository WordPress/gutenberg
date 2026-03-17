/**
 * Internal dependencies
 */
import { addBlockVariations, removeBlockVariations } from '../actions';

describe( 'actions', () => {
	describe( 'addBlockVariations', () => {
		const blockName = 'block/name';
		const variationName = 'my-variation';

		it( 'should return the ADD_BLOCK_VARIATIONS action', () => {
			const variation = {
				name: variationName,
				title: 'My Variation',
				attributes: {
					example: 'foo',
				},
			};
			const result = addBlockVariations( blockName, variation );
			expect( result ).toEqual( {
				type: 'ADD_BLOCK_VARIATIONS',
				variations: [ variation ],
				blockName,
			} );
		} );

		it( 'should return the REMOVE_BLOCK_VARIATIONS action', () => {
			const result = removeBlockVariations( blockName, variationName );
			expect( result ).toEqual( {
				type: 'REMOVE_BLOCK_VARIATIONS',
				variationNames: [ variationName ],
				blockName,
			} );
		} );
	} );
} );
