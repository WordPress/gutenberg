/**
 * Internal dependencies
 */
import hasNestedReusableBlocks from '../has-nested-reusable-blocks';

const badSingleBlock = [
	{
		name: 'core/block',
		innerBlocks: [],
	},
];

const goodSingleBlock = [
	{
		name: 'core/paragraph',
		innerBlocks: [],
	},
];

const badNestedBlocks = [
	{
		name: 'core/paragraph',
		innerBlocks: [],
	},
	{
		name: 'core/group',
		innerBlocks: [
			{
				name: 'core/template-part',
				innerBlocks: [],
			},
		],
	},
];

const goodNestedBlocks = [
	{
		name: 'core/paragraph',
		innerBlocks: [],
	},
	{
		name: 'core/group',
		innerBlocks: [
			{
				name: 'core/paragraph',
				innerBlocks: [],
			},
		],
	},
];

describe( 'hasNestedReusableBlocks', () => {
	it( 'handles shallow block sets', () => {
		expect( hasNestedReusableBlocks( goodSingleBlock ) ).toBe( false );
		expect( hasNestedReusableBlocks( badSingleBlock ) ).toBe( true );
	} );
	it( 'handles nested blocks', () => {
		expect( hasNestedReusableBlocks( goodNestedBlocks ) ).toBe( false );
		expect( hasNestedReusableBlocks( badNestedBlocks ) ).toBe( true );
	} );
} );
