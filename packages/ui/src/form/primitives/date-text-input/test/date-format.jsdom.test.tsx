import { describe, expect, it } from 'vitest';
import { createDateFormat } from '../date-format';

describe( 'localized Gregorian date text', () => {
	it.each( [
		[ 'en-US', '02/20/2026' ],
		[ 'it-IT', '20/02/2026' ],
		[ 'de-DE', '20.02.2026' ],
		[ 'ja-JP', '2026/02/20' ],
		[ 'ar-EG', '٢٠‏/٠٢‏/٢٠٢٦' ],
		[ 'fa-IR', '۲۰۲۶/۰۲/۲۰' ],
		[ 'th-TH', '20/02/2026' ],
	] )( 'displays %s dates and parses them to ISO', ( locale, text ) => {
		const format = createDateFormat( locale );
		expect( format.format( '2026-02-20' ) ).toBe( text );
		expect( format.parse( text ) ).toBe( '2026-02-20' );
	} );
	it.each( [
		'arab',
		'arabext',
		'beng',
		'deva',
		'fullwide',
		'hanidec',
		'khmr',
		'mymr',
		'thai',
		'latn',
	] )(
		'round-trips leap dates and early years with %s digits',
		( numberingSystem ) => {
			const format = createDateFormat(
				`en-US-u-nu-${ numberingSystem }`
			);
			for ( const date of [
				'0001-01-01',
				'0099-12-31',
				'2000-02-29',
				'2024-02-29',
				'9999-12-31',
			] ) {
				expect( format.parse( format.format( date ) ) ).toBe( date );
			}
		}
	);
	it.each( [
		'20/02/26',
		'30/02/2026',
		'29/02/1900',
		'01/13/2026',
		'00/02/2026',
		'20/02/',
		'2026-02-20',
		'20/02/2026 junk',
	] )(
		'rejects incomplete, impossible, or wrong-format Italian text: %s',
		( text ) => {
			expect( createDateFormat( 'it-IT' ).parse( text ) ).toBeUndefined();
		}
	);
	it( 'accepts Arabic or ASCII digits with optional direction marks', () => {
		const format = createDateFormat( 'ar-EG' );
		expect( format.parse( '٢٠/٠٢/٢٠٢٦' ) ).toBe( '2026-02-20' );
		expect( format.parse( '20/02/2026' ) ).toBe( '2026-02-20' );
	} );
	it( 'distinguishes clearing from incomplete text', () => {
		const format = createDateFormat( 'it-IT' );
		expect( format.parse( '' ) ).toBeNull();
		expect( format.parse( '20/' ) ).toBeUndefined();
	} );
} );
