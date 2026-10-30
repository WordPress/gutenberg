import { afterEach, describe, expect, it } from 'vitest';
import { setSettings, getSettings } from '@wordpress/date';
import normalizeFields from '../index';
import parseTime from '../utils/parse-time';
import type { Field } from '../../types';

describe( 'parseTime', () => {
	it.each( [
		[ '00:00', 0 ],
		[ '09:30', 34200 ],
		[ '23:59', 86340 ],
		[ '09:30:15', 34215 ],
		[ '9:30', 34200 ],
		// A trailing offset is accepted but does not shift the value, since
		// times are wall-clock.
		[ '09:30:00Z', 34200 ],
		[ '09:30:00z', 34200 ],
		[ '09:30:00+02:00', 34200 ],
		[ '09:30:00-0500', 34200 ],
		[ '09:30+23:59', 34200 ],
	] )( 'parses %s', ( value, expected ) => {
		expect( parseTime( value ) ).toBe( expected );
	} );

	it.each( [
		[ '24:00' ],
		[ '09:60' ],
		[ '09:30:60' ],
		[ '09:30:15.500' ],
		// A malformed offset is not a zone designator, so the whole value is
		// rejected rather than silently accepted.
		[ '09:30:00+99:99' ],
		[ '09:30:00+24:00' ],
		[ '09:30:00-05:60' ],
		[ '' ],
		[ 'noon' ],
		// Rejecting these is what keeps the shared temporal operators from
		// reading a date or datetime as a time.
		[ '2021-01-01' ],
		[ '2021-01-01T09:30:00' ],
		[ '2021-01-01T09:30:00Z' ],
	] )( 'rejects %s', ( value ) => {
		expect( parseTime( value ) ).toBeNull();
	} );

	it( 'rejects non-strings', () => {
		expect( parseTime( undefined ) ).toBeNull();
		expect( parseTime( null ) ).toBeNull();
		expect( parseTime( 930 ) ).toBeNull();
	} );
} );

describe( 'time field type: getValueFormatted', () => {
	const originalSettings = getSettings();

	afterEach( () => {
		setSettings( originalSettings );
	} );

	function normalize( field: Field< any > ) {
		return normalizeFields( [ field ] )[ 0 ];
	}

	it.each( [
		[ 'UTC', 'UTC', 0 ],
		[ 'a timezone behind the browser', 'America/New_York', -5 ],
		[ 'a timezone ahead of the browser', 'Australia/Sydney', 11 ],
	] )(
		'renders the stored wall clock unchanged under %s',
		( _label, timezone, offset ) => {
			setSettings( {
				...originalSettings,
				timezone: {
					...originalSettings.timezone,
					string: timezone,
					offset,
				},
			} );
			const field = normalize( {
				id: 'opensAt',
				type: 'time',
				format: { time: 'H:i' },
			} );

			expect(
				field.getValueFormatted( { item: { opensAt: '09:00' }, field } )
			).toBe( '09:00' );
		}
	);

	it( 'renders seconds when the format asks for them', () => {
		const field = normalize( {
			id: 'opensAt',
			type: 'time',
			format: { time: 'H:i:s' },
		} );

		expect(
			field.getValueFormatted( { item: { opensAt: '09:00:15' }, field } )
		).toBe( '09:00:15' );
	} );

	it( 'returns an empty string for missing or unparseable values', () => {
		const field = normalize( { id: 'opensAt', type: 'time' } );

		expect( field.getValueFormatted( { item: {}, field } ) ).toBe( '' );
		expect(
			field.getValueFormatted( { item: { opensAt: 'noon' }, field } )
		).toBe( '' );
	} );
} );
