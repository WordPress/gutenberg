/**
 * Internal dependencies
 */
import { isInTheFuture, getDate, getMoment, setSettings, __experimentalGetSettings } from '../';

describe( 'isInTheFuture', () => {
	it( 'should return true if the date is in the future', () => {
		// Create a Date object 1 minute in the future.
		const date = new Date( Number( getDate() ) + ( 1000 * 60 ) );

		expect( isInTheFuture( date ) ).toBe( true );
	} );

	it( 'should return true if the date is in the past', () => {
		// Create a Date object 1 minute in the past.
		const date = new Date( Number( getDate() ) - ( 1000 * 60 ) );

		expect( isInTheFuture( date ) ).toBe( false );
	} );

	it( 'should ignore the timezone', () => {
		const settings = __experimentalGetSettings();

		// Set a timezone in the future
		setSettings( {
			...settings,
			timezone: { offset: '4', string: '' },
		} );
		// Create a Date object 1 minute in the past.
		let date = new Date( Number( getDate() ) - ( 1000 * 60 ) );
		expect( isInTheFuture( date ) ).toBe( false );

		// Create a Date object 1 minute in the future.
		date = new Date( Number( getDate() ) + ( 1000 * 60 ) );
		expect( isInTheFuture( date ) ).toBe( true );

		// Restore default settings
		setSettings( settings );
	} );
} );

describe( 'Moment.js Localization', () => {
	it( 'should change the relative time strings', () => {
		const settings = __experimentalGetSettings();

		// Change the locale strings for tests.
		setSettings( {
			...settings,
			l10n: {
				...settings.l10n,
				relative: {
					...settings.l10n.relative,
					mm: '%d localized minutes',
					hh: '%d localized hours',
				},
			},
		} );

		// Test the unchanged locale strings.
		// Create a Date object 8 days in the past.
		date = new Date( Number( getDate() ) - ( 1000 * 60 * 60 * 24 * 8 ) );
		expect( getMoment( date ).fromNow() ).toBe( '8 days ago' );
		// Test withoutSuffix
		expect( getMoment( date ).fromNow( true ) ).toBe( '8 days' );

		// Create a Date object 5 minutes in the past.
		let date = new Date( Number( getDate() ) - ( 1000 * 60 * 5 ) );
		expect( getMoment( date ).fromNow() ).toBe( '5 localized minutes ago' );
		// Test withoutSuffix
		expect( getMoment( date ).fromNow( true ) ).toBe( '5 localized minutes' );

		// Create a Date object 10 hours in the future.
		date = new Date( Number( getDate() ) + ( 1000 * 60 * 60 * 10 ) );
		expect( getMoment( date ).fromNow() ).toBe( '10 localized hours from now' );
		// Test withoutSuffix
		expect( getMoment( date ).fromNow( true ) ).toBe( '10 localized hours' );

		// Restore default settings
		setSettings( settings );
	} );
} );
