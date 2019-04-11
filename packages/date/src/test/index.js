/**
 * Internal dependencies
 */
import { isInTheFuture, getDate, setSettings, __experimentalGetSettings } from '../';

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
