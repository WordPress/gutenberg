import { afterEach, describe, expect, it } from 'vitest';
import { formatNumber, getSettings, setSettings } from '../number-format';

describe( 'number format', () => {
	afterEach( () => {
		setSettings( { locale: 'en' } );
	} );

	it( 'defaults to the English locale', () => {
		expect( getSettings() ).toEqual( { locale: 'en' } );
		expect( formatNumber( 1234567.5 ) ).toBe( '1,234,567.5' );
	} );

	it( 'returns the settings that were set', () => {
		setSettings( { locale: 'de_DE' } );
		expect( getSettings() ).toEqual( { locale: 'de_DE' } );
	} );

	it( 'formats with the separators of the locale', () => {
		setSettings( { locale: 'de-DE' } );
		expect( formatNumber( 1234567.5 ) ).toBe( '1.234.567,5' );
	} );

	it( 'accepts WordPress locales with underscores', () => {
		setSettings( { locale: 'de_DE' } );
		expect( formatNumber( 1234567.5 ) ).toBe( '1.234.567,5' );
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
		setSettings( { locale: 'not a locale' } );
		expect( formatNumber( 1234567 ) ).toBe( '1,234,567' );
	} );
} );
