/**
 * Internal dependencies
 */
import { getCategoryExamples } from '../utils';
import { STYLE_BOOK_CATEGORIES } from '../constants';

// Fixtures
const exampleThemeBlocks = [
	{
		name: 'core/post-content',
		title: 'Post Content',
		category: 'theme',
	},
	{
		name: 'core/post-terms',
		title: 'Post Terms',
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
];

describe( 'utils', () => {
	describe( 'getCategoryExamples', () => {
		it( 'returns theme subcategories examples', () => {
			const themeCategory = STYLE_BOOK_CATEGORIES.find(
				( category ) => category.name === 'theme'
			);
			const themeCategoryExamples = getCategoryExamples(
				themeCategory,
				exampleThemeBlocks
			);

			expect( themeCategoryExamples.name ).toEqual( 'theme' );

			const siteIdentity = themeCategoryExamples.subcategories.find(
				( subcategory ) => subcategory.name === 'site-identity'
			);
			expect( siteIdentity ).toEqual( {
				title: 'Site Identity',
				name: 'site-identity',
				examples: [
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
				],
			} );

			const design = themeCategoryExamples.subcategories.find(
				( subcategory ) => subcategory.name === 'design'
			);
			expect( design ).toEqual( {
				title: 'Design',
				name: 'design',
				examples: [
					{
						name: 'core/group',
						title: 'Group',
						category: 'design',
					},
				],
			} );

			const posts = themeCategoryExamples.subcategories.find(
				( subcategory ) => subcategory.name === 'posts'
			);

			expect( posts ).toEqual( {
				title: 'Posts',
				name: 'posts',
				examples: [
					{
						name: 'core/post-terms',
						title: 'Post Terms',
						category: 'theme',
					},
				],
			} );
		} );
	} );
} );
