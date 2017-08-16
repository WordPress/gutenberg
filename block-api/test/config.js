/**
 * Internal dependencies
 */
import { getBlockType } from '../config';

describe( 'block types config', () => {
	describe( 'getBlockType', () => {
		it( 'should return undefined if the block type was not found', () => {
			const blockTypes = [
				{ name: 'core/text' },
			];
			const blockType = getBlockType( 'core/image', { blockTypes } );

			expect( blockType ).toBeUndefined();
		} );

		it( 'should return the correponding blockType', () => {
			const textBlockType = { name: 'core/text' };
			const blockTypes = [ textBlockType ];
			const blockType = getBlockType( 'core/text', { blockTypes } );

			expect( blockType ).toBe( textBlockType );
		} );
	} );
} );
