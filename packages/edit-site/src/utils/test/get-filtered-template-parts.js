/**
 * Internal dependencies
 */
import getFilteredTemplatePartBlocks from '../get-filtered-template-parts';

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

describe( 'getFilteredTemplatePartBlocks', () => {
	it( 'returns a flattened list of filtered template parts preserving a depth-first order', () => {
		const flattenedFilteredTemplateParts = getFilteredTemplatePartBlocks(
			NESTED_BLOCKS,
			TEMPLATE_PARTS
		);
		expect( flattenedFilteredTemplateParts ).toEqual( FLATTENED_BLOCKS );
	} );
} );
