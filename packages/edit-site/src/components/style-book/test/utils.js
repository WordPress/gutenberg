/**
 * Internal dependencies
 */
import { getCategoryExamples, getExamples } from '../utils';
import { STYLE_BOOK_CATEGORIES } from '../constants';

/**
 * WordPress dependencies
 */
import { getBlockTypes, unregisterBlockType } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';

describe( 'utils', () => {
	beforeAll( () => {
		// Register all core blocks
		registerCoreBlocks();
	} );

	afterAll( () => {
		// Clean up registered blocks
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	describe( 'getCategoryExamples', () => {
		it( 'returns category key value pairs', () => {
			const themeCategory = STYLE_BOOK_CATEGORIES.find(
				( category ) => category.name === 'theme'
			);
			const themeCategoryExamples = getCategoryExamples(
				themeCategory,
				getExamples()
			);
			expect( themeCategoryExamples.name ).toEqual( 'theme' );
			expect( themeCategoryExamples.subcategories ).toHaveLength(
				themeCategory.subcategories.length
			);
		} );
	} );
} );
