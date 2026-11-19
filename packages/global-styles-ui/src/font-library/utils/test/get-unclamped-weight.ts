import { describe, expect, it } from 'vitest';
import getUnclampedWeight from '../get-unclamped-weight';

describe( 'getUnclampedWeight', () => {
	it.each( [
		[ 'Thin', 250, 100 ],
		[ 'Thin', 275, 100 ],
		[ 'ExtraLight', 250, 200 ],
		[ 'ExtraLight', 275, 200 ],
	] )(
		'reads %s at usWeightClass %s as %s',
		( styleName, usWeightClass, expected ) => {
			expect( getUnclampedWeight( styleName, usWeightClass ) ).toBe(
				expected
			);
		}
	);

	it.each( [
		[ 'Thin Italic', 250, 100 ],
		[ 'ExtraLight Italic', 275, 200 ],
		[ 'Thin Oblique', 250, 100 ],
	] )( 'ignores the slant in %s', ( styleName, usWeightClass, expected ) => {
		expect( getUnclampedWeight( styleName, usWeightClass ) ).toBe(
			expected
		);
	} );

	it( 'is case and whitespace insensitive', () => {
		expect( getUnclampedWeight( '  eXTRA   lIGHT  ', 275 ) ).toBe( 200 );
	} );

	describe( 'leaves the weight alone', () => {
		it.each( [
			[ 'Thin', 100 ],
			[ 'Thin', 300 ],
			[ 'ExtraLight', 200 ],
		] )(
			'when %s is not at a clamped usWeightClass (%s)',
			( styleName, usWeightClass ) => {
				expect(
					getUnclampedWeight( styleName, usWeightClass )
				).toBeUndefined();
			}
		);

		/*
		 * Only Thin and ExtraLight are clamped. Other names at a clamped value
		 * are numbered by their author: Lato gives Hairline 250 and Thin 275,
		 * and reading Hairline as 100 would collide it with Thin.
		 */
		it.each( [
			[ 'Hairline', 250 ],
			[ 'Light', 250 ],
			[ 'Regular', 275 ],
			[ 'Heavy', 800 ],
			[ 'Black', 900 ],
			[ '', 250 ],
			[ undefined, 250 ],
			[ 'Thin', undefined ],
		] )( 'for %s at usWeightClass %s', ( styleName, usWeightClass ) => {
			expect(
				getUnclampedWeight( styleName, usWeightClass )
			).toBeUndefined();
		} );
	} );
} );
