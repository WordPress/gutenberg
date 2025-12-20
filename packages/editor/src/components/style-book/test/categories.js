/**
 * Internal dependencies
 */
import {
	getExamplesByCategory,
	getTopLevelStyleBookCategories,
} from '../categories';
import { STYLE_BOOK_CATEGORIES } from '../constants';

jest.mock( '@wordpress/blocks', () => {
	return {
		getCategories() {
			return [
				{
					slug: 'text',
					title: 'Text Registered',
					icon: 'text',
				},
				{
					slug: 'design',
					title: 'Design Registered',
					icon: 'design',
				},
				{
					slug: 'funky',
					title: 'Funky',
					icon: 'funky',
				},
			];
		},
	};
} );

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
	describe( 'getTopLevelStyleBookCategories', () => {
		it( 'returns theme subcategories examples', () => {
			expect( getTopLevelStyleBookCategories() ).toEqual( [
				...STYLE_BOOK_CATEGORIES,
				{
					slug: 'funky',
					title: 'Funky',
					icon: 'funky',
				},
			] );
		} );
	} );

	describe( 'getExamplesByCategory', () => {
		it( 'returns theme subcategories examples', () => {
			const themeCategory = STYLE_BOOK_CATEGORIES.find(
				( category ) => category.slug === 'theme'
			);
			const themeCategoryExamples = getExamplesByCategory(
				themeCategory,
				exampleThemeBlocks
			);

			expect( themeCategoryExamples.slug ).toEqual( 'theme' );

			const siteIdentity = themeCategoryExamples.subcategories.find(
				( subcategory ) => subcategory.slug === 'site-identity'
			);
			expect( siteIdentity ).toEqual( {
				title: 'Site Identity',
				slug: 'site-identity',
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
				( subcategory ) => subcategory.slug === 'design'
			);
			expect( design ).toEqual( {
				title: 'Design',
				slug: 'design',
				examples: [
					{
						name: 'core/group',
						title: 'Group',
						category: 'design',
					},
				],
			} );

			const posts = themeCategoryExamples.subcategories.find(
				( subcategory ) => subcategory.slug === 'posts'
			);

			expect( posts ).toEqual( {
				title: 'Posts',
				slug: 'posts',
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
