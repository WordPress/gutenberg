import { describe, expect, it } from 'vitest';
import getWeightFromStyleName from '../get-weight-from-style-name';

describe( 'getWeightFromStyleName', () => {
	it.each( [
		[ 'Thin', 100 ],
		[ 'Hairline', 100 ],
		[ 'ExtraLight', 200 ],
		[ 'Extra Light', 200 ],
		[ 'UltraLight', 200 ],
		[ 'Light', 300 ],
		[ 'Medium', 500 ],
		[ 'SemiBold', 600 ],
		[ 'Semi Bold', 600 ],
		[ 'DemiBold', 600 ],
		[ 'Bold', 700 ],
		[ 'ExtraBold', 800 ],
		[ 'UltraBold', 800 ],
		[ 'Black', 900 ],
		[ 'Heavy', 900 ],
	] )( 'maps the weight name %s to %s', ( styleName, expected ) => {
		expect( getWeightFromStyleName( styleName ) ).toBe( expected );
	} );

	it.each( [
		[ 'Thin Italic', 100 ],
		[ 'ExtraLight Italic', 200 ],
		[ 'Bold Italic', 700 ],
		[ 'Black Oblique', 900 ],
	] )( 'ignores the slant in %s', ( styleName, expected ) => {
		expect( getWeightFromStyleName( styleName ) ).toBe( expected );
	} );

	it( 'is case and whitespace insensitive', () => {
		expect( getWeightFromStyleName( '  eXTRA   bOLD  ' ) ).toBe( 800 );
	} );

	it.each( [
		[ 'Regular' ],
		[ 'Normal' ],
		[ 'Italic' ],
		[ 'Oblique' ],
		[ 'Condensed' ],
		[ 'Book' ],
		[ '' ],
		[ undefined ],
	] )(
		'returns undefined for %s, so the OS/2 weight is kept',
		( styleName ) => {
			expect( getWeightFromStyleName( styleName ) ).toBeUndefined();
		}
	);
} );
