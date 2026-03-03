/**
 * External dependencies
 */
import timezoneMock from 'timezone-mock';

/**
 * WordPress dependencies
 */
import { getSettings, setSettings, type DateSettings } from '@wordpress/date';

/**
 * Internal dependencies
 */
import { inputToDate } from '../utils';

describe( 'inputToDate', () => {
	let originalSettings: DateSettings;

	beforeAll( () => {
		originalSettings = getSettings();
	} );

	afterEach( () => {
		timezoneMock.unregister();
	} );

	afterAll( () => {
		setSettings( originalSettings );
	} );

	describe( 'timezoneless strings', () => {
		beforeEach( () => {
			// Default settings are UTC, but make it explicit so these tests
			// don't depend on global settings state.
			setSettings( {
				...originalSettings,
				timezone: {
					offset: 0,
					offsetFormatted: '0',
					string: '',
					abbr: '',
				},
			} );
		} );

		describe.each( [
			{
				timezone: 'US/Pacific' as const,
				description: 'Pacific time (behind UTC)',
			},
			{
				timezone: 'UTC' as const,
				description: 'UTC (zero offset)',
			},
			{
				timezone: 'Australia/Adelaide' as const,
				description: 'Adelaide (ahead of UTC)',
			},
		] )( 'in $description', ( { timezone } ) => {
			beforeEach( () => {
				timezoneMock.register( timezone );
			} );

			it( 'should parse midnight as UTC midnight, preventing day shifts', () => {
				const result = inputToDate( '2025-11-01T00:00:00' );

				// Should always be Nov 1 00:00 in UTC, regardless of browser timezone
				expect( result.getUTCFullYear() ).toBe( 2025 );
				expect( result.getUTCMonth() ).toBe( 10 ); // November (0-indexed)
				expect( result.getUTCDate() ).toBe( 1 );
				expect( result.getUTCHours() ).toBe( 0 );
				expect( result.getUTCMinutes() ).toBe( 0 );
				expect( result.getUTCSeconds() ).toBe( 0 );
			} );

			it( 'should preserve non-midnight times in UTC, preventing day shifts', () => {
				const result = inputToDate( '2025-06-20T15:30:45' );

				expect( result.getUTCFullYear() ).toBe( 2025 );
				expect( result.getUTCMonth() ).toBe( 5 ); // June (0-indexed)
				expect( result.getUTCDate() ).toBe( 20 );
				expect( result.getUTCHours() ).toBe( 15 );
				expect( result.getUTCMinutes() ).toBe( 30 );
				expect( result.getUTCSeconds() ).toBe( 45 );
			} );

			it( 'should parse date-only strings as midnight UTC', () => {
				const result = inputToDate( '2025-03-15' );

				expect( result.getUTCFullYear() ).toBe( 2025 );
				expect( result.getUTCMonth() ).toBe( 2 ); // March (0-indexed)
				expect( result.getUTCDate() ).toBe( 15 );
				expect( result.getUTCHours() ).toBe( 0 );
				expect( result.getUTCMinutes() ).toBe( 0 );
				expect( result.getUTCSeconds() ).toBe( 0 );
			} );
		} );
	} );

	describe( 'timezoneless strings with a site timezone string (DST-aware)', () => {
		beforeEach( () => {
			setSettings( {
				...originalSettings,
				timezone: {
					offset: -5,
					offsetFormatted: '-5',
					string: 'America/New_York',
					abbr: 'EST',
				},
			} );
		} );

		describe.each( [
			{
				timezone: 'US/Pacific' as const,
				description: 'Pacific time (behind UTC)',
			},
			{
				timezone: 'UTC' as const,
				description: 'UTC (zero offset)',
			},
			{
				timezone: 'Australia/Adelaide' as const,
				description: 'Adelaide (ahead of UTC)',
			},
		] )( 'in $description', ( { timezone } ) => {
			beforeEach( () => {
				timezoneMock.register( timezone );
			} );

			it( 'should interpret midnight using site timezone (winter)', () => {
				// Jan 10 is Eastern Standard Time in New York (UTC-5)
				const result = inputToDate( '2025-01-10T00:00:00' );
				expect( result.toISOString() ).toBe(
					'2025-01-10T05:00:00.000Z'
				);
			} );

			it( 'should interpret midnight using site timezone (summer/DST)', () => {
				// Mar 10 is Eastern Daylight Time in New York (UTC-4)
				const result = inputToDate( '2025-03-10T00:00:00' );
				expect( result.toISOString() ).toBe(
					'2025-03-10T04:00:00.000Z'
				);
			} );
		} );
	} );

	describe( 'strings with timezone indicators', () => {
		describe.each( [
			{
				input: '2025-11-01T00:00:00Z',
				expectedHour: 0,
				expectedMinute: 0,
				description: 'Z suffix',
			},
			{
				input: '2025-11-01T10:00:00+05:30',
				expectedHour: 4,
				expectedMinute: 30,
				description: '+HH:MM offset',
			},
			{
				input: '2025-11-01T10:00:00-08:00',
				expectedHour: 18,
				expectedMinute: 0,
				description: '-HH:MM offset',
			},
			// There's a few other valid formats in ISO-8601 (HHMM, HH, etc.),
			// but those aren't included in the ECMAScript specification, which
			// only includes "Z"-suffixed or "HH:mm"-suffixed strings.
			//
			// See: https://tc39.es/ecma262/#sec-date-time-string-format
		] )( '$description', ( { input, expectedHour, expectedMinute } ) => {
			it( 'should respect explicit timezone offset', () => {
				const result = inputToDate( input );

				expect( result.getUTCFullYear() ).toBe( 2025 );
				expect( result.getUTCMonth() ).toBe( 10 ); // November
				expect( result.getUTCDate() ).toBe( 1 );
				expect( result.getUTCHours() ).toBe( expectedHour );
				expect( result.getUTCMinutes() ).toBe( expectedMinute );
			} );
		} );
	} );

	describe( 'Date objects', () => {
		it( 'should extract the UTC timestamp, not local time components', () => {
			// Mock Pacific timezone where local time differs from UTC.
			// This ensures the test fails on trunk if we incorrectly preserve
			// local components instead of extracting the UTC timestamp.
			timezoneMock.register( 'US/Pacific' );

			// Create Nov 1, 2025 at 15:30:45 UTC
			const timestamp = Date.UTC( 2025, 10, 1, 15, 30, 45 );
			const input = new Date( timestamp );
			const result = inputToDate( input );

			// Should preserve the exact UTC moment (15:30:45), not the local
			// Pacific time components (7:30:45 or 8:30:45 depending on DST).
			expect( result.getUTCFullYear() ).toBe( 2025 );
			expect( result.getUTCMonth() ).toBe( 10 ); // November
			expect( result.getUTCDate() ).toBe( 1 );
			expect( result.getUTCHours() ).toBe( 15 ); // UTC hour, not 7 or 8
			expect( result.getUTCMinutes() ).toBe( 30 );
			expect( result.getUTCSeconds() ).toBe( 45 );
		} );
	} );

	describe( 'timestamps', () => {
		it( 'should preserve the UTC moment exactly', () => {
			// Ensure we're using a different timezone from UTC (the tests use
			// UTC by default).
			timezoneMock.register( 'US/Pacific' );

			const timestamp = Date.UTC( 2025, 10, 1, 15, 30, 45 );
			const result = inputToDate( timestamp );

			expect( result.getUTCFullYear() ).toBe( 2025 );
			expect( result.getUTCMonth() ).toBe( 10 ); // November
			expect( result.getUTCDate() ).toBe( 1 );
			expect( result.getUTCHours() ).toBe( 15 );
			expect( result.getUTCMinutes() ).toBe( 30 );
			expect( result.getUTCSeconds() ).toBe( 45 );
		} );
	} );
} );
