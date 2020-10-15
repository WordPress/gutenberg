/**
 * Internal dependencies
 */
import { getBlockPaddings, getBlockColors } from '../utils';

const DEFAULT_COLORS = [
	{ color: '#cd2653', name: 'Accent Color', slug: 'accent' },
	{ color: '#000000', name: 'Primary', slug: 'primary' },
	{ color: '#6d6d6d', name: 'Secondary', slug: 'secondary' },
];

describe( 'getBlockPaddings', () => {
	const PADDING = 12;

	it( 'returns no paddings for a block without background color', () => {
		const paddings = getBlockPaddings(
			{ color: 'red' },
			{ backgroundColor: 'red' },
			{ textColor: 'primary' }
		);
		expect( paddings ).toEqual( expect.objectContaining( {} ) );
	} );

	it( 'returns paddings for a block with background color', () => {
		const paddings = getBlockPaddings(
			{ color: 'red' },
			{},
			{ backgroundColor: 'red', textColor: 'primary' }
		);
		expect( paddings ).toEqual(
			expect.objectContaining( { padding: PADDING } )
		);
	} );

	it( 'returns no paddings for an inner block without background color within a parent block with background color', () => {
		const paddings = getBlockPaddings(
			{ backgroundColor: 'blue', color: 'yellow', padding: PADDING },
			{},
			{ textColor: 'primary' }
		);

		expect( paddings ).toEqual(
			expect.not.objectContaining( { padding: PADDING } )
		);
	} );
} );

describe( 'getBlockColors', () => {
	it( 'returns the theme colors correctly', () => {
		const blockColors = getBlockColors(
			{ backgroundColor: 'accent', textColor: 'secondary' },
			DEFAULT_COLORS
		);
		expect( blockColors ).toEqual(
			expect.objectContaining( {
				backgroundColor: '#cd2653',
				color: '#6d6d6d',
			} )
		);
	} );

	it( 'returns custom background color correctly', () => {
		const blockColors = getBlockColors(
			{ backgroundColor: '#222222', textColor: 'accent' },
			DEFAULT_COLORS
		);
		expect( blockColors ).toEqual(
			expect.objectContaining( {
				backgroundColor: '#222222',
				color: '#cd2653',
			} )
		);
	} );

	it( 'returns custom text color correctly', () => {
		const blockColors = getBlockColors(
			{ textColor: '#4ddddd' },
			DEFAULT_COLORS
		);
		expect( blockColors ).toEqual(
			expect.objectContaining( {
				color: '#4ddddd',
			} )
		);
	} );
} );
