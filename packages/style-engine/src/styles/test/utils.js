/**
 * Internal dependencies
 */
import { camelCaseJoin, getCSSValueFromRawStyle, upperFirst } from '../utils';

describe( 'utils', () => {
	describe( 'upperFirst()', () => {
		it( 'should return an string with a capitalized first letter', () => {
			expect( upperFirst( 'toontown' ) ).toEqual( 'Toontown' );
		} );
	} );

	describe( 'camelCaseJoin()', () => {
		it( 'should return a camelCase string', () => {
			expect( camelCaseJoin( [ 'toon', 'town' ] ) ).toEqual( 'toonTown' );
		} );
	} );

	describe( 'getCSSValueFromRawStyle()', () => {
		it.each( [
			[ 'min(40%, 400px)', 'min(40%, 400px)' ],
			[
				'var(--wp--preset--color--yellow-bun)',
				'var:preset|color|yellow-bun',
			],
			[ 'var(--wp--preset--font-size--h-1)', 'var:preset|font-size|h1' ],
			[
				'var(--wp--preset--font-size--1-px)',
				'var:preset|font-size|1px',
			],
			[
				'var(--wp--preset--color--orange-11-orange)',
				'var:preset|color|orange11orange',
			],
			[
				'var(--wp--preset--color--heavenly-blue)',
				'var:preset|color|heavenlyBlue',
			],
			[
				'var(--wp--preset--background--dark-secrets-100)',
				'var:preset|background|dark_Secrets_100',
			],
			[ null, null ],
			[ false, false ],
			[ 1000, 1000 ],
			[ undefined, undefined ],
		] )(
			'should return %s using an incoming value of %s',
			( expected, value ) => {
				expect( getCSSValueFromRawStyle( value ) ).toEqual( expected );
			}
		);
	} );
} );
