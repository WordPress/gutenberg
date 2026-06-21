/**
 * Internal dependencies
 */
import { getCSSClassUsageCounts, getCSSClassUsages } from '../css-classes';

jest.mock( '@wordpress/blocks', () => ( {
	getBlockType: ( name ) => ( {
		title: name === 'core/paragraph' ? 'Paragraph' : name,
	} ),
} ) );

const blocks = [
	{
		clientId: 'heading-client-id',
		name: 'core/heading',
		attributes: {
			className: 'hero-title featured-copy',
		},
	},
	{
		clientId: 'group-client-id',
		name: 'core/group',
		attributes: {
			className: 'featured-card',
		},
		innerBlocks: [
			{
				clientId: 'paragraph-client-id',
				name: 'core/paragraph',
				attributes: {
					className: 'featured-card featured-copy',
				},
			},
		],
	},
];

describe( 'getCSSClassUsages', () => {
	it( 'should find usages in nested blocks', () => {
		expect( getCSSClassUsages( blocks, 'featured-card' ) ).toEqual( [
			{
				clientId: 'group-client-id',
				className: 'featured-card',
				blockName: 'core/group',
				blockTitle: 'core/group',
			},
			{
				clientId: 'paragraph-client-id',
				className: 'featured-card',
				blockName: 'core/paragraph',
				blockTitle: 'Paragraph',
			},
		] );
	} );

	it( 'should normalize leading dots', () => {
		expect( getCSSClassUsages( blocks, '.featured-card' ) ).toHaveLength(
			2
		);
	} );

	it( 'should not count the same client ID twice', () => {
		expect(
			getCSSClassUsages( [ ...blocks, ...blocks ], 'featured-card' )
		).toHaveLength( 2 );
	} );
} );

describe( 'getCSSClassUsageCounts', () => {
	it( 'should return usage counts keyed by class name', () => {
		expect(
			getCSSClassUsageCounts( blocks, [
				{
					name: 'featured-card',
					css: 'color: red;',
				},
				{
					name: 'featured-copy',
					css: 'font-weight: 700;',
				},
				{
					name: 'unused-card',
					css: 'opacity: .5;',
				},
			] )
		).toEqual( {
			'featured-card': 2,
			'featured-copy': 2,
			'unused-card': 0,
		} );
	} );
} );
