import { describe, expect, it } from 'vitest';
import {
	getDateError,
	getRangeError,
	getTimeError,
	parseRange,
	parseTime,
	serializeDate,
	serializeRange,
	serializeTime,
} from '../validation';

describe( 'text date and time validation', () => {
	it.each( [
		[ '2026-02-19', 'Enter a date on or after 2026-02-20.' ],
		[ '2026-02-20', '' ],
		[ '2026-02-28', '' ],
		[ '2026-03-01', 'Enter a date on or before 2026-02-28.' ],
	] )( 'enforces inclusive date bounds for %s', ( text, error ) => {
		expect(
			getDateError( text, { min: '2026-02-20', max: '2026-02-28' } )
		).toBe( error );
	} );
	it( 'rejects unavailable dates without calling the predicate for an invalid draft', () => {
		const calls: string[] = [];
		const constraints = {
			isDateUnavailable: ( date: string ) => {
				calls.push( date );
				return true;
			},
		};
		expect( getDateError( '2026-02-30', constraints ) ).toBeTruthy();
		expect( calls ).toEqual( [] );
		expect( getDateError( '2026-02-20', constraints ) ).toBe(
			'This date is unavailable.'
		);
		expect( calls ).toEqual( [ '2026-02-20' ] );
	} );
	it.each( [ '2026-02-20/', '/2026-02-21', '2026-02-20/2026-02-21' ] )(
		'preserves complete endpoints in the partial or complete range %s',
		( text ) => {
			const parsed = parseRange( text );
			expect( parsed ).toBeDefined();
			expect( serializeRange( parsed! ) ).toBe( text );
		}
	);
	it.each( [
		'/',
		'2026-02-20',
		'2026-02-30/2026-03-01',
		'2026-02-20/2026-02-30',
		'2026-02-20/2026-02-21/2026-02-22',
	] )( 'does not turn the invalid range %s into another date', ( text ) => {
		expect( parseRange( text ) ).toBeUndefined();
		expect( getRangeError( text, {} ) ).not.toBe( '' );
	} );
	it( 'rejects reversed ranges and permits a same-day range', () => {
		expect( getRangeError( '2026-02-21/2026-02-20', {} ) ).toBe(
			'The end date must be on or after the start date.'
		);
		expect( getRangeError( '2026-02-20/2026-02-20', {} ) ).toBe( '' );
	} );
	it( 'applies bounds and unavailable dates to both range endpoints', () => {
		expect(
			getRangeError( '2026-02-19/2026-02-21', { min: '2026-02-20' } )
		).toContain( 'on or after' );
		expect(
			getRangeError( '2026-02-20/2026-02-22', { max: '2026-02-21' } )
		).toContain( 'on or before' );
		expect(
			getRangeError( '2026-02-20/2026-02-22', {
				isDateUnavailable: ( date ) => date === '2026-02-22',
			} )
		).toBe( 'This date is unavailable.' );
	} );
	it.each( [ '00:00', '12:30', '23:59' ] )(
		'accepts the local minute value %s',
		( text ) => {
			expect( parseTime( text, 'minute' ) ).toBe( text );
		}
	);
	it.each( [ '00:00:00', '12:30:45', '23:59:59' ] )(
		'accepts the local second value %s',
		( text ) => {
			expect( parseTime( text, 'second' ) ).toBe( text );
		}
	);
	it.each( [
		'24:00',
		'12:60',
		'9:30',
		'12:',
		'12:30 PM',
		'12:30:00',
		'12:30Z',
		'12:30+01:00',
	] )( 'rejects the invalid minute value %s', ( text ) => {
		expect( parseTime( text, 'minute' ) ).toBeUndefined();
	} );
	it.each( [ '24:00:00', '12:60:00', '23:59:60', '12:30' ] )(
		'rejects the invalid second value %s',
		( text ) => {
			expect( parseTime( text, 'second' ) ).toBeUndefined();
		}
	);
	it( 'uses inclusive local-time bounds without time-zone conversion', () => {
		expect( getTimeError( '09:30', 'minute', '09:30', '17:00' ) ).toBe(
			''
		);
		expect( getTimeError( '17:00', 'minute', '09:30', '17:00' ) ).toBe(
			''
		);
		expect( getTimeError( '09:29', 'minute', '09:30', '17:00' ) ).toContain(
			'at or after'
		);
		expect( getTimeError( '17:01', 'minute', '09:30', '17:00' ) ).toContain(
			'at or before'
		);
	} );
	it( 'distinguishes empty values from invalid public values', () => {
		expect( serializeDate( null ) ).toBe( '' );
		expect( serializeRange( null ) ).toBe( '' );
		expect( serializeTime( null, 'minute' ) ).toBe( '' );
		expect( () => serializeDate( '' ) ).toThrow( RangeError );
		expect( () => serializeDate( '2026-02-30' ) ).toThrow( RangeError );
		expect( () => serializeTime( '24:00', 'minute' ) ).toThrow(
			RangeError
		);
	} );
} );
