import { describe, expect, it } from 'vitest';
import { attributesToStyle } from '../typography';

/*
 * Everything that asks what font a block is in reads this: the panel resolves
 * the faces from it, and those faces decide which styles, weights and widths
 * the font can offer. A family lost here is replaced by the inherited one, and
 * the controls then describe a font the block is not drawn in.
 */
describe( 'attributesToStyle, for the font family', () => {
	const familyOf = ( attributes ) =>
		attributesToStyle( attributes ).typography.fontFamily;

	it( 'reads the attribute a preset sets', () => {
		expect( familyOf( { fontFamily: 'material-symbols' } ) ).toBe(
			'var:preset|font-family|material-symbols'
		);
	} );

	it( 'reads a family written inline in the style', () => {
		expect(
			familyOf( {
				style: {
					typography: {
						fontFamily: 'var:preset|font-family|material-symbols',
					},
				},
			} )
		).toBe( 'var:preset|font-family|material-symbols' );
	} );

	it( 'reads an inline family that names no preset', () => {
		expect(
			familyOf( {
				style: { typography: { fontFamily: '"Inter", sans-serif' } },
			} )
		).toBe( '"Inter", sans-serif' );
	} );

	it( 'prefers the attribute when a block carries both', () => {
		expect(
			familyOf( {
				fontFamily: 'material-symbols',
				style: {
					typography: {
						fontFamily: 'var:preset|font-family|roboto-flex',
					},
				},
			} )
		).toBe( 'var:preset|font-family|material-symbols' );
	} );

	it( 'reads nothing from a block with no family of its own', () => {
		expect(
			familyOf( { style: { typography: { fontSize: '48px' } } } )
		).toBeUndefined();
	} );

	it( 'leaves the other typography values as they were', () => {
		const style = attributesToStyle( {
			fontSize: 'large',
			style: { typography: { fontFamily: '"Inter", sans-serif' } },
		} );
		expect( style.typography.fontSize ).toBe(
			'var:preset|font-size|large'
		);
		expect( style.typography.fontFamily ).toBe( '"Inter", sans-serif' );
	} );
} );
