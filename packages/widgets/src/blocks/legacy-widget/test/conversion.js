/**
 * WordPress dependencies
 */
import { registerCoreBlocks } from '@wordpress/block-library';

/**
 * Internal dependencies
 */
import { convertLegacyWidgetToBlocks, transforms } from '../conversion';

describe( 'convertLegacyWidgetToBlocks', () => {
	beforeAll( () => {
		registerCoreBlocks();
	} );

	test.each( [
		[
			'text',
			{ text: '<p>Paragraph 1</p><hr />' },
			[
				expect.objectContaining( {
					name: 'core/paragraph',
					attributes: { content: 'Paragraph 1', dropCap: false },
				} ),
				expect.objectContaining( {
					name: 'core/separator',
				} ),
			],
		],
		[
			'text',
			{ title: 'Title', text: '<p>Paragraph 1</p><hr />' },
			[
				expect.objectContaining( {
					name: 'core/heading',
					attributes: { content: 'Title', level: 2 },
				} ),
				expect.objectContaining( {
					name: 'core/paragraph',
					attributes: { content: 'Paragraph 1', dropCap: false },
				} ),
				expect.objectContaining( {
					name: 'core/separator',
				} ),
			],
		],
		[
			'calendar',
			{},
			[
				expect.objectContaining( {
					name: 'core/calendar',
					attributes: {},
				} ),
			],
		],
		[
			'calendar',
			{ title: 'Title' },
			[
				expect.objectContaining( {
					name: 'core/heading',
					attributes: { content: 'Title', level: 2 },
				} ),
				expect.objectContaining( {
					name: 'core/calendar',
				} ),
			],
		],
		[
			'archives',
			{
				count: true,
				dropdown: true,
			},
			[
				expect.objectContaining( {
					name: 'core/archives',
					attributes: {
						showPostCounts: true,
						displayAsDropdown: true,
					},
				} ),
			],
		],
		[
			'archives',
			{
				title: 'Title',
				count: true,
				dropdown: true,
			},
			[
				expect.objectContaining( {
					name: 'core/heading',
					attributes: { content: 'Title', level: 2 },
				} ),
				expect.objectContaining( {
					name: 'core/archives',
					attributes: {
						showPostCounts: true,
						displayAsDropdown: true,
					},
				} ),
			],
		],
	] )( 'converting a %s widget', ( idBase, rawInstance, expectedBlocks ) => {
		const blocks = convertLegacyWidgetToBlocks( idBase, rawInstance );
		expect( blocks ).toEqual( expectedBlocks );
	} );
} );

describe( 'transforms', () => {
	it( 'matches snapshot', () => {
		expect( transforms ).toMatchSnapshot();
	} );
} );
