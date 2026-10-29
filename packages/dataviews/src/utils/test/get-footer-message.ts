import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import getFooterMessage from '../get-footer-message';

const toLocaleString = Number.prototype.toLocaleString;

describe( 'getFooterMessage', () => {
	beforeEach( () => {
		vi.spyOn( Number.prototype, 'toLocaleString' ).mockImplementation(
			function ( this: number ) {
				return toLocaleString.call( this, 'en-US' );
			}
		);
	} );

	afterEach( () => vi.restoreAllMocks() );

	it.each( [
		[ 1234, 10, 1234567, false, '1,234 Items selected' ],
		[ 0, 1234, 1234567, false, '1,234 of 1,234,567 Items' ],
		[ 0, 1234567, 1234567, false, '1,234,567 Items' ],
		[ 0, 10, 1234567, true, '1,234,567 Items' ],
		[ 1, 10, 1234567, false, '1 Item selected' ],
		[ 0, 1, 1, false, '1 Item' ],
		[ 0, 0, 0, false, '0 Items' ],
	] )(
		'formats the count for selection %i, page %i, total %i, total-only %s',
		( selection, page, total, totalOnly, expected ) => {
			expect(
				getFooterMessage( selection, page, total, totalOnly )
			).toBe( expected );
		}
	);

	it( 'uses the browser’s number formatting for every count', () => {
		vi.mocked( Number.prototype.toLocaleString ).mockImplementation(
			function ( this: number ) {
				return toLocaleString.call( this, 'de-DE' );
			}
		);

		expect( getFooterMessage( 1234, 10, 1234567 ) ).toBe(
			'1.234 Items selected'
		);
		expect( getFooterMessage( 0, 1234, 1234567 ) ).toBe(
			'1.234 of 1.234.567 Items'
		);
		expect( getFooterMessage( 0, 10, 1234567, true ) ).toBe(
			'1.234.567 Items'
		);
	} );
} );
