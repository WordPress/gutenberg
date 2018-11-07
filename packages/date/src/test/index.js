/**
 * Internal dependencies
 */
import { isInTheFuture, getDate, setSettings, __experimentalGetSettings } from '../';

describe( 'isInTheFuture', () => {
	it( 'should return true if the date is in the future', () => {
		const date = new Date( Number( getDate() ) + ( 1000 * 60 ) ); // 1 minute in the future

		expect( isInTheFuture( date ) ).toBe( true );
	} );

	it( 'should return true if the date is in the past', () => {
		const date = new Date( Number( getDate() ) - ( 1000 * 60 ) ); // 1 minute in the past

		expect( isInTheFuture( date ) ).toBe( false );
	} );

	it( 'should ignore the timezone', () => {
		const settings = __experimentalGetSettings();

		// Set a timezone in the future
		setSettings( {
			...settings,
			timezone: { offset: '4', string: '' },
		} );

		let date = new Date( Number( getDate() ) - ( 1000 * 60 ) ); // 1 minute in the past
		expect( isInTheFuture( date ) ).toBe( false );

		date = new Date( Number( getDate() ) + ( 1000 * 60 ) ); // 1 minute in the future
		expect( isInTheFuture( date ) ).toBe( true );

		// Restore default settings
		setSettings( settings );
	} );
} );
