/**
 * External dependencies
 */
import timezoneMock from 'timezone-mock';

/**
 * Internal dependencies
 */
import { inputToDate } from '../utils';

describe( 'inputToDate', () => {
	describe( 'timezoneless strings parsed as UTC', () => {
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

			afterEach( () => {
				timezoneMock.unregister();
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

	describe( 'non-string inputs', () => {
		it( 'should handle Date objects', () => {
			const input = new Date( '2025-11-01T00:00:00Z' );
			const result = inputToDate( input );

			expect( result.getUTCFullYear() ).toBe( 2025 );
			expect( result.getUTCMonth() ).toBe( 10 );
			expect( result.getUTCDate() ).toBe( 1 );
		} );

		it( 'should convert timestamps to Date', () => {
			const timestamp = Date.UTC( 2025, 10, 1, 0, 0, 0 );
			const result = inputToDate( timestamp );

			expect( result.getUTCFullYear() ).toBe( 2025 );
			expect( result.getUTCMonth() ).toBe( 10 );
			expect( result.getUTCDate() ).toBe( 1 );
		} );
	} );
} );
