/**
 * Internal dependencies
 */
import { getFilteredTemplatePartBlocks } from '../utils';

const NESTED_BLOCKS = [
	{
		clientId: '1',
		name: 'core/group',
		innerBlocks: [
			{
				clientId: '2',
				name: 'core/template-part',
				attributes: {
					slug: 'header',
					theme: 'my-theme',
				},
				innerBlocks: [
					{
						clientId: '3',
						name: 'core/group',
						innerBlocks: [],
					},
				],
			},
			{
				clientId: '4',
				name: 'core/template-part',
				attributes: {
					slug: 'aside',
					theme: 'my-theme',
				},
				innerBlocks: [],
			},
		],
	},
	{
		clientId: '5',
		name: 'core/paragraph',
		innerBlocks: [],
	},
	{
		clientId: '6',
		name: 'core/template-part',
		attributes: {
			slug: 'footer',
			theme: 'my-theme',
		},
		innerBlocks: [],
	},
];

const FLATTENED_BLOCKS = [
	{
		block: {
			clientId: '2',
			name: 'core/template-part',
			attributes: {
				slug: 'header',
				theme: 'my-theme',
			},
		},
		templatePart: {
			id: 'my-theme//header',
			slug: 'header',
			theme: 'my-theme',
		},
	},
	{
		block: {
			clientId: '4',
			name: 'core/template-part',
			attributes: {
				slug: 'aside',
				theme: 'my-theme',
			},
		},
		templatePart: {
			id: 'my-theme//aside',
			slug: 'aside',
			theme: 'my-theme',
		},
	},
	{
		block: {
			clientId: '6',
			name: 'core/template-part',
			attributes: {
				slug: 'footer',
				theme: 'my-theme',
			},
		},
		templatePart: {
			id: 'my-theme//footer',
			slug: 'footer',
			theme: 'my-theme',
		},
	},
];

const SINGLE_TEMPLATE_PART_BLOCK = {
	clientId: '1',
	name: 'core/template-part',
	innerBlocks: [],
	attributes: {
		slug: 'aside',
		theme: 'my-theme',
	},
};

const TEMPLATE_PARTS = [
	{
		id: 'my-theme//header',
		slug: 'header',
		theme: 'my-theme',
	},
	{
		id: 'my-theme//aside',
		slug: 'aside',
		theme: 'my-theme',
	},
	{
		id: 'my-theme//footer',
		slug: 'footer',
		theme: 'my-theme',
	},
];

describe( 'utils', () => {
	describe( 'getFilteredTemplatePartBlocks', () => {
		it( 'returns a flattened list of filtered template parts preserving a depth-first order', () => {
			const flattenedFilteredTemplateParts =
				getFilteredTemplatePartBlocks( NESTED_BLOCKS, TEMPLATE_PARTS );
			expect( flattenedFilteredTemplateParts ).toEqual(
				FLATTENED_BLOCKS
			);
		} );

		it( 'returns a cached result when passed the same params', () => {
			// Clear the cache and call the function twice.
			getFilteredTemplatePartBlocks.clear();
			getFilteredTemplatePartBlocks( NESTED_BLOCKS, TEMPLATE_PARTS );
			expect(
				getFilteredTemplatePartBlocks( NESTED_BLOCKS, TEMPLATE_PARTS )
			).toEqual( FLATTENED_BLOCKS );

			// The function has been called twice with the same params, so the cache size should be 1.
			const [ , , originalSize ] =
				getFilteredTemplatePartBlocks.getCache();
			expect( originalSize ).toBe( 1 );

			// Call the function again, with different params.
			expect(
				getFilteredTemplatePartBlocks(
					[ SINGLE_TEMPLATE_PART_BLOCK ],
					TEMPLATE_PARTS
				)
			).toEqual( [
				{
					block: {
						clientId: '1',
						name: 'core/template-part',
						attributes: {
							slug: 'aside',
							theme: 'my-theme',
						},
					},
					templatePart: {
						id: 'my-theme//aside',
						slug: 'aside',
						theme: 'my-theme',
					},
				},
			] );

			// The function has been called with different params, so the cache size should now be 2.
			const [ , , finalSize ] = getFilteredTemplatePartBlocks.getCache();
			expect( finalSize ).toBe( 2 );
		} );
	} );
} );
