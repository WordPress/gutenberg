import { describe, expect, it } from 'vitest';
import metadata from '../block.json';

describe( 'Navigation color support', () => {
	// The color block support is what makes the Color panel appear under
	// Styles > Blocks > Navigation in Global Styles.
	it( 'supports text and background colors', () => {
		expect( metadata.supports.color ).toMatchObject( {
			text: true,
			background: true,
		} );
	} );

	// The block's own PHP already prints its color classes and inline styles,
	// so the block support must not serialize them a second time.
	it( 'skips serializing the color support', () => {
		expect( metadata.supports.color.__experimentalSkipSerialization ).toBe(
			true
		);
	} );

	it( 'keeps the attributes of the existing color controls', () => {
		for ( const attribute of [
			'textColor',
			'customTextColor',
			'backgroundColor',
			'customBackgroundColor',
			'overlayTextColor',
			'customOverlayTextColor',
			'overlayBackgroundColor',
			'customOverlayBackgroundColor',
		] ) {
			expect( metadata.attributes ).toHaveProperty( attribute );
		}
	} );
} );
