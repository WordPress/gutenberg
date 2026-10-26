import { afterEach, describe, expect, it } from 'vitest';
import { resetLocaleData, setLocaleData } from '../default-i18n';
import { formatNumber } from '../number-format';

describe( 'formatNumber', () => {
	afterEach( () => {
		resetLocaleData();
	} );

	it( 'defaults to the English locale', () => {
		expect( formatNumber( 1234567.5 ) ).toBe( '1,234,567.5' );
	} );

	it( 'formats with the lang of the locale data', () => {
		setLocaleData( { '': { lang: 'de-DE' } } );
		expect( formatNumber( 1234567.5 ) ).toBe( '1.234.567,5' );
	} );

	it( 'accepts WordPress locales with underscores', () => {
		setLocaleData( { '': { lang: 'de_DE' } } );
		expect( formatNumber( 1234567.5 ) ).toBe( '1.234.567,5' );
	} );

	it( 'follows changes of the locale data', () => {
		setLocaleData( { '': { lang: 'de_DE' } } );
		setLocaleData( { '': { lang: 'fr_FR' } } );
		expect( formatNumber( 1234567 ) ).not.toBe( '1.234.567' );
		resetLocaleData();
		expect( formatNumber( 1234567 ) ).toBe( '1,234,567' );
	} );

	it( 'ignores locale data of other domains', () => {
		setLocaleData( { '': { lang: 'de_DE' } }, 'other' );
		expect( formatNumber( 1234567 ) ).toBe( '1,234,567' );
	} );

	it( 'formats zero and negative numbers', () => {
		expect( formatNumber( 0 ) ).toBe( '0' );
		expect( formatNumber( -1234 ) ).toBe( '-1,234' );
	} );

	it( 'passes options to Intl.NumberFormat', () => {
		expect( formatNumber( 1.23456, { maximumFractionDigits: 2 } ) ).toBe(
			'1.23'
		);
		expect( formatNumber( 1234567, { notation: 'compact' } ) ).toBe(
			'1.2M'
		);
	} );

	it( 'falls back to English for an invalid locale', () => {
		setLocaleData( { '': { lang: 'not a locale' } } );
		expect( formatNumber( 1234567 ) ).toBe( '1,234,567' );
	} );
} );
