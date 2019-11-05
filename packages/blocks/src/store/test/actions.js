/**
 * Internal dependencies
 */
import {
	__experimentalAddBlockPatterns,
	__experimentalRemoveBlockPatterns,
} from '../actions';

describe( 'actions', () => {
	describe( 'addBlockPatterns', () => {
		const blockName = 'block/name';
		const patternName = 'my-pattern';

		it( 'should return the ADD_BLOCK_PATTERNS action', () => {
			const pattern = {
				name: patternName,
				label: 'My Pattern',
				attributes: {
					example: 'foo',
				},
			};
			const result = __experimentalAddBlockPatterns( blockName, pattern );
			expect( result ).toEqual( {
				type: 'ADD_BLOCK_PATTERNS',
				patterns: [
					pattern,
				],
				blockName,
			} );
		} );

		it( 'should return the REMOVE_BLOCK_PATTERNS action', () => {
			const result = __experimentalRemoveBlockPatterns( blockName, patternName );
			expect( result ).toEqual( {
				type: 'REMOVE_BLOCK_PATTERNS',
				patternNames: [
					patternName,
				],
				blockName,
			} );
		} );
	} );
} );
