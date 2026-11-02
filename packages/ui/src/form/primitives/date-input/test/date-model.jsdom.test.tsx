import { describe, expect, it } from 'vitest';
import {
	getDateValue,
	parseDateValue,
	parseDatePaste,
	getDateParts,
	formatDigits,
} from '../date-model';

describe( 'DateInput parsing', () => {
	it.each( [
		'2026-01-20',
		'2028-02-29',
		'2000-02-29',
		'0001-01-01',
		'0099-12-31',
		'9999-12-31',
	] )(
		'round-trips the calendar date %s without timezone conversion',
		( value ) => {
			expect( getDateValue( parseDateValue( value ) ) ).toBe( value );
		}
	);

	it.each( [
		'',
		'2026-02-29',
		'1900-02-29',
		'2100-02-29',
		'2026-04-31',
		'2026-00-20',
		'2026-13-20',
		'2026-01-00',
		'2026-01-32',
		'0000-01-01',
		'10000-01-01',
		'2026-1-2',
		'2026-01-20T00:00:00Z',
	] )(
		'rejects the noncanonical or impossible public value %s',
		( value ) => {
			expect( () => parseDateValue( value ) ).toThrow();
		}
	);

	it.each( [
		{ year: '', month: '', day: '' },
		{ year: '2026', month: '', day: '20' },
		{ year: '2026', month: '2', day: '30' },
	] )(
		'does not serialize an incomplete or impossible draft %j',
		( draft ) => {
			expect( getDateValue( draft ) ).toBeNull();
		}
	);

	it.each( [
		'en-US',
		'en-GB',
		'it-IT',
		'de-DE',
		'fr-FR',
		'ja-JP',
		'zh-CN',
		'ar-EG',
		'fa-IR',
		'he-IL',
		'th-TH',
		'bn-BD',
		'hi-IN',
		'ko-KR',
		'fi-FI',
		'ckb',
		'ug-Latn',
	] )( 'parses a numeric date pasted in %s', ( locale ) => {
		const date = new Date( '2026-01-20T00:00:00Z' );
		const formatted = new Intl.DateTimeFormat( locale, {
			calendar: 'gregory',
			year: 'numeric',
			month: 'numeric',
			day: 'numeric',
			timeZone: 'UTC',
		} ).format( date );
		expect( getDateValue( parseDatePaste( formatted, locale ) ) ).toBe(
			'2026-01-20'
		);
	} );

	it( 'preserves an impossible pasted date for validation rather than normalizing it', () => {
		expect( parseDatePaste( '02/30/2026', 'en-US' ) ).toEqual( {
			year: '2026',
			month: '02',
			day: '30',
		} );
	} );

	it( 'accepts ISO paste independently of the display locale', () => {
		expect( getDateValue( parseDatePaste( '2026-01-20', 'it-IT' ) ) ).toBe(
			'2026-01-20'
		);
	} );

	it.each( [
		'next Tuesday',
		'01/20/26',
		'2026-01-20junk',
		'02/30/2026junk',
		'1e3/2/2026',
	] )( 'rejects ambiguous or unrelated pasted text %s', ( text ) => {
		expect( parseDatePaste( text, 'en-US' ) ).toBeNull();
	} );

	it( 'preserves leading zeroes while displaying localized digits', () => {
		expect( formatDigits( '02', 'ar-EG' ) ).toBe( '٠٢' );
	} );

	it( 'uses a Gregorian year even in a locale with another default calendar', () => {
		expect(
			getDateParts( 'th-TH' ).find( ( part ) => part.type === 'year' )
				?.value
		).toBe( '2026' );
	} );
} );
