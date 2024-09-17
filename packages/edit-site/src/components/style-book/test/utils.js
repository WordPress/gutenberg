/**
 * Internal dependencies
 */
import { getCategoryExamples, getExamples, getBlockCategories } from '../utils';
import { STYLE_BOOK_CATEGORIES } from '../constants';

/**
 * WordPress dependencies
 */
import { getBlockTypes, unregisterBlockType } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';

// Fixtures
/*const exampleBlocks = [
	{
		name: 'core/post-content',
		title: 'Post Content',
		category: 'theme',
	},
	{
		name: 'core/home-link',
		title: 'Home Link',
		category: 'design',
	},
	{
		name: 'custom/colors',
		title: 'Colors',
		category: 'colors',
	},
	{
		name: 'core/site-logo',
		title: 'Site Logo',
		category: 'theme',
	},
	{
		name: 'core/site-title',
		title: 'Site Title',
		category: 'theme',
	},
	{
		name: 'core/site-tagline',
		title: 'Site Tagline',
		category: 'theme',
	},
	{
		name: 'core/group',
		title: 'Group',
		category: 'design',
	},
	{
		name: 'core/comments-pagination-numbers',
		title: 'Comments Page Numbers',
		category: 'theme',
	},
	{
		name: 'core/post-featured-image',
		title: 'Featured Image',
		category: 'theme',
	},
];*/

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
			expect(
				themeCategoryExamples[ 'site-identity' ].examples
			).toBeDefined();
			expect( themeCategoryExamples.design.examples ).toBeDefined();
			expect( themeCategoryExamples.posts.examples ).toBeDefined();
			expect( themeCategoryExamples.comments.examples ).toBeDefined();
		} );
	} );

/*	describe( 'getBlockCategories', () => {
		it( 'returns categories', () => {
			expect( getBlockCategories( getExamples() ) ).toEqual( ' ' );
		} );
	} );*/
} );
