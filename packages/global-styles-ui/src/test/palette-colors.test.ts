import { describe, expect, it } from 'vitest';
import { prioritizePaletteColors } from '../palette-colors';

const colors = [
	{ name: 'Red', slug: 'red', color: '#f00' },
	{ name: 'Green', slug: 'green', color: '#0f0' },
	{ name: 'Blue', slug: 'blue', color: '#00f' },
	{ name: 'White', slug: 'white', color: '#fff' },
];

describe( 'prioritizePaletteColors', () => {
	it( 'puts the background and text colors first while preserving the order of the other colors', () => {
		expect( prioritizePaletteColors( colors, '#fff', '#0f0' ) ).toEqual( [
			colors[ 3 ],
			colors[ 1 ],
			colors[ 0 ],
			colors[ 2 ],
		] );
		expect( colors.map( ( color ) => color.slug ) ).toEqual( [
			'red',
			'green',
			'blue',
			'white',
		] );
	} );

	it( 'leaves the palette order unchanged when the background and text colors are missing', () => {
		expect( prioritizePaletteColors( colors, '#000', '#999' ) ).toEqual(
			colors
		);
	} );

	it( 'includes a shared background and text color only once', () => {
		expect( prioritizePaletteColors( colors, '#00f', '#00f' ) ).toEqual( [
			colors[ 2 ],
			colors[ 0 ],
			colors[ 1 ],
			colors[ 3 ],
		] );
	} );
} );
